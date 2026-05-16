import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { ProductsService } from '../products/products.service';
import { CreateGuestOrderDto } from './dto/guest-order.dto';
import { UpdateOrderStatusDto } from './dto/order.dto';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly productsService: ProductsService,
  ) {}

  async createGuestOrder(dto: CreateGuestOrderDto) {
    const lines: {
      productId: Types.ObjectId;
      name: string;
      price: number;
      quantity: number;
      unit: string;
      image: string;
    }[] = [];

    for (const item of dto.items) {
      const product = await this.productsService.findById(item.productId);
      if (!product.isActive) {
        throw new BadRequestException(`Product ${product.name} is unavailable`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Not enough stock for ${product.name}. Available: ${product.stock}`,
        );
      }
      lines.push({
        productId: new Types.ObjectId(item.productId),
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        unit: product.unit,
        image: product.image,
      });
    }

    const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    const addressSnapshot = {
      line1: dto.address.line1.trim(),
      city: dto.address.city.trim(),
      pincode: dto.address.pincode.trim(),
    };

    const session = await this.connection.startSession();
    let createdId: Types.ObjectId | null = null;
    try {
      await session.withTransaction(async () => {
        for (const line of lines) {
          await this.productsService.decrementStock(
            line.productId,
            line.quantity,
            session,
          );
        }
        const [doc] = await this.orderModel.create(
          [
            {
              customerPhone: dto.customerPhone.trim(),
              customerName: dto.customerName?.trim() ?? '',
              addressSnapshot,
              lines,
              total,
              status: OrderStatus.Pending,
              paymentMethod: 'cod',
            },
          ],
          { session },
        );
        createdId = doc._id as Types.ObjectId;
      });
    } finally {
      await session.endSession();
    }

    if (!createdId) {
      throw new BadRequestException('Order could not be created');
    }
    return this.orderModel.findById(createdId).lean().exec();
  }

  async listAll() {
    return this.orderModel.find().sort({ createdAt: -1 }).lean().exec();
  }

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order id');
    }
    const updated = await this.orderModel
      .findByIdAndUpdate(orderId, { status: dto.status }, { new: true })
      .lean()
      .exec();
    if (!updated) {
      throw new NotFoundException('Order not found');
    }
    return updated;
  }
}

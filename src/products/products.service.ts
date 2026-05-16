import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { Product, ProductDocument } from './schemas/product.schema';

const SEED_PRODUCTS = [
  {
    name: 'Tomato',
    price: 42,
    unit: 'kg',
    stock: 80,
    image:
      'https://images.unsplash.com/photo-1546094096-0df4fccacd21?w=800&q=80',
    category: 'vegetables',
    isActive: true,
  },
  {
    name: 'Onion',
    price: 35,
    unit: 'kg',
    stock: 120,
    image:
      'https://images.unsplash.com/photo-1518977822532-ef74b28a2800?w=800&q=80',
    category: 'vegetables',
    isActive: true,
  },
  {
    name: 'Potato',
    price: 28,
    unit: 'kg',
    stock: 200,
    image:
      'https://images.unsplash.com/photo-1518977676601-b53f02ca0026?w=800&q=80',
    category: 'vegetables',
    isActive: true,
  },
  {
    name: 'Carrot',
    price: 55,
    unit: 'kg',
    stock: 60,
    image:
      'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=800&q=80',
    category: 'vegetables',
    isActive: true,
  },
  {
    name: 'Capsicum',
    price: 90,
    unit: 'kg',
    stock: 40,
    image:
      'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=800&q=80',
    category: 'vegetables',
    isActive: true,
  },
  {
    name: 'Cucumber',
    price: 38,
    unit: 'kg',
    stock: 70,
    image:
      'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=800&q=80',
    category: 'vegetables',
    isActive: true,
  },
  {
    name: 'Spinach',
    price: 25,
    unit: 'bunch',
    stock: 50,
    image:
      'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&q=80',
    category: 'greens',
    isActive: true,
  },
  {
    name: 'Broccoli',
    price: 120,
    unit: 'kg',
    stock: 30,
    image:
      'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=800&q=80',
    category: 'vegetables',
    isActive: true,
  },
];

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
  ) {}

  async onModuleInit() {
    const count = await this.productModel.countDocuments().exec();
    if (count === 0) {
      await this.productModel.insertMany(SEED_PRODUCTS);
    }
  }

  async findPublicList(filters: { category?: string; search?: string }) {
    const q: Record<string, unknown> = { isActive: true };
    if (filters.category) {
      q.category = filters.category.toLowerCase();
    }
    if (filters.search) {
      const escapedSearch = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      q.name = { $regex: escapedSearch, $options: 'i' };
    }
    return this.productModel.find(q).sort({ name: 1 }).lean().exec();
  }

  async findAdminList() {
    return this.productModel.find().sort({ name: 1 }).lean().exec();
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product id');
    }
    const p = await this.productModel.findById(id).lean().exec();
    if (!p) {
      throw new NotFoundException('Product not found');
    }
    return p;
  }

  async create(dto: CreateProductDto) {
    const doc = await this.productModel.create({
      ...dto,
      category: dto.category.toLowerCase(),
      isActive: dto.isActive ?? true,
    });
    return doc.toObject();
  }

  async update(id: string, dto: UpdateProductDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product id');
    }
    const patch: Record<string, unknown> = { ...dto };
    if (dto.category) {
      patch.category = dto.category.toLowerCase();
    }
    const updated = await this.productModel
      .findByIdAndUpdate(id, patch, { new: true })
      .lean()
      .exec();
    if (!updated) {
      throw new NotFoundException('Product not found');
    }
    return updated;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product id');
    }
    const res = await this.productModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException('Product not found');
    }
    return { deleted: true };
  }

  /** Used by orders — must run inside a transaction session when provided */
  async decrementStock(
    productId: Types.ObjectId,
    quantity: number,
    session?: import('mongoose').ClientSession,
  ) {
    const res = await this.productModel
      .findOneAndUpdate(
        { _id: productId, stock: { $gte: quantity }, isActive: true },
        { $inc: { stock: -quantity } },
        { new: true, session },
      )
      .exec();
    if (!res) {
      throw new BadRequestException('Insufficient stock or inactive product');
    }
    return res;
  }
}

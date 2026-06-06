import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
  ) {}

  async findPublicList(filters: { category?: string; search?: string }) {
    const q: Record<string, unknown> = { isActive: true };
    if (filters.category) {
      q.category = filters.category.toLowerCase();
    }
    if (filters.search) {
      const escapedSearch = filters.search.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
      q.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { hindiName: { $regex: escapedSearch, $options: 'i' } },
      ];
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

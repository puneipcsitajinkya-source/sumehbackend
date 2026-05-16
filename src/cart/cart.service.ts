import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Cart, CartDocument } from './schemas/cart.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
  ) {}

  private async getOrCreateCart(userId: string) {
    let cart = await this.cartModel.findOne({ userId }).exec();
    if (!cart) {
      cart = await this.cartModel.create({
        userId: new Types.ObjectId(userId),
        items: [],
      });
    }
    return cart;
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    return this.populateCart(cart);
  }

  private async populateCart(cart: CartDocument) {
    await cart.populate('items.productId');
    return cart.toObject();
  }

  async addItem(userId: string, productId: string, quantity: number) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product id');
    }
    const product = await this.productModel.findById(productId).exec();
    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found');
    }
    if (product.stock < quantity) {
      throw new BadRequestException('Not enough stock');
    }

    const cart = await this.getOrCreateCart(userId);
    const pid = new Types.ObjectId(productId);
    const existing = cart.items.find(
      (i) => String(i.productId) === productId,
    );
    const nextQty = (existing?.quantity ?? 0) + quantity;
    if (nextQty > product.stock) {
      throw new BadRequestException('Not enough stock');
    }
    if (existing) {
      existing.quantity = nextQty;
    } else {
      cart.items.push({ productId: pid, quantity });
    }
    await cart.save();
    return this.populateCart(cart);
  }

  async updateItem(userId: string, productId: string, quantity: number) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product id');
    }
    const product = await this.productModel.findById(productId).exec();
    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found');
    }
    if (product.stock < quantity) {
      throw new BadRequestException('Not enough stock');
    }
    const cart = await this.cartModel.findOne({ userId }).exec();
    if (!cart) {
      throw new NotFoundException('Cart empty');
    }
    const item = cart.items.find((i) => String(i.productId) === productId);
    if (!item) {
      throw new NotFoundException('Item not in cart');
    }
    item.quantity = quantity;
    await cart.save();
    return this.populateCart(cart);
  }

  async removeItem(userId: string, productId: string) {
    if (!Types.ObjectId.isValid(productId)) {
      throw new BadRequestException('Invalid product id');
    }
    const cart = await this.cartModel.findOne({ userId }).exec();
    if (!cart) {
      return { items: [] };
    }
    cart.items = cart.items.filter((i) => String(i.productId) !== productId);
    await cart.save();
    return this.populateCart(cart);
  }

  async clearCart(userId: string, session?: import('mongoose').ClientSession) {
    await this.cartModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: { items: [] } },
        { session },
      )
      .exec();
  }

  async getCartDocument(userId: string) {
    return this.getOrCreateCart(userId);
  }
}

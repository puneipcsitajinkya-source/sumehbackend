import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { Address, AddressDocument } from './schemas/address.schema';

@Injectable()
export class AddressesService {
  constructor(
    @InjectModel(Address.name) private readonly addressModel: Model<AddressDocument>,
  ) {}

  async listForUser(userId: string) {
    return this.addressModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async create(userId: string, dto: CreateAddressDto) {
    return this.addressModel.create({
      userId: new Types.ObjectId(userId),
      label: dto.label ?? 'Home',
      line1: dto.line1,
      city: dto.city,
      pincode: dto.pincode,
      phone: dto.phone,
    });
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid address id');
    }
    const doc = await this.addressModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Address not found');
    }
    if (String(doc.userId) !== userId) {
      throw new ForbiddenException();
    }
    Object.assign(doc, dto);
    await doc.save();
    return doc.toObject();
  }

  async remove(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid address id');
    }
    const doc = await this.addressModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException('Address not found');
    }
    if (String(doc.userId) !== userId) {
      throw new ForbiddenException();
    }
    await doc.deleteOne();
    return { deleted: true };
  }

  async getOwnedOrThrow(userId: string, addressId: string) {
    if (!Types.ObjectId.isValid(addressId)) {
      throw new BadRequestException('Invalid address id');
    }
    const doc = await this.addressModel.findById(addressId).lean().exec();
    if (!doc) {
      throw new NotFoundException('Address not found');
    }
    if (String(doc.userId) !== userId) {
      throw new ForbiddenException();
    }
    return doc;
  }
}

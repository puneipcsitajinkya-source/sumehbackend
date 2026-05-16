import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async createCustomer(input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<UserDocument> {
    const passwordHash = await bcrypt.hash(input.password, 10);
    return this.userModel.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      phone: input.phone ?? '',
      role: UserRole.User,
    });
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .exec();
  }

  async findByIdLean(id: string) {
    return this.userModel
      .findById(id)
      .select('-passwordHash')
      .lean()
      .exec();
  }

  async findByEmailPlain(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }
}

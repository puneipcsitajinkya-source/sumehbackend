import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ _id: false })
export class AddressSnapshot {
  @Prop({ required: true, trim: true })
  line1: string;

  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ required: true, trim: true })
  pincode: string;
}

const AddressSnapshotSchema = SchemaFactory.createForClass(AddressSnapshot);

@Schema({ _id: false })
export class OrderLine {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  unit: string;

  @Prop({ required: true })
  image: string;
}

const OrderLineSchema = SchemaFactory.createForClass(OrderLine);

export enum OrderStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  OutForDelivery = 'out_for_delivery',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
}

export type OrderDocument = HydratedDocument<Order>;

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, trim: true, index: true })
  customerPhone: string;

  @Prop({ trim: true, default: '' })
  customerName: string;

  @Prop({ type: AddressSnapshotSchema, required: true })
  addressSnapshot: AddressSnapshot;

  @Prop({ type: [OrderLineSchema], required: true })
  lines: OrderLine[];

  @Prop({ required: true, min: 0 })
  total: number;

  @Prop({
    enum: OrderStatus,
    default: OrderStatus.Pending,
  })
  status: OrderStatus;

  @Prop({ default: 'cod' })
  paymentMethod: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

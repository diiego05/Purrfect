import mongoose, { Document, Schema } from 'mongoose';

export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
export type PaymentMethod = 'VNPAY' | 'FREE';

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderCode: string;
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  amount: number;
  originalAmount: number;
  discountAmount: number;
  couponCode?: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  vnpayDetails?: {
    transactionNo?: string;
    bankCode?: string;
    bankTranNo?: string;
    cardType?: string;
    payDate?: string;
    responseCode?: string;
    txnRef?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    orderCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    originalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponCode: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['VNPAY', 'FREE'],
      default: 'VNPAY',
    },
    vnpayDetails: {
      transactionNo: { type: String, default: '' },
      bankCode: { type: String, default: '' },
      bankTranNo: { type: String, default: '' },
      cardType: { type: String, default: '' },
      payDate: { type: String, default: '' },
      responseCode: { type: String, default: '' },
      txnRef: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    collection: 'orders',
  },
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);
export default Order;

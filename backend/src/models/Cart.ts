import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
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
  },
  {
    timestamps: true,
    collection: 'cart_items',
  },
);

// Mỗi người dùng chỉ có thể thêm một khóa học vào giỏ hàng 1 lần
cartItemSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const CartItem = mongoose.model<ICartItem>('CartItem', cartItemSchema);
export default CartItem;

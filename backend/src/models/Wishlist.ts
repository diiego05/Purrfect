import mongoose, { Document, Schema } from 'mongoose';

export interface IWishlistItem extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const wishlistSchema = new Schema<IWishlistItem>(
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
    collection: 'wishlists',
  },
);

// Mỗi người dùng chỉ có thể lưu một khóa học vào danh sách yêu thích 1 lần
wishlistSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const WishlistItem = mongoose.model<IWishlistItem>(
  'WishlistItem',
  wishlistSchema,
);
export default WishlistItem;

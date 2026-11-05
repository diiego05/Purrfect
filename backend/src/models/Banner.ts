import mongoose, { Document, Schema } from 'mongoose';

export interface IBanner extends Document {
  imageUrl: string;
  title?: string;
  linkUrl?: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    linkUrl: {
      type: String,
      trim: true,
      default: '',
    },
    orderIndex: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'banners',
  }
);

export default mongoose.model<IBanner>('Banner', BannerSchema);


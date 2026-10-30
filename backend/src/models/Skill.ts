import mongoose, { Document, Schema } from 'mongoose';

export interface ISkill extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  categoryId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const skillSchema = new Schema<ISkill>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'skills',
  },
);

// Tối ưu hóa truy vấn theo danh mục
skillSchema.index({ categoryId: 1 });
skillSchema.index({ slug: 1, categoryId: 1 }, { unique: true });

export const Skill = mongoose.model<ISkill>('Skill', skillSchema);

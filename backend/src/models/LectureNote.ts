import mongoose, { Document, Schema } from 'mongoose';

export interface ILectureNote extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  lectureId: mongoose.Types.ObjectId;
  content: string;
  timestampSeconds: number;
  createdAt: Date;
  updatedAt: Date;
}

const lectureNoteSchema = new Schema<ILectureNote>(
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
    lectureId: { type: Schema.Types.ObjectId, required: true, index: true },
    content: { type: String, required: true, trim: true, maxlength: 3000 },
    timestampSeconds: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, collection: 'lecture_notes' },
);

lectureNoteSchema.index({ userId: 1, lectureId: 1, timestampSeconds: 1 });

export const LectureNote = mongoose.model<ILectureNote>(
  'LectureNote',
  lectureNoteSchema,
);

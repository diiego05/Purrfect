import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICourseDiscussion extends Document {
  _id: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  lectureId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  parentId?: mongoose.Types.ObjectId | null;
  content: string;
  upvoteCount: number;
  upvotedUsers: mongoose.Types.ObjectId[];
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICourseDiscussionModel extends Model<ICourseDiscussion> {
  createComment(
    userId: string | mongoose.Types.ObjectId,
    courseId: string | mongoose.Types.ObjectId,
    lectureId: string | mongoose.Types.ObjectId,
    content: string,
    parentId?: string | mongoose.Types.ObjectId | null,
  ): Promise<ICourseDiscussion>;

  createReply(
    userId: string | mongoose.Types.ObjectId,
    courseId: string | mongoose.Types.ObjectId,
    lectureId: string | mongoose.Types.ObjectId,
    content: string,
    parentId: string | mongoose.Types.ObjectId,
  ): Promise<ICourseDiscussion>;

  updatePinStatus(
    replyId: string | mongoose.Types.ObjectId,
    isPinned: boolean,
  ): Promise<ICourseDiscussion | null>;
}

const courseDiscussionSchema = new Schema<
  ICourseDiscussion,
  ICourseDiscussionModel
>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    lectureId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'CourseDiscussion',
      default: null,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    upvoteCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    upvotedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'course_discussions',
  },
);

// Khớp Lược đồ tuần tự 3.2.22: createComment(userId, courseId, lectureId, content, parentId = null)
courseDiscussionSchema.statics.createComment = async function (
  userId: string | mongoose.Types.ObjectId,
  courseId: string | mongoose.Types.ObjectId,
  lectureId: string | mongoose.Types.ObjectId,
  content: string,
  parentId: string | mongoose.Types.ObjectId | null = null,
): Promise<ICourseDiscussion> {
  return this.create({
    userId,
    courseId,
    lectureId,
    content: content.trim(),
    parentId: parentId || null,
    upvoteCount: 0,
    upvotedUsers: [],
    isPinned: false,
  });
};

// Khớp Lược đồ tuần tự 3.2.22: createReply(instructorId, courseId, lectureId, content, parentId = id)
courseDiscussionSchema.statics.createReply = async function (
  userId: string | mongoose.Types.ObjectId,
  courseId: string | mongoose.Types.ObjectId,
  lectureId: string | mongoose.Types.ObjectId,
  content: string,
  parentId: string | mongoose.Types.ObjectId,
): Promise<ICourseDiscussion> {
  return this.create({
    userId,
    courseId,
    lectureId,
    content: content.trim(),
    parentId,
    upvoteCount: 0,
    upvotedUsers: [],
    isPinned: false,
  });
};

// Khớp Lược đồ tuần tự 3.2.22: updatePinStatus(replyId, isPinned = true)
courseDiscussionSchema.statics.updatePinStatus = async function (
  replyId: string | mongoose.Types.ObjectId,
  isPinned: boolean = true,
): Promise<ICourseDiscussion | null> {
  return this.findByIdAndUpdate(
    replyId,
    { $set: { isPinned } },
    { new: true },
  );
};

export const CourseDiscussion = mongoose.model<
  ICourseDiscussion,
  ICourseDiscussionModel
>('CourseDiscussion', courseDiscussionSchema);

export default CourseDiscussion;

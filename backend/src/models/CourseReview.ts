import mongoose, { Document, Model, Schema } from 'mongoose';

export type ReviewReplyRole = 'INSTRUCTOR' | 'ADMIN';
export type ReviewStatus = 'ACTIVE' | 'HIDDEN' | 'DELETED';

export interface ICourseReview extends Document {
  _id: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rating: number; // 1 - 5 sao
  comment: string;
  instructorReply?: string | null;
  repliedAt?: Date | null;
  repliedBy?: mongoose.Types.ObjectId | null;
  replyRole?: ReviewReplyRole | null;
  status: ReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICourseReviewModel extends Model<ICourseReview> {
  saveInstructorReply(
    reviewId: string | mongoose.Types.ObjectId,
    instructorReply: string,
    repliedBy: string | mongoose.Types.ObjectId,
    replyRole: ReviewReplyRole,
    repliedAt?: Date,
  ): Promise<ICourseReview | null>;

  deleteInstructorReply(
    reviewId: string | mongoose.Types.ObjectId,
  ): Promise<ICourseReview | null>;

  hideOrDeleteContent(
    targetId: string | mongoose.Types.ObjectId,
    action?: 'HIDE' | 'DELETE',
  ): Promise<ICourseReview | null>;
}

const courseReviewSchema = new Schema<ICourseReview, ICourseReviewModel>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    instructorReply: {
      type: String,
      default: null,
      trim: true,
      maxlength: 3000,
    },
    repliedAt: {
      type: Date,
      default: null,
    },
    repliedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    replyRole: {
      type: String,
      enum: ['INSTRUCTOR', 'ADMIN'],
      default: null,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'HIDDEN', 'DELETED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'course_reviews',
  },
);

// Khớp Sequence Diagram 3.2.23: saveInstructorReply(reviewId, instructorReply, repliedAt)
courseReviewSchema.statics.saveInstructorReply = async function (
  reviewId: string | mongoose.Types.ObjectId,
  instructorReply: string,
  repliedBy: string | mongoose.Types.ObjectId,
  replyRole: ReviewReplyRole,
  repliedAt: Date = new Date(),
): Promise<ICourseReview | null> {
  return this.findByIdAndUpdate(
    reviewId,
    {
      $set: {
        instructorReply: instructorReply.trim(),
        repliedBy,
        replyRole,
        repliedAt,
      },
    },
    { new: true },
  )
    .populate('userId', 'fullName email avatarUrl role')
    .populate('repliedBy', 'fullName email avatarUrl role');
};

// Alternative Flow 4a: Xóa phản hồi
courseReviewSchema.statics.deleteInstructorReply = async function (
  reviewId: string | mongoose.Types.ObjectId,
): Promise<ICourseReview | null> {
  return this.findByIdAndUpdate(
    reviewId,
    {
      $set: {
        instructorReply: null,
        repliedBy: null,
        replyRole: null,
        repliedAt: null,
      },
    },
    { new: true },
  ).populate('userId', 'fullName email avatarUrl role');
};

// Khớp Sequence Diagram 3.2.26: CourseDiscussion.hideOrDeleteContent(reportObject.targetId) -> contentRemoved()
courseReviewSchema.statics.hideOrDeleteContent = async function (
  targetId: string | mongoose.Types.ObjectId,
  action: 'HIDE' | 'DELETE' = 'HIDE',
): Promise<ICourseReview | null> {
  const newStatus = action === 'DELETE' ? 'DELETED' : 'HIDDEN';
  const review = await this.findByIdAndUpdate(
    targetId,
    { $set: { status: newStatus } },
    { new: true },
  );

  if (review) {
    const Course = mongoose.model('Course');
    const activeReviews = await this.find({
      courseId: review.courseId,
      status: 'ACTIVE',
    });
    if (activeReviews.length > 0) {
      const totalRating = activeReviews.reduce(
        (sum: number, r: ICourseReview) => sum + r.rating,
        0,
      );
      const averageRating =
        Math.round((totalRating / activeReviews.length) * 10) / 10;
      await Course.findByIdAndUpdate(review.courseId, {
        $set: { averageRating },
      });
    } else {
      await Course.findByIdAndUpdate(review.courseId, {
        $set: { averageRating: 0 },
      });
    }
  }

  return review;
};

export const CourseReview = mongoose.model<ICourseReview, ICourseReviewModel>(
  'CourseReview',
  courseReviewSchema,
);

export default CourseReview;

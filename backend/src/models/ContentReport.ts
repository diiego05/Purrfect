import mongoose, { Document, Model, Schema } from 'mongoose';

export type ReportTargetType = 'DISCUSSION' | 'REVIEW';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';
export type ReportReason =
  | 'SPAM'
  | 'INAPPROPRIATE'
  | 'HARASSMENT'
  | 'MALICIOUS_LINK'
  | 'OFF_TOPIC'
  | 'OTHER';

export interface IContentReport extends Document {
  _id: mongoose.Types.ObjectId;
  targetType: ReportTargetType;
  targetId: mongoose.Types.ObjectId;
  offendingUserId: mongoose.Types.ObjectId;
  reportedBy: mongoose.Types.ObjectId;
  reason: ReportReason;
  details?: string | null;
  status: ReportStatus;
  moderatedBy?: mongoose.Types.ObjectId | null;
  moderatedAt?: Date | null;
  moderationAction?: 'HIDE' | 'DELETE' | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IContentReportModel extends Model<IContentReport> {
  updateStatus(
    reportId: string | mongoose.Types.ObjectId,
    status: ReportStatus,
    moderatedBy?: string | mongoose.Types.ObjectId | null,
    moderationAction?: 'HIDE' | 'DELETE' | null,
  ): Promise<IContentReport | null>;
}

const contentReportSchema = new Schema<IContentReport, IContentReportModel>(
  {
    targetType: {
      type: String,
      enum: ['DISCUSSION', 'REVIEW'],
      required: true,
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    offendingUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      enum: ['SPAM', 'INAPPROPRIATE', 'HARASSMENT', 'MALICIOUS_LINK', 'OFF_TOPIC', 'OTHER'],
      required: true,
    },
    details: {
      type: String,
      default: null,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['PENDING', 'RESOLVED', 'DISMISSED'],
      default: 'PENDING',
      index: true,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
    moderationAction: {
      type: String,
      enum: ['HIDE', 'DELETE'],
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'content_reports',
  },
);

// Khớp Sequence Diagram 3.2.26: ContentReport.updateStatus(reportId, status)
contentReportSchema.statics.updateStatus = async function (
  reportId: string | mongoose.Types.ObjectId,
  status: ReportStatus,
  moderatedBy: string | mongoose.Types.ObjectId | null = null,
  moderationAction: 'HIDE' | 'DELETE' | null = null,
): Promise<IContentReport | null> {
  return this.findByIdAndUpdate(
    reportId,
    {
      $set: {
        status,
        moderatedBy,
        moderatedAt: new Date(),
        moderationAction,
      },
    },
    { new: true },
  )
    .populate('offendingUserId', 'fullName email avatarUrl')
    .populate('reportedBy', 'fullName email avatarUrl')
    .populate('moderatedBy', 'fullName email avatarUrl');
};

export const ContentReport = mongoose.model<IContentReport, IContentReportModel>(
  'ContentReport',
  contentReportSchema,
);

export default ContentReport;

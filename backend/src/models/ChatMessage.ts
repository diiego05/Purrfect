import mongoose, { Document, Schema } from 'mongoose';

export type ChatRole = 'USER' | 'ASSISTANT';

export interface IChatMessage extends Document {
  _id: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId | null;
  courseId?: mongoose.Types.ObjectId | null;
  role: ChatRole;
  prompt: string;
  createdAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
      index: true,
    },
    role: {
      type: String,
      enum: ['USER', 'ASSISTANT'],
      required: true,
      index: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'chat_messages',
  },
);

export const ChatMessage = mongoose.model<IChatMessage>(
  'ChatMessage',
  chatMessageSchema,
);

/**
 * Hàm lưu tin nhắn khớp với phương thức saveMessage trong Lược đồ tuần tự 3.2.21
 * saveMessage(studentId, courseId, role, prompt)
 */
export async function saveMessage(params: {
  studentId?: string | mongoose.Types.ObjectId | null;
  courseId?: string | mongoose.Types.ObjectId | null;
  role: ChatRole;
  prompt: string;
}): Promise<IChatMessage> {
  let studentObjectId: mongoose.Types.ObjectId | null = null;
  if (params.studentId && mongoose.isValidObjectId(params.studentId)) {
    studentObjectId = new mongoose.Types.ObjectId(params.studentId.toString());
  }

  let courseObjectId: mongoose.Types.ObjectId | null = null;
  if (params.courseId && mongoose.isValidObjectId(params.courseId)) {
    courseObjectId = new mongoose.Types.ObjectId(params.courseId.toString());
  }

  return ChatMessage.create({
    studentId: studentObjectId,
    courseId: courseObjectId,
    role: params.role,
    prompt: params.prompt,
  });
}


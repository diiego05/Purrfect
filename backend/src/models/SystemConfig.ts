import mongoose, { Document, Schema } from 'mongoose';

export type ConfigGroup = 'FINANCE' | 'UI' | 'SYSTEM';

export interface ISystemConfig extends Document {
  keyName: string;
  valueText: string;
  group: ConfigGroup;
  description?: string;
  updatedAt: Date;
}

const SystemConfigSchema = new Schema<ISystemConfig>(
  {
    keyName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    valueText: {
      type: String,
      required: true,
      default: '',
    },
    group: {
      type: String,
      enum: ['FINANCE', 'UI', 'SYSTEM'],
      required: true,
      default: 'SYSTEM',
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'system_configs',
  }
);

export default mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);


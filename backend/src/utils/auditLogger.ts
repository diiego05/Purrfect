import mongoose from 'mongoose';
import { AuditLog } from '../models/AuditLog';

export interface AuditLogParams {
  adminId: string | mongoose.Types.ObjectId;
  action: string;
  targetType: string;
  targetId?: string | mongoose.Types.ObjectId;
  details?: Record<string, unknown> | string;
  ipAddress?: string;
}

export const recordAuditLog = async (params: AuditLogParams): Promise<void> => {
  try {
    const adminObjectId =
      typeof params.adminId === 'string'
        ? new mongoose.Types.ObjectId(params.adminId)
        : params.adminId;

    await AuditLog.create({
      adminId: adminObjectId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId ? params.targetId.toString() : '',
      details: params.details || {},
      ipAddress: params.ipAddress || '',
    });
  } catch (err) {
    // Không làm gián đoạn luồng chính nếu ghi log thất bại
    console.error('[AuditLogger] Không thể lưu nhật ký kiểm toán:', err);
  }
};


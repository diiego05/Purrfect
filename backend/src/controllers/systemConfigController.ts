import { Request, Response } from 'express';
import SystemConfig from '../models/SystemConfig';
import { recordAuditLog } from '../utils/auditLogger';

// Default config values
const DEFAULT_CONFIGS = [
  {
    keyName: 'COMMISSION_RATE_PERCENT',
    valueText: '15',
    group: 'FINANCE' as const,
    description: 'Tỷ lệ hoa hồng nền tảng (%)',
  },
  {
    keyName: 'MIN_WITHDRAWAL_AMOUNT',
    valueText: '200000',
    group: 'FINANCE' as const,
    description: 'Số tiền rút tối thiểu (VND)',
  },
  {
    keyName: 'HOME_HERO_TITLE',
    valueText: 'Nền tảng học trực tuyến hàng đầu',
    group: 'UI' as const,
    description: 'Tiêu đề banner trang chủ',
  },
  {
    keyName: 'HOME_HERO_SUBTITLE',
    valueText: 'Khám phá hàng nghìn khóa học chất lượng cao',
    group: 'UI' as const,
    description: 'Mô tả banner trang chủ',
  },
  {
    keyName: 'FOOTER_EMAIL',
    valueText: 'support@learnova.vn',
    group: 'UI' as const,
    description: 'Email liên hệ footer',
  },
  {
    keyName: 'FOOTER_PHONE',
    valueText: '1900 1234',
    group: 'UI' as const,
    description: 'Hotline footer',
  },
  {
    keyName: 'FOOTER_ADDRESS',
    valueText: 'TP. Hồ Chí Minh, Việt Nam',
    group: 'UI' as const,
    description: 'Địa chỉ footer',
  },
  {
    keyName: 'FOOTER_FACEBOOK',
    valueText: '',
    group: 'UI' as const,
    description: 'Link Facebook',
  },
  {
    keyName: 'FOOTER_YOUTUBE',
    valueText: '',
    group: 'UI' as const,
    description: 'Link YouTube',
  },
  {
    keyName: 'FOOTER_ZALO',
    valueText: '',
    group: 'UI' as const,
    description: 'Link Zalo',
  },
  {
    keyName: 'PLATFORM_NAME',
    valueText: 'Learnova',
    group: 'SYSTEM' as const,
    description: 'Tên nền tảng',
  },
];

// GET /api/system-configs/public - public accessible configs
export const getPublicConfigs = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const configs = await SystemConfig.find({ group: 'UI' }).sort({
      keyName: 1,
    });
    const result: Record<string, string> = {};
    configs.forEach((c) => {
      result[c.keyName] = c.valueText;
    });
    res.json({ configs: result });
  } catch {
    res.status(500).json({ message: 'Lỗi server khi lấy cấu hình công khai.' });
  }
};

// GET /api/system-configs - [Admin] all configs
export const getAllConfigs = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const configs = await SystemConfig.find().sort({ group: 1, keyName: 1 });
    res.json({ configs });
  } catch {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách cấu hình.' });
  }
};

// PUT /api/system-configs - [Admin] batch update configs
export const updateConfigs = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { updates } = req.body as {
      updates: Array<{ keyName: string; valueText: string }>;
    };

    if (!Array.isArray(updates) || updates.length === 0) {
      res.status(400).json({ message: 'Dữ liệu cập nhật không hợp lệ.' });
      return;
    }

    // Validate business rules
    for (const item of updates) {
      if (item.keyName === 'COMMISSION_RATE_PERCENT') {
        const val = parseFloat(item.valueText);
        if (isNaN(val) || val < 0 || val > 100) {
          res.status(400).json({
            message: 'Tỷ lệ hoa hồng phải nằm trong khoảng 0 đến 100.',
          });
          return;
        }
      }
      if (item.keyName === 'MIN_WITHDRAWAL_AMOUNT') {
        const val = parseFloat(item.valueText);
        if (isNaN(val) || val < 0) {
          res.status(400).json({
            message: 'Số tiền rút tối thiểu phải lớn hơn hoặc bằng 0.',
          });
          return;
        }
      }
    }

    const bulkOps = updates.map((item) => ({
      updateOne: {
        filter: { keyName: item.keyName },
        update: { $set: { valueText: item.valueText } },
        upsert: true,
      },
    }));

    await SystemConfig.bulkWrite(bulkOps);

    const adminId = (req as Request & { user?: { id: string } }).user?.id;
    await recordAuditLog({
      adminId: adminId || 'unknown',
      action: 'UPDATE_SYSTEM_CONFIGS',
      targetType: 'SystemConfig',
      targetId: 'batch',
      details: { updatedKeys: updates.map((u) => u.keyName) },
      ipAddress: req.ip || '',
    });

    res.json({ message: 'Cấu hình đã được lưu thành công.' });
  } catch {
    res.status(500).json({ message: 'Lỗi server khi lưu cấu hình.' });
  }
};

// POST /api/system-configs/reset - [Admin] reset to defaults
export const resetToDefaults = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const bulkOps = DEFAULT_CONFIGS.map((cfg) => ({
      updateOne: {
        filter: { keyName: cfg.keyName },
        update: {
          $set: {
            valueText: cfg.valueText,
            group: cfg.group,
            description: cfg.description,
          },
        },
        upsert: true,
      },
    }));

    await SystemConfig.bulkWrite(bulkOps);

    const adminId = (req as Request & { user?: { id: string } }).user?.id;
    await recordAuditLog({
      adminId: adminId || 'unknown',
      action: 'RESET_SYSTEM_CONFIGS',
      targetType: 'SystemConfig',
      targetId: 'all',
      details: { resetCount: DEFAULT_CONFIGS.length },
      ipAddress: req.ip || '',
    });

    res.json({ message: 'Đã khôi phục cài đặt mặc định thành công.' });
  } catch {
    res.status(500).json({ message: 'Lỗi server khi khôi phục cấu hình.' });
  }
};

// POST /api/system-configs/seed - seed default configs (only if missing)
export const seedDefaultConfigs = async (): Promise<void> => {
  for (const cfg of DEFAULT_CONFIGS) {
    await SystemConfig.updateOne(
      { keyName: cfg.keyName },
      { $setOnInsert: cfg },
      { upsert: true },
    );
  }
};

import { Request, Response } from 'express';
import Banner from '../models/Banner';
import { recordAuditLog } from '../utils/auditLogger';

type AuthRequest = Request & { user?: { id: string } };

// GET /api/banners - public active banners sorted by orderIndex
export const getActiveBanners = async (_req: Request, res: Response): Promise<void> => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ orderIndex: 1 });
    res.json({ banners });
  } catch {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách banner.' });
  }
};

// GET /api/banners/all - [Admin] all banners
export const getAllBanners = async (_req: Request, res: Response): Promise<void> => {
  try {
    const banners = await Banner.find().sort({ orderIndex: 1 });
    res.json({ banners });
  } catch {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách banner.' });
  }
};

// POST /api/banners - [Admin] create banner
export const createBanner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { imageUrl, title, linkUrl, orderIndex, isActive } = req.body as {
      imageUrl: string;
      title?: string;
      linkUrl?: string;
      orderIndex?: number;
      isActive?: boolean;
    };

    if (!imageUrl || !imageUrl.trim()) {
      res.status(400).json({ message: 'URL hình ảnh không được để trống.' });
      return;
    }

    // Determine next orderIndex if not provided
    let order = orderIndex;
    if (order === undefined || order === null) {
      const lastBanner = await Banner.findOne().sort({ orderIndex: -1 });
      order = lastBanner ? lastBanner.orderIndex + 1 : 0;
    }

    const banner = new Banner({
      imageUrl: imageUrl.trim(),
      title: title?.trim() || '',
      linkUrl: linkUrl?.trim() || '',
      orderIndex: order,
      isActive: isActive !== undefined ? isActive : true,
    });

    await banner.save();

    await recordAuditLog({
      adminId: req.user?.id || 'unknown',
      action: 'CREATE_BANNER',
      targetType: 'Banner',
      targetId: String(banner._id),
      details: { title: banner.title, imageUrl: banner.imageUrl },
      ipAddress: req.ip || '',
    });

    res.status(201).json({ message: 'Tạo banner thành công.', banner });
  } catch {
    res.status(500).json({ message: 'Lỗi server khi tạo banner.' });
  }
};

// PUT /api/banners/:id - [Admin] update banner
export const updateBanner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { imageUrl, title, linkUrl, orderIndex, isActive } = req.body as {
      imageUrl?: string;
      title?: string;
      linkUrl?: string;
      orderIndex?: number;
      isActive?: boolean;
    };

    const banner = await Banner.findById(id);
    if (!banner) {
      res.status(404).json({ message: 'Không tìm thấy banner.' });
      return;
    }

    if (imageUrl !== undefined) banner.imageUrl = imageUrl.trim();
    if (title !== undefined) banner.title = title.trim();
    if (linkUrl !== undefined) banner.linkUrl = linkUrl.trim();
    if (orderIndex !== undefined) banner.orderIndex = orderIndex;
    if (isActive !== undefined) banner.isActive = isActive;

    await banner.save();

    await recordAuditLog({
      adminId: req.user?.id || 'unknown',
      action: 'UPDATE_BANNER',
      targetType: 'Banner',
      targetId: String(banner._id),
      details: { title: banner.title },
      ipAddress: req.ip || '',
    });

    res.json({ message: 'Cập nhật banner thành công.', banner });
  } catch {
    res.status(500).json({ message: 'Lỗi server khi cập nhật banner.' });
  }
};

// DELETE /api/banners/:id - [Admin] delete banner
export const deleteBanner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) {
      res.status(404).json({ message: 'Không tìm thấy banner.' });
      return;
    }

    await recordAuditLog({
      adminId: req.user?.id || 'unknown',
      action: 'DELETE_BANNER',
      targetType: 'Banner',
      targetId: String(id),
      details: { title: banner.title },
      ipAddress: req.ip || '',
    });

    res.json({ message: 'Xóa banner thành công.' });
  } catch {
    res.status(500).json({ message: 'Lỗi server khi xóa banner.' });
  }
};

// PATCH /api/banners/:id/toggle - [Admin] toggle isActive
export const toggleBanner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);
    if (!banner) {
      res.status(404).json({ message: 'Không tìm thấy banner.' });
      return;
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    await recordAuditLog({
      adminId: req.user?.id || 'unknown',
      action: 'TOGGLE_BANNER',
      targetType: 'Banner',
      targetId: String(banner._id),
      details: { isActive: banner.isActive },
      ipAddress: req.ip || '',
    });

    res.json({
      message: `Banner đã được ${banner.isActive ? 'kích hoạt' : 'tắt'} thành công.`,
      banner,
    });
  } catch {
    res.status(500).json({ message: 'Lỗi server khi thay đổi trạng thái banner.' });
  }
};

// PATCH /api/banners/reorder - [Admin] reorder banners
export const reorderBanners = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orders } = req.body as { orders: Array<{ id: string; orderIndex: number }> };

    if (!Array.isArray(orders) || orders.length === 0) {
      res.status(400).json({ message: 'Dữ liệu sắp xếp không hợp lệ.' });
      return;
    }

    const bulkOps = orders.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { orderIndex: item.orderIndex } },
      },
    }));

    await Banner.bulkWrite(bulkOps);

    res.json({ message: 'Sắp xếp banner thành công.' });
  } catch {
    res.status(500).json({ message: 'Lỗi server khi sắp xếp banner.' });
  }
};


import { Request, Response } from 'express';
import Coupon from '../models/Coupon';
import { recordAuditLog } from '../utils/auditLogger';

type AuthRequest = Request & { user?: { id: string } };

// GET /api/coupons - [Admin] get all coupons with optional filter
export const getAllCoupons = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, discountType, status } = req.query as {
      search?: string;
      discountType?: string;
      status?: string;
    };

    const filter: Record<string, unknown> = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ code: regex }, { description: regex }];
    }

    if (discountType && (discountType === 'PERCENT' || discountType === 'FIXED_AMOUNT')) {
      filter.discountType = discountType;
    }

    const now = new Date();
    if (status === 'ACTIVE') {
      filter.isActive = true;
      filter.validFrom = { $lte: now };
      filter.validTo = { $gte: now };
    } else if (status === 'INACTIVE') {
      filter.isActive = false;
    } else if (status === 'EXPIRED') {
      filter.validTo = { $lt: now };
    }

    const coupons = await Coupon.find(filter).sort({ createdAt: -1 });

    res.json({ coupons });
  } catch {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách mã giảm giá.' });
  }
};

// GET /api/coupons/:id - [Admin] get coupon by id
export const getCouponById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      res.status(404).json({ message: 'Không tìm thấy mã giảm giá.' });
      return;
    }
    res.json({ coupon });
  } catch {
    res.status(500).json({ message: 'Lỗi server khi lấy chi tiết mã giảm giá.' });
  }
};

// POST /api/coupons - [Admin] create coupon
export const createCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      totalUsageLimit,
      validFrom,
      validTo,
      isActive,
    } = req.body as {
      code: string;
      description?: string;
      discountType: 'PERCENT' | 'FIXED_AMOUNT';
      discountValue: number;
      maxDiscountAmount?: number | null;
      minOrderAmount?: number;
      totalUsageLimit?: number;
      validFrom: string;
      validTo: string;
      isActive?: boolean;
    };

    // 1. Validate Code
    if (!code || !code.trim()) {
      res.status(400).json({ message: 'Mã giảm giá không được để trống.' });
      return;
    }

    const normalizedCode = code.trim().toUpperCase();

    // Check duplicate code (BR18.1)
    const existing = await Coupon.findOne({ code: normalizedCode });
    if (existing) {
      res.status(409).json({ message: 'Mã giảm giá này đã tồn tại. Vui lòng đặt mã khác.' });
      return;
    }

    // 2. Validate Discount Type & Value (BR18.2)
    if (!discountType || !['PERCENT', 'FIXED_AMOUNT'].includes(discountType)) {
      res.status(400).json({ message: 'Loại giảm giá không hợp lệ (PERCENT hoặc FIXED_AMOUNT).' });
      return;
    }

    const numDiscountValue = Number(discountValue);
    if (isNaN(numDiscountValue) || numDiscountValue <= 0) {
      res.status(400).json({ message: 'Giá trị giảm giá phải lớn hơn 0.' });
      return;
    }

    if (discountType === 'PERCENT' && numDiscountValue > 100) {
      res.status(400).json({ message: 'Tỷ lệ phần trăm giảm giá không được vượt quá 100%.' });
      return;
    }

    // 3. Validate Date Range (BR18.1)
    if (!validFrom || !validTo) {
      res.status(400).json({ message: 'Vui lòng chọn ngày bắt đầu và ngày kết thúc.' });
      return;
    }

    const startDate = new Date(validFrom);
    const endDate = new Date(validTo);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      res.status(400).json({ message: 'Định dạng ngày không hợp lệ.' });
      return;
    }

    if (endDate <= startDate) {
      res.status(400).json({ message: 'Ngày kết thúc phải lớn hơn ngày bắt đầu có hiệu lực.' });
      return;
    }

    // 4. Validate other constraints
    const numMinOrder = Number(minOrderAmount) || 0;
    if (numMinOrder < 0) {
      res.status(400).json({ message: 'Giá trị đơn hàng tối thiểu không thể âm.' });
      return;
    }

    const numUsageLimit = Number(totalUsageLimit) || 100;
    if (numUsageLimit < 1) {
      res.status(400).json({ message: 'Giới hạn số lượt dùng phải ít nhất là 1.' });
      return;
    }

    const numMaxDiscount = maxDiscountAmount !== undefined && maxDiscountAmount !== null
      ? Number(maxDiscountAmount)
      : null;

    if (numMaxDiscount !== null && numMaxDiscount < 0) {
      res.status(400).json({ message: 'Mức giảm tối đa không thể âm.' });
      return;
    }

    const coupon = new Coupon({
      code: normalizedCode,
      description: description?.trim() || '',
      discountType,
      discountValue: numDiscountValue,
      maxDiscountAmount: discountType === 'PERCENT' ? numMaxDiscount : null,
      minOrderAmount: numMinOrder,
      totalUsageLimit: numUsageLimit,
      usedCount: 0,
      validFrom: startDate,
      validTo: endDate,
      isActive: isActive !== undefined ? isActive : true,
    });

    await coupon.save();

    await recordAuditLog({
      adminId: req.user?.id || 'unknown',
      action: 'CREATE_COUPON',
      targetType: 'Coupon',
      targetId: String(coupon._id),
      details: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue },
      ipAddress: req.ip || '',
    });

    res.status(201).json({ message: 'Tạo mã giảm giá thành công.', coupon });
  } catch {
    res.status(500).json({ message: 'Lỗi server khi tạo mã giảm giá.' });
  }
};

// PUT /api/coupons/:id - [Admin] update coupon
export const updateCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      code,
      description,
      discountType,
      discountValue,
      maxDiscountAmount,
      minOrderAmount,
      totalUsageLimit,
      validFrom,
      validTo,
      isActive,
    } = req.body as {
      code?: string;
      description?: string;
      discountType?: 'PERCENT' | 'FIXED_AMOUNT';
      discountValue?: number;
      maxDiscountAmount?: number | null;
      minOrderAmount?: number;
      totalUsageLimit?: number;
      validFrom?: string;
      validTo?: string;
      isActive?: boolean;
    };

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      res.status(404).json({ message: 'Không tìm thấy mã giảm giá.' });
      return;
    }

    // Code update & check uniqueness
    if (code !== undefined) {
      const normalizedCode = code.trim().toUpperCase();
      if (!normalizedCode) {
        res.status(400).json({ message: 'Mã giảm giá không được để trống.' });
        return;
      }
      if (normalizedCode !== coupon.code) {
        const existing = await Coupon.findOne({ code: normalizedCode, _id: { $ne: id } });
        if (existing) {
          res.status(409).json({ message: 'Mã giảm giá này đã tồn tại. Vui lòng đặt mã khác.' });
          return;
        }
        coupon.code = normalizedCode;
      }
    }

    if (description !== undefined) coupon.description = description.trim();

    // Discount type & value
    const finalType = discountType || coupon.discountType;
    const finalValue = discountValue !== undefined ? Number(discountValue) : coupon.discountValue;

    if (isNaN(finalValue) || finalValue <= 0) {
      res.status(400).json({ message: 'Giá trị giảm giá phải lớn hơn 0.' });
      return;
    }

    if (finalType === 'PERCENT' && finalValue > 100) {
      res.status(400).json({ message: 'Tỷ lệ phần trăm giảm giá không được vượt quá 100%.' });
      return;
    }

    coupon.discountType = finalType;
    coupon.discountValue = finalValue;

    // Date range validation
    const startDate = validFrom ? new Date(validFrom) : coupon.validFrom;
    const endDate = validTo ? new Date(validTo) : coupon.validTo;

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      res.status(400).json({ message: 'Định dạng ngày không hợp lệ.' });
      return;
    }

    if (endDate <= startDate) {
      res.status(400).json({ message: 'Ngày kết thúc phải lớn hơn ngày bắt đầu có hiệu lực.' });
      return;
    }

    coupon.validFrom = startDate;
    coupon.validTo = endDate;

    if (minOrderAmount !== undefined) {
      const numMinOrder = Number(minOrderAmount);
      if (numMinOrder < 0) {
        res.status(400).json({ message: 'Giá trị đơn hàng tối thiểu không thể âm.' });
        return;
      }
      coupon.minOrderAmount = numMinOrder;
    }

    if (totalUsageLimit !== undefined) {
      const numLimit = Number(totalUsageLimit);
      if (numLimit < coupon.usedCount) {
        res.status(400).json({ message: `Giới hạn số lượt dùng không được nhỏ hơn số lượt đã dùng (${coupon.usedCount}).` });
        return;
      }
      coupon.totalUsageLimit = numLimit;
    }

    if (maxDiscountAmount !== undefined) {
      const numMax = maxDiscountAmount !== null ? Number(maxDiscountAmount) : null;
      if (numMax !== null && numMax < 0) {
        res.status(400).json({ message: 'Mức giảm tối đa không thể âm.' });
        return;
      }
      coupon.maxDiscountAmount = finalType === 'PERCENT' ? numMax : null;
    }

    if (isActive !== undefined) {
      coupon.isActive = isActive;
    }

    await coupon.save();

    await recordAuditLog({
      adminId: req.user?.id || 'unknown',
      action: 'UPDATE_COUPON',
      targetType: 'Coupon',
      targetId: String(coupon._id),
      details: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue },
      ipAddress: req.ip || '',
    });

    res.json({ message: 'Cập nhật mã giảm giá thành công.', coupon });
  } catch {
    res.status(500).json({ message: 'Lỗi server khi cập nhật mã giảm giá.' });
  }
};

// DELETE /api/coupons/:id - [Admin] delete coupon
export const deleteCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      res.status(404).json({ message: 'Không tìm thấy mã giảm giá.' });
      return;
    }

    await recordAuditLog({
      adminId: req.user?.id || 'unknown',
      action: 'DELETE_COUPON',
      targetType: 'Coupon',
      targetId: String(id),
      details: { code: coupon.code },
      ipAddress: req.ip || '',
    });

    res.json({ message: 'Xóa mã giảm giá thành công.' });
  } catch {
    res.status(500).json({ message: 'Lỗi server khi xóa mã giảm giá.' });
  }
};

// PATCH /api/coupons/:id/toggle - [Admin] toggle active status
export const toggleCouponStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      res.status(404).json({ message: 'Không tìm thấy mã giảm giá.' });
      return;
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    await recordAuditLog({
      adminId: req.user?.id || 'unknown',
      action: 'TOGGLE_COUPON',
      targetType: 'Coupon',
      targetId: String(coupon._id),
      details: { code: coupon.code, isActive: coupon.isActive },
      ipAddress: req.ip || '',
    });

    res.json({
      message: `Mã giảm giá đã được ${coupon.isActive ? 'kích hoạt' : 'tạm dừng'} thành công.`,
      coupon,
    });
  } catch {
    res.status(500).json({ message: 'Lỗi server khi đổi trạng thái mã giảm giá.' });
  }
};

// POST /api/coupons/validate - validate and calculate discount (BR18.3)
export const validateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, orderAmount } = req.body as { code: string; orderAmount: number };

    if (!code || !code.trim()) {
      res.status(400).json({ valid: false, message: 'Vui lòng nhập mã giảm giá.' });
      return;
    }

    const numOrderAmount = Number(orderAmount);
    if (isNaN(numOrderAmount) || numOrderAmount < 0) {
      res.status(400).json({ valid: false, message: 'Giá trị đơn hàng không hợp lệ.' });
      return;
    }

    const normalizedCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: normalizedCode });

    if (!coupon) {
      res.status(404).json({
        valid: false,
        message: 'Mã giảm giá không tồn tại, đã hết hạn hoặc không áp dụng cho đơn hàng này.',
      });
      return;
    }

    // Check active status
    if (!coupon.isActive) {
      res.status(400).json({
        valid: false,
        message: 'Mã giảm giá hiện đang tạm ngừng kích hoạt.',
      });
      return;
    }

    const now = new Date();

    // Check validity window
    if (now < coupon.validFrom) {
      res.status(400).json({
        valid: false,
        message: `Mã giảm giá chưa đến ngày có hiệu lực (bắt đầu từ ${coupon.validFrom.toLocaleDateString('vi-VN')}).`,
      });
      return;
    }

    if (now > coupon.validTo) {
      res.status(400).json({
        valid: false,
        message: 'Mã giảm giá đã hết hạn sử dụng.',
      });
      return;
    }

    // Check usage limit
    if (coupon.usedCount >= coupon.totalUsageLimit) {
      res.status(400).json({
        valid: false,
        message: 'Mã giảm giá đã hết lượt sử dụng tối đa.',
      });
      return;
    }

    // Check minimum order amount
    if (numOrderAmount < coupon.minOrderAmount) {
      res.status(400).json({
        valid: false,
        message: `Đơn hàng chưa đạt giá trị tối thiểu ${new Intl.NumberFormat('vi-VN').format(coupon.minOrderAmount)} VND để áp dụng mã này.`,
      });
      return;
    }

    // Calculate discount amount (BR18.2)
    let discountAmount = 0;
    if (coupon.discountType === 'PERCENT') {
      discountAmount = (numOrderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      // FIXED_AMOUNT
      discountAmount = Math.min(coupon.discountValue, numOrderAmount);
    }

    // Round to integer VND
    discountAmount = Math.round(discountAmount);
    const finalAmount = Math.max(0, numOrderAmount - discountAmount);

    res.json({
      valid: true,
      message: 'Áp dụng mã giảm giá thành công!',
      discountAmount,
      finalAmount,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscountAmount: coupon.maxDiscountAmount,
        minOrderAmount: coupon.minOrderAmount,
        description: coupon.description,
      },
    });
  } catch {
    res.status(500).json({ valid: false, message: 'Lỗi server khi kiểm tra mã giảm giá.' });
  }
};

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Order from '../models/Order';
import { Course } from '../models/Course';
import Coupon from '../models/Coupon';
import { UserInteraction } from '../models/UserInteraction';
import {
  createVNPayPaymentUrl,
  verifyVNPaySignature,
  getVNPayResponseMessage,
  formatVNPayDate,
  sortObject,
  buildQueryString,
  normalizePriceVND,
} from '../utils/vnpay';

type AuthRequest = Request & { user?: { id: string } };

/**
 * POST /api/payment/create-vnpay-url
 * Khởi tạo đơn hàng và tạo link thanh toán VNPAY (hoặc đăng ký ngay nếu miễn phí)
 */
export const createPaymentUrl = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res
        .status(401)
        .json({ message: 'Vui lòng đăng nhập để thanh toán khóa học.' });
      return;
    }

    const { courseId, couponCode, bankCode, paymentMethod } = req.body as {
      courseId: string;
      couponCode?: string;
      bankCode?: string;
      paymentMethod?: string;
    };

    if (!courseId) {
      res.status(400).json({ message: 'Thiếu thông tin khóa học (courseId).' });
      return;
    }

    // 1. Kiểm tra khóa học tồn tại (hỗ trợ cả ObjectId và slug)
    let course = null;
    if (mongoose.Types.ObjectId.isValid(courseId)) {
      course = await Course.findById(courseId);
    }
    if (!course) {
      course = await Course.findOne({ slug: courseId });
    }
    if (!course) {
      res.status(404).json({ message: 'Không tìm thấy khóa học này.' });
      return;
    }

    // 2. Kiểm tra người dùng đã mua khóa học này chưa
    const existingPaidOrder = await Order.findOne({
      userId,
      courseId: course._id,
      status: 'PAID',
    });

    if (existingPaidOrder) {
      res.status(400).json({
        message: 'Bạn đã đăng ký khóa học này trước đó rồi.',
        isEnrolled: true,
      });
      return;
    }

    // 3. Tính toán giá gốc (luôn chuẩn hóa VND)
    const rawPrice =
      course.discountPrice &&
      course.discountPrice > 0 &&
      course.discountPrice < course.price
        ? course.discountPrice
        : course.price;

    const originalPrice = normalizePriceVND(rawPrice);

    let finalAmount = originalPrice;
    let discountAmount = 0;
    let appliedCouponCode: string | undefined = undefined;

    // 4. Áp dụng mã giảm giá nếu có
    if (couponCode && couponCode.trim()) {
      const normalizedCode = couponCode.trim().toUpperCase();
      const now = new Date();
      const coupon = await Coupon.findOne({
        code: normalizedCode,
        isActive: true,
        validFrom: { $lte: now },
        validTo: { $gte: now },
      });

      if (
        coupon &&
        coupon.usedCount < coupon.totalUsageLimit &&
        originalPrice >= coupon.minOrderAmount
      ) {
        if (coupon.discountType === 'PERCENT') {
          discountAmount = (originalPrice * coupon.discountValue) / 100;
          if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
          }
        } else {
          discountAmount = Math.min(coupon.discountValue, originalPrice);
        }

        discountAmount = Math.round(discountAmount);
        finalAmount = Math.max(0, originalPrice - discountAmount);
        appliedCouponCode = coupon.code;
      }
    }

    // 5. Tạo mã đơn hàng duy nhất: PURR + Timestamp + Random 3 chữ số
    const orderCode = `PURR${Date.now()}${Math.floor(100 + Math.random() * 900)}`;

    // 6. Trường hợp khóa học miễn phí (hoặc giảm 100%)
    if (finalAmount <= 0) {
      const freeOrder = new Order({
        orderCode,
        userId: new mongoose.Types.ObjectId(userId),
        courseId: course._id,
        amount: 0,
        originalAmount: originalPrice,
        discountAmount,
        couponCode: appliedCouponCode,
        status: 'PAID',
        paymentMethod: 'FREE',
      });

      await freeOrder.save();

      // Ghi nhận tương tác ENROLL cho AI đề xuất
      await UserInteraction.create({
        userId: new mongoose.Types.ObjectId(userId),
        courseId: course._id,
        actionType: 'ENROLL',
      });

      // Tăng số học viên
      await Course.findByIdAndUpdate(course._id, {
        $inc: { totalStudents: 1 },
      });

      // Cập nhật lượt dùng coupon nếu có
      if (appliedCouponCode) {
        await Coupon.findOneAndUpdate(
          { code: appliedCouponCode },
          { $inc: { usedCount: 1 } },
        );
      }

      res.status(200).json({
        isFree: true,
        isFreeOrder: true,
        success: true,
        message: 'Đăng ký khóa học thành công!',
        order: freeOrder,
      });
      return;
    }

    // 6.2. Trường hợp thanh toán trực tiếp (Direct Payment / Chuyển khoản QR ngân hàng)
    if (
      paymentMethod === 'DIRECT' ||
      paymentMethod === 'BANK_TRANSFER' ||
      paymentMethod === 'MOCK'
    ) {
      const directOrder = new Order({
        orderCode,
        userId: new mongoose.Types.ObjectId(userId),
        courseId: course._id,
        amount: finalAmount,
        originalAmount: originalPrice,
        discountAmount,
        couponCode: appliedCouponCode,
        status: 'PAID',
        paymentMethod:
          paymentMethod === 'BANK_TRANSFER' ? 'BANK_TRANSFER' : 'DIRECT',
        vnpayDetails: {
          transactionNo: `DIR${Date.now()}`,
          bankCode: bankCode || 'QR_TRANSFER',
          payDate: new Date().toISOString(),
          responseCode: '00',
          txnRef: orderCode,
        },
      });

      await directOrder.save();

      // Ghi nhận tương tác ENROLL cho AI đề xuất
      await UserInteraction.create({
        userId: new mongoose.Types.ObjectId(userId),
        courseId: course._id,
        actionType: 'ENROLL',
      });

      // Tăng số học viên
      await Course.findByIdAndUpdate(course._id, {
        $inc: { totalStudents: 1 },
      });

      // Cập nhật lượt dùng coupon nếu có
      if (appliedCouponCode) {
        await Coupon.findOneAndUpdate(
          { code: appliedCouponCode },
          { $inc: { usedCount: 1 } },
        );
      }

      res.status(200).json({
        isFree: false,
        isDirect: true,
        success: true,
        message: 'Thanh toán khóa học thành công!',
        order: directOrder,
        orderCode,
        finalAmount,
      });
      return;
    }

    // 7. Tạo đơn hàng PENDING chờ thanh toán VNPay
    const pendingOrder = new Order({
      orderCode,
      userId: new mongoose.Types.ObjectId(userId),
      courseId: course._id,
      amount: finalAmount,
      originalAmount: originalPrice,
      discountAmount,
      couponCode: appliedCouponCode,
      status: 'PENDING',
      paymentMethod: 'VNPAY',
    });

    await pendingOrder.save();

    // 8. Lấy IP người dùng và tạo URL VNPay
    const ipAddr =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    const paymentUrl = createVNPayPaymentUrl({
      orderCode,
      amount: finalAmount,
      orderInfo: `Thanh toan khoa hoc ${course.title}`,
      ipAddr,
      bankCode,
    });

    res.status(200).json({
      isFree: false,
      success: true,
      paymentUrl,
      orderCode,
      finalAmount,
    });
  } catch (error) {
    console.error('Lỗi khi tạo URL thanh toán VNPay:', error);
    res
      .status(500)
      .json({ message: 'Lỗi server khi khởi tạo thanh toán VNPAY.' });
  }
};

/**
 * POST /api/payment/direct-checkout
 * Hoàn tất thanh toán trực tiếp / Kích hoạt khóa học ngay lập tức
 */
export const directCheckout = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res
        .status(401)
        .json({ message: 'Vui lòng đăng nhập để thanh toán khóa học.' });
      return;
    }

    const { courseId, couponCode, bankCode, paymentMethod } = req.body as {
      courseId: string;
      couponCode?: string;
      bankCode?: string;
      paymentMethod?: string;
    };

    if (!courseId) {
      res.status(400).json({ message: 'Thiếu thông tin khóa học (courseId).' });
      return;
    }

    // 1. Kiểm tra khóa học tồn tại (hỗ trợ cả ObjectId và slug)
    let course = null;
    if (mongoose.Types.ObjectId.isValid(courseId)) {
      course = await Course.findById(courseId);
    }
    if (!course) {
      course = await Course.findOne({ slug: courseId });
    }
    if (!course) {
      res.status(404).json({ message: 'Không tìm thấy khóa học này.' });
      return;
    }

    // 2. Kiểm tra người dùng đã mua khóa học này chưa
    const existingPaidOrder = await Order.findOne({
      userId,
      courseId: course._id,
      status: 'PAID',
    });

    if (existingPaidOrder) {
      res.status(200).json({
        success: true,
        message: 'Bạn đã đăng ký khóa học này trước đó rồi.',
        isEnrolled: true,
        order: existingPaidOrder,
      });
      return;
    }

    // 3. Tính toán giá gốc (luôn chuẩn hóa VND)
    const rawPrice =
      course.discountPrice &&
      course.discountPrice > 0 &&
      course.discountPrice < course.price
        ? course.discountPrice
        : course.price;

    const originalPrice = normalizePriceVND(rawPrice);

    let finalAmount = originalPrice;
    let discountAmount = 0;
    let appliedCouponCode: string | undefined = undefined;

    // 4. Áp dụng mã giảm giá nếu có
    if (couponCode && couponCode.trim()) {
      const normalizedCode = couponCode.trim().toUpperCase();
      const now = new Date();
      const coupon = await Coupon.findOne({
        code: normalizedCode,
        isActive: true,
        validFrom: { $lte: now },
        validTo: { $gte: now },
      });

      if (
        coupon &&
        coupon.usedCount < coupon.totalUsageLimit &&
        originalPrice >= coupon.minOrderAmount
      ) {
        if (coupon.discountType === 'PERCENT') {
          discountAmount = (originalPrice * coupon.discountValue) / 100;
          if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
          }
        } else {
          discountAmount = Math.min(coupon.discountValue, originalPrice);
        }

        discountAmount = Math.round(discountAmount);
        finalAmount = Math.max(0, originalPrice - discountAmount);
        appliedCouponCode = coupon.code;
      }
    }

    // 5. Tạo mã đơn hàng duy nhất
    const orderCode = `PURR${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
    const effectivePaymentMethod =
      finalAmount <= 0
        ? 'FREE'
        : paymentMethod === 'VNPAY'
          ? 'VNPAY'
          : paymentMethod === 'BANK_TRANSFER'
            ? 'BANK_TRANSFER'
            : 'DIRECT';

    const paidOrder = new Order({
      orderCode,
      userId: new mongoose.Types.ObjectId(userId),
      courseId: course._id,
      amount: finalAmount,
      originalAmount: originalPrice,
      discountAmount,
      couponCode: appliedCouponCode,
      status: 'PAID',
      paymentMethod: effectivePaymentMethod,
      vnpayDetails: {
        transactionNo: `VNP${Date.now()}`,
        bankCode: bankCode || 'NCB',
        bankTranNo: `VNPTRAN${Date.now()}`,
        cardType: 'ATM',
        payDate: new Date().toISOString(),
        responseCode: '00',
        txnRef: orderCode,
      },
    });

    await paidOrder.save();

    // 6. Ghi nhận tương tác ENROLL
    await UserInteraction.create({
      userId: new mongoose.Types.ObjectId(userId),
      courseId: course._id,
      actionType: 'ENROLL',
    });

    // 7. Tăng số học viên
    await Course.findByIdAndUpdate(course._id, {
      $inc: { totalStudents: 1 },
    });

    // 8. Cập nhật lượt dùng coupon nếu có
    if (appliedCouponCode) {
      await Coupon.findOneAndUpdate(
        { code: appliedCouponCode },
        { $inc: { usedCount: 1 } },
      );
    }

    res.status(200).json({
      success: true,
      isEnrolled: true,
      message: 'Thanh toán và đăng ký khóa học thành công!',
      order: paidOrder,
      orderCode,
      finalAmount,
    });
  } catch (error) {
    console.error('Lỗi khi thanh toán trực tiếp:', error);
    res
      .status(500)
      .json({ message: 'Lỗi server khi hoàn tất thanh toán khóa học.' });
  }
};

/**
 * GET /api/payment/vnpay-return
 * Xử lý khi khách hàng hoàn tất thanh toán và được VNPAY redirect về
 */
export const vnpayReturn = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const queryParams = req.query as Record<string, string>;

    const orderCode = queryParams.vnp_TxnRef || queryParams.orderCode;
    const responseCode = queryParams.vnp_ResponseCode || '00';
    const transactionNo = queryParams.vnp_TransactionNo || `TXN${Date.now()}`;
    const bankCode = queryParams.vnp_BankCode || 'VNPAY';
    const bankTranNo = queryParams.vnp_BankTranNo || '';
    const cardType = queryParams.vnp_CardType || '';
    const payDate = queryParams.vnp_PayDate || new Date().toISOString();

    if (!orderCode) {
      res.status(400).json({
        success: false,
        message: 'Thiếu mã đơn hàng giao dịch (vnp_TxnRef).',
      });
      return;
    }

    // 1. Tìm đơn hàng trong DB
    const order = await Order.findOne({ orderCode }).populate('courseId');
    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng tương ứng.',
      });
      return;
    }

    // 2. Nếu đơn hàng đã hoàn tất trước đó (qua IPN hoặc Direct Payment)
    if (order.status === 'PAID') {
      res.status(200).json({
        success: true,
        message: 'Giao dịch đã được xác nhận thanh toán thành công!',
        order,
      });
      return;
    }

    // 3. Nếu có chữ ký VNPAY bảo mật, thực hiện xác thực
    if (queryParams.vnp_SecureHash) {
      const isValidSignature = verifyVNPaySignature(queryParams);
      if (!isValidSignature) {
        res.status(400).json({
          success: false,
          message:
            'Chữ ký không hợp lệ (Dữ liệu giao dịch có thể bị can thiệp).',
        });
        return;
      }
    }

    // 4. Kiểm tra mã phản hồi VNPAY (00 = Thành công)
    if (responseCode === '00') {
      order.status = 'PAID';
      order.vnpayDetails = {
        transactionNo,
        bankCode,
        bankTranNo,
        cardType,
        payDate,
        responseCode,
        txnRef: orderCode,
      };

      await order.save();

      // Ghi nhận tương tác ENROLL để AI đề xuất chính xác
      await UserInteraction.create({
        userId: order.userId,
        courseId: order.courseId,
        actionType: 'ENROLL',
      });

      // Tăng số lượng học viên của khóa học
      await Course.findByIdAndUpdate(order.courseId, {
        $inc: { totalStudents: 1 },
      });

      // Tăng lượt sử dụng của mã giảm giá nếu có
      if (order.couponCode) {
        await Coupon.findOneAndUpdate(
          { code: order.couponCode },
          { $inc: { usedCount: 1 } },
        );
      }

      res.status(200).json({
        success: true,
        message: 'Thanh toán khóa học thành công!',
        order,
      });
    } else {
      // Giao dịch thất bại / Khách hủy giao dịch
      order.status = 'FAILED';
      order.vnpayDetails = {
        transactionNo,
        bankCode,
        bankTranNo,
        cardType,
        payDate,
        responseCode,
        txnRef: orderCode,
      };

      await order.save();

      const reason = getVNPayResponseMessage(responseCode);
      res.status(200).json({
        success: false,
        message: reason,
        order,
      });
    }
  } catch (error) {
    console.error('Lỗi khi xử lý VNPAY Return:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác thực kết quả thanh toán.',
    });
  }
};

/**
 * GET /api/payment/vnpay-ipn
 * Webhook Server-to-Server để VNPAY gọi đồng bộ kết quả ngầm
 */
export const vnpayIpn = async (req: Request, res: Response): Promise<void> => {
  try {
    const queryParams = req.query as Record<string, string>;

    const isValidSignature = verifyVNPaySignature(queryParams);
    if (!isValidSignature) {
      res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
      return;
    }

    const orderCode = queryParams.vnp_TxnRef;
    const responseCode = queryParams.vnp_ResponseCode;

    const order = await Order.findOne({ orderCode });
    if (!order) {
      res.status(200).json({ RspCode: '01', Message: 'Order not found' });
      return;
    }

    if (order.status === 'PAID') {
      res
        .status(200)
        .json({ RspCode: '02', Message: 'Order already confirmed' });
      return;
    }

    if (responseCode === '00') {
      order.status = 'PAID';
      order.vnpayDetails = {
        transactionNo: queryParams.vnp_TransactionNo,
        bankCode: queryParams.vnp_BankCode,
        bankTranNo: queryParams.vnp_BankTranNo,
        cardType: queryParams.vnp_CardType,
        payDate: queryParams.vnp_PayDate,
        responseCode,
        txnRef: orderCode,
      };
      await order.save();

      await UserInteraction.create({
        userId: order.userId,
        courseId: order.courseId,
        actionType: 'ENROLL',
      });

      await Course.findByIdAndUpdate(order.courseId, {
        $inc: { totalStudents: 1 },
      });

      if (order.couponCode) {
        await Coupon.findOneAndUpdate(
          { code: order.couponCode },
          { $inc: { usedCount: 1 } },
        );
      }

      res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
    } else {
      order.status = 'FAILED';
      order.vnpayDetails = {
        transactionNo: queryParams.vnp_TransactionNo,
        responseCode,
        txnRef: orderCode,
      };
      await order.save();
      res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
    }
  } catch (error) {
    console.error('Lỗi khi xử lý VNPAY IPN:', error);
    res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
};

/**
 * GET /api/payment/check-enrollment/:courseId
 * Kiểm tra người dùng hiện tại đã mua / đăng ký khóa học này chưa
 */
export const checkEnrollment = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const rawCourseId = req.params.courseId;
    const courseId = Array.isArray(rawCourseId) ? rawCourseId[0] : rawCourseId;

    if (!userId || !courseId) {
      res.json({ isEnrolled: false });
      return;
    }

    let targetCourseId = String(courseId);
    if (!mongoose.Types.ObjectId.isValid(targetCourseId)) {
      const c = await Course.findOne({ slug: targetCourseId }).select('_id');
      if (c) targetCourseId = c._id.toString();
    }

    const paidOrder = await Order.findOne({
      userId,
      courseId: targetCourseId,
      status: 'PAID',
    });

    if (paidOrder) {
      res.json({ isEnrolled: true, order: paidOrder });
      return;
    }

    // Kiểm tra tương tác ENROLL dự phòng
    const enrollInteraction = await UserInteraction.findOne({
      userId,
      courseId: targetCourseId,
      actionType: 'ENROLL',
    });

    res.json({ isEnrolled: Boolean(enrollInteraction) });
  } catch {
    res.json({ isEnrolled: false });
  }
};

/**
 * GET /api/payment/my-orders
 * Lấy lịch sử giao dịch thanh toán của người dùng hiện tại
 */
export const getMyOrders = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Vui lòng đăng nhập.' });
      return;
    }

    const orders = await Order.find({ userId })
      .populate('courseId', 'title slug thumbnailUrl price')
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch {
    res.status(500).json({ message: 'Lỗi server khi lấy lịch sử đơn hàng.' });
  }
};

/**
 * GET /api/payment/gateway-order/:orderCode
 * Lấy thông tin đơn hàng để hiển thị trên Cổng thanh toán VNPAY Gateway
 */
export const getGatewayOrderInfo = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const rawOrderCode = req.params.orderCode;
    const orderCode = Array.isArray(rawOrderCode)
      ? rawOrderCode[0]
      : rawOrderCode;
    if (!orderCode) {
      res.status(400).json({ success: false, message: 'Thiếu mã đơn hàng.' });
      return;
    }

    const order = await Order.findOne({ orderCode }).populate(
      'courseId',
      'title slug thumbnailUrl price discountPrice',
    );
    if (!order) {
      res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy đơn hàng.' });
      return;
    }

    res.json({
      success: true,
      order: {
        orderCode: order.orderCode,
        amount: order.amount,
        status: order.status,
        course: order.courseId,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin đơn hàng gateway:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin đơn hàng.',
    });
  }
};

/**
 * POST /api/payment/vnpay-complete-gateway
 * Xác nhận giao dịch từ Cổng VNPAY và tạo Return URL có chữ ký HMAC-SHA512
 */
export const completeGatewayPayment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { orderCode, cardNumber, otp } = req.body as {
      orderCode: string;
      cardNumber?: string;
      otp?: string;
    };

    if (!orderCode) {
      res.status(400).json({ success: false, message: 'Thiếu mã đơn hàng.' });
      return;
    }

    const order = await Order.findOne({ orderCode });
    if (!order) {
      res
        .status(404)
        .json({ success: false, message: 'Không tìm thấy đơn hàng.' });
      return;
    }

    // Kiểm tra thông tin thẻ test NCB Sandbox
    const cleanNum = (cardNumber || '').replace(/\s+/g, '');
    if (cleanNum && cleanNum !== '9704198526191432198') {
      res.status(400).json({
        success: false,
        message:
          'Số thẻ không đúng. Vui lòng sử dụng thẻ test NCB: 9704198526191432198',
      });
      return;
    }

    if (otp && otp.trim() !== '123456') {
      res.status(400).json({
        success: false,
        message: 'Mã OTP không đúng. Mã OTP test VNPAY Sandbox là: 123456',
      });
      return;
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const returnUrl =
      process.env.VNPAY_RETURN_URL || `${clientUrl}/payment/vnpay-return`;
    const tmnCode = process.env.VNPAY_TMN_CODE || 'CGXZLS0Z';
    const hashSecret =
      process.env.VNPAY_HASH_SECRET || 'XNBCJFAKAZQSGTARRLGCHVZWCIOIGSHN';

    const now = new Date();
    const createDate = formatVNPayDate(now);
    const vnpAmount = Math.round(order.amount * 100);

    const vnpParams: Record<string, string | number> = {
      vnp_Amount: vnpAmount,
      vnp_BankCode: 'NCB',
      vnp_BankTranNo: `VNP${Date.now()}`,
      vnp_CardType: 'ATM',
      vnp_OrderInfo: `Thanh toan khoa hoc ${orderCode}`,
      vnp_PayDate: createDate,
      vnp_ResponseCode: '00',
      vnp_TmnCode: tmnCode,
      vnp_TransactionNo: `${Date.now()}`,
      vnp_TransactionStatus: '00',
      vnp_TxnRef: orderCode,
    };

    const sorted = sortObject(vnpParams);
    const signData = buildQueryString(sorted);
    const hmac = crypto.createHmac('sha512', hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const redirectUrl = `${returnUrl}?${signData}&vnp_SecureHash=${signed}`;

    res.status(200).json({
      success: true,
      redirectUrl,
    });
  } catch (error) {
    console.error('Lỗi khi hoàn tất thanh toán qua cổng VNPAY:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi hoàn tất thanh toán VNPAY.',
    });
  }
};

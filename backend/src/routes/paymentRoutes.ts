import { Router } from 'express';
import {
  createPaymentUrl,
  directCheckout,
  vnpayReturn,
  vnpayIpn,
  checkEnrollment,
  getMyOrders,
  getGatewayOrderInfo,
  completeGatewayPayment,
} from '../controllers/paymentController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Khởi tạo thanh toán VNPAY (cần đăng nhập)
router.post('/create-vnpay-url', authenticateToken, createPaymentUrl);

// Cổng thanh toán VNPAY Gateway (Simulator / Dedicated Gateway)
router.get('/gateway-order/:orderCode', getGatewayOrderInfo);
router.post('/vnpay-complete-gateway', completeGatewayPayment);

// Hoàn tất thanh toán trực tiếp / Kích hoạt khóa học (cần đăng nhập)
router.post('/direct-checkout', authenticateToken, directCheckout);

// Nhận kết quả từ VNPAY redirect về
router.get('/vnpay-return', vnpayReturn);

// IPN Webhook Server-to-Server
router.get('/vnpay-ipn', vnpayIpn);

// Kiểm tra trạng thái đã mua/đăng ký khóa học
router.get('/check-enrollment/:courseId', authenticateToken, checkEnrollment);

// Lịch sử đơn hàng của tôi
router.get('/my-orders', authenticateToken, getMyOrders);

export default router;

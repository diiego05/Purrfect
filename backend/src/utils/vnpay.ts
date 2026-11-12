import crypto from 'crypto';

export interface VNPayUrlParams {
  orderCode: string;
  amount: number; // in VND
  orderInfo: string;
  ipAddr: string;
  bankCode?: string;
  returnUrl?: string;
}

/**
 * Định dạng thời gian theo múi giờ Việt Nam GMT+7 (YYYYMMDDHHmmss)
 */
export const formatVNPayDate = (date: Date = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const getPart = (type: string) =>
    parts.find((p) => p.type === type)?.value || '00';

  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');
  const hour = getPart('hour');
  const minute = getPart('minute');
  const second = getPart('second');

  return `${year}${month}${day}${hour}${minute}${second}`;
};

/**
 * Sắp xếp các tham số VNPay theo alphabet và mã hóa theo chuẩn VNPAY 2.1.0
 */
export const sortObject = (
  obj: Record<string, string | number>,
): Record<string, string> => {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    const val = obj[key];
    if (val !== undefined && val !== null && String(val).length > 0) {
      sorted[encodeURIComponent(key)] = encodeURIComponent(String(val)).replace(
        /%20/g,
        '+',
      );
    }
  }

  return sorted;
};

/**
 * Chuyển object đã sắp xếp thành chuỗi query params (không encode thêm)
 */
export const buildQueryString = (sortedObj: Record<string, string>): string => {
  return Object.entries(sortedObj)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
};

/**
 * Tạo URL thanh toán VNPay có chữ ký HMAC SHA512
 */
export const createVNPayPaymentUrl = (params: VNPayUrlParams): string => {
  const vnpUrl =
    process.env.VNPAY_URL ||
    'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  const tmnCode = process.env.VNPAY_TMN_CODE || '';
  const hashSecret = process.env.VNPAY_HASH_SECRET || '';
  const returnUrl =
    params.returnUrl ||
    process.env.VNPAY_RETURN_URL ||
    'http://localhost:5173/payment/vnpay-return';

  if (!tmnCode || !hashSecret) {
    throw new Error(
      'Thiếu cấu hình VNPAY_TMN_CODE hoặc VNPAY_HASH_SECRET trong biến môi trường.',
    );
  }

  const now = new Date();
  const createDate = formatVNPayDate(now);

  // Hết hạn sau 15 phút
  const expireDate = formatVNPayDate(new Date(now.getTime() + 15 * 60 * 1000));

  // VNPay tính số tiền nhân 100 (Ví dụ: 100.000 VNĐ -> 10000000)
  const vnpAmount = Math.round(params.amount * 100);

  // Chuẩn hóa OrderInfo: Loại bỏ ký tự đặc biệt nguy hiểm
  const cleanOrderInfo = params.orderInfo
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .trim()
    .substring(0, 250);

  const vnpParams: Record<string, string | number> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: params.orderCode,
    vnp_OrderInfo: cleanOrderInfo || `Thanh toan don hang ${params.orderCode}`,
    vnp_OrderType: 'other',
    vnp_Amount: vnpAmount,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: params.ipAddr || '127.0.0.1',
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };

  if (params.bankCode && params.bankCode.trim()) {
    vnpParams.vnp_BankCode = params.bankCode.trim();
  }

  const sortedParams = sortObject(vnpParams);
  const signData = buildQueryString(sortedParams);

  const hmac = crypto.createHmac('sha512', hashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  return `${vnpUrl}?${signData}&vnp_SecureHash=${signed}`;
};

/**
 * Xác thực chữ ký phản hồi từ VNPay (Return URL hoặc IPN Webhook)
 */
export const verifyVNPaySignature = (
  queryParams: Record<string, string | number>,
): boolean => {
  const hashSecret = process.env.VNPAY_HASH_SECRET || '';
  if (!hashSecret) return false;

  const secureHash = queryParams['vnp_SecureHash'];
  if (!secureHash) return false;

  // Loại bỏ các trường hash để kiểm tra chữ ký
  const paramsToVerify: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(queryParams)) {
    if (key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType') {
      paramsToVerify[key] = value;
    }
  }

  const sortedParams = sortObject(paramsToVerify);
  const signData = buildQueryString(sortedParams);

  const hmac = crypto.createHmac('sha512', hashSecret);
  const calculatedHash = hmac
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  return String(secureHash).toLowerCase() === calculatedHash.toLowerCase();
};

/**
 * Bản đồ mã phản hồi VNPAY sang thông báo tiếng Việt dễ hiểu
 */
export const getVNPayResponseMessage = (responseCode: string): string => {
  const messages: Record<string, string> = {
    '00': 'Giao dịch thành công.',
    '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
    '09': 'Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
    '10': 'Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.',
    '11': 'Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch.',
    '12': 'Thẻ/Tài khoản của khách hàng bị khóa.',
    '13': 'Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin vui lòng thực hiện lại giao dịch.',
    '24': 'Khách hàng đã hủy giao dịch.',
    '51': 'Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
    '65': 'Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
    '75': 'Ngân hàng thanh toán đang bảo trì.',
    '79': 'Khách hàng nhập sai mật khẩu thanh toán quá số lần quy định.',
    '99': 'Các lỗi khác (lỗi không xác định từ hệ thống ngân hàng).',
  };

  return (
    messages[responseCode] ||
    `Giao dịch không thành công (Mã lỗi VNPAY: ${responseCode}).`
  );
};

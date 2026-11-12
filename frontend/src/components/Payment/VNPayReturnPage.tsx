import { useState, useEffect, type FC } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  paymentApi,
  type VNPayReturnResponse,
} from '../../services/paymentApi';
import { formatVND } from '../../utils/format';
import './VNPayReturnPage.css';

export const VNPayReturnPage: FC = () => {
  const { navigate } = useAuth();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VNPayReturnResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    const verify = async () => {
      const queryString = window.location.search;
      if (!queryString) {
        if (isMounted) {
          setLoading(false);
          setResult({
            success: false,
            message: 'Không tìm thấy thông tin phản hồi từ giao dịch VNPAY.',
          });
        }
        return;
      }

      try {
        const data = await paymentApi.verifyVNPayReturn(queryString);
        if (isMounted) {
          setResult(data);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setLoading(false);
          setResult({
            success: false,
            message: 'Lỗi kết nối khi xác thực với máy chủ thanh toán.',
          });
        }
      }
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="vnpay-return-container">
        <div className="vnpay-return-card">
          <div className="return-status-badge loading">
            <div className="spinner-anim" />
          </div>
          <h2 className="return-title">Đang xác thực giao dịch</h2>
          <p className="return-subtitle">
            Hệ thống đang kết nối và kiểm tra bảo mật với VNPAY. Vui lòng không
            tắt hoặc tải lại trang...
          </p>
        </div>
      </div>
    );
  }

  const isSuccess = Boolean(result?.success);
  const order = result?.order;

  return (
    <div className="vnpay-return-container">
      <div className="vnpay-return-card">
        {isSuccess ? (
          <>
            <div className="return-status-badge success">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="return-title">Thanh toán thành công!</h2>
            <p className="return-subtitle">
              Chúc mừng bạn đã đăng ký khóa học thành công. Bạn có thể bắt đầu
              học tập ngay bây giờ!
            </p>

            {order && (
              <div className="return-details-table">
                {order.courseId && (
                  <div className="detail-row">
                    <span className="label">Khóa học:</span>
                    <span className="value" title={order.courseId.title}>
                      {order.courseId.title}
                    </span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="label">Mã đơn hàng:</span>
                  <span className="value">
                    <code>{order.orderCode}</code>
                  </span>
                </div>
                {order.vnpayDetails?.transactionNo && (
                  <div className="detail-row">
                    <span className="label">Mã giao dịch VNPAY:</span>
                    <span className="value">
                      {order.vnpayDetails.transactionNo}
                    </span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="label">Số tiền thanh toán:</span>
                  <span className="value highlight">
                    {formatVND(order.amount)}
                  </span>
                </div>
                {order.vnpayDetails?.bankCode && (
                  <div className="detail-row">
                    <span className="label">Ngân hàng:</span>
                    <span className="value">{order.vnpayDetails.bankCode}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="label">Trạng thái:</span>
                  <span className="value badge-status paid">ĐÃ THANH TOÁN</span>
                </div>
              </div>
            )}

            <div className="return-actions-row">
              <button
                type="button"
                className="btn-primary-action"
                onClick={() => {
                  if (order?.courseId?.slug) {
                    navigate(`/courses/${order.courseId.slug}`);
                  } else {
                    navigate('/');
                  }
                }}
              >
                <span>Vào học ngay</span>
                <span>→</span>
              </button>
              <button
                type="button"
                className="btn-secondary-action"
                onClick={() => navigate('/')}
              >
                Về trang chủ
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="return-status-badge failed">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h2 className="return-title">Giao dịch không thành công</h2>
            <p className="return-subtitle">
              {result?.message ||
                'Giao dịch thanh toán VNPAY chưa hoàn tất hoặc bị hủy.'}
            </p>

            {order && (
              <div className="return-details-table">
                <div className="detail-row">
                  <span className="label">Mã đơn hàng:</span>
                  <span className="value">
                    <code>{order.orderCode}</code>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Số tiền:</span>
                  <span className="value">{formatVND(order.amount)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Trạng thái:</span>
                  <span className="value badge-status failed">
                    CHƯA THANH TOÁN
                  </span>
                </div>
              </div>
            )}

            <div className="return-actions-row">
              <button
                type="button"
                className="btn-primary-action"
                onClick={() => {
                  if (order?.courseId?.slug) {
                    navigate(`/courses/${order.courseId.slug}`);
                  } else {
                    navigate('/');
                  }
                }}
              >
                Thử lại thanh toán
              </button>
              <button
                type="button"
                className="btn-secondary-action"
                onClick={() => navigate('/')}
              >
                Về trang chủ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

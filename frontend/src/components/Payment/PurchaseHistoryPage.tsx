import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { paymentApi } from '../../services/paymentApi';
import { refundApi } from '../../services/refundApi';
import type {
  RefundEligibilityResponse,
  RefundRequestItem,
} from '../../services/refundApi';
import {
  IconlyTick,
  IconlyClose,
  IconlyPlay,
  IconlyTimeCircle,
  IconlyShield,
  IconlyArrowLeft,
} from '../Onboarding/IconlyIcons';
import './PurchaseHistoryPage.css';

interface OrderItem {
  _id: string;
  orderCode: string;
  amount: number;
  originalAmount: number;
  discountAmount: number;
  couponCode?: string;
  status:
    'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUND_PENDING' | 'REFUNDED';
  paymentMethod: string;
  isManualEnrollment?: boolean;
  courseId?: {
    _id: string;
    title: string;
    slug: string;
    thumbnailUrl?: string;
    price: number;
  };
  createdAt: string;
}

const REFUND_REASONS_VI = [
  'Khóa học không phù hợp với mục tiêu học tập',
  'Nội dung khóa học không đúng như phần giới thiệu',
  'Chất lượng video hoặc âm thanh bài giảng không tốt',
  'Mua nhầm khóa học hoặc chọn sai lộ trình',
  'Lý do cá nhân khác',
];

const REFUND_REASONS_EN = [
  'Course is not aligned with my learning goals',
  'Course content is different from the description',
  'Poor video or audio recording quality',
  'Purchased by mistake or chose wrong track',
  'Other personal reasons',
];

export const PurchaseHistoryPage: React.FC = () => {
  const { isAuthenticated, navigate } = useAuth();
  const { language } = useLanguage();

  const refundReasons =
    language === 'vi' ? REFUND_REASONS_VI : REFUND_REASONS_EN;

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [refundRequests, setRefundRequests] = useState<RefundRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'refunds'>('orders');

  // Modal hoàn tiền state
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [checkingEligibility, setCheckingEligibility] =
    useState<boolean>(false);
  const [eligibilityData, setEligibilityData] =
    useState<RefundEligibilityResponse | null>(null);
  const [showRefundModal, setShowRefundModal] = useState<boolean>(false);
  const [selectedReason, setSelectedReason] = useState<string>(
    refundReasons[0],
  );
  const [notes, setNotes] = useState<string>('');
  const [submittingRefund, setSubmittingRefund] = useState<boolean>(false);

  // Thông báo phản hồi
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Tải dữ liệu đơn hàng và yêu cầu hoàn tiền
  const loadData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const [ordersRes, refundsRes] = await Promise.all([
        paymentApi.getMyOrders(),
        refundApi.getMyRefundRequests(),
      ]);

      if (ordersRes && ordersRes.orders) {
        setOrders(ordersRes.orders);
      }
      if (refundsRes && refundsRes.requests) {
        setRefundRequests(refundsRes.requests);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu lịch sử mua hàng:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  const formatVND = (price: number) => {
    return new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 0);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleString(
      language === 'vi' ? 'vi-VN' : 'en-US',
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      },
    );
  };

  // Trigger: Chọn "Yêu cầu hoàn tiền" tại chi tiết đơn hàng (Basic Flow 1, 2)
  const handleOpenRefundRequest = async (order: OrderItem) => {
    if (order.isManualEnrollment) {
      setAlertMessage({
        type: 'error',
        text:
          language === 'vi'
            ? 'Khóa học được ghi danh thủ công bởi giảng viên, không áp dụng chính sách hoàn tiền.'
            : 'This course was manually enrolled by instructor and is non-refundable.',
      });
      return;
    }

    setSelectedOrder(order);
    setCheckingEligibility(true);
    setEligibilityData(null);
    setAlertMessage(null);

    try {
      // 2. Hệ thống kiểm tra điều kiện hoàn tiền của đơn hàng
      const res = await refundApi.checkEligibility(order._id);
      setEligibilityData(res);

      if (!res.isEligible) {
        // Exception Flow 2a, 2b, 2c
        setAlertMessage({
          type: 'error',
          text:
            res.errorMessage ||
            res.message ||
            (language === 'vi'
              ? 'Đơn hàng không đủ điều kiện hoàn tiền.'
              : 'Order is not eligible for refund.'),
        });
      } else {
        // 3. Hệ thống hiển thị biểu mẫu Yêu cầu hoàn tiền (Flow 3)
        setSelectedReason(refundReasons[0]);
        setNotes('');
        setShowRefundModal(true);
      }
    } catch (err) {
      setAlertMessage({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : language === 'vi'
              ? 'Không thể kiểm tra điều kiện hoàn tiền.'
              : 'Failed to verify refund eligibility.',
      });
    } finally {
      setCheckingEligibility(false);
    }
  };

  // 4 & 5. Gửi yêu cầu hoàn tiền (Basic Flow 4, 5, 6)
  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    if (!selectedReason) {
      setAlertMessage({
        type: 'error',
        text:
          language === 'vi'
            ? 'Vui lòng chọn lý do hoàn tiền.'
            : 'Please select a refund reason.',
      });
      return;
    }

    setSubmittingRefund(true);
    try {
      const res = await refundApi.createRefundRequest(
        selectedOrder._id,
        selectedReason,
        notes,
      );

      setShowRefundModal(false);
      // 6. Màn hình hiển thị thông báo chuẩn
      setAlertMessage({
        type: 'success',
        text:
          res.message ||
          (language === 'vi'
            ? 'Yêu cầu hoàn tiền của bạn đã được gửi thành công và đang chờ xem xét xử lý.'
            : 'Your refund request has been successfully submitted and is pending review.'),
      });

      // Tải lại dữ liệu để cập nhật trạng thái đơn hàng sang REFUND_PENDING
      await loadData();
      setActiveTab('refunds');
    } catch (err) {
      setAlertMessage({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : language === 'vi'
              ? 'Lỗi khi gửi yêu cầu hoàn tiền.'
              : 'Failed to submit refund request.',
      });
    } finally {
      setSubmittingRefund(false);
    }
  };

  // 4a. Hủy yêu cầu hoàn tiền khi đang PENDING (Alternative Flow 4a &
  const handleCancelRefund = async (requestId: string) => {
    const isConfirmed = window.confirm(
      language === 'vi'
        ? 'Bạn có chắc chắn muốn hủy yêu cầu hoàn tiền này? Quyền truy cập bài học khóa học sẽ được khôi phục ngay lập tức.'
        : 'Are you sure you want to cancel this refund request? Your course learning access will be restored immediately.',
    );
    if (!isConfirmed) return;

    try {
      const res = await refundApi.cancelRefundRequest(requestId);
      setAlertMessage({
        type: 'success',
        text:
          res.message ||
          (language === 'vi'
            ? 'Đã hủy yêu cầu hoàn tiền thành công. Quyền truy cập bài học đã được khôi phục.'
            : 'Refund request cancelled successfully. Course access has been restored.'),
      });
      await loadData();
    } catch (err) {
      setAlertMessage({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : language === 'vi'
              ? 'Lỗi khi hủy yêu cầu hoàn tiền.'
              : 'Failed to cancel refund request.',
      });
    }
  };

  // Ánh xạ trạng thái đơn hàng
  const getStatusBadge = (status: OrderItem['status']) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="order-badge order-badge--paid">
            {language === 'vi' ? 'Đã thanh toán' : 'Paid'}
          </span>
        );
      case 'REFUND_PENDING':
        return (
          <span className="order-badge order-badge--refund-pending">
            {language === 'vi' ? 'Đang chờ duyệt hoàn tiền' : 'Refund Pending'}
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="order-badge order-badge--refunded">
            {language === 'vi' ? 'Đã hoàn tiền' : 'Refunded'}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="order-badge order-badge--cancelled">
            {language === 'vi' ? 'Đã hủy' : 'Cancelled'}
          </span>
        );
      case 'FAILED':
        return (
          <span className="order-badge order-badge--failed">
            {language === 'vi' ? 'Thất bại' : 'Failed'}
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="order-badge order-badge--pending">
            {language === 'vi' ? 'Chờ thanh toán' : 'Pending'}
          </span>
        );
    }
  };

  const getRefundStatusBadge = (status: RefundRequestItem['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="order-badge order-badge--refund-pending">
            {language === 'vi' ? 'Chờ Admin duyệt' : 'Under Review'}
          </span>
        );
      case 'APPROVED':
        return (
          <span className="order-badge order-badge--paid">
            {language === 'vi' ? 'Đã hoàn tiền' : 'Approved'}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="order-badge order-badge--failed">
            {language === 'vi' ? 'Từ chối hoàn tiền' : 'Rejected'}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="order-badge order-badge--cancelled">
            {language === 'vi' ? 'Đã hủy yêu cầu' : 'Cancelled'}
          </span>
        );
      default:
        return <span className="order-badge">{status}</span>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="purchase-history-container">
        <div className="purchase-history-empty">
          <IconlyShield size={48} color="#0056d2" />
          <h2>{language === 'vi' ? 'Vui lòng đăng nhập' : 'Please Sign In'}</h2>
          <p>
            {language === 'vi'
              ? 'Bạn cần đăng nhập để xem lịch sử mua hàng và quản lý hoàn tiền.'
              : 'Sign in to access your purchase history and manage refunds.'}
          </p>
          <button
            type="button"
            className="btn-purr-primary"
            onClick={() => navigate('/login')}
          >
            {language === 'vi' ? 'Đăng nhập ngay' : 'Sign In Now'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="purchase-history-container">
      {/* Header & Tiêu đề */}
      <div className="purchase-history-header">
        <div>
          <button
            type="button"
            className="purchase-history-back"
            onClick={() => navigate('/profile')}
          >
            <IconlyArrowLeft size={16} color="currentColor" />
            <span>
              {language === 'vi' ? 'Quay lại hồ sơ' : 'Back to Profile'}
            </span>
          </button>
          <h1 className="purchase-history-title">
            {language === 'vi'
              ? 'Lịch sử mua hàng & Hoàn tiền'
              : 'Purchase History & Refunds'}
          </h1>
          <p className="purchase-history-subtitle">
            {language === 'vi'
              ? 'Quản lý các khóa học đã thanh toán, yêu cầu hoàn tiền và tiến độ xử lý.'
              : 'Manage purchased courses, refund requests, and processing status.'}
          </p>
        </div>

        {/* Tab chuyển đổi */}
        <div className="purchase-tabs">
          <button
            type="button"
            className={`purchase-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('orders');
              setAlertMessage(null);
            }}
          >
            {language === 'vi' ? 'Đơn hàng đã mua' : 'Purchased Orders'} (
            {orders.length})
          </button>
          <button
            type="button"
            className={`purchase-tab-btn ${activeTab === 'refunds' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('refunds');
              setAlertMessage(null);
            }}
          >
            {language === 'vi' ? 'Yêu cầu hoàn tiền' : 'Refund Requests'} (
            {refundRequests.length})
          </button>
        </div>
      </div>

      {/* Thông báo Alert */}
      {alertMessage && (
        <div
          className={`purchase-alert ${
            alertMessage.type === 'success'
              ? 'purchase-alert--success'
              : 'purchase-alert--error'
          }`}
        >
          <div className="purchase-alert-icon">
            {alertMessage.type === 'success' ? (
              <IconlyTick size={20} color="#10b981" />
            ) : (
              <IconlyClose size={20} color="#ef4444" />
            )}
          </div>
          <div className="purchase-alert-content">
            <p>{alertMessage.text}</p>
          </div>
          <button
            type="button"
            className="purchase-alert-close"
            onClick={() => setAlertMessage(null)}
          >
            <IconlyClose size={16} color="currentColor" />
          </button>
        </div>
      )}

      {/* Nội dung danh sách */}
      {loading ? (
        <div className="purchase-loading">
          <div className="purchase-spinner" />
          <p>
            {language === 'vi'
              ? 'Đang tải dữ liệu đơn hàng và lịch sử hoàn tiền...'
              : 'Loading order and refund records...'}
          </p>
        </div>
      ) : activeTab === 'orders' ? (
        /* TAB 1: DANH SÁCH ĐƠN HÀNG */
        orders.length === 0 ? (
          <div className="purchase-history-empty">
            <IconlyTimeCircle size={48} color="#94a3b8" />
            <h3>
              {language === 'vi' ? 'Chưa có đơn hàng nào' : 'No Orders Found'}
            </h3>
            <p>
              {language === 'vi'
                ? 'Bạn chưa phát sinh giao dịch mua khóa học nào trên hệ thống.'
                : 'You have not purchased any courses on our platform yet.'}
            </p>
            <button
              type="button"
              className="btn-purr-primary"
              onClick={() => navigate('/courses')}
            >
              {language === 'vi' ? 'Khám phá khóa học ngay' : 'Browse Courses'}
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((ord) => {
              const matchingRefund = refundRequests.find(
                (r) =>
                  r.orderId &&
                  (r.orderId._id === ord._id ||
                    (typeof r.orderId === 'string' && r.orderId === ord._id)) &&
                  r.status === 'PENDING',
              );

              return (
                <div key={ord._id} className="order-card">
                  <div className="order-card-header">
                    <div className="order-code-wrap">
                      <span className="order-code-label">
                        {language === 'vi' ? 'Mã đơn hàng:' : 'Order Code:'}
                      </span>
                      <strong className="order-code">{ord.orderCode}</strong>
                      <span className="order-date">
                        • {formatDate(ord.createdAt)}
                      </span>
                    </div>
                    <div className="order-status-wrap">
                      {getStatusBadge(ord.status)}
                    </div>
                  </div>

                  <div className="order-card-body">
                    {/* Ảnh khóa học */}
                    <div className="order-course-thumb">
                      <img
                        src={
                          ord.courseId?.thumbnailUrl ||
                          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300'
                        }
                        alt={ord.courseId?.title || 'Khóa học'}
                      />
                    </div>

                    {/* Chi tiết khóa học - Giữ nguyên nội dung theo yêu cầu */}
                    <div className="order-course-info">
                      <h4
                        className="order-course-title"
                        onClick={() =>
                          ord.courseId &&
                          navigate(
                            `/courses/${ord.courseId.slug || ord.courseId._id}`,
                          )
                        }
                      >
                        {ord.courseId?.title ||
                          (language === 'vi'
                            ? 'Khóa học trực tuyến'
                            : 'Online Course')}
                      </h4>
                      <div className="order-meta-info">
                        <span>
                          {language === 'vi' ? 'Hình thức:' : 'Method:'}{' '}
                          {ord.paymentMethod}
                        </span>
                        {ord.couponCode && (
                          <span className="order-coupon">
                            {language === 'vi' ? 'Mã giảm giá:' : 'Coupon:'}{' '}
                            {ord.couponCode}
                          </span>
                        )}
                      </div>
                      <div className="order-price-wrap">
                        <span className="order-final-amount">
                          {formatVND(ord.amount)}
                        </span>
                        {ord.discountAmount > 0 && (
                          <span className="order-orig-amount">
                            {formatVND(ord.originalAmount)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Các nút hành động */}
                    <div className="order-actions">
                      {/* Nút vào học (nếu đã thanh toán và không pending hoàn tiền) */}
                      {ord.status === 'PAID' && (
                        <button
                          type="button"
                          className="btn-purr-learn"
                          onClick={() =>
                            ord.courseId &&
                            navigate(
                              `/courses/${ord.courseId.slug || ord.courseId._id}/learn`,
                            )
                          }
                        >
                          <IconlyPlay size={16} color="#ffffff" />
                          <span>
                            {language === 'vi'
                              ? 'Vào học ngay'
                              : 'Start Learning'}
                          </span>
                        </button>
                      )}

                      {/* NÚT YÊU CẦU HOÀN TIỀN (  Trigger) */}
                      {ord.status === 'PAID' &&
                        (ord.isManualEnrollment ? (
                          <span
                            className="badge-manual-enroll"
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              background: '#fef3c7',
                              color: '#b45309',
                              border: '1px solid #fde68a',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            {language === 'vi'
                              ? 'Ghi danh thủ công (Không hoàn tiền)'
                              : 'Manual Enrollment (Non-refundable)'}
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn-purr-refund"
                            disabled={
                              checkingEligibility &&
                              selectedOrder?._id === ord._id
                            }
                            onClick={() => handleOpenRefundRequest(ord)}
                          >
                            {checkingEligibility &&
                            selectedOrder?._id === ord._id
                              ? language === 'vi'
                                ? 'Đang kiểm tra...'
                                : 'Checking...'
                              : language === 'vi'
                                ? 'Yêu cầu hoàn tiền'
                                : 'Request Refund'}
                          </button>
                        ))}

                      {/* Trạng thái đang PENDING hoàn tiền: Hiển thị cảnh báo & Nút Hủy (Alternative Flow 4a) */}
                      {ord.status === 'REFUND_PENDING' && matchingRefund && (
                        <div className="order-refund-pending-box">
                          <p className="refund-pending-notice">
                            {language === 'vi'
                              ? '⏳ Đang chờ Admin xét duyệt hoàn tiền. Quyền truy cập bài học tạm thời bị khóa.'
                              : '⏳ Awaiting Admin review. Course lecture access is temporarily locked.'}
                          </p>
                          <button
                            type="button"
                            className="btn-purr-cancel-refund"
                            onClick={() =>
                              handleCancelRefund(matchingRefund._id)
                            }
                          >
                            {language === 'vi'
                              ? 'Hủy yêu cầu hoàn tiền'
                              : 'Cancel Refund Request'}
                          </button>
                        </div>
                      )}

                      {ord.status === 'REFUNDED' && (
                        <div className="order-refunded-box">
                          <span className="refunded-notice">
                            {language === 'vi'
                              ? 'Đã hoàn tiền thành công. Khóa học đã được thu hồi quyền học.'
                              : 'Refund completed. Course access has been revoked.'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : /* TAB 2: DANH SÁCH YÊU CẦU HOÀN TIỀN (Student Refund Requests) */
      refundRequests.length === 0 ? (
        <div className="purchase-history-empty">
          <IconlyShield size={48} color="#94a3b8" />
          <h3>
            {language === 'vi'
              ? 'Chưa có yêu cầu hoàn tiền nào'
              : 'No Refund Requests'}
          </h3>
          <p>
            {language === 'vi'
              ? 'Bạn chưa gửi yêu cầu hoàn tiền cho bất kỳ khóa học nào.'
              : 'You have not submitted any refund requests yet.'}
          </p>
        </div>
      ) : (
        <div className="refund-requests-list">
          {refundRequests.map((req) => (
            <div key={req._id} className="refund-card">
              <div className="refund-card-header">
                <div>
                  <span className="order-code-label">
                    {language === 'vi' ? 'Mã đơn:' : 'Order:'}{' '}
                  </span>
                  <strong>{req.orderId?.orderCode || '---'}</strong>
                  <span className="order-date">
                    • {language === 'vi' ? 'Ngày gửi:' : 'Requested on:'}{' '}
                    {formatDate(req.createdAt)}
                  </span>
                </div>
                <div>{getRefundStatusBadge(req.status)}</div>
              </div>

              <div className="refund-card-body">
                <div className="refund-course-info">
                  <h4>{req.courseId?.title || 'Khóa học'}</h4>
                  <p className="refund-amount-text">
                    {language === 'vi' ? 'Số tiền hoàn:' : 'Refund Amount:'}{' '}
                    <strong className="text-primary">
                      {formatVND(req.amount)}
                    </strong>
                  </p>
                  {req.status === 'APPROVED' && (
                    <p
                      style={{
                        margin: '4px 0',
                        fontSize: '0.85rem',
                        color: '#b45309',
                        fontWeight: 600,
                      }}
                    >
                      🪙{' '}
                      {language === 'vi'
                        ? 'Điểm PurrPoint đã nhận:'
                        : 'PurrPoints credited:'}{' '}
                      <strong style={{ color: '#d97706' }}>
                        {(
                          req.pointsRefunded || Math.floor(req.amount / 1000)
                        ).toLocaleString('vi-VN')}{' '}
                        pts
                      </strong>
                    </p>
                  )}
                  <p className="refund-reason-text">
                    <strong>{language === 'vi' ? 'Lý do:' : 'Reason:'}</strong>{' '}
                    {req.reason}
                  </p>
                  {req.notes && (
                    <p className="refund-notes-text">
                      <strong>
                        {language === 'vi' ? 'Ghi chú:' : 'Notes:'}
                      </strong>{' '}
                      {req.notes}
                    </p>
                  )}

                  {/* Phản hồi từ Admin nếu bị từ chối */}
                  {req.status === 'REJECTED' && req.rejectionReason && (
                    <div className="refund-rejection-box">
                      <strong className="text-danger">
                        {language === 'vi'
                          ? 'Lý do từ chối:'
                          : 'Rejection Reason:'}
                      </strong>{' '}
                      {req.rejectionReason}
                    </div>
                  )}

                  {req.adminNotes && (
                    <div className="refund-admin-notes">
                      <strong>
                        {language === 'vi'
                          ? 'Lời nhắn từ Admin:'
                          : 'Admin Notes:'}
                      </strong>{' '}
                      {req.adminNotes}
                    </div>
                  )}
                </div>

                {/* Nút Hủy yêu cầu hoàn tiền khi đang PENDING (  Alternative Flow 4a) */}
                {req.status === 'PENDING' && (
                  <div className="refund-actions">
                    <button
                      type="button"
                      className="btn-purr-cancel-refund"
                      onClick={() => handleCancelRefund(req._id)}
                    >
                      {language === 'vi'
                        ? 'Hủy yêu cầu hoàn tiền'
                        : 'Cancel Refund Request'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL BIỂU MẪU YÊU CẦU HOÀN TIỀN (Basic Flow 3, 4, 5) */}
      {showRefundModal && selectedOrder && (
        <div
          className="purr-modal-backdrop"
          onClick={() => setShowRefundModal(false)}
        >
          <div
            className="purr-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="purr-modal-header">
              <h3>
                {language === 'vi'
                  ? 'Yêu cầu hoàn tiền khóa học'
                  : 'Course Refund Request'}
              </h3>
              <button
                type="button"
                className="purr-modal-close"
                onClick={() => setShowRefundModal(false)}
              >
                <IconlyClose size={20} color="currentColor" />
              </button>
            </div>

            <form onSubmit={handleSubmitRefund} className="purr-modal-body">
              {/* Thông tin đơn hàng tóm tắt */}
              <div className="refund-summary-box">
                <div className="refund-summary-row">
                  <span>{language === 'vi' ? 'Khóa học:' : 'Course:'}</span>
                  <strong>{selectedOrder.courseId?.title}</strong>
                </div>
                <div className="refund-summary-row">
                  <span>
                    {language === 'vi' ? 'Mã đơn hàng:' : 'Order Code:'}
                  </span>
                  <strong>{selectedOrder.orderCode}</strong>
                </div>
                <div className="refund-summary-row">
                  <span>
                    {language === 'vi'
                      ? 'Số tiền hoàn dự kiến:'
                      : 'Refund Amount:'}
                  </span>
                  <strong className="text-primary">
                    {formatVND(selectedOrder.amount)}
                  </strong>
                </div>
                {eligibilityData && (
                  <>
                    <div className="refund-summary-row">
                      <span>
                        {language === 'vi'
                          ? 'Quy đổi điểm PurrPoint nhận được:'
                          : 'PurrPoints to receive:'}
                      </span>
                      <strong style={{ color: '#b45309' }}>
                        🪙{' '}
                        {(
                          eligibilityData.estimatedPoints ||
                          Math.floor(
                            selectedOrder.amount /
                              (eligibilityData.pointConversionRate || 1000),
                          )
                        ).toLocaleString('vi-VN')}{' '}
                        pts
                      </strong>
                    </div>
                    <div className="refund-summary-row">
                      <span>
                        {language === 'vi'
                          ? 'Số lần hoàn tiền đã dùng:'
                          : 'Refunds used:'}
                      </span>
                      <strong>
                        {eligibilityData.refundCount || 0} /{' '}
                        {eligibilityData.maxRefunds || 3} lần tối đa
                      </strong>
                    </div>
                    <div className="refund-summary-eligibility">
                      <span>
                        {language === 'vi'
                          ? `✓ Đã thanh toán ${eligibilityData.daysPassed} ngày (≤ 14 ngày)`
                          : `✓ Paid ${eligibilityData.daysPassed} days ago (≤ 14 days)`}
                      </span>
                      <span>
                        {language === 'vi'
                          ? `✓ Đã hoàn thành ${eligibilityData.completedLecturesCount} bài giảng (≤ 2 bài)`
                          : `✓ Completed ${eligibilityData.completedLecturesCount} lectures (≤ 2)`}
                      </span>
                      <span>
                        {language === 'vi'
                          ? '✓ Chưa cấp chứng chỉ hoàn thành'
                          : '✓ No certificate claimed or issued'}
                      </span>
                    </div>
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        color: '#92400e',
                        lineHeight: 1.4,
                      }}
                    >
                      📌{' '}
                      {language === 'vi'
                        ? `Tiền hoàn sẽ được chuyển thành điểm PurrPoint (${(eligibilityData.pointConversionRate || 1000).toLocaleString('vi-VN')}đ = 1 point) và cộng trực tiếp vào tài khoản học viên để sử dụng tiếp.`
                        : `Refund amount will be converted into PurrPoints and credited to your account.`}
                    </div>
                  </>
                )}
              </div>

              {/* Lựa chọn lý do hoàn tiền (Flow 4) */}
              <div className="refund-form-group">
                <label className="refund-form-label">
                  {language === 'vi' ? 'Lý do hoàn tiền' : 'Refund Reason'}{' '}
                  <span className="text-danger">*</span>
                </label>
                <select
                  className="refund-select"
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  required
                >
                  {refundReasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ghi chú bổ sung (Flow 4) */}
              <div className="refund-form-group">
                <label className="refund-form-label">
                  {language === 'vi'
                    ? 'Ghi chú bổ sung (không bắt buộc)'
                    : 'Additional Notes (Optional)'}
                </label>
                <textarea
                  className="refund-textarea"
                  rows={4}
                  placeholder={
                    language === 'vi'
                      ? 'Hãy chia sẻ thêm chi tiết để giúp chúng tôi cải thiện chất lượng khóa học...'
                      : 'Share any details to help us improve course quality...'
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Nút gửi */}
              <div className="purr-modal-footer">
                <button
                  type="button"
                  className="btn-purr-secondary"
                  onClick={() => setShowRefundModal(false)}
                  disabled={submittingRefund}
                >
                  {language === 'vi' ? 'Đóng' : 'Close'}
                </button>
                <button
                  type="submit"
                  className="btn-purr-primary"
                  disabled={submittingRefund}
                >
                  {submittingRefund
                    ? language === 'vi'
                      ? 'Đang gửi yêu cầu...'
                      : 'Submitting...'
                    : language === 'vi'
                      ? 'Gửi yêu cầu hoàn tiền'
                      : 'Submit Refund Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseHistoryPage;

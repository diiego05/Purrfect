import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../context/ToastContext';
import { fetchInstructorStatisticsApi } from '../../services/instructorCourseApi';
import {
  IconlyBookmark,
  IconlyRefresh,
  IconlyDocument,
  IconlyWallet,
  IconlyArrowLeft,
} from '../Onboarding/IconlyIcons';
import './InstructorStatisticsPage.css';

interface CourseStatItem {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl: string;
  status: string;
  level: string;
  price: number;
  discountPrice?: number;
  totalStudents: number;
  sectionsCount: number;
  lecturesCount: number;
  badge: string;
  createdAt: string;
  revenue: number;
}

interface MonthlyRevenueItem {
  monthNumber: number;
  monthLabel: string;
  year: number;
  revenue: number;
  ordersCount: number;
  enrollmentsCount: number;
}

export const InstructorStatisticsPage: React.FC = () => {
  const { navigate } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshTick, setRefreshTick] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'ALL' | 'COURSES' | 'REVENUE'>(
    'ALL',
  );

  const [coursesStats, setCoursesStats] = useState<{
    totalCourses: number;
    publishedCourses: number;
    pendingCourses: number;
    draftCourses: number;
    disabledCourses: number;
    totalStudentsCount: number;
    totalEstimatedRevenue: number;
    coursesList: CourseStatItem[];
  }>({
    totalCourses: 0,
    publishedCourses: 0,
    pendingCourses: 0,
    draftCourses: 0,
    disabledCourses: 0,
    totalStudentsCount: 0,
    totalEstimatedRevenue: 0,
    coursesList: [],
  });

  const [revenueStats, setRevenueStats] = useState<{
    year: number;
    totalAccumulatedRevenue: number;
    currentMonthRevenue: number;
    lastMonthRevenue: number;
    avgMonthlyRevenue: number;
    monthlyBreakdown: MonthlyRevenueItem[];
  }>({
    year: new Date().getFullYear(),
    totalAccumulatedRevenue: 0,
    currentMonthRevenue: 0,
    lastMonthRevenue: 0,
    avgMonthlyRevenue: 0,
    monthlyBreakdown: [],
  });

  const formatVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 0);
  };

  const formatShortVND = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace('.0', '') + ' tr ₫';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + ' k ₫';
    }
    return num + ' ₫';
  };

  const handleRefresh = () => {
    setLoading(true);
    setRefreshTick((prev) => prev + 1);
  };

  useEffect(() => {
    let isMounted = true;
    fetchInstructorStatisticsApi()
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setCoursesStats(res.data.coursesStats);
          setRevenueStats(res.data.revenueStats);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Lỗi khi tải dữ liệu thống kê:', err);
        toast.error('Không thể tải dữ liệu thống kê giảng viên');
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTick]);

  // Xuất file CSV báo cáo doanh thu & khóa học
  const handleExportCSV = () => {
    const headers = [
      'Tháng / Năm',
      'Số lượt ghi danh',
      'Số đơn thanh toán',
      'Doanh thu (VNĐ)',
    ];

    const rows = revenueStats.monthlyBreakdown.map((m) => [
      `"${m.monthLabel}/${m.year}"`,
      `"${m.enrollmentsCount}"`,
      `"${m.ordersCount}"`,
      `"${m.revenue}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [
        `BÁO CÁO THỐNG KÊ DOANH THU TỪNG THÁNG NĂM ${revenueStats.year}`,
        `Tổng khóa học đang có: ${coursesStats.totalCourses}`,
        `Tổng doanh thu lũy kế: ${formatVND(revenueStats.totalAccumulatedRevenue)}`,
        '',
        headers.join(','),
        ...rows.map((e) => e.join(',')),
      ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Bao_Cao_Thong_Ke_Doanh_Thu_${revenueStats.year}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Đã xuất thành công tệp báo cáo thống kê (.CSV)!');
  };

  const maxMonthlyRevenue = Math.max(
    ...revenueStats.monthlyBreakdown.map((m) => m.revenue),
    1,
  );
  const currentMonthNum = new Date().getMonth() + 1;

  return (
    <div className="instructor-stats-page-container">
      {/* 1. Header */}
      <div className="stats-page-header">
        <div className="stats-header-left">
          <div className="stats-breadcrumbs">
            <button
              type="button"
              className="btn-back-breadcrumb"
              onClick={() => navigate('/instructor/courses')}
            >
              <IconlyArrowLeft size={13} color="currentColor" />
              <span>Khóa học của tôi</span>
            </button>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span style={{ color: '#0056d2', fontWeight: 600 }}>Thống kê</span>
          </div>
          <h1 className="stats-header-title">
            Thống kê hoạt động giảng dạy & Doanh thu
          </h1>
          <p className="stats-header-desc">
            Báo cáo tổng quan số lượng khóa học đang có và chi tiết tổng doanh
            thu thực tế theo từng tháng
          </p>
        </div>

        <div className="stats-header-actions">
          <button
            type="button"
            className="btn-stats-header"
            onClick={handleRefresh}
            title="Tải lại dữ liệu"
          >
            <IconlyRefresh size={15} color="currentColor" />
            <span>Làm mới</span>
          </button>
          <button
            type="button"
            className="btn-stats-header primary"
            onClick={handleExportCSV}
            title="Xuất báo cáo ra file Excel CSV"
          >
            <IconlyDocument size={15} color="#ffffff" />
            <span>Xuất báo cáo CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs chuyển đổi phần xem */}
      <div className="stats-view-tabs">
        <button
          type="button"
          className={`stats-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveTab('ALL')}
        >
          Toàn bộ thống kê
        </button>
        <button
          type="button"
          className={`stats-tab-btn ${activeTab === 'COURSES' ? 'active' : ''}`}
          onClick={() => setActiveTab('COURSES')}
        >
          Thống kê Tổng khóa học ({coursesStats.totalCourses})
        </button>
        <button
          type="button"
          className={`stats-tab-btn ${activeTab === 'REVENUE' ? 'active' : ''}`}
          onClick={() => setActiveTab('REVENUE')}
        >
          Thống kê Doanh thu từng tháng (Năm {revenueStats.year})
        </button>
      </div>

      {loading ? (
        <div className="stats-loading-box">
          <div className="spinner-dual-ring" />
          <span>Đang tổng hợp dữ liệu thống kê giảng viên...</span>
        </div>
      ) : (
        <>
          {/* =========================================================================
              PHẦN 1: THỐNG KÊ TỔNG KHÓA HỌC ĐANG CÓ
             ========================================================================= */}
          {(activeTab === 'ALL' || activeTab === 'COURSES') && (
            <div className="stats-section-card">
              <div className="stats-section-header">
                <div className="stats-section-title-wrap">
                  <span className="stats-section-badge-icon blue">
                    <IconlyBookmark size={18} color="#0056d2" />
                  </span>
                  <div className="stats-section-headings">
                    <h2 className="stats-section-title">
                      Thống kê Tổng khóa học đang có
                    </h2>
                    <p className="stats-section-subtitle">
                      Chi tiết tình trạng xuất bản, quy mô bài giảng và sĩ số
                      học viên của từng khóa
                    </p>
                  </div>
                </div>
                <div className="stats-section-quick-total">
                  Tổng cộng:{' '}
                  <strong>{coursesStats.totalCourses} khóa học</strong>
                </div>
              </div>

              {/* 4 Cards phân loại trạng thái khóa học */}
              <div className="stats-cards-grid">
                <div className="stat-highlight-card blue">
                  <span className="shc-label">Tổng khóa học đang có</span>
                  <strong className="shc-value">
                    {coursesStats.totalCourses}
                  </strong>
                  <span className="shc-sub">Toàn bộ danh mục</span>
                </div>
                <div className="stat-highlight-card green">
                  <span className="shc-label">Đang phát hành</span>
                  <strong className="shc-value">
                    {coursesStats.publishedCourses}
                  </strong>
                  <span className="shc-sub">Học viên đang học</span>
                </div>
                <div className="stat-highlight-card amber">
                  <span className="shc-label">Chờ phê duyệt</span>
                  <strong className="shc-value">
                    {coursesStats.pendingCourses}
                  </strong>
                  <span className="shc-sub">Đang chờ Admin duyệt</span>
                </div>
                <div className="stat-highlight-card purple">
                  <span className="shc-label">Bản nháp & Tạm dừng</span>
                  <strong className="shc-value">
                    {coursesStats.draftCourses + coursesStats.disabledCourses}
                  </strong>
                  <span className="shc-sub">Đang soạn thảo / Ngừng bán</span>
                </div>
              </div>

              {/* Bảng danh sách từng khóa học */}
              <div className="stats-table-wrapper">
                <table className="stats-data-table">
                  <thead>
                    <tr>
                      <th>STT</th>
                      <th>Khóa học</th>
                      <th>Trình độ</th>
                      <th>Cấu trúc</th>
                      <th>Sĩ số học viên</th>
                      <th>Học phí</th>
                      <th>Huy hiệu</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coursesStats.coursesList.map((c, idx) => (
                      <tr key={c.id}>
                        <td style={{ color: '#94a3b8', fontSize: '12px' }}>
                          {idx + 1}
                        </td>
                        <td>
                          <div className="table-course-cell">
                            <img
                              src={
                                c.thumbnailUrl ||
                                'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300'
                              }
                              alt={c.title}
                              className="table-course-thumb"
                            />
                            <div>
                              <div
                                className="table-course-title"
                                title={c.title}
                              >
                                {c.title}
                              </div>
                              <div className="table-course-slug">
                                /{c.slug || c.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="table-level-badge">{c.level}</span>
                        </td>
                        <td>
                          <span
                            style={{ fontSize: '12.5px', color: '#475569' }}
                          >
                            {c.sectionsCount} chương • {c.lecturesCount} bài
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: '#0056d2' }}>
                            {(c.totalStudents || 0).toLocaleString('vi-VN')}
                          </strong>{' '}
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            học viên
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: '#0f172a' }}>
                            {c.price <= 0 ? 'Miễn phí' : formatVND(c.price)}
                          </strong>
                        </td>
                        <td>
                          {c.badge ? (
                            <span
                              className={`smart-badge ${
                                c.badge === 'HOT'
                                  ? 'hot'
                                  : c.badge === 'BESTSELLER'
                                    ? 'bestseller'
                                    : 'new'
                              }`}
                            >
                              {c.badge}
                            </span>
                          ) : (
                            <span
                              style={{ color: '#94a3b8', fontSize: '12px' }}
                            >
                              ---
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`course-status-pill ${
                              c.status === 'PUBLISHED'
                                ? 'published'
                                : c.status === 'PENDING_APPROVAL'
                                  ? 'pending'
                                  : 'draft'
                            }`}
                          >
                            {c.status === 'PUBLISHED'
                              ? 'Đang phát hành'
                              : c.status === 'PENDING_APPROVAL'
                                ? 'Chờ duyệt'
                                : 'Bản nháp'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              PHẦN 2: THỐNG KÊ TỔNG DOANH THU TỪNG THÁNG
             ========================================================================= */}
          {(activeTab === 'ALL' || activeTab === 'REVENUE') && (
            <div className="stats-section-card" style={{ marginTop: '24px' }}>
              <div className="stats-section-header">
                <div className="stats-section-title-wrap">
                  <span className="stats-section-badge-icon green">
                    <IconlyWallet size={18} color="#16a34a" />
                  </span>
                  <div className="stats-section-headings">
                    <h2 className="stats-section-title">
                      Thống kê Tổng doanh thu từng tháng (Năm{' '}
                      {revenueStats.year})
                    </h2>
                    <p className="stats-section-subtitle">
                      Biểu đồ và bảng kê chi tiết doanh thu thực tế lũy kế qua
                      12 tháng
                    </p>
                  </div>
                </div>
                <div className="stats-section-quick-total green">
                  Lũy kế:{' '}
                  <strong>
                    {formatVND(revenueStats.totalAccumulatedRevenue)}
                  </strong>
                </div>
              </div>

              {/* 3 Cards Tổng kết Doanh thu */}
              <div className="stats-cards-grid revenue-grid">
                <div className="stat-highlight-card green">
                  <span className="shc-label">Tổng doanh thu lũy kế</span>
                  <strong className="shc-value">
                    {formatVND(revenueStats.totalAccumulatedRevenue)}
                  </strong>
                  <span className="shc-sub">
                    Toàn bộ các khóa học trong năm
                  </span>
                </div>
                <div className="stat-highlight-card blue">
                  <span className="shc-label">
                    Doanh thu Tháng {currentMonthNum} (Hiện tại)
                  </span>
                  <strong className="shc-value">
                    {formatVND(revenueStats.currentMonthRevenue)}
                  </strong>
                  <span className="shc-sub">Ghi nhận trong tháng này</span>
                </div>
                <div className="stat-highlight-card purple">
                  <span className="shc-label">
                    Doanh thu trung bình mỗi tháng
                  </span>
                  <strong className="shc-value">
                    {formatVND(revenueStats.avgMonthlyRevenue)}
                  </strong>
                  <span className="shc-sub">
                    Tính trên các tháng đang hoạt động
                  </span>
                </div>
              </div>

              {/* Biểu đồ thanh doanh thu 12 tháng */}
              <div className="monthly-chart-box">
                <h3 className="chart-box-title">
                  Biểu đồ doanh thu từng tháng trong năm {revenueStats.year}
                </h3>
                <div className="monthly-bars-track">
                  {revenueStats.monthlyBreakdown.map((m) => {
                    const heightPercent =
                      maxMonthlyRevenue > 0
                        ? Math.max(
                            6,
                            Math.round((m.revenue / maxMonthlyRevenue) * 100),
                          )
                        : 6;
                    const isCurrent = m.monthNumber === currentMonthNum;
                    return (
                      <div key={m.monthNumber} className="month-bar-column">
                        <div className="month-bar-val-bubble">
                          {m.revenue > 0 ? formatShortVND(m.revenue) : '0 ₫'}
                        </div>
                        <div className="month-bar-slot">
                          <div
                            className={`month-bar-fill ${isCurrent ? 'current-month' : ''}`}
                            style={{ height: `${heightPercent}%` }}
                            title={`${m.monthLabel}: ${formatVND(m.revenue)} (${m.ordersCount} đơn)`}
                          />
                        </div>
                        <span
                          className={`month-bar-label ${isCurrent ? 'current' : ''}`}
                        >
                          T{m.monthNumber}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bảng chi tiết doanh thu 12 tháng */}
              <div
                className="stats-table-wrapper"
                style={{ marginTop: '20px' }}
              >
                <table className="stats-data-table">
                  <thead>
                    <tr>
                      <th>Tháng / Năm</th>
                      <th>Lượt học viên ghi danh</th>
                      <th>Số đơn thanh toán</th>
                      <th>Doanh thu ghi nhận (VNĐ)</th>
                      <th>Tỷ trọng</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueStats.monthlyBreakdown.map((m) => {
                      const sharePercent =
                        revenueStats.totalAccumulatedRevenue > 0
                          ? (
                              (m.revenue /
                                revenueStats.totalAccumulatedRevenue) *
                              100
                            ).toFixed(1)
                          : '0.0';
                      const isCurrent = m.monthNumber === currentMonthNum;
                      const isPast = m.monthNumber < currentMonthNum;

                      return (
                        <tr
                          key={m.monthNumber}
                          style={isCurrent ? { background: '#f0fdf4' } : {}}
                        >
                          <td>
                            <strong>{m.monthLabel}</strong> / {m.year}
                            {isCurrent && (
                              <span
                                style={{
                                  marginLeft: '8px',
                                  fontSize: '11px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: '#16a34a',
                                  color: '#ffffff',
                                  fontWeight: 600,
                                }}
                              >
                                Tháng này
                              </span>
                            )}
                          </td>
                          <td>
                            <strong style={{ color: '#0056d2' }}>
                              {m.enrollmentsCount}
                            </strong>{' '}
                            <span
                              style={{ fontSize: '12px', color: '#64748b' }}
                            >
                              học viên
                            </span>
                          </td>
                          <td>
                            <span>{m.ordersCount} đơn</span>
                          </td>
                          <td>
                            <strong
                              style={{ fontSize: '14px', color: '#0f172a' }}
                            >
                              {formatVND(m.revenue)}
                            </strong>
                          </td>
                          <td>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              <div
                                style={{
                                  width: '50px',
                                  height: '6px',
                                  background: '#e2e8f0',
                                  borderRadius: '4px',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: `${sharePercent}%`,
                                    height: '100%',
                                    background: '#16a34a',
                                  }}
                                />
                              </div>
                              <span
                                style={{ fontSize: '12px', color: '#475569' }}
                              >
                                {sharePercent}%
                              </span>
                            </div>
                          </td>
                          <td>
                            {isCurrent ? (
                              <span className="status-pill active">
                                Đang diễn ra
                              </span>
                            ) : isPast ? (
                              <span className="status-pill completed">
                                Đã hoàn thành
                              </span>
                            ) : (
                              <span
                                style={{ color: '#94a3b8', fontSize: '12px' }}
                              >
                                Sắp tới
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

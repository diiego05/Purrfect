import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { adminStatisticsApi } from '../../../services/adminStatisticsApi';
import type {
  AdminStatisticsData,
  MonthlyRevenuePoint,
} from '../../../types/adminStatistics';
import {
  IconlyRefresh,
  IconlyBuy,
  IconlyUserGroup,
  IconlyTick,
  IconlyDiscount,
} from '../../Onboarding/IconlyIcons';
import { formatVND } from '../../../utils/format';
import './AdminStatisticsPage.css';

export const AdminStatisticsPage: React.FC = () => {
  const [data, setData] = useState<AdminStatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredMonth, setHoveredMonth] = useState<MonthlyRevenuePoint | null>(
    null,
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );

  const loadData = useCallback(
    (isRefresh = false, yearToFetch = selectedYear) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      adminStatisticsApi
        .getStatistics(yearToFetch)
        .then((res) => {
          if (res.success && res.data) {
            setData(res.data);
          }
        })
        .catch((err) => {
          console.error('Lỗi khi tải dữ liệu thống kê Admin:', err);
        })
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    [selectedYear],
  );

  useEffect(() => {
    loadData(false, selectedYear);
  }, [loadData, selectedYear]);

  const formatShortVND = (num: number) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1).replace('.0', '') + ' tỷ ₫';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(0) + ' tr ₫';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + ' k ₫';
    }
    return num + ' ₫';
  };

  // Tính toán tọa độ biểu đồ SVG đường cong cho Doanh thu 12 tháng
  const svgChartData = useMemo(() => {
    if (!data?.revenueChart?.monthly) return null;
    const points = data.revenueChart.monthly;
    const width = 800;
    const height = 240;
    const paddingX = 40;
    const paddingY = 30;

    const maxRev = Math.max(...points.map((p) => p.revenue), 100000000);
    const usableWidth = width - paddingX * 2;
    const usableHeight = height - paddingY * 2;

    const coords = points.map((p, idx) => {
      const x = paddingX + (idx / (points.length - 1)) * usableWidth;
      const y = height - paddingY - (p.revenue / maxRev) * usableHeight;
      return { x, y, point: p };
    });

    // Tạo đường SVG line path
    const pathD = coords.reduce((acc, curr, idx) => {
      if (idx === 0) return `M ${curr.x} ${curr.y}`;
      // Smooth bezier curves
      const prev = coords[idx - 1];
      const cx1 = prev.x + (curr.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (curr.x - prev.x) / 2;
      const cy2 = curr.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
    }, '');

    // Tạo polygon kín cho gradient background
    const areaD = `${pathD} L ${coords[coords.length - 1].x} ${height - paddingY} L ${coords[0].x} ${height - paddingY} Z`;

    return { width, height, paddingX, paddingY, maxRev, coords, pathD, areaD };
  }, [data]);

  // Max instructor bar
  const maxNewInstructor = useMemo(() => {
    if (!data?.instructorChart?.monthly) return 10;
    return Math.max(
      ...data.instructorChart.monthly.map((m) => m.newInstructors),
      5,
    );
  }, [data]);

  if (loading) {
    return (
      <div className="admin-stats-loading">
        <div className="admin-stats-spinner" />
        <p>Đang tải dữ liệu thống kê toàn hệ thống...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="admin-stats-loading">
        <p>Không thể kết nối đến máy chủ thống kê.</p>
        <button
          type="button"
          className="admin-stats-refresh-btn"
          onClick={() => loadData()}
        >
          Thử lại
        </button>
      </div>
    );
  }

  const { summary, revenueChart, instructorChart } = data;

  return (
    <div className="admin-stats-container">
      {/* 1. Header & Actions */}
      <div className="admin-stats-header">
        <div className="admin-stats-title-wrap">
          <div>
            <h1 className="admin-stats-title">Thống kê</h1>
            <p className="admin-stats-subtitle">
              Doanh thu nền tảng và tăng trưởng giảng viên (Năm {selectedYear})
            </p>
          </div>
        </div>

        <div className="admin-stats-actions">
          <div className="admin-stats-year-filter">
            <span className="year-filter-label">Năm:</span>
            <select
              className="tab-pill-select"
              value={selectedYear}
              onChange={(e) => {
                const yr = Number(e.target.value);
                setSelectedYear(yr);
              }}
            >
              {[2026, 2025, 2024, 2023, 2022].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className={`admin-stats-refresh-btn ${refreshing ? 'rotating' : ''}`}
            onClick={() => loadData(true, selectedYear)}
            title="Làm mới số liệu"
          >
            <IconlyRefresh size={15} color="currentColor" />
            <span>{refreshing ? 'Đang cập nhật...' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {/* DOANH THU & GIẢNG VIÊN */}
      <div className="kpi-cards-grid">
        {/* Card 1: Doanh thu tháng này */}
        <div className="kpi-stat-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">
              Doanh thu Tháng {summary.currentMonthNum}
            </span>
            <div className="kpi-card-icon green">
              <IconlyBuy size={18} color="currentColor" />
            </div>
          </div>
          <div className="kpi-card-value">
            {formatVND(summary.currentMonthRevenue)}
          </div>
          <div className="kpi-card-footer">
            <span>So với tháng trước</span>
            <span
              className={`growth-badge ${summary.revenueGrowthRate >= 0 ? 'up' : 'down'}`}
            >
              {summary.revenueGrowthRate >= 0 ? '▲ +' : '▼ '}
              {summary.revenueGrowthRate}%
            </span>
          </div>
        </div>

        {/* Card 2: Lũy kế toàn sàn */}
        <div className="kpi-stat-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Tổng doanh thu lũy kế</span>
            <div className="kpi-card-icon blue">
              <IconlyDiscount size={18} color="currentColor" />
            </div>
          </div>
          <div className="kpi-card-value">
            {formatVND(summary.totalAccumulatedRevenue)}
          </div>
          <div className="kpi-card-footer">
            <span>Hoa hồng sàn ({summary.commissionPercent}%):</span>
            <strong style={{ color: '#0056d2' }}>
              {formatVND(summary.totalCommissionRevenue)}
            </strong>
          </div>
        </div>

        {/* Card 3: Đội ngũ giảng viên */}
        <div className="kpi-stat-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Tổng số giảng viên</span>
            <div className="kpi-card-icon purple">
              <IconlyUserGroup size={18} color="currentColor" />
            </div>
          </div>
          <div className="kpi-card-value">{summary.totalInstructors}</div>
          <div className="kpi-card-footer">
            <span>Mới trong tháng {summary.currentMonthNum}:</span>
            <span
              className={`growth-badge ${summary.instructorGrowthRate >= 0 ? 'up' : 'down'}`}
            >
              {summary.instructorGrowthRate >= 0 ? '▲ +' : '▼ '}
              {summary.newInstructorsThisMonth} GV (
              {summary.instructorGrowthRate}%)
            </span>
          </div>
        </div>

        {/* Card 4: Tổng đơn hàng & Quy mô */}
        <div className="kpi-stat-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Đơn hàng thanh toán</span>
            <div className="kpi-card-icon amber">
              <IconlyTick size={18} color="currentColor" />
            </div>
          </div>
          <div className="kpi-card-value">
            {summary.totalPaidOrders.toLocaleString('vi-VN')}
          </div>
          <div className="kpi-card-footer">
            <span>Tổng số khóa học:</span>
            <strong>{summary.totalCoursesCount} khóa học</strong>
          </div>
        </div>
      </div>

      {/* Sơ đồ đường doanh thu & Tăng trưởng giảng viên */}
      <div className="charts-grid-two-col">
        {/* Cột trái: Sơ đồ đường doanh thu tăng giảm */}
        <div className="chart-card-box">
          <div className="chart-card-header">
            <div className="chart-title-area">
              <h3>
                Sơ đồ tăng giảm Doanh thu 12 tháng (Năm {summary.currentYear})
              </h3>
              <p>
                Biểu đồ đường biểu diễn xu hướng dòng tiền và hoa hồng nền tảng
              </p>
            </div>
            <div className="chart-legend-box">
              <div className="legend-item">
                <span className="legend-dot blue" />
                <span>Doanh thu khóa học</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot green" />
                <span>Hoa hồng ({summary.commissionPercent}%)</span>
              </div>
            </div>
          </div>

          {/* Interactive SVG Line Chart */}
          {svgChartData && (
            <div className="svg-chart-wrapper">
              <svg
                viewBox={`0 0 ${svgChartData.width} ${svgChartData.height}`}
                className="svg-chart-root"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#0056d2" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#0056d2" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const yPos =
                    svgChartData.height -
                    svgChartData.paddingY -
                    ratio * (svgChartData.height - svgChartData.paddingY * 2);
                  const labelVal = svgChartData.maxRev * ratio;
                  return (
                    <g key={i}>
                      <line
                        x1={svgChartData.paddingX}
                        y1={yPos}
                        x2={svgChartData.width - svgChartData.paddingX}
                        y2={yPos}
                        className="chart-grid-line"
                      />
                      <text
                        x={svgChartData.paddingX - 8}
                        y={yPos + 4}
                        textAnchor="end"
                        className="chart-axis-text"
                      >
                        {formatShortVND(labelVal)}
                      </text>
                    </g>
                  );
                })}

                {/* Area Fill */}
                <path d={svgChartData.areaD} className="chart-area-fill" />

                {/* Line Path */}
                <path d={svgChartData.pathD} className="chart-line-path" />

                {/* Data Points */}
                {svgChartData.coords.map((c) => {
                  const isCurrent =
                    c.point.monthNumber === summary.currentMonthNum;
                  const isHovered =
                    hoveredMonth?.monthNumber === c.point.monthNumber;
                  return (
                    <g key={c.point.monthNumber}>
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={isHovered ? 7 : isCurrent ? 5.5 : 4}
                        className={`chart-point-dot ${isCurrent ? 'current' : ''}`}
                        onMouseEnter={() => setHoveredMonth(c.point)}
                        onMouseLeave={() => setHoveredMonth(null)}
                      />
                      {/* X-axis label */}
                      <text
                        x={c.x}
                        y={svgChartData.height - 8}
                        textAnchor="middle"
                        className={`chart-axis-text ${isCurrent ? 'active' : ''}`}
                        style={
                          isCurrent ? { fill: '#0056d2', fontWeight: 700 } : {}
                        }
                      >
                        T{c.point.monthNumber}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip khi rê chuột vào điểm nút */}
              {hoveredMonth && (
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '16px',
                    background: '#0f172a',
                    color: '#ffffff',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    boxShadow: '0 6px 18px rgba(0, 0, 0, 0.2)',
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: '4px',
                      color: '#93c5fd',
                    }}
                  >
                    {hoveredMonth.monthLabel} / {hoveredMonth.year}
                  </div>
                  <div>
                    Doanh thu:{' '}
                    <strong>{formatVND(hoveredMonth.revenue)}</strong>
                  </div>
                  <div>
                    Hoa hồng sàn:{' '}
                    <strong>{formatVND(hoveredMonth.commissionRevenue)}</strong>
                  </div>
                  <div>
                    Đơn hàng: <strong>{hoveredMonth.ordersCount} đơn</strong>
                  </div>
                  <div
                    style={{
                      marginTop: '4px',
                      color:
                        hoveredMonth.growthPercent >= 0 ? '#4ade80' : '#f87171',
                    }}
                  >
                    Tăng trưởng: {hoveredMonth.growthPercent >= 0 ? '+' : ''}
                    {hoveredMonth.growthPercent}%
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cột phải: Tăng giảm số lượng giảng viên */}
        <div className="chart-card-box">
          <div className="chart-card-header">
            <div className="chart-title-area">
              <h3>Tăng giảm số lượng Giảng viên</h3>
              <p>
                Số giảng viên mới gia nhập và tổng số lũy kế theo từng tháng
              </p>
            </div>
          </div>

          <div className="instructor-bars-grid">
            {instructorChart.monthly.map((m) => {
              const barHeight =
                maxNewInstructor > 0
                  ? Math.max(
                      8,
                      Math.round((m.newInstructors / maxNewInstructor) * 100),
                    )
                  : 8;
              const isCurrent = m.monthNumber === summary.currentMonthNum;
              return (
                <div key={m.monthNumber} className="instructor-bar-col">
                  <div className="inst-bubble-val">
                    {m.newInstructors > 0 ? `+${m.newInstructors}` : '0'}
                  </div>
                  <div className="inst-bar-track">
                    <div
                      className={`inst-bar-fill ${isCurrent ? 'active-month' : ''}`}
                      style={{ height: `${barHeight}%` }}
                      title={`${m.monthLabel}: +${m.newInstructors} GV mới (Tổng tích lũy: ${m.cumulativeTotal} GV)`}
                    />
                  </div>
                  <span
                    className={`inst-month-lbl ${isCurrent ? 'active' : ''}`}
                  >
                    T{m.monthNumber}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc',
              padding: '12px 16px',
              borderRadius: '8px',
              marginTop: '16px',
              fontSize: '0.85rem',
            }}
          >
            <div>
              <span style={{ color: '#64748b' }}>
                Đơn ứng tuyển chờ duyệt:{' '}
              </span>
              <strong style={{ color: '#d97706' }}>
                {summary.appStats.pending} đơn
              </strong>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Đã duyệt thành công: </span>
              <strong style={{ color: '#16a34a' }}>
                {summary.appStats.approved} GV
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Bảng chi tiết doanh thu 12 tháng */}
      <div className="admin-stats-table-card">
        <div className="admin-stats-table-header">
          <h2 className="admin-stats-table-title">
            Bảng phân tích doanh thu & tăng trưởng chi tiết 12 tháng
          </h2>
        </div>

        <div className="admin-stats-table-wrap">
          <table className="admin-custom-table">
            <thead>
              <tr>
                <th>Tháng / Năm</th>
                <th>Tổng doanh thu (VNĐ)</th>
                <th>Hoa hồng sàn ({summary.commissionPercent}%)</th>
                <th>Số đơn hàng</th>
                <th>Giảng viên mới</th>
                <th>Tổng GV tích lũy</th>
                <th>Tăng trưởng doanh thu</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {revenueChart.monthly.map((m, idx) => {
                const instData = instructorChart.monthly[idx];
                const isCurrent = m.monthNumber === summary.currentMonthNum;
                const isFuture = m.monthNumber > summary.currentMonthNum;

                return (
                  <tr
                    key={m.monthNumber}
                    className={isCurrent ? 'highlight-current' : ''}
                  >
                    <td>
                      <strong>{m.monthLabel}</strong> / {m.year}
                      {isCurrent && (
                        <span
                          style={{
                            marginLeft: '8px',
                            background: '#10b981',
                            color: '#ffffff',
                            fontSize: '10.5px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 700,
                          }}
                        >
                          HIỆN TẠI
                        </span>
                      )}
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>
                        {isFuture ? '---' : formatVND(m.revenue)}
                      </strong>
                    </td>
                    <td>
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>
                        {isFuture ? '---' : formatVND(m.commissionRevenue)}
                      </span>
                    </td>
                    <td>{isFuture ? '---' : `${m.ordersCount} đơn`}</td>
                    <td>
                      {isFuture ? (
                        '---'
                      ) : (
                        <strong style={{ color: '#2563eb' }}>
                          +{instData?.newInstructors || 0} GV
                        </strong>
                      )}
                    </td>
                    <td>
                      {isFuture
                        ? '---'
                        : `${instData?.cumulativeTotal || 0} GV`}
                    </td>
                    <td>
                      {isFuture ? (
                        '---'
                      ) : (
                        <span
                          className={`growth-badge ${m.growthPercent >= 0 ? 'up' : 'down'}`}
                        >
                          {m.growthPercent >= 0 ? '▲ +' : '▼ '}
                          {m.growthPercent}%
                        </span>
                      )}
                    </td>
                    <td>
                      {isCurrent ? (
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>
                          Đang ghi nhận
                        </span>
                      ) : isFuture ? (
                        <span style={{ color: '#94a3b8' }}>Dự kiến</span>
                      ) : (
                        <span style={{ color: '#64748b' }}>Đã hoàn tất</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

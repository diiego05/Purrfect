/**
 * Định dạng tiền tệ Việt Nam Đồng (VND / ₫)
 * Tự động xử lý cả giá trị số VND thực tế và các dữ liệu cũ còn lưu dạng USD (< 1000)
 */
export const formatVND = (price?: number | string | null): string => {
  if (price === undefined || price === null || price === '') {
    return 'Miễn phí';
  }

  let numericPrice: number;
  if (typeof price === 'string') {
    const cleaned = price.replace(/[^0-9.-]+/g, '');
    numericPrice = parseFloat(cleaned);
    if (isNaN(numericPrice)) return price;
  } else {
    numericPrice = price;
  }

  if (numericPrice <= 0) {
    return 'Miễn phí';
  }

  // Tự động quy đổi số USD cũ (< 1000) sang tiền Việt làm tròn đẹp đến 50.000 đ
  if (numericPrice < 1000) {
    numericPrice = Math.round((numericPrice * 10000) / 50000) * 50000;
  }

  // Dùng non-breaking space (\u00A0) để đảm bảo số tiền và đơn vị ₫ không bao giờ bị rớt dòng
  return `${numericPrice.toLocaleString('vi-VN')}\u00A0₫`;
};

/**
 * Định dạng thời gian tương đối tiếng Việt (ví dụ: "Vừa xong", "5 phút trước", "2 giờ trước")
 */
export const formatTimeAgo = (dateStr?: string | Date): string => {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffSec < 60) return 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} ngày trước`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} tháng trước`;
  return `${Math.floor(diffDay / 365)} năm trước`;
};

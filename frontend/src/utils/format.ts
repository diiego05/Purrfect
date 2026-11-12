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

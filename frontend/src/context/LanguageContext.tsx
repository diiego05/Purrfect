import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'vi' | 'en';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Header
    nav_explore: 'Khám phá',
    nav_all_categories: 'Tất cả danh mục ngành học',
    nav_cert: 'Chứng chỉ',
    nav_forum: 'Diễn đàn',
    nav_playlist: 'Playlist',
    search_placeholder: 'Tìm kiếm khóa học, kỹ năng, giảng viên...',
    nav_cart: 'Giỏ hàng',
    nav_wishlist: 'Khóa học yêu thích',
    nav_notifications: 'Thông báo',
    nav_ai: 'Trợ lý AI Purrfect',
    btn_login: 'Đăng nhập',
    btn_register: 'Đăng ký',
    menu_profile: 'Hồ sơ cá nhân',
    menu_my_courses: 'Khóa học của tôi',
    menu_my_certs: 'Chứng chỉ của tôi',
    menu_my_playlists: 'Playlist của tôi',
    menu_purchase_history: 'Lịch sử mua hàng',
    menu_logout: 'Đăng xuất',
    menu_admin: 'Quản trị hệ thống',
    menu_instructor: 'Phân hệ giảng viên',
    menu_language: 'Ngôn ngữ',

    // Hero
    hero_welcome: 'Chào mừng',
    hero_back: 'quay trở lại',
    hero_desc_auth:
      'Lộ trình học tập của bạn đã được cá nhân hóa. Khám phá các khóa học chất lượng cao từ các chuyên gia hàng đầu ngay bên dưới!',
    hero_desc_guest:
      'Nền tảng học trực tuyến chất lượng cao với hàng trăm khóa học thực chiến từ chuyên gia hàng đầu. Khám phá ngay để bứt phá sự nghiệp!',
    hero_btn_explore: 'Khám phá khóa học',
    hero_btn_onboarding: 'Cập nhật lại định hướng',
    hero_onboarding_badge: 'Chưa hoàn thành định hướng học tập',
    hero_onboarding_heading: 'Thiết lập lộ trình học tập cá nhân hóa của bạn',
    hero_onboarding_text:
      'Bạn đã bỏ qua phần khảo sát mục tiêu. Hãy dành 1 phút để Purrfect thấu hiểu định hướng nghề nghiệp và gợi ý danh sách khóa học phù hợp nhất dành riêng cho bạn!',
    hero_onboarding_btn: 'Khảo sát định hướng ngay',
    hero_onboarding_btn_all: 'Khám phá tất cả khóa học',

    // Home Courses
    sec_for_you: 'Dành riêng cho bạn',
    sec_for_you_sub_auth:
      'Được AI đề xuất dựa trên khảo sát định hướng & hành vi học tập của bạn',
    sec_for_you_sub_guest:
      'Được chọn lọc và đề xuất dựa trên xu hướng phát triển kỹ năng hàng đầu',
    sec_best_sellers: 'Khóa học bán chạy nhất',
    sec_best_sellers_sub:
      'Các chương trình học được cộng đồng học viên tin cậy và đăng ký nhiều nhất',
    sec_new_releases: 'Khóa học mới ra mắt',
    sec_new_releases_sub:
      'Cập nhật những công nghệ đột phá và kiến thức mới nhất hiện nay',
    view_all: 'Xem tất cả',
    free_badge: 'Miễn phí',

    // Footer
    footer_about: 'Về chúng tôi',
    footer_blog: 'Bài viết & Tin tức',
    footer_services: 'Dịch vụ đào tạo',
    footer_support: 'Hỗ trợ khách hàng',
    footer_privacy: 'Chính sách bảo mật',
    footer_terms: 'Điều khoản dịch vụ',
    footer_copyright: '2026 © Purrfect | Đã đăng ký bản quyền',

    // Cart & Wishlist
    cart_title: 'Giỏ hàng của bạn',
    cart_empty: 'Giỏ hàng của bạn đang trống',
    cart_total: 'Tổng thanh toán',
    cart_checkout_btn: 'Tiến hành thanh toán',
    wishlist_title: 'Khóa học yêu thích',
    wishlist_empty: 'Bạn chưa lưu khóa học yêu thích nào',

    // Purchase History
    purchase_history_title: 'Lịch sử mua hàng & Hoàn tiền',
    purchase_history_subtitle:
      'Quản lý các khóa học đã thanh toán, yêu cầu hoàn tiền và tiến độ xử lý.',
    tab_orders: 'Đơn hàng đã mua',
    tab_refunds: 'Yêu cầu hoàn tiền',
    btn_learn_now: 'Vào học ngay',
    btn_request_refund: 'Yêu cầu hoàn tiền',
    btn_cancel_refund: 'Hủy yêu cầu hoàn tiền',

    // Auth Card (Login, Register, Forgot Password)
    auth_tab_login: 'Đăng nhập',
    auth_tab_register: 'Đăng ký',
    auth_title_login: 'Chào mừng đến với Purrfect',
    auth_title_register_email: 'Tạo tài khoản mới',
    auth_title_register_otp: 'Xác nhận mã OTP',
    auth_title_register_password: 'Thiết lập mật khẩu',
    auth_title_forgot_request: 'Khôi phục mật khẩu',
    auth_title_forgot_verify: 'Đặt lại mật khẩu mới',
    auth_subtitle_login:
      'Đăng nhập vào tài khoản Purr của bạn để tiếp tục học tập.',
    auth_subtitle_register_email:
      'Nhập địa chỉ email của bạn để bắt đầu đăng ký tài khoản.',
    auth_subtitle_register_otp:
      'Mã xác nhận OTP đã được gửi đến email của bạn.',
    auth_subtitle_register_password:
      'Nhập thông tin cá nhân và mật khẩu (nhập lại) để hoàn tất đăng ký.',
    auth_subtitle_forgot_request:
      'Nhập email của bạn để nhận mã xác nhận OTP khôi phục mật khẩu.',
    auth_subtitle_forgot_verify:
      'Nhập mã xác nhận OTP và mật khẩu mới của bạn.',
    auth_label_email: 'EMAIL',
    auth_label_email_reg: 'EMAIL ĐĂNG KÝ',
    auth_label_email_recovery: 'EMAIL CẦN KHÔI PHỤC',
    auth_label_password: 'MẬT KHẨU',
    auth_label_password_min6: 'MẬT KHẨU (TỐI THIỂU 6 KÝ TỰ)',
    auth_label_password_new: 'MẬT KHẨU MỚI',
    auth_label_password_confirm: 'NHẬP LẠI MẬT KHẨU',
    auth_label_password_confirm_verify: 'XÁC NHẬN MẬT KHẨU',
    auth_label_fullname: 'HỌ VÀ TÊN',
    auth_placeholder_fullname: 'Ví dụ: Nguyễn Văn A',
    auth_placeholder_email: 'name@example.com',
    auth_placeholder_password: 'Nhập mật khẩu của bạn',
    auth_placeholder_password_new: 'Nhập mật khẩu mới (tối thiểu 6 ký tự)',
    auth_placeholder_password_confirm: 'Xác nhận lại mật khẩu vừa nhập',
    auth_show: 'Hiện',
    auth_hide: 'Ẩn',
    auth_remember_me: 'Ghi nhớ đăng nhập',
    auth_forgot_password: 'Quên mật khẩu?',
    auth_btn_login: 'Đăng nhập',
    auth_or: 'HOẶC',
    auth_btn_google: 'Tiếp tục với Google',
    auth_no_account: 'Chưa có tài khoản?',
    auth_register_now: 'Đăng ký ngay',
    auth_has_account: 'Đã có tài khoản?',
    auth_login_now: 'Đăng nhập ngay',
    auth_terms_agree: 'Tôi chấp nhận',
    auth_terms_usage: 'Điều khoản Sử dụng',
    auth_terms_and: 'và',
    auth_terms_privacy: 'Thông báo về quyền riêng tư',
    auth_terms_of: 'của Purrfect',
    auth_btn_continue: 'Tiếp tục',
    auth_btn_change_email: 'Thay đổi email',
    auth_otp_label: 'NHẬP MÃ XÁC NHẬN OTP (6 SỐ)',
    auth_otp_resend_countdown: 'Gửi lại sau',
    auth_otp_resend_btn: 'Gửi lại mã OTP',
    auth_otp_limit: 'Đã hết số lần gửi lại mã OTP (tối đa 3 lần)',
    auth_btn_verify_otp: 'Xác nhận OTP',
    auth_btn_back: '← Quay lại',
    auth_btn_complete_reg: 'Hoàn tất đăng ký & Bắt đầu',
    auth_btn_send_forgot_otp: 'Gửi mã xác nhận OTP',
    auth_btn_back_to_login: '← Quay lại đăng nhập',
    auth_btn_confirm_reset: 'Xác nhận & Đổi mật khẩu',
    auth_btn_request_another_code: '← Gửi lại mã khác',
    auth_google_detected_title: 'Tài khoản đăng nhập bằng Google',
    auth_google_detected_desc:
      'Email này trước đó đã đăng nhập bằng Google. Bạn có thể tiếp tục với Google hoặc tạo mật khẩu mới cho tài khoản.',
    auth_google_create_pwd_btn: 'Tạo mật khẩu cho email này',
    auth_google_set_pwd_btn: 'Tạo mật khẩu & Đăng nhập',

    // Checkout
    checkout_title: 'Thanh toán đơn hàng',
    checkout_courses: 'Khóa học thanh toán',
    checkout_payment_method: 'Phương thức thanh toán',
    checkout_vnpay_official: 'Cổng thanh toán VNPAY',
    checkout_vnpay_badge: 'Chính thức',
    checkout_vnpay_desc:
      'Hỗ trợ quét mã VNPAY-QR, Thẻ nội địa (ATM), Internet Banking và Thẻ quốc tế Visa/MasterCard.',
    checkout_summary_title: 'Chi tiết thanh toán',
    checkout_coupon_label: 'MÃ GIẢM GIÁ (NẾU CÓ)',
    checkout_coupon_placeholder: 'Nhập mã voucher / giảm giá',
    checkout_coupon_apply: 'Áp dụng',
    checkout_subtotal: 'Tạm tính:',
    checkout_discount: 'Giảm giá:',
    checkout_total: 'Tổng thanh toán:',
    checkout_btn_pay: 'Thanh toán ngay qua VNPAY',
    checkout_secure_badge: 'Thanh toán bảo mật SSL 256-bit',

    // Course Detail Fixed Elements
    cd_tab_overview: 'Tổng quan',
    cd_tab_curriculum: 'Nội dung khóa học',
    cd_tab_instructor: 'Giảng viên',
    cd_tab_reviews: 'Đánh giá học viên',
    cd_enrolled_badge: 'Học viên đã tham gia:',
    cd_level: 'Cấp độ:',
    cd_duration: 'Thời lượng:',
    cd_lectures: 'Bài giảng:',
    cd_btn_enroll_free: 'Đăng ký học miễn phí',
    cd_btn_add_cart: 'Thêm vào giỏ hàng',
    cd_btn_buy_now: 'Mua ngay',
    cd_btn_learning: 'Tiếp tục vào học',
  },
  en: {
    // Header
    nav_explore: 'Explore',
    nav_all_categories: 'All Categories',
    nav_cert: 'Certificates',
    nav_forum: 'Forum',
    nav_playlist: 'Playlists',
    search_placeholder: 'Search courses, skills, instructors...',
    nav_cart: 'Cart',
    nav_wishlist: 'Wishlist',
    nav_notifications: 'Notifications',
    nav_ai: 'Purrfect AI Assistant',
    btn_login: 'Sign In',
    btn_register: 'Sign Up',
    menu_profile: 'My Profile',
    menu_my_courses: 'My Courses',
    menu_my_certs: 'My Certificates',
    menu_my_playlists: 'My Playlists',
    menu_purchase_history: 'Purchase History',
    menu_logout: 'Log Out',
    menu_admin: 'Admin Panel',
    menu_instructor: 'Instructor Studio',
    menu_language: 'Language',

    // Hero
    hero_welcome: 'Welcome',
    hero_back: 'back to',
    hero_desc_auth:
      'Your personalized learning path is ready. Explore top-notch courses from industry leaders below!',
    hero_desc_guest:
      'High-quality online learning platform with hundreds of real-world courses from top experts. Boost your career today!',
    hero_btn_explore: 'Explore Courses',
    hero_btn_onboarding: 'Update Goals',
    hero_onboarding_badge: 'Learning direction incomplete',
    hero_onboarding_heading: 'Set up your personalized learning path',
    hero_onboarding_text:
      'You skipped the onboarding survey. Take 1 minute to let Purrfect understand your career goals and suggest the best courses for you!',
    hero_onboarding_btn: 'Take Survey Now',
    hero_onboarding_btn_all: 'Browse All Courses',

    // Home Courses
    sec_for_you: 'Recommended for You',
    sec_for_you_sub_auth:
      'AI-curated based on your onboarding survey and learning behavior',
    sec_for_you_sub_guest:
      'Curated and recommended based on current top industry skill trends',
    sec_best_sellers: 'Best Selling Courses',
    sec_best_sellers_sub:
      'The most popular and highly trusted programs chosen by our student community',
    sec_new_releases: 'New Releases',
    sec_new_releases_sub:
      'Stay up-to-date with breakthrough technologies and latest skills',
    view_all: 'View All',
    free_badge: 'Free',

    // Footer
    footer_about: 'About Us',
    footer_blog: 'Blog & News',
    footer_services: 'Services',
    footer_support: 'Support',
    footer_privacy: 'Privacy Policy',
    footer_terms: 'Terms of Service',
    footer_copyright: '2026 © Purrfect | All rights reserved',

    // Cart & Wishlist
    cart_title: 'Your Shopping Cart',
    cart_empty: 'Your shopping cart is empty',
    cart_total: 'Order Total',
    cart_checkout_btn: 'Proceed to Checkout',
    wishlist_title: 'My Wishlist',
    wishlist_empty: 'Your wishlist is empty',

    // Purchase History
    purchase_history_title: 'Purchase History & Refunds',
    purchase_history_subtitle:
      'Manage purchased courses, refund requests, and processing status.',
    tab_orders: 'Purchased Orders',
    tab_refunds: 'Refund Requests',
    btn_learn_now: 'Start Learning',
    btn_request_refund: 'Request Refund',
    btn_cancel_refund: 'Cancel Refund Request',

    // Auth Card (Login, Register, Forgot Password)
    auth_tab_login: 'Sign In',
    auth_tab_register: 'Sign Up',
    auth_title_login: 'Welcome to Purrfect',
    auth_title_register_email: 'Create New Account',
    auth_title_register_otp: 'Confirm OTP Code',
    auth_title_register_password: 'Set Up Password',
    auth_title_forgot_request: 'Recover Password',
    auth_title_forgot_verify: 'Reset New Password',
    auth_subtitle_login: 'Sign in to your Purr account to continue learning.',
    auth_subtitle_register_email: 'Enter your email address to get started.',
    auth_subtitle_register_otp:
      'A verification OTP code has been sent to your email.',
    auth_subtitle_register_password:
      'Enter your name and password to complete registration.',
    auth_subtitle_forgot_request:
      'Enter your email to receive an OTP code to reset password.',
    auth_subtitle_forgot_verify:
      'Enter the verification OTP and your new password.',
    auth_label_email: 'EMAIL',
    auth_label_email_reg: 'REGISTRATION EMAIL',
    auth_label_email_recovery: 'RECOVERY EMAIL',
    auth_label_password: 'PASSWORD',
    auth_label_password_min6: 'PASSWORD (MINIMUM 6 CHARACTERS)',
    auth_label_password_new: 'NEW PASSWORD',
    auth_label_password_confirm: 'CONFIRM PASSWORD',
    auth_label_password_confirm_verify: 'VERIFY PASSWORD',
    auth_label_fullname: 'FULL NAME',
    auth_placeholder_fullname: 'E.g. John Doe',
    auth_placeholder_email: 'name@example.com',
    auth_placeholder_password: 'Enter your password',
    auth_placeholder_password_new: 'Enter new password (min. 6 characters)',
    auth_placeholder_password_confirm: 'Re-enter your password to confirm',
    auth_show: 'Show',
    auth_hide: 'Hide',
    auth_remember_me: 'Remember me',
    auth_forgot_password: 'Forgot password?',
    auth_btn_login: 'Sign In',
    auth_or: 'OR',
    auth_btn_google: 'Continue with Google',
    auth_no_account: "Don't have an account?",
    auth_register_now: 'Sign up now',
    auth_has_account: 'Already have an account?',
    auth_login_now: 'Sign in now',
    auth_terms_agree: 'I agree to the',
    auth_terms_usage: 'Terms of Use',
    auth_terms_and: 'and',
    auth_terms_privacy: 'Privacy Notice',
    auth_terms_of: 'of Purrfect',
    auth_btn_continue: 'Continue',
    auth_btn_change_email: 'Change email',
    auth_otp_label: 'ENTER 6-DIGIT OTP CODE',
    auth_otp_resend_countdown: 'Resend in',
    auth_otp_resend_btn: 'Resend OTP Code',
    auth_otp_limit: 'Resend limit reached (maximum 3 times)',
    auth_btn_verify_otp: 'Verify OTP',
    auth_btn_back: '← Back',
    auth_btn_complete_reg: 'Complete Registration & Start',
    auth_btn_send_forgot_otp: 'Send Verification OTP',
    auth_btn_back_to_login: '← Back to Sign In',
    auth_btn_confirm_reset: 'Confirm & Reset Password',
    auth_btn_request_another_code: '← Request another code',
    auth_google_detected_title: 'Google Account Detected',
    auth_google_detected_desc:
      'This email was previously used with Google Sign-In. You can continue with Google or set a password for this account.',
    auth_google_create_pwd_btn: 'Create Password for this Email',
    auth_google_set_pwd_btn: 'Set Password & Sign In',

    // Checkout
    checkout_title: 'Order Checkout',
    checkout_courses: 'Purchasing Courses',
    checkout_payment_method: 'Payment Method',
    checkout_vnpay_official: 'VNPAY Payment Gateway',
    checkout_vnpay_badge: 'Official',
    checkout_vnpay_desc:
      'Supports VNPAY-QR code, Domestic ATM cards, Internet Banking, and International Visa/MasterCard.',
    checkout_summary_title: 'Payment Details',
    checkout_coupon_label: 'COUPON / VOUCHER (OPTIONAL)',
    checkout_coupon_placeholder: 'Enter coupon or voucher code',
    checkout_coupon_apply: 'Apply',
    checkout_subtotal: 'Subtotal:',
    checkout_discount: 'Discount:',
    checkout_total: 'Total Amount:',
    checkout_btn_pay: 'Pay Now via VNPAY',
    checkout_secure_badge: 'Secure 256-bit SSL Payment',

    // Course Detail Fixed Elements
    cd_tab_overview: 'Overview',
    cd_tab_curriculum: 'Curriculum',
    cd_tab_instructor: 'Instructor',
    cd_tab_reviews: 'Reviews',
    cd_enrolled_badge: 'Students enrolled:',
    cd_level: 'Level:',
    cd_duration: 'Duration:',
    cd_lectures: 'Lectures:',
    cd_btn_enroll_free: 'Enroll for Free',
    cd_btn_add_cart: 'Add to Cart',
    cd_btn_buy_now: 'Buy Now',
    cd_btn_learning: 'Go to Course',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('preferred_lang');
    return saved === 'en' ? 'en' : 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('preferred_lang', lang);
    document.documentElement.lang = lang;
  };

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, fallback?: string): string => {
    return translations[language]?.[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, toggleLanguage, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;

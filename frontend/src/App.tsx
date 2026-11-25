import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartWishlistProvider } from './context/CartWishlistContext';
import { ChatbotProvider } from './context/ChatbotContext';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { HomeCourses } from './components/Courses/HomeCourses';
import { CourseDetail } from './components/Courses/CourseDetail';
import { Footer } from './components/Footer';
import { AuthCard } from './components/Auth/AuthCard';
import { OnboardingFlow } from './components/Onboarding/OnboardingFlow';
import { CourseDetailPage } from './components/CourseDetail/CourseDetailPage';
import { CourseLearningPage } from './components/Learning/CourseLearningPage';
import { CategoryPage } from './components/Category/CategoryPage';
import { SearchPage } from './components/Search/SearchPage';
import { CartPage } from './components/Cart/CartPage';
import { WishlistPage } from './components/Wishlist/WishlistPage';
import { CheckoutPage } from './components/Payment/CheckoutPage';
import { VNPayReturnPage } from './components/Payment/VNPayReturnPage';
import { PurchaseHistoryPage } from './components/Payment/PurchaseHistoryPage';
import { MyCoursesPage } from './components/Courses/MyCoursesPage';
import { NotFound } from './components/NotFound/NotFound';
import { AdminLayout } from './components/Admin/AdminLayout';
import { CategoryManagement } from './components/Admin/CategoryManagement/CategoryManagement';
import SystemConfigManagement from './components/Admin/SystemConfig/SystemConfigManagement';
import CouponManagement from './components/Admin/CouponManagement/CouponManagement';
import { UserManagement } from './components/Admin/UserManagement/UserManagement';
import { CourseApprovalManagement } from './components/Admin/CourseApproval/CourseApprovalManagement';
import { AdminStatisticsPage } from './components/Admin/Statistics/AdminStatisticsPage';

import { AdminRefundManagement } from './components/Admin/RefundManagement/AdminRefundManagement';

import { AdminModerationPage } from './components/Admin/Moderation/AdminModerationPage';
import { InstructorApplicationManagement } from './components/Admin/InstructorApplications/InstructorApplicationManagement';
import { InstructorApplyPage } from './components/Instructor/InstructorApplyPage';
import { PublicInstructorCoursesPage } from './components/Instructor/PublicInstructorCoursesPage';

import { ProfilePage } from './components/Profile/ProfilePage';
import { PlaylistsPage } from './components/Playlist/PlaylistsPage';
import { PlaylistDetailPage } from './components/Playlist/PlaylistDetailPage';
import { InstructorLayout } from './components/Instructor/InstructorLayout';
import { InstructorCoursesPage } from './components/Instructor/InstructorCoursesPage';
import { InstructorCourseCouponsPage } from './components/Instructor/InstructorCourseCouponsPage';

import { InstructorReviewsPage } from './components/Instructor/InstructorReviewsPage';

import { InstructorStudentsPage } from './components/Instructor/InstructorStudentsPage';
import { InstructorStatisticsPage } from './components/Instructor/InstructorStatisticsPage';
import { InstructorWithdrawalPage } from './components/Instructor/InstructorWithdrawalPage';
import { InstructorRefundLogsPage } from './components/Instructor/InstructorRefundLogsPage';

import { BannerCarousel } from './components/Banner/BannerCarousel';
import { ChatbotWidget } from './components/Chatbot/ChatbotWidget';
import './App.css';

function MainRouter() {
  const { currentPath } = useAuth();

  // Normalize path by stripping query string and removing trailing slash (e.g., '/search?q=abc' -> '/search')
  const pathWithoutQuery = currentPath.split('?')[0];
  const normalizedPath = pathWithoutQuery.replace(/\/+$/, '') || '/';

  // 1. Khảo sát định hướng Onboarding
  if (normalizedPath === '/onboarding') {
    return <OnboardingFlow />;
  }

  // Kết quả thanh toán VNPAY
  if (normalizedPath === '/payment/vnpay-return') {
    return (
      <div className="app-layout">
        <Header />
        <main className="main-content">
          <VNPayReturnPage />
        </main>
        <Footer />
      </div>
    );
  }

  // Trang Giỏ hàng (/cart & /gio-hang)
  if (normalizedPath === '/cart' || normalizedPath === '/gio-hang') {
    return (
      <div className="app-layout">
        <Header />
        <main className="main-content">
          <CartPage />
        </main>
        <Footer />
      </div>
    );
  }

  // Trang Khóa học yêu thích (/wishlist & /yeu-thich)
  if (normalizedPath === '/wishlist' || normalizedPath === '/yeu-thich') {
    return (
      <div className="app-layout">
        <Header />
        <main className="main-content">
          <WishlistPage />
        </main>
        <Footer />
      </div>
    );
  }

  // Trang Chi tiết Playlist khóa học (/playlists/:id, /playlist/:id, /danh-sach-phat/:id) -
  const playlistDetailMatch = normalizedPath.match(
    /^\/(?:playlists|playlist|danh-sach-phat)\/([^/]+)$/,
  );
  if (playlistDetailMatch) {
    const playlistId = decodeURIComponent(playlistDetailMatch[1]);
    return (
      <div className="app-layout">
        <Header />
        <main className="main-content">
          <PlaylistDetailPage key={playlistId} playlistId={playlistId} />
        </main>
        <Footer />
      </div>
    );
  }

  // Trang Quản lý Playlist khóa học (/playlists, /playlist, /danh-sach-phat) -
  if (
    normalizedPath === '/playlists' ||
    normalizedPath === '/playlist' ||
    normalizedPath === '/danh-sach-phat'
  ) {
    return (
      <div className="app-layout">
        <Header />
        <main className="main-content">
          <PlaylistsPage />
        </main>
        <Footer />
      </div>
    );
  }

  // Trang Thanh toán (/checkout & /checkout/:param & /thanh-toan)
  const checkoutMatch = normalizedPath.match(
    /^\/(?:checkout|thanh-toan)(?:\/([^/]+))?$/,
  );
  if (checkoutMatch) {
    const courseParam = checkoutMatch[1]
      ? decodeURIComponent(checkoutMatch[1])
      : undefined;
    return (
      <div className="app-layout">
        <Header />
        <main className="main-content">
          <CheckoutPage key={courseParam || 'cart'} courseParam={courseParam} />
        </main>
        <Footer />
      </div>
    );
  }

  // Trang Tìm kiếm khóa học (/search, /courses, /tim-kiem)
  if (
    normalizedPath === '/search' ||
    normalizedPath === '/courses' ||
    normalizedPath === '/tim-kiem'
  ) {
    return (
      <div className="app-layout">
        <Header />
        <main className="main-content">
          <SearchPage />
        </main>
        <Footer />
      </div>
    );
  }

  // 4. Phòng học trực tuyến / Trình phát bài giảng chuyên biệt (Course Learning Room)
  const learningMatch = normalizedPath.match(
    /^\/(?:learning|learn|hoc-tap)\/([^/]+)$/,
  );
  if (learningMatch) {
    const slug = decodeURIComponent(learningMatch[1]);
    return <CourseLearningPage key={slug} slug={slug} />;
  }

  const courseLearnMatch = normalizedPath.match(
    /^\/courses\/([^/]+)\/(?:learn|learning)$/,
  );
  if (courseLearnMatch) {
    const slug = decodeURIComponent(courseLearnMatch[1]);
    return <CourseLearningPage key={slug} slug={slug} />;
  }

  // Handle course detail page: /courses/:slug or /course/:slug
  const courseMatch = normalizedPath.match(/^\/(?:courses|course)\/([^/]+)$/);
  if (courseMatch) {
    const slug = decodeURIComponent(courseMatch[1]);
    return (
      <div className="app-layout">
        <Header />
        <main className="main-content">
          <CourseDetailPage key={slug} slug={slug} />
        </main>
        <Footer />
      </div>
    );
  }

  // Handle category page: /category/:slug or /categories/:slug
  const categoryMatch = normalizedPath.match(
    /^\/(?:category|categories)\/([^/]+)$/,
  );
  if (categoryMatch) {
    const slug = decodeURIComponent(categoryMatch[1]);
    return (
      <div className="app-layout">
        <Header />
        <main className="main-content">
          <CategoryPage key={slug} slug={slug} />
        </main>
        <Footer />
      </div>
    );
  }

  // Handle public instructor courses page: /instructors/:id, /giang-vien/:id, /instructor-courses/:id
  const instructorCoursesMatch = normalizedPath.match(
    /^\/(?:instructors|instructor-courses|giang-vien|instructor-profile)\/([^/]+)$/,
  );
  if (instructorCoursesMatch) {
    const instructorId = decodeURIComponent(instructorCoursesMatch[1]);
    return (
      <div className="app-layout">
        <Header />
        <main className="main-content">
          <PublicInstructorCoursesPage
            key={instructorId}
            instructorId={instructorId}
          />
        </main>
        <Footer />
      </div>
    );
  }

  if (normalizedPath === '/login' || normalizedPath === '/register') {
    return (
      <div className="app-layout">
        <Header />
        <main className="main-content">
          <div className="auth-page-container">
            <AuthCard
              key={normalizedPath}
              initialStep={
                normalizedPath === '/register' ? 'REGISTER_EMAIL' : 'LOGIN'
              }
            />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Trang Hồ sơ cá nhân (/profile, /ho-so-ca-nhan, /tai-khoan) -
  if (
    normalizedPath === '/profile' ||
    normalizedPath === '/ho-so-ca-nhan' ||
    normalizedPath === '/tai-khoan'
  ) {
    return (
      <div className="app-layout">
        <Header />
        <main className="main-content">
          <ProfilePage />
        </main>
        <Footer />
      </div>
    );
  }

  // Trang Lịch sử mua hàng & Yêu cầu hoàn tiền (/purchase-history, /orders, /lich-su-mua-hang) -
  if (
    normalizedPath === '/purchase-history' ||
    normalizedPath === '/orders' ||
    normalizedPath === '/lich-su-mua-hang' ||
    normalizedPath === '/don-hang'
  ) {
    return (
      <div className="app-layout">
        <Header />
        <main className="main-content">
          <PurchaseHistoryPage />
        </main>
        <Footer />
      </div>
    );
  }

  // Trang Khóa học của tôi (/my-courses, /khoa-hoc-cua-toi, /my-learning)
  if (
    normalizedPath === '/my-courses' ||
    normalizedPath === '/khoa-hoc-cua-toi' ||
    normalizedPath === '/my-learning'
  ) {
    return (
      <div className="app-layout">
        <Header />
        <main className="main-content">
          <MyCoursesPage />
        </main>
        <Footer />
      </div>
    );
  }

  // Phân hệ Giảng viên (Instructor Dashboard) - Bảng điều khiển giống Admin
  if (
    normalizedPath === '/instructor/statistics' ||
    normalizedPath === '/instructor/analytics' ||
    normalizedPath === '/instructor/thong-ke'
  ) {
    return (
      <InstructorLayout activeTab="analytics" pageTitle="Thống kê">
        <InstructorStatisticsPage />
      </InstructorLayout>
    );
  }

  if (
    normalizedPath === '/instructor/students' ||
    normalizedPath === '/instructor/hoc-vien'
  ) {
    return (
      <InstructorLayout
        activeTab="students"
        pageTitle="Quản lý học viên ghi danh"
      >
        <InstructorStudentsPage />
      </InstructorLayout>
    );
  }

  if (
    normalizedPath === '/instructor/courses' ||
    normalizedPath === '/instructor' ||
    normalizedPath === '/giang-vien/khoa-hoc' ||
    normalizedPath === '/instructor/courses/new'
  ) {
    return (
      <InstructorLayout activeTab="courses" pageTitle="Quản lý khóa học">
        <InstructorCoursesPage />
      </InstructorLayout>
    );
  }

  // Quản lý Mã giảm giá khóa học của Giảng viên (Trang đầy đủ - không dùng popup)
  const instructorCouponsMatch = normalizedPath.match(
    /^\/instructor\/(?:courses\/([^/]+)\/coupons|coupons\/([^/]+)|coupons)$/,
  );
  if (instructorCouponsMatch) {
    const courseId =
      instructorCouponsMatch[1] ||
      instructorCouponsMatch[2] ||
      new URLSearchParams(window.location.search).get('courseId') ||
      '';
    return (
      <InstructorLayout activeTab="courses" pageTitle="Mã giảm giá khóa học">
        <InstructorCourseCouponsPage courseId={courseId} />
      </InstructorLayout>
    );
  }

  // Quản lý Đánh giá & Phản hồi của Giảng viên
  if (
    normalizedPath === '/instructor/reviews' ||
    normalizedPath === '/giang-vien/danh-gia' ||
    normalizedPath === '/instructor/danh-gia'
  ) {
    return (
      <InstructorLayout
        activeTab="reviews"
        pageTitle="Đánh giá & Phản hồi học viên"
      >
        <InstructorReviewsPage />
      </InstructorLayout>
    );
  }

  // Quản lý Doanh thu & Rút tiền Giảng viên
  if (
    normalizedPath === '/instructor/withdrawals' ||
    normalizedPath === '/instructor/rut-tien' ||
    normalizedPath === '/giang-vien/rut-tien'
  ) {
    return (
      <InstructorLayout
        activeTab="withdrawals"
        pageTitle="Quản lý Doanh thu & Rút tiền"
      >
        <InstructorWithdrawalPage />
      </InstructorLayout>
    );
  }

  // Nhật ký Hoàn trả khóa học & Biến động Doanh thu
  if (
    normalizedPath === '/instructor/refunds' ||
    normalizedPath === '/instructor/hoan-tien' ||
    normalizedPath === '/giang-vien/hoan-tien'
  ) {
    return (
      <InstructorLayout
        activeTab="refunds"
        pageTitle="Nhật ký Hoàn trả khóa học"
      >
        <InstructorRefundLogsPage />
      </InstructorLayout>
    );
  }

  // 3. Phân hệ Quản trị viên (Admin Dashboard)
  if (
    normalizedPath === '/admin/statistics' ||
    normalizedPath === '/admin/thong-ke'
  ) {
    return (
      <AdminLayout activeTab="statistics" pageTitle="Thống kê hệ thống">
        <AdminStatisticsPage />
      </AdminLayout>
    );
  }
  if (
    normalizedPath === '/admin/courses' ||
    normalizedPath === '/admin/course-approvals' ||
    normalizedPath === '/admin/phe-duyet-khoa-hoc'
  ) {
    return (
      <AdminLayout activeTab="course-approvals" pageTitle="Phê duyệt khóa học">
        <CourseApprovalManagement />
      </AdminLayout>
    );
  }

  if (normalizedPath === '/admin' || normalizedPath === '/admin/categories') {
    return (
      <AdminLayout
        activeTab="categories"
        pageTitle="Quản lý danh mục ngành học"
      >
        <CategoryManagement />
      </AdminLayout>
    );
  }

  if (normalizedPath === '/admin/coupons') {
    return (
      <AdminLayout activeTab="coupons" pageTitle="Quản lý mã giảm giá">
        <CouponManagement />
      </AdminLayout>
    );
  }

  if (normalizedPath === '/admin/system-configs') {
    return (
      <AdminLayout activeTab="system-configs" pageTitle="Cấu hình hệ thống">
        <SystemConfigManagement />
      </AdminLayout>
    );
  }

  if (normalizedPath === '/admin/users') {
    return (
      <AdminLayout activeTab="users" pageTitle="Quản lý người dùng & Tài khoản">
        <UserManagement />
      </AdminLayout>
    );
  }

  // Quản lý Hoàn tiền & Rút tiền
  if (
    normalizedPath === '/admin/refunds' ||
    normalizedPath === '/admin/withdrawals' ||
    normalizedPath === '/admin/hoan-tien' ||
    normalizedPath === '/admin/rut-tien'
  ) {
    return (
      <AdminLayout activeTab="refunds" pageTitle="Quản lý Hoàn tiền & Rút tiền">
        <AdminRefundManagement />
      </AdminLayout>
    );
  }

  // Quản lý Kiểm duyệt nội dung
  if (
    normalizedPath === '/admin/moderation' ||
    normalizedPath === '/admin/kiem-duyet' ||
    normalizedPath === '/admin/reports'
  ) {
    return (
      <AdminLayout activeTab="moderation" pageTitle="Kiểm duyệt nội dung">
        <AdminModerationPage />
      </AdminLayout>
    );
  }

  // Quản lý Phê duyệt Đơn đăng ký Giảng viên
  if (
    normalizedPath === '/admin/instructor-applications' ||
    normalizedPath === '/admin/duyet-giang-vien' ||
    normalizedPath === '/admin/don-giang-vien'
  ) {
    return (
      <AdminLayout
        activeTab="instructor-applications"
        pageTitle="Duyệt đơn đăng ký Giảng viên"
      >
        <InstructorApplicationManagement />
      </AdminLayout>
    );
  }

  // Đăng ký làm Giảng viên (Instructor Application)
  if (
    normalizedPath === '/instructor/apply' ||
    normalizedPath === '/dang-ky-giang-vien' ||
    normalizedPath === '/become-instructor'
  ) {
    return <InstructorApplyPage />;
  }

  // 4. Chi tiết khóa học (Course Detail)
  if (normalizedPath.startsWith('/courses/')) {
    const slug = normalizedPath.replace(/^\/courses\//, '');
    return (
      <div className="app-layout">
        <Header />
        <main className="main-content">
          <CourseDetail slug={slug} />
        </main>
        <Footer />
      </div>
    );
  }

  // 5. Trang chủ chính (Homepage)
  if (normalizedPath === '/') {
    return (
      <div className="app-layout">
        <Header />
        <main className="main-content">
          <Hero />
          <BannerCarousel />
          <HomeCourses />
        </main>
        <Footer />
      </div>
    );
  }

  // Handle all nonexistent / undefined routes
  return <NotFound />;
}

function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <CartWishlistProvider>
            <ChatbotProvider>
              <MainRouter />
              <ChatbotWidget />
            </ChatbotProvider>
          </CartWishlistProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}

export default App;

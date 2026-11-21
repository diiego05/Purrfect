import { AuthProvider, useAuth } from './context/AuthContext';
import { CartWishlistProvider } from './context/CartWishlistContext';
import { ChatbotProvider } from './context/ChatbotContext';
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
import { NotFound } from './components/NotFound/NotFound';
import { AdminLayout } from './components/Admin/AdminLayout';
import { CategoryManagement } from './components/Admin/CategoryManagement/CategoryManagement';
import SystemConfigManagement from './components/Admin/SystemConfig/SystemConfigManagement';
import CouponManagement from './components/Admin/CouponManagement/CouponManagement';
import { UserManagement } from './components/Admin/UserManagement/UserManagement';
import { CourseApprovalManagement } from './components/Admin/CourseApproval/CourseApprovalManagement';
import { AdminModerationPage } from './components/Admin/Moderation/AdminModerationPage';
import { InstructorApplicationManagement } from './components/Admin/InstructorApplications/InstructorApplicationManagement';
import { InstructorApplyPage } from './components/Instructor/InstructorApplyPage';
import { ProfilePage } from './components/Profile/ProfilePage';
import { PlaylistsPage } from './components/Playlist/PlaylistsPage';
import { PlaylistDetailPage } from './components/Playlist/PlaylistDetailPage';
import { InstructorLayout } from './components/Instructor/InstructorLayout';
import { InstructorCoursesPage } from './components/Instructor/InstructorCoursesPage';
import { InstructorReviewsPage } from './components/Instructor/InstructorReviewsPage';
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

  // Trang Chi tiết Playlist khóa học (/playlists/:id, /playlist/:id, /danh-sach-phat/:id) - UC29
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

  // Trang Quản lý Playlist khóa học (/playlists, /playlist, /danh-sach-phat) - UC29
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

  // Trang Hồ sơ cá nhân (/profile, /ho-so-ca-nhan, /tai-khoan) - UC04
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

  // Phân hệ Giảng viên (Instructor Dashboard) - Bảng điều khiển giống Admin (UC06)
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

  // Quản lý Đánh giá & Phản hồi của Giảng viên (UC23)
  if (
    normalizedPath === '/instructor/reviews' ||
    normalizedPath === '/giang-vien/danh-gia' ||
    normalizedPath === '/instructor/danh-gia'
  ) {
    return (
      <InstructorLayout activeTab="reviews" pageTitle="Đánh giá & Phản hồi học viên">
        <InstructorReviewsPage />
      </InstructorLayout>
    );
  }

  // 3. Phân hệ Quản trị viên (Admin Dashboard)
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
      <AdminLayout
        activeTab="system-configs"
        pageTitle="Cấu hình hệ thống & Banner"
      >
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

  // Quản lý Kiểm duyệt nội dung (UC26)
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
      <AdminLayout activeTab="instructor-applications" pageTitle="Duyệt đơn đăng ký Giảng viên">
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
    <AuthProvider>
      <CartWishlistProvider>
        <ChatbotProvider>
          <MainRouter />
          <ChatbotWidget />
        </ChatbotProvider>
      </CartWishlistProvider>
    </AuthProvider>
  );
}

export default App;

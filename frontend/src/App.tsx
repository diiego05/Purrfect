import { AuthProvider, useAuth } from './context/AuthContext';
import { CartWishlistProvider } from './context/CartWishlistContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { HomeCourses } from './components/Courses/HomeCourses';
import { Footer } from './components/Footer';
import { AuthCard } from './components/Auth/AuthCard';
import { OnboardingFlow } from './components/Onboarding/OnboardingFlow';
import { CourseDetailPage } from './components/CourseDetail/CourseDetailPage';
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
import { ProfilePage } from './components/Profile/ProfilePage';
import { PlaylistsPage } from './components/Playlist/PlaylistsPage';
import { PlaylistDetailPage } from './components/Playlist/PlaylistDetailPage';
import { InstructorLayout } from './components/Instructor/InstructorLayout';
import { InstructorCoursesPage } from './components/Instructor/InstructorCoursesPage';
import { BannerCarousel } from './components/Banner/BannerCarousel';
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

  // 3. Phân hệ Quản trị viên (Admin Dashboard)
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

  // 4. Trang chủ chính (Homepage)
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
        <MainRouter />
      </CartWishlistProvider>
    </AuthProvider>
  );
}

export default App;

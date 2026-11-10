import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { HomeCourses } from './components/Courses/HomeCourses';
import { CourseDetail } from './components/Courses/CourseDetail';
import { Footer } from './components/Footer';
import { AuthCard } from './components/Auth/AuthCard';
import { OnboardingFlow } from './components/Onboarding/OnboardingFlow';
import { NotFound } from './components/NotFound/NotFound';
import { AdminLayout } from './components/Admin/AdminLayout';
import { CategoryManagement } from './components/Admin/CategoryManagement/CategoryManagement';
import SystemConfigManagement from './components/Admin/SystemConfig/SystemConfigManagement';
import CouponManagement from './components/Admin/CouponManagement/CouponManagement';
import { BannerCarousel } from './components/Banner/BannerCarousel';
import { ChatbotWidget } from './components/Chatbot/ChatbotWidget';
import './App.css';

function MainRouter() {
  const { currentPath } = useAuth();

  // Normalize path by removing trailing slash (e.g., '/login/' -> '/login', '' -> '/')
  const normalizedPath = currentPath.replace(/\/+$/, '') || '/';

  // 1. Khảo sát định hướng Onboarding
  if (normalizedPath === '/onboarding') {
    return <OnboardingFlow />;
  }

  // 2. Trang Đăng nhập & Đăng ký
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

  // 3. Phân hệ Quản trị viên (Admin Dashboard)
  if (normalizedPath === '/admin' || normalizedPath === '/admin/categories') {
    return (
      <AdminLayout activeTab="categories" pageTitle="Quản lý danh mục ngành học">
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
      <AdminLayout activeTab="system-configs" pageTitle="Cấu hình hệ thống & Banner">
        <SystemConfigManagement />
      </AdminLayout>
    );
  }

  if (normalizedPath === '/admin/users') {
    return (
      <AdminLayout activeTab="users" pageTitle="Quản lý người dùng">
        <div className="cat-empty-state" style={{ background: '#111827', borderRadius: '12px', padding: '4rem 2rem' }}>
          <div className="cat-empty-icon" style={{ fontSize: '3.5rem' }}>👥</div>
          <h2 style={{ color: '#fff', margin: '0.5rem 0' }}>Quản lý người dùng (Use Case UC24)</h2>
          <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto' }}>
            Phân hệ phân quyền, khóa tài khoản vi phạm và xuất danh sách người dùng kèm kiểm toán audit logs.
          </p>
        </div>
      </AdminLayout>
    );
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
      <MainRouter />
      <ChatbotWidget />
    </AuthProvider>
  );
}

export default App;

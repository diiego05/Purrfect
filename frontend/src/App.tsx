import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { HomeCourses } from './components/Courses/HomeCourses';
import { Footer } from './components/Footer';
import { AuthCard } from './components/Auth/AuthCard';
import { OnboardingFlow } from './components/Onboarding/OnboardingFlow';
import { CourseDetailPage } from './components/CourseDetail/CourseDetailPage';
import { NotFound } from './components/NotFound/NotFound';
import './App.css';

function MainRouter() {
  const { currentPath } = useAuth();

  // Normalize path by removing trailing slash (e.g., '/login/' -> '/login', '' -> '/')
  const normalizedPath = currentPath.replace(/\/+$/, '') || '/';

  if (normalizedPath === '/onboarding') {
    return <OnboardingFlow />;
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

  if (normalizedPath === '/') {
    return (
      <div className="app-layout">
        <Header />
        <main className="main-content">
          <Hero />
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
    </AuthProvider>
  );
}

export default App;

import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Footer } from './components/Footer';
import { AuthCard } from './components/Auth/AuthCard';
import './App.css';

function MainRouter() {
  const { currentPath } = useAuth();
  const isLoginPage = currentPath === '/login';

  return (
    <div className="app-layout">
      <Header />
      <main className="main-content">
        {isLoginPage ? (
          <div className="auth-page-container">
            <AuthCard />
          </div>
        ) : (
          <Hero />
        )}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}

export default App;

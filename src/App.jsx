import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './sections/Hero';
import About from './sections/About';
import FilmStrip from './sections/FilmStrip';
import Skills from './sections/Skills';
import TrustedApps from './sections/TrustedApps';
import Footer from './components/Footer';
import Testimonials from './sections/Testimonials';
import PersonalChronicles from './sections/PersonalChronicles';
import Background from './components/Background';
import Login from './pages/Login';
import { ConfigProvider } from './context/ConfigContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingScreen from './components/LoadingScreen';
import { AnimatePresence } from 'framer-motion';
import ScrollToTop from './components/ScrollToTop';
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const BlogCMS = React.lazy(() => import('./pages/admin/BlogCMS'));
const Blog = React.lazy(() => import('./pages/blog/Blog')); 
const BlogPost = React.lazy(() => import('./pages/blog/BlogPost'));
const Chronicles = React.lazy(() => import('./pages/Chronicles'));
const LinkShortener = React.lazy(() => import('./pages/LinkShortener'));
const ShortLinkRedirect = React.lazy(() => import('./pages/ShortLinkRedirect'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const QuizMaker = React.lazy(() => import('./pages/QuizMaker'));
const QuizPlayer = React.lazy(() => import('./pages/QuizPlayer'));
const Showcase = React.lazy(() => import('./pages/Showcase'));
const ProjectDetail = React.lazy(() => import('./pages/ProjectDetail'));

import PageGuard from './components/PageGuard';
import MobileBottomNav from './components/MobileBottomNav';
import { useAnalytics } from './hooks/useAnalytics';
import './styles/home-mobile.css';

const Home = () => (
  <>
    <Hero />
    <About />
    <FilmStrip />
    <Skills />
    <TrustedApps />
    <Testimonials />
    <MobileBottomNav />
  </>
);

function AppRoutes() {
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);
  const location = useLocation();
  const { trackEvent } = useAnalytics();

  React.useEffect(() => {
    trackEvent('PAGE_VIEW', {
      title: document.title || 'BCT Project'
    });
  }, [location.pathname, trackEvent]);

  React.useEffect(() => {
    if (location.hash && location.pathname === '/') {
      const id = location.hash.replace('#', '');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300); 
    }
  }, [location]);

  const isLoginPage = location.pathname === '/login';
  const isAdminPage = location.pathname.startsWith('/admin');
  const isBlogPage = location.pathname.startsWith('/blog');
  const isChroniclesPage = location.pathname === '/chronicles';
  const isShortenerPage = location.pathname === '/shortener';
  const isQuizMakerPage = location.pathname === '/quiz-maker';
  const isRedirectPage = location.pathname.length > 1 && !isLoginPage && !isAdminPage && !isBlogPage && !isChroniclesPage && !isShortenerPage && !isQuizMakerPage && !location.pathname.startsWith('/quiz/');

  const { isAdmin, currentUser } = useAuth();

  return (
    <>
      <AnimatePresence>
        {isInitialLoading && (
          <LoadingScreen onComplete={() => setIsInitialLoading(false)} />
        )}
      </AnimatePresence>

      <div style={{ position: 'relative' }}>
        <Background />
        {!isLoginPage && !isAdminPage && !isRedirectPage && <Navbar />}
        <React.Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/blog" element={
              <PageGuard pageId="blog">
                <Blog />
              </PageGuard>
            } />
            <Route path="/blog/:id" element={
              <PageGuard pageId="blog">
                <BlogPost />
              </PageGuard>
            } />
            <Route path="/chronicles" element={
              <PageGuard pageId="chronicles">
                <Chronicles />
              </PageGuard>
            } />
            <Route path="/showcase" element={
              <PageGuard pageId="showcase">
                <Showcase />
              </PageGuard>
            } />
            <Route path="/showcase/:id" element={
              <PageGuard pageId="showcase">
                <ProjectDetail />
              </PageGuard>
            } />

            <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Login />} />
            <Route path="/admin/cms/:id" element={isAdmin ? <BlogCMS /> : <Login />} />
            <Route path="/shortener" element={
              <PageGuard pageId="shortener">
                <LinkShortener />
              </PageGuard>
            } />
            <Route path="/quiz-maker" element={
              <PageGuard pageId="quiz">
                {(currentUser || isAdmin) ? <QuizMaker /> : <Login />}
              </PageGuard>
            } />
            <Route path="/quiz/:slug" element={
              <PageGuard pageId="quiz">
                <QuizPlayer />
              </PageGuard>
            } />
            <Route path="/:slug" element={<ShortLinkRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </React.Suspense>
        {!isLoginPage && !isAdminPage && !isRedirectPage && <Footer technicalFont={isShortenerPage} />}
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <ScrollToTop />
        <AppRoutes />
      </ConfigProvider>
    </AuthProvider>
  );
}

export default App;

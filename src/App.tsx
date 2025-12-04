import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { PricingSection } from './components/Pricing/PricingSection';
import { MergerTool } from './components/MergerTool';
import { UsageCard } from './components/UsageCard';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { Footer } from './components/Footer';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { HowItWorks } from './components/HowItWorks';
import { Blog } from './components/Blog';
import { BlogPost } from './components/BlogPost';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { Dashboard } from './components/Dashboard';
import { SubscriptionPage } from './components/SubscriptionPage';
import { ForgotPassword } from './components/ForgotPassword';
import { ResetPassword } from './components/ResetPassword';
import { FAQ } from './components/FAQ';
import { useAuth } from './contexts/AuthContext';
import { blogPosts } from './data/blogPosts';

function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle legacy query params redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const postIdParam = params.get('postId');

    if (viewParam) {
      // Clear query params to prevent infinite loops if logic fails, 
      // but we are navigating so it should be fine.
      switch (viewParam) {
        case 'blog-post':
          if (postIdParam) navigate(`/blog/${postIdParam}`, { replace: true });
          else navigate('/blog', { replace: true });
          break;
        case 'blog':
          navigate('/blog', { replace: true });
          break;
        case 'privacy':
          navigate('/privacy', { replace: true });
          break;
        case 'how-it-works':
          navigate('/how-it-works', { replace: true });
          break;
        case 'login':
          navigate('/login', { replace: true });
          break;
        case 'signup':
          navigate('/signup', { replace: true });
          break;
        case 'dashboard':
          navigate('/dashboard', { replace: true });
          break;
        case 'subscription':
          navigate('/subscription', { replace: true });
          break;
        case 'forgot-password':
          navigate('/forgot-password', { replace: true });
          break;
        case 'reset-password':
          navigate('/reset-password', { replace: true });
          break;
        default:
          navigate('/', { replace: true });
      }
    }
  }, []);

  // Auto-redirect after login
  useEffect(() => {
    if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/signup')) {
      const params = new URLSearchParams(window.location.search);
      const redirectTarget = params.get('redirect');

      if (redirectTarget === 'pricing' && location.pathname === '/signup') {
        // We want to go to DASHBOARD view, but keep auto params
        // In React Router, we pass state or keep query params
        // For now, let's keep query params as they are read by Dashboard
        navigate(`/dashboard?trigger_subscription=true&${params.toString()}`, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
    // Redirect to login if trying to access dashboard while logged out
    if (!authLoading && !isAuthenticated && (location.pathname === '/dashboard' || location.pathname === '/subscription')) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, authLoading, location.pathname, navigate]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const hideNavbar = ['/dashboard', '/subscription', '/login', '/signup', '/forgot-password', '/reset-password'].includes(location.pathname);

  return (
    <div className="min-h-screen w-full bg-zinc-50 font-sans text-zinc-900 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      {!hideNavbar && <Navbar onNavigate={(page) => navigate(page === 'home' ? '/' : `/${page}`)} />}

      <Routes>
        <Route path="/" element={
          <main>
            <Hero />
            <MergerTool />
            <section className="py-8 px-4 sm:px-6 lg:px-8">
              <div className="max-w-5xl mx-auto">
                <UsageCard />
              </div>
            </section>
            <Features />
            <PricingSection />
            <FAQ />
          </main>
        } />

        <Route path="/login" element={<Login onSwitchToSignup={() => navigate('/signup')} onBackToHome={() => navigate('/')} />} />
        <Route path="/signup" element={<Signup onSwitchToLogin={() => navigate('/login')} onBackToHome={() => navigate('/')} />} />

        <Route path="/dashboard" element={
          isAuthenticated ? <Dashboard /> : <Navigate to="/" replace />
        } />

        <Route path="/subscription" element={
          isAuthenticated ? <SubscriptionPage /> : <Navigate to="/" replace />
        } />

        <Route path="/privacy" element={<PrivacyPolicy onBack={() => navigate('/')} />} />

        <Route path="/how-it-works" element={
          <HowItWorks
            onBack={() => navigate('/')}
            onStartMerging={() => {
              navigate('/');
              setTimeout(() => {
                const toolElement = document.getElementById('merger-tool');
                toolElement?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
          />
        } />

        <Route path="/blog" element={<Blog onBack={() => navigate('/')} onReadPost={(id) => navigate(`/blog/${id}`)} />} />

        <Route path="/blog/:id" element={<BlogPostWrapper />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!hideNavbar && <Footer onOpenPrivacy={() => navigate('/privacy')} />}
    </div>
  );
}

// Wrapper to handle params for BlogPost
function BlogPostWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  // We need to extract the ID from the URL path
  const pathParts = location.pathname.split('/');
  const id = pathParts[pathParts.length - 1];

  const post = blogPosts.find(p => p.id === id);

  if (post) {
    return <BlogPost post={post} onBack={() => navigate('/blog')} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
        <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/blog')}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          Back to Blog
        </button>
      </div>
    </div>
  );
}

function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
      <Analytics />
      <SpeedInsights />
    </ErrorBoundary>
  );
}

export default AppWrapper;

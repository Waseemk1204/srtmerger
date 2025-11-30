import { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { PricingSection } from './components/Pricing/PricingSection';
import { MergerTool } from './components/MergerTool';
import { UsageCard } from './components/UsageCard';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Footer } from './components/Footer';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { HowItWorks } from './components/HowItWorks';
import { Blog } from './components/Blog';
import { BlogPost } from './components/BlogPost';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { Dashboard } from './components/Dashboard';
import { SubscriptionPage } from './components/SubscriptionPage';
import { FAQ } from './components/FAQ';
import { useAuth } from './contexts/AuthContext';
import { blogPosts } from './data/blogPosts';

type View = 'home' | 'privacy' | 'how-it-works' | 'blog' | 'blog-post' | 'login' | 'signup' | 'dashboard' | 'subscription';

function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [view, setView] = useState<View>('home');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Initialize state from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view') as typeof view;
    const postIdParam = params.get('postId');

    if (viewParam && ['home', 'privacy', 'how-it-works', 'blog', 'blog-post', 'login', 'signup', 'dashboard', 'subscription'].includes(viewParam)) {
      setView(viewParam);
      if (viewParam === 'blog-post' && postIdParam) {
        setSelectedPostId(postIdParam);
      }
    }
  }, []);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = (params.get('view') as typeof view) || 'home';
      const postIdParam = params.get('postId');

      setView(viewParam);
      setSelectedPostId(postIdParam);
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle BFCache restoration
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        const params = new URLSearchParams(window.location.search);
        const viewParam = (params.get('view') as typeof view) || 'home';
        setView(viewParam);
      }
    };

    window.addEventListener('pageshow', handlePageShow as any);
    return () => window.removeEventListener('pageshow', handlePageShow as any);
  }, []);

  // Navigate function that updates URL
  const navigate = (newView: View, postId?: string) => {
    const params = new URLSearchParams();
    if (newView !== 'home') {
      params.set('view', newView);
    }
    if (postId) {
      params.set('postId', postId);
    }

    const newUrl = params.toString() ? `?${params.toString()}` : '/';

    if (window.location.search !== (params.toString() ? `?${params.toString()}` : '')) {
      window.history.pushState({}, '', newUrl);
    }

    setView(newView);
    setSelectedPostId(postId || null);
    window.scrollTo(0, 0);
  };

  // Auto-redirect to dashboard when user logs in
  useEffect(() => {
    if (isAuthenticated && (view === 'login' || view === 'signup')) {
      navigate('dashboard');
    }
    // Redirect to login if trying to access dashboard while logged out
    if (!authLoading && !isAuthenticated && view === 'dashboard') {
      navigate('home');
    }
  }, [isAuthenticated, authLoading, view]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderContent = () => {
    // Auth views (public)
    if (view === 'login') {
      return <Login onSwitchToSignup={() => navigate('signup')} onBackToHome={() => navigate('home')} />;
    }

    if (view === 'signup') {
      return <Signup onSwitchToLogin={() => navigate('login')} onBackToHome={() => navigate('home')} />;
    }

    // Dashboard (authenticated users only)
    if (view === 'dashboard' && isAuthenticated) {
      return <Dashboard />;
    }

    // Subscription Page (authenticated users only)
    if (view === 'subscription' && isAuthenticated) {
      return <SubscriptionPage onBack={() => navigate('dashboard')} />;
    }

    if (view === 'privacy') {
      return <PrivacyPolicy onBack={() => navigate('home')} />;
    }

    if (view === 'how-it-works') {
      return (
        <HowItWorks
          onBack={() => navigate('home')}
          onStartMerging={() => {
            navigate('home');
            // Wait for render then scroll
            setTimeout(() => {
              const toolElement = document.getElementById('merger-tool');
              toolElement?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
        />
      );
    }

    if (view === 'blog') {
      return (
        <Blog
          onBack={() => navigate('home')}
          onReadPost={(id) => navigate('blog-post', id)}
        />
      );
    }

    if (view === 'blog-post' && selectedPostId) {
      const post = blogPosts.find(p => p.id === selectedPostId);
      if (post) {
        return (
          <BlogPost
            post={post}
            onBack={() => navigate('blog')}
          />
        );
      }
      // Post not found - redirect to blog list
      return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
            <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('blog')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Back to Blog
            </button>
          </div>
        </div>
      );
    }

    // Home View
    return (
      <main>
        <Hero onNavigate={(page) => setView(page)} />

        {/* Merger Tool Section */}
        <MergerTool />

        {/* Usage Card Section */}
        <section className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <UsageCard />
          </div>
        </section>

        <PricingSection />

        {/* FAQ Section */}
        <FAQ />

      </main >
    );
  };

  const hideNavbar = view === 'login' || view === 'signup';

  return (
    <div className="min-h-screen w-full bg-zinc-50 font-sans text-zinc-900 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
      {!hideNavbar && <Navbar onNavigate={(page) => navigate(page as View)} />}

      {renderContent()}

      {!hideNavbar && <Footer onOpenPrivacy={() => navigate('privacy')} />}


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

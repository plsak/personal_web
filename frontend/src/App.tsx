import React, { useEffect, useRef, useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useIsCallerAdmin, useIncrementVisitCount, useGetHeadingConfig } from './hooks/useQueries';
import LoginButton from './components/LoginButton';
import AdminManagement from './components/AdminManagement';
import BlogSection from './components/BlogSection';
import CaffeineInfoSection from './components/CaffeineInfoSection';
import LinksSection from './components/LinksSection';
import HeadingEditor from './components/HeadingEditor';
import { Heart, AlertTriangle, Copy, Check } from 'lucide-react';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: isAdmin = false, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: headingConfig, isLoading: headingLoading } = useGetHeadingConfig();
  const incrementVisitCount = useIncrementVisitCount();
  const hasIncrementedRef = useRef(false);

  const [showCopiedFeedback, setShowCopiedFeedback] = useState(false);

  const isAuthenticated = !!identity;

  // Increment visit count on app load - ensure it happens only once per session
  useEffect(() => {
    // Use a more reliable method to track visits
    const sessionKey = 'visit_tracked_' + Date.now();
    const hasVisitedThisSession = sessionStorage.getItem('visit_tracked');
    
    if (!hasVisitedThisSession && !hasIncrementedRef.current) {
      hasIncrementedRef.current = true;
      sessionStorage.setItem('visit_tracked', sessionKey);
      
      // Add a small delay to ensure the actor is ready
      const timer = setTimeout(() => {
        incrementVisitCount.mutate();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [incrementVisitCount]);

  // Also increment on page visibility change (when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const lastVisit = localStorage.getItem('last_visit_time');
        const currentTime = Date.now();
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        // If it's been more than 5 minutes since last visit, count as new visit
        if (!lastVisit || (currentTime - parseInt(lastVisit)) > fiveMinutes) {
          localStorage.setItem('last_visit_time', currentTime.toString());
          incrementVisitCount.mutate();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [incrementVisitCount]);

  // Helper function to format principal
  const formatPrincipal = (principal: string) => {
    if (principal.length <= 8) return principal;
    return `${principal.slice(0, 4)}...${principal.slice(-4)}`;
  };

  // Helper function to copy principal to clipboard with feedback
  const copyPrincipal = async () => {
    if (identity) {
      try {
        await navigator.clipboard.writeText(identity.getPrincipal().toString());
        setShowCopiedFeedback(true);
        setTimeout(() => setShowCopiedFeedback(false), 2000);
      } catch (err) {
        console.error('Failed to copy principal:', err);
      }
    }
  };

  // Get heading configuration with defaults
  const getHeadingText = () => {
    return headingConfig?.text || "plsak with caffeine.ai";
  };

  const getHeadingFont = () => {
    return headingConfig?.font || "cursive";
  };

  const getHeadingColor = () => {
    return headingConfig?.color || "#f1f5f9"; // slate-100
  };

  const getHeadingFontClass = () => {
    const font = getHeadingFont();
    switch (font) {
      case 'cursive': return 'cursive-font';
      case 'serif': return 'serif-font';
      case 'sans-serif': return 'sans-serif-font';
      case 'monospace': return 'monospace-font';
      case 'fantasy': return 'fantasy-font';
      default: return 'cursive-font';
    }
  };

  if (isInitializing || (isAuthenticated && adminLoading)) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex-1 flex justify-center">
              <div className="text-center">
                <div className="relative group">
                  <h1 
                    className={`text-4xl font-bold ${getHeadingFontClass()}`}
                    style={{ color: getHeadingColor() }}
                  >
                    {getHeadingText()}
                  </h1>
                  {isAdmin && (
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <HeadingEditor />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-3">
                {isAdmin && <AdminManagement />}
                <LoginButton />
              </div>
              {isAuthenticated && (
                <div className="flex items-center gap-2">
                  <div className="text-xs text-slate-400">
                    {formatPrincipal(identity.getPrincipal().toString())}
                  </div>
                  <div className="relative">
                    <button
                      onClick={copyPrincipal}
                      className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                      title="Copy full principal ID"
                    >
                      {showCopiedFeedback ? (
                        <Check className="w-3 h-3 text-slate-300" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    {showCopiedFeedback && (
                      <div className="absolute -top-8 right-0 bg-slate-600 text-slate-200 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                        Copied!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Access Denied Banner for authenticated non-admin users */}
      {isAuthenticated && !isAdmin && (
        <div className="bg-red-900 border-b border-red-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-red-200 text-sm">
                <strong>Access Denied:</strong> You are viewing in read-only mode. Admin privileges required for content management.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Caffeine Info (Top) and Links (Bottom) */}
          <div className="lg:col-span-2 space-y-8">
            <CaffeineInfoSection isAdmin={isAdmin} />
            <LinksSection isAdmin={isAdmin} />
          </div>

          {/* Right Column - Blog */}
          <div className="lg:col-span-1">
            <BlogSection isAdmin={isAdmin} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-slate-400">
            © 2025. Built with <Heart className="inline w-4 h-4 text-red-500" /> using{' '}
            <a 
              href="https://caffeine.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

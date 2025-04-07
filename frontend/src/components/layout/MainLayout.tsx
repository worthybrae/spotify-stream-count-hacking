// components/layout/MainLayout.tsx
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import BackgroundManager from './BackgroundManager';
import { useState, useEffect } from 'react';
import { SearchResult } from '@/types/search';
import AuthStatus from '@/components/features/auth/AuthStatus';
import { useAuth } from '@/contexts/AuthContext';

const MainLayout = () => {
  const [selectedAlbum, setSelectedAlbum] = useState<SearchResult | null>(null);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Redirect unauthenticated users from dashboard to home
  useEffect(() => {
    if (location.pathname === '/dashboard' && !user) {
      navigate('/');
    }
  }, [location.pathname, user, navigate]);

  // Listen for album selection through a custom event
  useEffect(() => {
    const handleAlbumSelected = (event: CustomEvent<{album: SearchResult | null}>) => {
      console.log("Album selected event received:", event.detail);
      setSelectedAlbum(event.detail.album);
    };

    window.addEventListener('albumSelected' as any, handleAlbumSelected as EventListener);

    return () => {
      window.removeEventListener('albumSelected' as any, handleAlbumSelected as EventListener);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 w-full backdrop-blur-sm z-50 bg-black/0">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <Link to="/" className="text-lg font-medium text-white">streamclout.io</Link>
            
            <div className="flex items-center gap-6">
              {/* Navigation Links */}
              <nav className="flex gap-6">
                {user && (
                  <Link 
                    to="/dashboard" 
                    className={`text-sm flex items-center gap-1 hover:text-white transition-colors ${
                      location.pathname === '/dashboard' ? 'text-white' : 'text-white/70'
                    }`}
                  >
                    <span>dashboard</span>
                  </Link>
                )}
                <Link 
                  to="/about" 
                  className={`text-sm hover:text-white transition-colors ${
                    location.pathname === '/about' ? 'text-white' : 'text-white/70'
                  }`}
                >
                  about
                </Link>
              </nav>
              {/* Auth Status Component */}
              <AuthStatus />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-grow flex items-center pt-14 pb-10">
        <div className="container mx-auto px-4 py-1">
          <Outlet />
        </div>
      </div>

      {/* Background Manager */}
      <BackgroundManager selectedAlbum={selectedAlbum} />
      
      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 w-full z-50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-center py-2">
            <span className="text-xs">
              <a 
                href="https://worthyrae.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline text-white/60"
              >
                built by worthy
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
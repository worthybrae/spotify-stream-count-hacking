// components/layout/MainLayout.tsx
import { Outlet, Link, useLocation } from 'react-router-dom';
import BackgroundManager from './BackgroundManager';
import { useState, useEffect } from 'react';
import { SearchResult } from '@/types/search';

// Define the custom event type
interface AlbumSelectedEvent extends CustomEvent {
  detail: {
    album: SearchResult | null;
  };
}

const MainLayout = () => {
  const [selectedAlbum, setSelectedAlbum] = useState<SearchResult | null>(null);
  const location = useLocation();

  // Listen for album selection through a custom event
  useEffect(() => {
    const handleAlbumSelected = (event: AlbumSelectedEvent) => {
      console.log("Album selected event received:", event.detail);
      setSelectedAlbum(event.detail.album);
    };

    window.addEventListener('albumSelected', handleAlbumSelected as EventListener);

    return () => {
      window.removeEventListener('albumSelected', handleAlbumSelected as EventListener);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 w-full backdrop-blur-sm z-50 bg-black/0">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="text-lg font-medium text-white">streamclout.io</Link>
              <div className="flex items-center gap-2 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <span className="text-orange-300 text-xs font-medium">ALPHA</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Navigation Links */}
              <nav className="flex gap-6">
                <Link
                  to="/about"
                  className={`text-sm hover:text-white transition-colors ${
                    location.pathname === '/about' ? 'text-white' : 'text-white/70'
                  }`}
                >
                  about
                </Link>
              </nav>
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
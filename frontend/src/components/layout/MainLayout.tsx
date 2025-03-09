// MainLayout.tsx
import { Outlet, Link } from 'react-router-dom';
import BackgroundManager from './BackgroundManager';
import { useState, useEffect } from 'react';
import { SearchResult } from '@/types/search';

const MainLayout = () => {
  const [selectedAlbum, setSelectedAlbum] = useState<SearchResult | null>(null);

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
            <nav className="flex gap-6">
              <Link to="/api" className="text-sm text-white/70 hover:text-white transition-colors">api</Link>
              <Link to="/docs" className="text-sm text-white/70 hover:text-white transition-colors">docs</Link>
              <Link to="/about" className="text-sm text-white/70 hover:text-white transition-colors">about</Link>
            </nav>
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
          <div className="flex justify-center py-2 font-bold">
            <span className="text-xs">
              <a 
                href="https://worthyrae.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline text-white/60"
              >
                by worthy
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
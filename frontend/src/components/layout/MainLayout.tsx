import { Outlet, Link } from 'react-router-dom';
import EnhancedBackground from './EnhancedBackground';

const MainLayout = () => {
  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="fixed top-0 w-full border-b border-white/5 bg-black/50 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <Link to="/" className="text-lg font-medium text-white">StreamClout</Link>
            <nav className="flex gap-6">
              <Link to="/about" className="text-sm text-white/60 hover:text-white transition-colors">About</Link>
              <Link to="/api" className="text-sm text-white/60 hover:text-white transition-colors">API</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content - Outlet renders the child route components */}
      <Outlet />

      {/* Enhanced Background */}
      <EnhancedBackground />
    </div>
  );
};

export default MainLayout;
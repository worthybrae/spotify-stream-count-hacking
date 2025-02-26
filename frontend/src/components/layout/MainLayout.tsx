import { Outlet, Link } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-black text-white">
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

      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <svg className="absolute w-full h-full opacity-10" viewBox="0 0 1000 1000">
          <path
            d="M0,500 Q250,400 500,500 T1000,500"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="1"
            className="animate-flow"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

export default MainLayout;
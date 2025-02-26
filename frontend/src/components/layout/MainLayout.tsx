import { Outlet, Link } from 'react-router-dom';
import EnhancedBackground from './EnhancedBackground';

const MainLayout = () => {
  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="fixed top-0 w-full  backdrop-blur-sm z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <Link to="/" className="text-lg font-medium text-white">streamclout</Link>
            <nav className="flex gap-6">
              <Link to="/about" className="text-sm text-white/60 hover:text-white transition-colors">about</Link>
              <Link to="/api" className="text-sm text-white/60 hover:text-white transition-colors">api</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content - Outlet renders the child route components */}
      <Outlet />

      {/* Enhanced Background */}
      <EnhancedBackground />
      <footer className="fixed bottom-0 w-full bg-background/5 backdrop-blur supports-[backdrop-filter]:bg-background/5">
        <div className="container flex justify-center py-2 ">
            <span className="text-xs text-muted-foreground">
            
            <a 
                href="https://worthyrae.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline text-white"
            >
                built by worthy
            </a>
            </span>
        </div>
        </footer>
    </div>
  );
};

export default MainLayout;
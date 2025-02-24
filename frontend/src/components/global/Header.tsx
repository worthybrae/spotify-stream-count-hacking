import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

export function Header() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <nav className="container flex h-16 items-center justify-between">
        {/* Logo & Primary Nav */}
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              StreamClout
            </span>
          </a>
          
          <div className="hidden md:flex items-center gap-1">
            <Button variant="ghost" className="text-sm text-white/70 hover:text-white">
              Platform
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
            <Button variant="ghost" className="text-sm text-white/70 hover:text-white">
              Analytics
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
            <Button variant="ghost" className="text-sm text-white/70 hover:text-white">
              Resources
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>

        
      </nav>
    </header>
  );
}
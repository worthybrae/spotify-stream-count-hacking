// components/features/ViewSwitcher.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { User, Search } from 'lucide-react';

interface ViewSwitcherProps {
  activeView: 'user' | 'search';
  onViewChange: (view: 'user' | 'search') => void;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  activeView,
  onViewChange
}) => {
  return (
    <div className="mb-4 flex items-center justify-center">
      <div className="inline-flex p-1 rounded-lg bg-black/30 border border-white/10">
        <Button
          variant={activeView === 'user' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('user')}
          className={`rounded-md flex items-center gap-2 px-3 ${
            activeView === 'user' ? 'bg-white/20' : 'bg-transparent text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <User className="h-4 w-4" />
          <span>My Stats</span>
        </Button>
        
        <Button
          variant={activeView === 'search' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('search')}
          className={`rounded-md flex items-center gap-2 px-3 ${
            activeView === 'search' ? 'bg-white/20' : 'bg-transparent text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <Search className="h-4 w-4" />
          <span>Album Search</span>
        </Button>
      </div>
    </div>
  );
};

export default ViewSwitcher;
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';

interface SearchInputProps {
  searchValue: string;
  loading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({ 
  searchValue, 
  loading, 
  onChange 
}) => {
  return (
    <div className="relative">
      <Input
        type="text"
        value={searchValue}
        onChange={onChange}
        className="w-full h-12 pl-12 pr-4 text-lg bg-white/5 border-white/10 rounded-xl 
                 placeholder:text-white/40 text-white transition-all duration-300
                 focus:bg-white/10 focus:border-white/20 focus:ring-2 focus:ring-white/10"
        placeholder="Search any Spotify album..."
      />
      <div className="absolute left-4 top-3.5">
        {loading ? (
          <Loader2 className="h-5 w-5 text-white/40 animate-spin" />
        ) : (
          <Search className="h-5 w-5 text-white/40" />
        )}
      </div>
    </div>
  );
};
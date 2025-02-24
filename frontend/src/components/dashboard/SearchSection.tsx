import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { SearchResult } from '@/types/search';
import { Search, Loader2, TrendingUp, BarChart3, Database, Clock } from 'lucide-react';
import { searchAlbums } from '@/lib/api';

interface SearchSectionProps {
  onAlbumSelect: (result: SearchResult) => void;
  selectedAlbum: SearchResult | null;
  onSearchStateChange: (state: boolean) => void;
}

export const featuresData = [
  {
    icon: <TrendingUp className="h-5 w-5 text-blue-400" />,
    title: "Revenue Tracking",
    description: "Real-time Spotify revenue analytics"
  },
  {
    icon: <BarChart3 className="h-5 w-5 text-purple-400" />,
    title: "Daily Updates",
    description: "Fresh streaming data every 24 hours"
  },
  {
    icon: <Database className="h-5 w-5 text-pink-400" />,
    title: "Direct Integration",
    description: "Connected to Spotify's platform"
  },
  {
    icon: <Clock className="h-5 w-5 text-green-400" />,
    title: "Historical Data",
    description: "Complete streaming history"
  }
] as const;

const formatReleaseDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Release date unavailable';
    
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) 
        ? 'Release date unavailable' 
        : date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          });
    } catch {
      return 'Release date unavailable';
    }
  };

export function SearchSection({ 
  onAlbumSelect, 
  selectedAlbum,
  onSearchStateChange
}: SearchSectionProps) {
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let searchTimer: NodeJS.Timeout;

    const performSearch = async () => {
      setLoading(true);
      try {
        const data = await searchAlbums(searchValue);
        setResults(data);
        onSearchStateChange(data.length > 0);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
        onSearchStateChange(false);
      } finally {
        setLoading(false);
      }
    };

    if (searchValue.trim()) {
      searchTimer = setTimeout(performSearch, 150);
    } else {
      setResults([]);
      onSearchStateChange(false);
      setLoading(false);
    }

    return () => {
      if (searchTimer) {
        clearTimeout(searchTimer);
      }
    };
  }, [searchValue, onSearchStateChange]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Input
          type="text"
          value={searchValue}
          onChange={handleSearchChange}
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

      <div className="relative min-h-[300px]">
        {/* Features Grid - Only show when no search and no selected album */}
        <div className={`
          grid grid-cols-2 gap-3 absolute w-full
          transition-all duration-500 transform
          ${searchValue.trim() || selectedAlbum ? 'opacity-0 scale-95 -translate-y-4 pointer-events-none' : 'opacity-100 scale-100'}
        `}>
          {featuresData.map((feature, index) => (
            <Card 
              key={index}
              className="bg-white/5 hover:bg-white/10 border-white/5 p-4 
                       transition-all duration-300 transform hover:scale-102"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/5">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-medium text-sm text-white">{feature.title}</h3>
                  <p className="text-xs text-white/60">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Search Results or No Results Message */}
        <div className={`
          absolute w-full space-y-2
          transition-all duration-500 transform
          ${searchValue.trim() && !loading ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}
        `}>
          {searchValue.trim() && results.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              No results found
            </div>
          ) : (
            results.map((result) => (
              <Card
                key={result.album_id}
                className="bg-white/5 hover:bg-white/10 border-white/5 cursor-pointer 
                         transition-all duration-300 transform hover:scale-102"
                onClick={() => {
                  onAlbumSelect(result);
                  setSearchValue('');
                  setResults([]);
                  // Don't set search state to false since we want to show tracks
                  onSearchStateChange(true);
                }}
              >
                <div className="p-3 flex items-center gap-4">
                  <img
                    src={result.cover_art}
                    alt={result.album_name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-white">
                      {result.album_name}
                    </h3>
                    <p className="text-sm text-white/60">
                      {result.artist_name}
                    </p>
                    <p className="text-xs text-white/40">
                      {formatReleaseDate(result.release_date)}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .scale-102 {
          scale: 1.02;
        }
      `}</style>
    </div>
  );
}
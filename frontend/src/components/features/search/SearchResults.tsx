import React from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { SearchResult } from '@/types/search';
import { formatDate } from '@/lib/utils/formatters';

interface SearchResultsProps {
  isVisible: boolean;
  results: SearchResult[];
  searchStatus: string;
  onResultClick: (result: SearchResult) => void;
  savingData?: boolean;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ 
    isVisible, 
    results, 
    searchStatus, 
    onResultClick,
    savingData = false
  }) => {
    return (
      <div className={`
        absolute w-full space-y-2
        transition-all duration-500 transform
        ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}
        max-h-[50vh] overflow-auto pb-8 mb-8
      `}>
        {/* Add saving data indicator */}
        {savingData && (
          <Card className="bg-blue-500/20 border-blue-400/30 p-3">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
              <span className="text-blue-300">Saving album data...</span>
            </div>
          </Card>
        )}
        
        {results.length === 0 ? (
        <div className="text-center py-8 text-white/60">
          {searchStatus === 'too-short' && (
            "Type at least 3 characters to search"
          )}
          {searchStatus === 'searching' && (
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 text-white/40 animate-spin" />
              <span>Searching...</span>
            </div>
          )}
          {searchStatus === 'no-results' && (
            "No results found in database or Spotify"
          )}
        </div>
      ) : (
        results.map((result) => (
          <Card
            key={result.album_id}
            className="bg-white/5 hover:bg-white/10 border-white/5 cursor-pointer 
                     transition-all duration-300 transform hover:scale-102"
            onClick={() => onResultClick(result)}
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
                  {formatDate(result.release_date)}
                </p>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};
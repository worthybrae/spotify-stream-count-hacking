import React from 'react';
import { Card } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import { SearchResult } from '@/types/search';
import { formatDate } from '@/lib/utils/formatters';

interface SearchResultsProps {
  isVisible: boolean;
  results: SearchResult[];
  searchStatus: string;
  onResultClick: (result: SearchResult) => void;
  onSearchSpotify?: (query: string) => void; // Only present for regular search, not Spotify search
  searchValue?: string;
  savingData?: boolean;
  renderTrendingTracks?: React.ReactNode;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
    isVisible,
    results,
    searchStatus,
    onResultClick,
    onSearchSpotify,
    searchValue = "",
    savingData = false,
    renderTrendingTracks
  }) => {
    if (!isVisible) return null;

    // Function to handle direct Spotify search
    const handleSearchSpotify = () => {
      if (onSearchSpotify && searchValue.trim()) {
        onSearchSpotify(searchValue.trim());
      }
    };

    // Determine if this is a regular search (has onSearchSpotify) or already a Spotify search (no onSearchSpotify)
    const isRegularSearch = Boolean(onSearchSpotify);

    return (
      <div className="w-full space-y-2 max-h-[calc(100vh-16rem)] overflow-auto">
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
              renderTrendingTracks || null
            )}
            {searchStatus === 'searching' && (
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="h-5 w-5 text-white/40 animate-spin" />
                <span>Searching...</span>
              </div>
            )}
            {searchStatus === 'no-results' && !isRegularSearch && (
              "No results found on Spotify"
            )}
            {searchStatus === 'no-results' && isRegularSearch && (
              "No results found in database"
            )}
          </div>
        ) : (
          <>
            {/* Regular search results */}
            {results.map((result) => (
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
            ))}

            {/* "Don't see the album?" card - only show for regular search, not Spotify search */}
            {searchValue && onSearchSpotify && isRegularSearch && (
              <Card
                className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30
                         border-purple-500/30 cursor-pointer transition-all duration-300 transform hover:scale-102"
                onClick={handleSearchSpotify}
              >
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/10">
                      <Search className="h-4 w-4 text-purple-300" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">Don't see the album?</h3>
                      <p className="text-sm text-white/60">
                        Try an expanded search
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    );
};
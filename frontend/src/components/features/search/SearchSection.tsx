import React, { useState, useEffect } from 'react';
import { SearchInput } from './SearchInput';
import { FeaturesGrid } from './FeaturesGrid';
import { SearchResults } from './SearchResults';
import { SearchStyles } from './SearchStyles';
import { SearchResult } from '@/types/search';
import useSearch from '@/hooks/useSearch';
import { searchAlbums } from '@/lib/api';

interface SearchSectionProps {
  onAlbumSelect: (result: SearchResult) => void;
  selectedAlbum: SearchResult | null;
}

const SearchSection: React.FC<SearchSectionProps> = ({ 
  onAlbumSelect, 
  selectedAlbum
}) => {
  const {
    searchValue,
    results,
    loading,
    searchStatus,
    handleSearchChange,
    clearSearch
  } = useSearch(3); // minimum 3 characters to trigger search
  
  // State for direct Spotify search
  const [spotifySearching, setSpotifySearching] = useState(false);
  const [spotifyResults, setSpotifyResults] = useState<SearchResult[]>([]);
  const [isSpotifySearch, setIsSpotifySearch] = useState(false);
  const [spotifyQuery, setSpotifyQuery] = useState('');
  
  // Reset Spotify search state when the search value changes
  useEffect(() => {
    // If the user modifies the search query, reset Spotify search state
    if (isSpotifySearch && searchValue !== spotifyQuery) {
      setIsSpotifySearch(false);
      setSpotifyResults([]);
    }
  }, [searchValue, isSpotifySearch, spotifyQuery]);
  
  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    // Pass the selected album up to the parent component
    onAlbumSelect(result);
    
    // Clear search state
    clearSearch();
    setSpotifyResults([]);
    setIsSpotifySearch(false);
    setSpotifyQuery('');
  };

  // Create a custom search input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // If we're in Spotify search mode and user changes input, reset to regular search
    if (isSpotifySearch) {
      setIsSpotifySearch(false);
      setSpotifyResults([]);
    }
    
    // Pass the event to the original handler
    handleSearchChange(e);
  };

  // Function to search Spotify directly
  const handleSearchSpotify = async (query: string) => {
    if (!query.trim() || spotifySearching) return;
    
    setSpotifySearching(true);
    setIsSpotifySearch(true);
    setSpotifyQuery(query); // Store the query used for Spotify search
    
    try {
      // Using the force_spotify parameter to bypass cache and search Spotify directly
      const results = await searchAlbums(query, 20, true);
      
      if (results && results.length > 0) {
        // Store the Spotify results in state to display them
        setSpotifyResults(results);
      } else {
        setSpotifyResults([]);
      }
    } catch (error) {
      console.error('Error searching Spotify directly:', error);
      setSpotifyResults([]);
    } finally {
      setSpotifySearching(false);
    }
  };

  const showFeaturesGrid = !searchValue.trim() && !selectedAlbum;
  const showSearchResults = Boolean(searchValue.trim());
  
  // Determine which results to show
  const displayResults = isSpotifySearch ? spotifyResults : results;
  const currentSearchStatus = isSpotifySearch ? 
    (spotifySearching ? 'searching' : (spotifyResults.length === 0 ? 'no-results' : 'idle')) 
    : searchStatus;

  return (
    <div className="w-full space-y-4">
      {/* Search input */}
      <div className="w-full">
        <SearchInput 
          searchValue={searchValue}
          loading={loading || spotifySearching}
          onChange={handleInputChange} // Use our custom handler
        />
      </div>
      
      {/* Feature grid or search results */}
      {showFeaturesGrid && (
        <FeaturesGrid isVisible={true} />
      )}
      
      {showSearchResults && (
        <SearchResults
          isVisible={true}
          results={displayResults}
          searchStatus={currentSearchStatus}
          onResultClick={handleResultSelect}
          onSearchSpotify={!isSpotifySearch ? handleSearchSpotify : undefined}
          searchValue={searchValue}
        />
      )}
      
      <SearchStyles />
    </div>
  );
};

export default SearchSection;
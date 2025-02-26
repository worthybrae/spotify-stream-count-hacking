// components/dashboard/SearchSection.tsx
import { useState, useEffect } from 'react';
import { SearchInput } from './SearchInput';
import { FeaturesGrid } from './FeaturesGrid';
import { SearchResults } from './SearchResults';
import { SearchStyles } from './SearchStyles';
import { SearchResult } from '@/types/search';
import { searchAlbums } from '@/lib/api';

interface SearchSectionProps {
  onAlbumSelect: (result: SearchResult) => void;
  selectedAlbum: SearchResult | null;
  onSearchStateChange: (state: boolean) => void;
}

export function SearchSection({ 
  onAlbumSelect, 
  selectedAlbum,
  onSearchStateChange
}: SearchSectionProps) {
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');
  const [lastSearched, setLastSearched] = useState('');
  
  // Search functionality
  useEffect(() => {
    let searchTimer: ReturnType<typeof setTimeout>;

    const performSearch = async () => {
      if (searchValue.trim() === lastSearched) return;
      
      if (searchValue.trim().length < 3) {
        setResults([]);
        onSearchStateChange(false);
        setLastSearched(searchValue.trim());
        setLoading(false);
        setSearchStatus('too-short');
        return;
      }
      
      setLoading(true);
      setLastSearched(searchValue.trim());
      setSearchStatus('searching');
      
      try {
        // Search albums using the unified endpoint that searches both DB and Spotify
        const searchResults = await searchAlbums(searchValue);
        
        if (searchResults.length > 0) {
          setResults(searchResults);
          onSearchStateChange(true);
          setSearchStatus('idle');
        } else {
          setSearchStatus('no-results');
        }
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
        onSearchStateChange(false);
        setSearchStatus('no-results');
      } finally {
        setLoading(false);
      }
    };

    if (searchValue.trim()) {
      searchTimer = setTimeout(performSearch, 800);
    } else {
      setResults([]);
      onSearchStateChange(false);
      setLoading(false);
      setLastSearched('');
      setSearchStatus('idle');
    }

    return () => {
      if (searchTimer) clearTimeout(searchTimer);
    };
  }, [searchValue, onSearchStateChange, lastSearched]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    if (!value.trim()) {
      setResults([]);
      setLastSearched('');
      setSearchStatus('idle');
    } else if (value.trim().length < 3) {
      setSearchStatus('too-short');
    }
  };

  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    // Pass the selected album up to the parent component
    onAlbumSelect(result);
    
    // Clear search state
    setSearchValue('');
    setResults([]);
  };

  const showFeaturesGrid = !searchValue.trim() && !selectedAlbum;
  const showSearchResults = Boolean(searchValue.trim() && !loading);

  return (
    <div className="space-y-6">
      <SearchInput 
        searchValue={searchValue}
        loading={loading}
        onChange={handleSearchChange}
      />

      <div className="relative min-h-[300px]">
        <FeaturesGrid isVisible={showFeaturesGrid} />
        
        <SearchResults
          isVisible={showSearchResults}
          results={results}
          searchStatus={searchStatus}
          searchSource="db" // This is no longer needed but kept for compatibility
          onResultClick={handleResultSelect}
        />
      </div>

      <SearchStyles />
    </div>
  );
}
import React from 'react';
import { SearchInput } from './SearchInput';
import { FeaturesGrid } from './FeaturesGrid';
import { SearchResults } from './SearchResults';
import { SearchStyles } from './SearchStyles';
import { SearchResult } from '@/types/search';
import useSearch from '@/hooks/useSearch';

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
  
  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    // Pass the selected album up to the parent component
    onAlbumSelect(result);
    
    // Clear search state
    clearSearch();
  };

  const showFeaturesGrid = !searchValue.trim() && !selectedAlbum;
  const showSearchResults = Boolean(searchValue.trim() && !loading);

  return (
    <div className="space-y-6">
      {/* Search input - full width */}
      <div className="w-full">
        <SearchInput 
          searchValue={searchValue}
          loading={loading}
          onChange={handleSearchChange}
        />
      </div>
      
      {/* Features grid below search */}
      <div className="w-full">
        <div className={`transition-all duration-500 transform ${showFeaturesGrid ? 'opacity-100 scale-100' : 'opacity-0 scale-95 -translate-y-4 pointer-events-none'}`}>
          <FeaturesGrid isVisible={true} />
        </div>
      </div>

      {/* Search results area */}
      <div className="relative min-h-[100px]">
        <SearchResults
          isVisible={showSearchResults}
          results={results}
          searchStatus={searchStatus}
          onResultClick={handleResultSelect}
        />
      </div>
      
      <SearchStyles />
    </div>
  );
};

export default SearchSection;
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
  const showSearchResults = Boolean(searchValue.trim());

  return (
    <div className="w-full space-y-4">
      {/* Search input */}
      <div className="w-full">
        <SearchInput 
          searchValue={searchValue}
          loading={loading}
          onChange={handleSearchChange}
        />
      </div>
      
      {/* Feature grid or search results */}
      {showFeaturesGrid && (
        <FeaturesGrid isVisible={true} />
      )}
      
      {showSearchResults && (
        <SearchResults
          isVisible={true}
          results={results}
          searchStatus={searchStatus}
          onResultClick={handleResultSelect}
        />
      )}
      
      <SearchStyles />
    </div>
  );
};

export default SearchSection;
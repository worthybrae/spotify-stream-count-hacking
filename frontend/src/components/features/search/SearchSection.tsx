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
          onResultClick={handleResultSelect}
        />
      </div>
      
      <SearchStyles />
    </div>
  );
};

export default SearchSection;
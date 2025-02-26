import { useState, useEffect, useCallback } from 'react';
import { searchAlbums } from '../lib/api';
import { SearchResult } from '../types/search';

type SearchStatus = 'idle' | 'too-short' | 'searching' | 'no-results';

interface SearchState {
  results: SearchResult[];
  loading: boolean;
  searchStatus: SearchStatus;
  lastSearched: string;
}

export const useSearch = (minQueryLength: number = 3) => {
  const [searchValue, setSearchValue] = useState('');
  const [searchState, setSearchState] = useState<SearchState>({
    results: [],
    loading: false,
    searchStatus: 'idle',
    lastSearched: ''
  });

  // Search functionality
  useEffect(() => {
    let searchTimer: ReturnType<typeof setTimeout>;

    const performSearch = async () => {
      if (searchValue.trim() === searchState.lastSearched) return;
      
      if (searchValue.trim().length < minQueryLength) {
        setSearchState(prev => ({
          ...prev,
          results: [],
          lastSearched: searchValue.trim(),
          loading: false,
          searchStatus: 'too-short'
        }));
        return;
      }
      
      setSearchState(prev => ({
        ...prev,
        loading: true,
        lastSearched: searchValue.trim(),
        searchStatus: 'searching'
      }));
      
      try {
        // Search albums using the unified endpoint
        const searchResults = await searchAlbums(searchValue);
        
        if (searchResults.length > 0) {
          setSearchState(prev => ({
            ...prev,
            results: searchResults,
            loading: false,
            searchStatus: 'idle'
          }));
        } else {
          setSearchState(prev => ({
            ...prev,
            results: [],
            loading: false,
            searchStatus: 'no-results'
          }));
        }
      } catch (error) {
        console.error('Search failed:', error);
        setSearchState(prev => ({
          ...prev,
          results: [],
          loading: false,
          searchStatus: 'no-results'
        }));
      }
    };

    if (searchValue.trim()) {
      searchTimer = setTimeout(performSearch, 800);
    } else {
      setSearchState({
        results: [],
        loading: false,
        lastSearched: '',
        searchStatus: 'idle'
      });
    }

    return () => {
      if (searchTimer) clearTimeout(searchTimer);
    };
  }, [searchValue, searchState.lastSearched, minQueryLength]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    if (!value.trim()) {
      setSearchState(prev => ({
        ...prev,
        results: [],
        lastSearched: '',
        searchStatus: 'idle'
      }));
    } else if (value.trim().length < minQueryLength) {
      setSearchState(prev => ({
        ...prev,
        searchStatus: 'too-short'
      }));
    }
  }, [minQueryLength]);

  const clearSearch = useCallback(() => {
    setSearchValue('');
    setSearchState({
      results: [],
      loading: false,
      lastSearched: '',
      searchStatus: 'idle'
    });
  }, []);

  return {
    searchValue,
    ...searchState,
    handleSearchChange,
    clearSearch
  };
};

export default useSearch;
// Corrected SearchSection.tsx
import { useState, useEffect } from 'react';
import { SearchInput } from './SearchInput';
import { FeaturesGrid } from './FeaturesGrid';
import { SearchResults } from './SearchResults';
import { SearchStyles } from './SearchStyles';
import { SearchResult } from '@/types/search';
import { NewRelease } from '@/types/api';
import {
  searchAlbums,
  searchSpotifyAlbums,
  saveAlbumData,
  getAlbumTracks,
  getTrackHistory
} from '@/lib/api';

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
  const [searchSource, setSearchSource] = useState<'db' | 'spotify'>('db');
  const [searchStatus, setSearchStatus] = useState('');
  const [savingData, setSavingData] = useState(false);
  const [lastSearched, setLastSearched] = useState('');
  
  // Search functionality (unchanged)
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
      setSearchStatus('searching-db');
      
      try {
        // First search DB
        const dbData = await searchAlbums(searchValue);
        
        if (dbData.length > 0) {
          setResults(dbData);
          setSearchSource('db');
          onSearchStateChange(true);
          setSearchStatus('idle');
        } else {
          setSearchStatus('searching-spotify');
          
          // Search Spotify if no DB results
          const spotifyData = await searchSpotifyAlbums(searchValue);
          
          // We're now using NewRelease directly from Spotify search
          // which includes artist_id
          if (spotifyData.length > 0) {
            // Map to SearchResult for the UI display
            const mappedResults: SearchResult[] = spotifyData.map(item => ({
              album_id: item.album_id,
              album_name: item.album_name,
              artist_name: item.artist_name,
              cover_art: item.cover_art,
              release_date: item.release_date
            }));
            
            // Store the original data for later use
            setResults(mappedResults);
            // Store the original NewRelease objects for reference
            setSpotifyResults(spotifyData);
            setSearchSource('spotify');
            onSearchStateChange(true);
            setSearchStatus('idle');
          } else {
            setSearchStatus('no-results');
          }
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

  // Store Spotify search results to reference artist_id later
  const [spotifyResults, setSpotifyResults] = useState<NewRelease[]>([]);

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
  const handleResultSelect = async (result: SearchResult) => {
    // First pass the result to parent for UI update
    onAlbumSelect(result);
    
    // Then if it's from Spotify, save the data
    if (searchSource === 'spotify') {
      setSavingData(true);
      
      try {
        // Find the matching NewRelease which has the artist_id
        const spotifyResult = spotifyResults.find(item => 
          item.album_id === result.album_id
        );
        
        if (!spotifyResult) {
          throw new Error('Could not find matching Spotify result with artist_id');
        }
        
        // Get album tracks
        const albumData = await getAlbumTracks(result.album_id);
        
        // Get track history for all tracks
        const historyPromises = albumData.tracks.map(track => 
          getTrackHistory(track.track_id)
        );
        const histories = await Promise.all(historyPromises);
        const combinedHistory = histories.flat();
        
        // Save everything with the correct NewRelease that has artist_id
        await saveAlbumData(spotifyResult, albumData.tracks, combinedHistory);
        console.log('Album data saved successfully');
      } catch (error) {
        console.error('Error saving album data:', error);
      } finally {
        setSavingData(false);
      }
    }
    
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
          searchSource={searchSource}
          onResultClick={handleResultSelect}
          savingData={savingData}
        />
      </div>

      <SearchStyles />
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import { SearchResult } from '@/types/search';
import { searchAlbums } from '@/lib/api';

interface SearchBarProps {
  onResultSelect: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ 
  onResultSelect, 
  placeholder = "Search for any album...",
  className = "" 
}: SearchBarProps) {
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchValue.length >= 2) {
        setLoading(true);
        try {
          const data = await searchAlbums(searchValue);
          setResults(data);
        } catch (error) {
          console.error('Search failed:', error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          className="h-12 pl-12 pr-4 text-lg bg-background/60 backdrop-blur"
          placeholder={placeholder}
        />
        {loading ? (
          <Loader2 className="absolute left-4 top-3.5 w-5 h-5 text-primary animate-spin" />
        ) : (
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
        )}
      </div>

      {results.length > 0 && focused && (
        <Card className="absolute w-full mt-2 p-2 bg-background/95 backdrop-blur z-50 divide-y divide-border">
          {results.map((result) => (
            <div
              key={result.album_id}
              className="flex items-center gap-4 p-3 hover:bg-primary/5 cursor-pointer rounded-lg transition-colors"
              onClick={() => {
                onResultSelect(result);
                setSearchValue(`${result.album_name} - ${result.artist_name}`);
                setResults([]);
              }}
            >
              <img
                src={result.cover_art}
                alt={result.album_name}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div>
                <h3 className="font-medium">{result.album_name}</h3>
                <p className="text-sm text-muted-foreground">{result.artist_name}</p>
                <p className="text-xs text-muted-foreground">
                  Released {formatDate(result.release_date)}
                </p>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
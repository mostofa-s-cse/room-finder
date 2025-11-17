'use client';

import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string, location: string) => void;
  onChange?: (query: string) => void;
  value?: string;
  showLocationSearch?: boolean;
  className?: string;
}

export function SearchBar({ 
  placeholder = "Search for rooms...", 
  onSearch,
  onChange,
  value,
  showLocationSearch = true,
  className = ""
}: SearchBarProps) {
  const [internalQuery, setInternalQuery] = useState('');
  const [location, setLocation] = useState('');
  
  const query = value !== undefined ? value : internalQuery;
  const router = useRouter();

  const handleQueryChange = (newQuery: string) => {
    if (value === undefined) {
      setInternalQuery(newQuery);
    }
    if (onChange) {
      onChange(newQuery);
    }
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch(query, location);
    } else {
      // Default behavior: navigate to search page
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (location) params.set('location', location);
      router.push(`/search?${params.toString()}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-2 w-full max-w-2xl ${className}`}>
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10"
        />
      </div>
      
      {showLocationSearch && (
        <div className="flex-1 relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
      )}
      
      <Button onClick={handleSearch} className="px-6">
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
    </div>
  );
}
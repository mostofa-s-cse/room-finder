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
      if (location) params.set('city', location);
      router.push(`/search?${params.toString()}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-3 w-full max-w-4xl ${className}`}>
      <div className="flex-1 relative group">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-primary" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-12 pr-4 py-3 text-base bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 shadow-sm hover:shadow-md"
        />
      </div>
      
      {showLocationSearch && (
        <div className="flex-1 relative group">
          <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-primary" />
          <Input
            type="text"
            placeholder="Location (e.g., Dhaka, Chittagong)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-12 pr-4 py-3 text-base bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 shadow-sm hover:shadow-md"
          />
        </div>
      )}
      
      <Button 
        onClick={handleSearch} 
        className="px-8 py-3 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
      >
        <Search className="h-5 w-5 mr-2" />
        Search Rooms
      </Button>
    </div>
  );
}
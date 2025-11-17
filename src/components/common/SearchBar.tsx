'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/utils/helpers';

interface SearchSuggestion {
  id: string;
  type: 'location' | 'area' | 'landmark' | 'recent';
  title: string;
  subtitle?: string;
  popular?: boolean;
}

interface SearchBarProps {
  defaultLocation?: string;
  defaultCheckIn?: string;
  defaultCheckOut?: string;
  defaultGuests?: number;
  onSearch?: (params: {
    location: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
  }) => void;
  showDateInputs?: boolean;
  showGuestInput?: boolean;
  variant?: 'default' | 'compact' | 'hero';
  className?: string;
}

// Mock search suggestions
const MOCK_SUGGESTIONS: SearchSuggestion[] = [
  // Popular locations
  { id: '1', type: 'location', title: 'Dhanmondi', subtitle: '1,200+ rooms available', popular: true },
  { id: '2', type: 'location', title: 'Gulshan', subtitle: '800+ rooms available', popular: true },
  { id: '3', type: 'location', title: 'Banani', subtitle: '600+ rooms available', popular: true },
  { id: '4', type: 'location', title: 'Uttara', subtitle: '900+ rooms available', popular: true },
  
  // Areas
  { id: '5', type: 'area', title: 'Old Dhaka', subtitle: 'Historic area' },
  { id: '6', type: 'area', title: 'Mirpur', subtitle: 'Affordable options' },
  { id: '7', type: 'area', title: 'Wari', subtitle: 'Central location' },
  
  // Landmarks
  { id: '8', type: 'landmark', title: 'Near Dhaka University', subtitle: 'Student-friendly' },
  { id: '9', type: 'landmark', title: 'Near BUET', subtitle: 'University area' },
  { id: '10', type: 'landmark', title: 'Near TSC', subtitle: 'Cultural hub' },
];

export function SearchBar({
  defaultLocation = '',
  defaultCheckIn = '',
  defaultCheckOut = '',
  defaultGuests = 1,
  onSearch,
  showDateInputs = true,
  showGuestInput = true,
  variant = 'default',
  className,
}: SearchBarProps) {
  const router = useRouter();
  const [location, setLocation] = useState(defaultLocation);
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [guests, setGuests] = useState(defaultGuests);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Compute suggestions based on location input
  const suggestions = !location.trim() 
    ? MOCK_SUGGESTIONS.filter(s => s.popular)
    : MOCK_SUGGESTIONS.filter(suggestion =>
        suggestion.title.toLowerCase().includes(location.toLowerCase()) ||
        (suggestion.subtitle && suggestion.subtitle.toLowerCase().includes(location.toLowerCase()))
      );

  // Initialize recent searches from localStorage
  const [recentSearches, setRecentSearches] = useState<SearchSuggestion[]>(() => {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem('room-finder-recent-searches');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.slice(0, 3); // Show max 3 recent searches
      } catch {
        // Invalid JSON, ignore
      }
    }
    return [];
  });

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    if (!location.trim()) return;

    const searchParams = {
      location: location.trim(),
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      guests: guests || undefined,
    };

    // Save to recent searches
    const newRecentSearch: SearchSuggestion = {
      id: Date.now().toString(),
      type: 'recent',
      title: location.trim(),
      subtitle: `${guests} guest${guests > 1 ? 's' : ''}`,
    };

    const updatedRecent = [newRecentSearch, ...recentSearches.filter(r => r.title !== location.trim())].slice(0, 5);
    setRecentSearches(updatedRecent);
    localStorage.setItem('room-finder-recent-searches', JSON.stringify(updatedRecent));

    // Hide suggestions
    setShowSuggestions(false);

    // Call onSearch callback or navigate
    if (onSearch) {
      onSearch(searchParams);
    } else {
      const params = new URLSearchParams();
      params.set('location', searchParams.location);
      if (searchParams.checkIn) params.set('checkIn', searchParams.checkIn);
      if (searchParams.checkOut) params.set('checkOut', searchParams.checkOut);
      if (searchParams.guests) params.set('guests', searchParams.guests.toString());
      
      router.push(`/search?${params.toString()}`);
    }
  };

  const selectSuggestion = (suggestion: SearchSuggestion) => {
    setLocation(suggestion.title);
    setShowSuggestions(false);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('room-finder-recent-searches');
  };

  const isCompact = variant === 'compact';
  const isHero = variant === 'hero';

  if (isCompact) {
    return (
      <div className={cn('relative', className)} ref={searchRef}>
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Where do you want to stay?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={!location.trim()}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-2 max-h-80 overflow-y-auto">
            <CardContent className="p-0">
              {suggestions.length > 0 ? (
                <div className="py-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => selectSuggestion(suggestion)}
                      className="w-full px-4 py-2 text-left hover:bg-muted transition-colors flex items-center space-x-3"
                    >
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="font-medium">{suggestion.title}</div>
                        {suggestion.subtitle && (
                          <div className="text-sm text-muted-foreground">{suggestion.subtitle}</div>
                        )}
                      </div>
                      {suggestion.popular && (
                        <Badge variant="secondary" className="text-xs">Popular</Badge>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No locations found
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} ref={searchRef}>
      <Card className={cn(
        isHero && 'shadow-xl border-0 bg-background/95 backdrop-blur-sm'
      )}>
        <CardContent className={cn('p-6', isHero && 'p-8')}>
          <div className={cn(
            'flex flex-col space-y-4',
            !isHero && 'md:flex-row md:space-y-0 md:space-x-4'
          )}>
            {/* Location Input */}
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Where</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search destinations..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Date Inputs */}
            {showDateInputs && (
              <>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Check-in</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Check-out</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Guests Input */}
            {showGuestInput && (
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Guests</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            {/* Search Button */}
            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                disabled={!location.trim()}
                className={cn('w-full md:w-auto', isHero && 'px-8 py-6 text-lg')}
              >
                <Search className={cn('h-4 w-4 mr-2', isHero && 'h-5 w-5')} />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-2 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Recent</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    className="text-xs text-muted-foreground"
                  >
                    Clear
                  </Button>
                </div>
                
                {recentSearches.map((recent) => (
                  <button
                    key={recent.id}
                    onClick={() => selectSuggestion(recent)}
                    className="w-full px-4 py-2 text-left hover:bg-muted transition-colors flex items-center space-x-3"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{recent.title}</div>
                      {recent.subtitle && (
                        <div className="text-sm text-muted-foreground">{recent.subtitle}</div>
                      )}
                    </div>
                  </button>
                ))}
                
                <Separator className="my-2" />
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 ? (
              <div className="py-2">
                {!location.trim() && (
                  <div className="px-4 py-2 flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Popular destinations</span>
                  </div>
                )}
                
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-muted transition-colors flex items-center space-x-3"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{suggestion.title}</div>
                      {suggestion.subtitle && (
                        <div className="text-sm text-muted-foreground">{suggestion.subtitle}</div>
                      )}
                    </div>
                    {suggestion.popular && (
                      <Badge variant="secondary" className="text-xs">Popular</Badge>
                    )}
                  </button>
                ))}
              </div>
            ) : location.trim() && (
              <div className="p-4 text-center text-muted-foreground">
                No locations found for &ldquo;{location}&rdquo;
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
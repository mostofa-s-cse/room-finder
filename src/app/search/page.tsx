'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/ui/SearchBar';
import { FiltersSidebar } from '@/components/ui/FiltersSidebar';

// Import FilterOptions interface
interface FilterOptions {
  location?: string;
  minRent?: number;
  maxRent?: number;
  roomType?: string;
  amenities?: string[];
  availableFrom?: string;
  sortBy?: string;
}
import { ListingCard } from '@/components/ui/ListingCard';
import { Pagination } from '@/components/ui/pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Grid, List, MapPin, SlidersHorizontal, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  rent: number;
  location: string;
  lat: number;
  lng: number;
  roomType: 'SINGLE' | 'SHARED' | 'ENTIRE_APARTMENT';
  images: string[];
  amenities: string[];
  isAvailable: boolean;
  availableFrom: string;
  avgRating?: number;
  landlord: {
    id: string;
    name: string;
    profilePicture?: string;
  };
  createdAt: string;
}

interface SearchFilters {
  query?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  roomType?: string;
  amenities?: string[];
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'distance';
  lat?: number;
  lng?: number;
  radius?: number;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [mapCenter, setMapCenter] = useState({ lat: 23.8103, lng: 90.4125 }); // Dhaka center
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams?.get('q') || '',
    city: searchParams?.get('city') || '',
    sortBy: 'newest',
  });

  const fetchListings = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(filters.query && { q: filters.query }),
        ...(filters.city && { city: filters.city }),
        ...(filters.minPrice && { minPrice: filters.minPrice.toString() }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice.toString() }),
        ...(filters.roomType && { roomType: filters.roomType }),
        ...(filters.amenities?.length && { amenities: filters.amenities.join(',') }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.lat && { lat: filters.lat.toString() }),
        ...(filters.lng && { lng: filters.lng.toString() }),
        ...(filters.radius && { radius: filters.radius.toString() }),
      });

      const endpoint = filters.lat && filters.lng 
        ? `/api/search?${queryParams}`
        : `/api/listings?${queryParams}`;

      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }

      const data = await response.json();
      // Handle API response structure: { data: [...], pagination: {...} }
      const listingsData = data.data || data.listings || [];
      setListings(Array.isArray(listingsData) ? listingsData : []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalResults(data.pagination?.total || 0);
      
      // Update map center if we have results with coordinates
      if (listingsData && listingsData.length > 0 && listingsData[0].lat && listingsData[0].lng) {
        setMapCenter({ 
          lat: listingsData[0].lat, 
          lng: listingsData[0].lng 
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchListings(currentPage);
  }, [fetchListings, currentPage]);

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, query }));
    setCurrentPage(1);
  };

  const handleFilterChange = (filterOptions: FilterOptions) => {
    // Map FilterOptions to SearchFilters
    const mappedFilters: Partial<SearchFilters> = {
      city: filterOptions.location,
      minPrice: filterOptions.minRent,
      maxPrice: filterOptions.maxRent,
      roomType: filterOptions.roomType,
      amenities: filterOptions.amenities,
      sortBy: filterOptions.sortBy as SearchFilters['sortBy'],
    };
    
    setFilters(prev => ({ ...prev, ...mappedFilters }));
    setCurrentPage(1);
  };

  const handleSortChange = (sortBy: string) => {
    setFilters(prev => ({ ...prev, sortBy: sortBy as SearchFilters['sortBy'] }));
    setCurrentPage(1);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLocationSearch = (location: { lat: number; lng: number; address: string }) => {
    setFilters(prev => ({
      ...prev,
      lat: location.lat,
      lng: location.lng,
      query: location.address,
      sortBy: 'distance',
      radius: 5, // 5km radius
    }));
    setMapCenter(location);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      city: '',
      sortBy: 'newest',
    });
    setCurrentPage(1);
  };

  const activeFiltersCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    return value && value !== 'newest';
  }).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Search Results
              </h1>
              <p className="text-gray-600">
                {loading 
                  ? 'Searching...' 
                  : `${totalResults} rooms found${filters.query ? ` for "${filters.query}"` : ''}`
                }
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 min-w-[300px]">
                <SearchBar 
                  value={filters.query}
                  onChange={handleSearch}
                  placeholder="Search by city, area, or landmark..."
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="relative"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
                
                <div className="flex rounded-md border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'rounded-r-none',
                      viewMode === 'grid' && 'bg-gray-100'
                    )}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'rounded-l-none border-l',
                      viewMode === 'list' && 'bg-gray-100'
                    )}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={cn(
            'lg:w-80 lg:flex-shrink-0',
            showFilters ? 'block' : 'hidden lg:block'
          )}>
            <div className="sticky top-6">
              <FiltersSidebar
                filters={{
                  location: filters.city,
                  minRent: filters.minPrice,
                  maxRent: filters.maxPrice,
                  roomType: filters.roomType,
                  amenities: filters.amenities,
                  sortBy: filters.sortBy,
                }}
                onFiltersChange={handleFilterChange}
                onClearFilters={clearFilters}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort and View Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <Select value={filters.sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    {filters.lat && filters.lng && (
                      <SelectItem value="distance">Distance</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear filters ({activeFiltersCount})
                  </Button>
                )}
              </div>
              
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
            </div>

            {/* Location-based search info */}
            {filters.lat && filters.lng && (
              <Card className="mb-6">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="text-sm">
                        Showing results within {filters.radius || 5}km of your location
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        lat: undefined, 
                        lng: undefined, 
                        radius: undefined,
                        sortBy: 'newest'
                      }))}
                    >
                      Clear location
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Listings Grid/List */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Error loading results</p>
                  <p className="text-sm text-gray-600">{error}</p>
                </div>
                <Button onClick={() => fetchListings(currentPage)}>
                  Try Again
                </Button>
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No rooms found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or filters
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                {Array.isArray(listings) && listings.length > 0 ? (
                  <div className={cn(
                    viewMode === 'grid' 
                      ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                      : 'space-y-4'
                  )}>
                    {listings.map((listing) => (
                      <ListingCard 
                        key={listing.id} 
                        listing={listing}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No listings found. Try adjusting your search criteria.</p>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SearchContent />
    </Suspense>
  );
}
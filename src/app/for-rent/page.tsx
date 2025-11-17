'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/ui/SearchBar';
import { FiltersSidebar } from '@/components/ui/FiltersSidebar';
import { ListingCard } from '@/components/ui/ListingCard';
import { Pagination } from '@/components/ui/pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Grid, List, MapPin, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Listing {
  id: string;
  title: string;
  description: string;
  rent: number;
  location: string;
  images: string[];
  amenities: string[];
  roomType: 'SINGLE' | 'SHARED' | 'ENTIRE_APARTMENT';
  isAvailable: boolean;
  availableFrom: string;
  avgRating?: number;
  reviewCount: number;
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
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
}

function ForRentContent() {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
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
      });

      const response = await fetch(`/api/listings?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }

      const data = await response.json();
      setListings(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
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

  interface FilterOptions {
    location?: string;
    minRent?: number;
    maxRent?: number;
    roomType?: string;
    amenities?: string[];
    availableFrom?: string;
    sortBy?: string;
  }

  const handleFilterChange = (newFilters: FilterOptions) => {
    // Map FilterOptions to SearchFilters
    const mappedFilters: Partial<SearchFilters> = {
      city: newFilters.location,
      minPrice: newFilters.minRent,
      maxPrice: newFilters.maxRent,
      roomType: newFilters.roomType,
      amenities: newFilters.amenities,
      sortBy: newFilters.sortBy as SearchFilters['sortBy'],
    };
    
    setFilters(prev => ({ ...prev, ...mappedFilters }));
    setCurrentPage(1);
  };

  const handleSortChange = (sortBy: string) => {
    setFilters(prev => ({ ...prev, sortBy: sortBy as SearchFilters['sortBy'] }));
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
                Rooms for Rent
              </h1>
              <p className="text-gray-600">
                {listings.length > 0 ? `${listings.length} rooms found` : 'Loading rooms...'}
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

            {/* Listings Grid/List */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Error loading listings</p>
                  <p className="text-sm text-gray-600">{error}</p>
                </div>
                <Button onClick={() => fetchListings(currentPage)}>
                  Try Again
                </Button>
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
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

export default function ForRentPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ForRentContent />
    </Suspense>
  );
}
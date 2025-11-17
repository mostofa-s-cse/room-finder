import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse } from '@/lib/api-utils';
import { searchService } from '@/lib/search/search-service';
import { SearchFilters, SearchSortOption } from '@/lib/search/types';

// POST /api/search/advanced - Advanced search with all features
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  
  // Extract and validate search parameters
  const filters: SearchFilters = {
    location: body.location || '',
    city: body.city,
    minPrice: body.minPrice ? Number(body.minPrice) : undefined,
    maxPrice: body.maxPrice ? Number(body.maxPrice) : undefined,
    priceRange: body.priceRange,
    roomType: body.roomType,
    amenities: body.amenities || [],
    requiredAmenities: body.requiredAmenities || [],
    latitude: body.latitude ? Number(body.latitude) : undefined,
    longitude: body.longitude ? Number(body.longitude) : undefined,
    radius: body.radius ? Number(body.radius) : undefined,
    minRating: body.minRating ? Number(body.minRating) : undefined,
    verifiedOnly: body.verifiedOnly || false,
    newListingsOnly: body.newListingsOnly || false,
    availableFrom: body.availableFrom ? new Date(body.availableFrom) : undefined,
    sortBy: body.sortBy || SearchSortOption.RELEVANCE,
    sortOrder: body.sortOrder || 'DESC',
    page: body.page ? Number(body.page) : 1,
    limit: body.limit ? Number(body.limit) : 20,
    userPreferences: body.userPreferences
  };

  const options = {
    includeNearbyAreas: body.includeNearbyAreas || false,
    fuzzyMatching: body.fuzzyMatching || false,
    semanticSearch: body.semanticSearch || false,
    personalizedResults: body.personalizedResults || false,
    applyMLRanking: body.applyMLRanking || false,
    includeRecommendations: body.includeRecommendations || false,
    trackSearchAnalytics: body.trackSearchAnalytics !== false, // default true
    enableFacetedSearch: body.enableFacetedSearch !== false // default true
  };

  // Perform search
  const searchResult = await searchService.searchListings(filters, options);

  return successResponse(searchResult);
});

// GET /api/search/advanced - Simple advanced search via query parameters
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  
  const filters: SearchFilters = {
    location: searchParams.get('q') || searchParams.get('location') || '',
    city: searchParams.get('city') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    roomType: (searchParams.get('roomType') as 'SINGLE' | 'SHARED') || undefined,
    amenities: searchParams.get('amenities')?.split(',').filter(Boolean) || [],
    latitude: searchParams.get('lat') ? Number(searchParams.get('lat')) : undefined,
    longitude: searchParams.get('lng') ? Number(searchParams.get('lng')) : undefined,
    radius: searchParams.get('radius') ? Number(searchParams.get('radius')) : undefined,
    minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
    verifiedOnly: searchParams.get('verified') === 'true',
    newListingsOnly: searchParams.get('new') === 'true',
    sortBy: (searchParams.get('sort') as SearchSortOption) || SearchSortOption.RELEVANCE,
    sortOrder: (searchParams.get('order') as 'ASC' | 'DESC') || 'DESC',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20
  };

  const searchResult = await searchService.searchListings(filters);

  return successResponse(searchResult);
});
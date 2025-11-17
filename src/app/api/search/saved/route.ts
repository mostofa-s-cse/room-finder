import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse, errorResponse, ApiErrorClass } from '@/lib/api-utils';
import { searchService } from '@/lib/search/search-service';
import { getCurrentUser } from '@/lib/auth-utils';

// POST /api/search/saved - Save a search
export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse(new ApiErrorClass('Unauthorized', 'UNAUTHORIZED', 401));
  }

  const body = await request.json();
  const { name, filters } = body;

  if (!name || !filters) {
    return errorResponse(new ApiErrorClass('Name and filters are required', 'VALIDATION_ERROR', 400));
  }

  const savedSearch = await searchService.saveSearch(user.id, name, filters);
  return successResponse(savedSearch);
});

// GET /api/search/saved - Get user's saved searches
export const GET = withErrorHandling(async () => {
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse(new ApiErrorClass('Unauthorized', 'UNAUTHORIZED', 401));
  }

  const savedSearches = await searchService.getSavedSearches(user.id);
  return successResponse(savedSearches);
});
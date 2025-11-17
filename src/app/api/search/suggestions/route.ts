import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse } from '@/lib/api-utils';
import { searchService } from '@/lib/search/search-service';

// GET /api/search/suggestions - Get autocomplete suggestions
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') as 'location' | 'amenity' | 'all' || 'all';

  if (!query.trim() || query.length < 2) {
    return successResponse([]);
  }

  const suggestions = await searchService.getAutocompleteSuggestions(query, type);
  return successResponse(suggestions);
});
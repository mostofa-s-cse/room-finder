import { NextRequest } from 'next/server';
import { successResponse, requireAuth, withErrorHandling } from '@/lib/api-utils';

// GET /api/users/favorites - Get user favorites (mock implementation)
// Note: Favorites functionality is not implemented in the database schema yet
export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireAuth(request);

  // Return empty array since favorites table doesn't exist yet
  // This prevents the 404 error in the frontend
  const favorites: never[] = [];

  return successResponse(favorites);
});

// POST /api/users/favorites - Add to favorites (mock implementation)
export const POST = withErrorHandling(async (request: NextRequest) => {
  await requireAuth(request);
  
  const body = await request.json();
  const { listingId } = body;

  // Mock response - favorites functionality not implemented
  return successResponse({ 
    message: 'Favorites feature coming soon',
    listingId 
  });
});

// DELETE /api/users/favorites - Remove from favorites (mock implementation) 
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  await requireAuth(request);

  // Mock response - favorites functionality not implemented
  return successResponse({ 
    message: 'Favorites feature coming soon' 
  });
});
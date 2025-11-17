import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, successResponse, requireAuth, ApiErrorClass } from '@/lib/api-utils';

// GET /api/analytics/landlord - Get analytics data for landlord
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAuth(request);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user) {
    throw new ApiErrorClass('User not found', 'USER_NOT_FOUND', 404);
  }

  // Only landlords can access this endpoint
  if (user.role !== 'LANDLORD') {
    throw new ApiErrorClass('Access denied. Only landlords can view analytics.', 'ACCESS_DENIED', 403);
  }

  // Get all landlord's listings
  const listings = await prisma.listing.findMany({
    where: { landlordId: user.id },
    include: {
      bookings: true,
      reviews: true,
      _count: {
        select: {
          bookings: true,
          reviews: true
        }
      }
    }
  });

  // Calculate analytics
  const totalListings = listings.length;
  const activeListings = listings.filter(l => l.status === 'APPROVED' && l.isPublished).length;
  
  const allBookings = listings.flatMap(l => l.bookings);
  const totalBookings = allBookings.length;
  const confirmedBookings = allBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED');
  
  const totalEarnings = confirmedBookings.reduce((sum, booking) => {
    return sum + (booking.amount || 0);
  }, 0);

  const allReviews = listings.flatMap(l => l.reviews);
  const averageRating = allReviews.length > 0 
    ? allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length 
    : 0;

  // Monthly bookings for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const monthlyBookings = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const bookingsInMonth = allBookings.filter(b => 
      new Date(b.createdAt) >= monthStart && new Date(b.createdAt) <= monthEnd
    ).length;
    
    monthlyBookings.push({
      month: date.toLocaleDateString('default', { month: 'short', year: 'numeric' }),
      count: bookingsInMonth
    });
  }

  const analytics = {
    overview: {
      totalListings,
      activeListings,
      totalBookings,
      totalEarnings,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: allReviews.length
    },
    monthlyBookings,
    topListings: listings
      .map(listing => ({
        id: listing.id,
        title: listing.title,
        bookings: listing._count.bookings,
        reviews: listing._count.reviews,
        rating: listing.averageRating
      }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5)
  };

  return successResponse(analytics);
});
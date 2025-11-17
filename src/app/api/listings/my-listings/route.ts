import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, successResponse, requireAuth, ApiErrorClass } from '@/lib/api-utils';

// GET /api/listings/my-listings - Get current user's listings
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
    throw new ApiErrorClass('Access denied. Only landlords can view their listings.', 'ACCESS_DENIED', 403);
  }

  const myListings = await prisma.listing.findMany({
    where: {
      landlordId: user.id
    },
    include: {
      reviews: {
        include: {
          reviewer: {
            select: {
              name: true,
              id: true
            }
          }
        }
      },
      bookings: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
              id: true
            }
          }
        }
      },
      _count: {
        select: {
          bookings: true,
          reviews: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Calculate average rating and earnings for each listing
  const listingsWithStats = myListings.map(listing => {
    const totalRating = listing.reviews.reduce((sum: number, review) => sum + review.rating, 0);
    const averageRating = listing.reviews.length > 0 ? totalRating / listing.reviews.length : 0;
    
    const totalEarnings = listing.bookings
      .filter(booking => booking.status === 'CONFIRMED' || booking.status === 'COMPLETED')
      .reduce((sum: number, booking) => {
        const days = Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24));
        return sum + (listing.price * days);
      }, 0);
    
    return {
      ...listing,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: listing.reviews.length,
      totalEarnings,
      occupancyRate: listing.bookings.length > 0 ? 
        (listing.bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED').length / listing.bookings.length) * 100 : 0
    };
  });

  return successResponse(listingsWithStats);
});
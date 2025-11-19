import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, successResponse, requireAuth, ApiErrorClass } from '@/lib/api-utils';

// GET /api/bookings/landlord - Get bookings for landlord's listings
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
    throw new ApiErrorClass('Access denied. Only landlords can view bookings.', 'ACCESS_DENIED', 403);
  }

  const bookings = await prisma.booking.findMany({
    where: {
      listing: {
        landlordId: user.id
      }
    },
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true,
      amount: true,
      totalAmount: true,
      currency: true,
      createdAt: true,
      listing: {
        select: {
          id: true,
          title: true,
          address: true,
          price: true
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return successResponse(bookings);
});
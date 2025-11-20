import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, requireAuth, ApiErrorClass, errorResponse } from '@/lib/api-utils';
import { UserRole } from '@prisma/client';

// GET /api/landlord/tenants - Get landlord's tenants
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request, [UserRole.LANDLORD]);

    // Get all tenants who have bookings with the landlord's listings
    const tenants = await prisma.user.findMany({
      where: {
        role: UserRole.BACHELOR,
        bookings: {
          some: {
            listing: {
              landlordId: session.user.id,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        bookings: {
          where: {
            listing: {
              landlordId: session.user.id,
            },
          },
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            totalAmount: true,
            listing: {
              select: {
                id: true,
                title: true,
                address: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    });

    // Transform data to include current status
    const tenantsWithStatus = tenants.map(tenant => {
      const activeBooking = tenant.bookings?.find(
        booking => booking.status === 'CONFIRMED' || booking.status === 'PAID'
      );
      
      return {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        joinedAt: tenant.createdAt,
        totalBookings: tenant._count?.bookings || 0,
        totalReviews: tenant._count?.reviews || 0,
        currentStatus: activeBooking ? 'ACTIVE' : 'INACTIVE',
        currentListing: activeBooking?.listing || null,
        recentBookings: tenant.bookings?.slice(0, 3) || [],
      };
    });

    return successResponse(tenantsWithStatus);
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiErrorClass) {
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Internal server error', 'INTERNAL_ERROR', 500));
  }
}
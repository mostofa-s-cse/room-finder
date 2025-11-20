import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, requireAuth, ApiErrorClass, errorResponse } from '@/lib/api-utils';
import { UserRole } from '@prisma/client';

// GET /api/landlord/financial - Get landlord's financial data
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request, [UserRole.LANDLORD]);

    // Get financial data from bookings
    const bookings = await prisma.booking.findMany({
      where: {
        listing: {
          landlordId: session.user.id,
        },
        status: {
          in: ['CONFIRMED', 'COMPLETED'],
        },
      },
      select: {
        id: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate totals
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
    const totalBookings = bookings.length;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyRevenue = bookings
      .filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
      })
      .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

    // Group by month for chart data
    const monthlyData = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      const monthRevenue = bookings
        .filter(booking => {
          const bookingDate = new Date(booking.createdAt);
          return bookingDate.getMonth() === month && bookingDate.getFullYear() === year;
        })
        .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
      
      monthlyData.unshift({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthRevenue,
        bookings: bookings.filter(booking => {
          const bookingDate = new Date(booking.createdAt);
          return bookingDate.getMonth() === month && bookingDate.getFullYear() === year;
        }).length,
      });
    }

    const financialData = {
      totalRevenue,
      monthlyRevenue,
      totalBookings,
      monthlyData,
      recentTransactions: bookings.slice(0, 10).map(booking => ({
        id: booking.id,
        amount: booking.totalAmount,
        status: booking.status,
        date: booking.createdAt,
        tenant: booking.user.name,
        listing: booking.listing.title,
      })),
    };

    return successResponse(financialData);
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiErrorClass) {
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Internal server error', 'INTERNAL_ERROR', 500));
  }
}
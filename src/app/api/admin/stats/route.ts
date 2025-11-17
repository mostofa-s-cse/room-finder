import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get admin statistics
    const [
      totalUsers,
      totalListings, 
      totalBookings,
      totalRevenue,
      pendingReviews,
      reportedListings,
      activeUsers,
      newUsersThisMonth
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Total listings
      prisma.listing.count(),
      
      // Total bookings
      prisma.booking.count(),
      
      // Total revenue (sum of all completed bookings)
      prisma.booking.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { totalAmount: true }
      }).then(result => result._sum.totalAmount || 0),
      
      // Pending reviews
      prisma.review.count({
        where: { status: 'PENDING' }
      }),
      
      // Reported listings
      prisma.listing.count({
        where: { status: 'REPORTED' }
      }),
      
      // Active users (logged in within last 30 days)
      prisma.user.count({
        where: {
          lastLogin: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // New users this month
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    const stats = {
      totalUsers,
      totalListings,
      totalBookings,
      totalRevenue,
      pendingReviews,
      reportedListings,
      activeUsers,
      newUsersThisMonth
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin statistics' },
      { status: 500 }
    );
  }
}
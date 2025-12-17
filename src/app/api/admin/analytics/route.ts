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

    // Get current date and previous months for comparison
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    // Fetch user growth data
    const userGrowthData = await Promise.all([
      // Last 3 months
      prisma.user.count({
        where: {
          createdAt: {
            gte: threeMonthsAgo,
            lt: twoMonthsAgo
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: twoMonthsAgo,
            lt: previousMonth
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: previousMonth,
            lt: currentMonth
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: currentMonth
          }
        }
      })
    ]);

    // Fetch listing growth data
    const listingGrowthData = await Promise.all([
      prisma.listing.count({
        where: {
          createdAt: {
            gte: threeMonthsAgo,
            lt: twoMonthsAgo
          }
        }
      }),
      prisma.listing.count({
        where: {
          createdAt: {
            gte: twoMonthsAgo,
            lt: previousMonth
          }
        }
      }),
      prisma.listing.count({
        where: {
          createdAt: {
            gte: previousMonth,
            lt: currentMonth
          }
        }
      }),
      prisma.listing.count({
        where: {
          createdAt: {
            gte: currentMonth
          }
        }
      })
    ]);

    // Fetch revenue data from bookings
    const revenueData = await Promise.all([
      prisma.booking.aggregate({
        where: {
          createdAt: {
            gte: threeMonthsAgo,
            lt: twoMonthsAgo
          },
          status: {
            in: ['CONFIRMED', 'PAID', 'COMPLETED']
          }
        },
        _sum: {
          totalAmount: true
        }
      }),
      prisma.booking.aggregate({
        where: {
          createdAt: {
            gte: twoMonthsAgo,
            lt: previousMonth
          },
          status: {
            in: ['CONFIRMED', 'PAID', 'COMPLETED']
          }
        },
        _sum: {
          totalAmount: true
        }
      }),
      prisma.booking.aggregate({
        where: {
          createdAt: {
            gte: previousMonth,
            lt: currentMonth
          },
          status: {
            in: ['CONFIRMED', 'PAID', 'COMPLETED']
          }
        },
        _sum: {
          totalAmount: true
        }
      }),
      prisma.booking.aggregate({
        where: {
          createdAt: {
            gte: currentMonth
          },
          status: {
            in: ['CONFIRMED', 'PAID', 'COMPLETED']
          }
        },
        _sum: {
          totalAmount: true
        }
      })
    ]);

    // Fetch top cities data
    const topCitiesRaw = await prisma.listing.groupBy({
      by: ['city'],
      _count: {
        city: true
      },
      orderBy: {
        _count: {
          city: 'desc'
        }
      },
      take: 10,
      where: {
        city: {
          not: ''
        }
      }
    });

    // Format month names
    const getMonthName = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short' });
    };

    const analyticsData = {
      userGrowth: [
        { 
          month: getMonthName(threeMonthsAgo), 
          users: userGrowthData[0] 
        },
        { 
          month: getMonthName(twoMonthsAgo), 
          users: userGrowthData[1] 
        },
        { 
          month: getMonthName(previousMonth), 
          users: userGrowthData[2] 
        },
        { 
          month: getMonthName(currentMonth), 
          users: userGrowthData[3] 
        }
      ],
      listingGrowth: [
        { 
          month: getMonthName(threeMonthsAgo), 
          listings: listingGrowthData[0] 
        },
        { 
          month: getMonthName(twoMonthsAgo), 
          listings: listingGrowthData[1] 
        },
        { 
          month: getMonthName(previousMonth), 
          listings: listingGrowthData[2] 
        },
        { 
          month: getMonthName(currentMonth), 
          listings: listingGrowthData[3] 
        }
      ],
      revenueGrowth: [
        { 
          month: getMonthName(threeMonthsAgo), 
          revenue: revenueData[0]._sum.totalAmount || 0
        },
        { 
          month: getMonthName(twoMonthsAgo), 
          revenue: revenueData[1]._sum.totalAmount || 0
        },
        { 
          month: getMonthName(previousMonth), 
          revenue: revenueData[2]._sum.totalAmount || 0
        },
        { 
          month: getMonthName(currentMonth), 
          revenue: revenueData[3]._sum.totalAmount || 0
        }
      ],
      topCities: topCitiesRaw.map(cityData => ({
        city: cityData.city || 'Unknown',
        count: cityData._count?.city || 0
      })),
      // Additional metrics
      usersByRole: await prisma.user.groupBy({
        by: ['role'],
        _count: {
          role: true
        }
      }),
      listingsByStatus: await prisma.listing.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      }),
      // Recent activity
      recentUsers: await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }),
      recentListings: await prisma.listing.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          landlord: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      })
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
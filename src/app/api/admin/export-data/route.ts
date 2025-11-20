import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface ExportRequest {
  exportType: 'full' | 'users' | 'listings' | 'bookings' | 'analytics';
  includeUsers?: boolean;
  includeListings?: boolean;
  includeBookings?: boolean;
  includeAnalytics?: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body: ExportRequest = await request.json();
    const { 
      exportType, 
      includeUsers = true, 
      includeListings = true, 
      includeBookings = true, 
      includeAnalytics = true,
      dateRange 
    } = body;

    console.log('Data export request:', {
      adminId: session.user.id,
      exportType,
      includes: { includeUsers, includeListings, includeBookings, includeAnalytics },
      dateRange,
      timestamp: new Date().toISOString()
    });

    const exportData: Record<string, unknown> = {
      exportInfo: {
        exportedBy: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email
        },
        exportDate: new Date().toISOString(),
        exportType,
        version: '1.0.0',
        platform: 'Room Finder BD'
      }
    };

    // Build date filter for queries if dateRange is provided
    const dateFilter = dateRange ? {
      createdAt: {
        gte: new Date(dateRange.from),
        lte: new Date(dateRange.to)
      }
    } : {};

    try {
      // Export Users
      if (includeUsers) {
        const users = await prisma.user.findMany({
          where: dateFilter,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            income: true,
            affordablePrice: true,
            transportMode: true,
            createdAt: true,
            updatedAt: true,
            lastLogin: true,
            // Exclude sensitive data
            // passwordHash: false
          }
        });

        exportData.users = {
          count: users.length,
          data: users
        };
      }

      // Export Listings
      if (includeListings) {
        const listings = await prisma.listing.findMany({
          where: dateFilter,
          include: {
            landlord: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            },
            reviews: {
              select: {
                id: true,
                rating: true,
                comment: true,
                createdAt: true
              }
            },
            _count: {
              select: {
                bookings: true,
                reviews: true
              }
            }
          }
        });

        exportData.listings = {
          count: listings.length,
          data: listings
        };
      }

      // Export Bookings
      if (includeBookings) {
        const bookings = await prisma.booking.findMany({
          where: dateFilter,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            },
            listing: {
              select: {
                id: true,
                title: true,
                price: true,
                city: true,
                address: true
              }
            },
            payment: {
              select: {
                id: true,
                amount: true,
                status: true,
                paymentMethod: true,
                createdAt: true
              }
            }
          }
        });

        exportData.bookings = {
          count: bookings.length,
          data: bookings
        };
      }

      // Export Analytics (if you have analytics tables)
      if (includeAnalytics) {
        try {
          // Get basic analytics from existing tables
          const totalUsers = await prisma.user.count({
            where: dateFilter
          });
          
          const totalListings = await prisma.listing.count({
            where: dateFilter
          });
          
          const totalBookings = await prisma.booking.count({
            where: dateFilter
          });

          exportData.analytics = {
            summary: {
              totalUsers,
              totalListings,
              totalBookings,
              averageListingPrice: 0, // Calculate if needed
              bookingSuccessRate: 0   // Calculate if needed
            },
            note: 'Basic analytics included. Advanced analytics tables may be added separately.'
          };
        } catch (analyticsError) {
          console.log('Analytics export skipped (tables may not exist):', analyticsError);
          exportData.analytics = {
            note: 'Analytics data not available or tables not found'
          };
        }
      }

      // Add summary statistics
      exportData.summary = {
        totalUsers: (exportData.users as { count: number })?.count || 0,
        totalListings: (exportData.listings as { count: number })?.count || 0,
        totalBookings: (exportData.bookings as { count: number })?.count || 0,
        exportSize: JSON.stringify(exportData).length,
        dataCategories: Object.keys(exportData).filter(key => key !== 'exportInfo' && key !== 'summary')
      };

    } catch (dbError) {
      console.error('Database error during export:', dbError);
      return NextResponse.json(
        { 
          error: 'Database error during export',
          message: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      );
    }

    // Convert to JSON string for download
    const jsonData = JSON.stringify(exportData, null, 2);

    // Create response with JSON file download
    return new NextResponse(jsonData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="admin-data-export-${new Date().toISOString().split('T')[0]}.json"`,
        'Content-Length': jsonData.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error processing data export:', error);
    return NextResponse.json(
      { 
        error: 'Failed to export data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check export status or get export history
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // In a real implementation, you might want to track export history
    // For now, just return available export options
    return NextResponse.json({
      success: true,
      data: {
        availableExports: [
          { type: 'full', description: 'Complete platform data export' },
          { type: 'users', description: 'User data only' },
          { type: 'listings', description: 'Listing data only' },
          { type: 'bookings', description: 'Booking data only' },
          { type: 'analytics', description: 'Analytics data only' }
        ],
        lastExport: null, // In real implementation, get from export history table
        exportFormat: 'JSON',
        maxFileSize: '50MB'
      }
    });

  } catch (error) {
    console.error('Error fetching export info:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch export information',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
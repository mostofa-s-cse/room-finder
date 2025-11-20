import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    console.log('User data export request:', {
      userId,
      userEmail: session.user.email,
      timestamp: new Date().toISOString()
    });

    try {
      // Fetch user's personal data
      const userData = await prisma.user.findUnique({
        where: { id: userId },
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
        }
      });

      if (!userData) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Fetch user's listings (if they are a landlord)
      const userListings = await prisma.listing.findMany({
        where: { landlordId: userId },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          monthlyRent: true,
          city: true,
          address: true,
          location: true,
          lat: true,
          lng: true,
          roomType: true,
          amenities: true,
          images: true,
          averageRating: true,
          status: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
          availableFrom: true,
          contactEmail: true,
          contactPhone: true,
          rules: true
        }
      });

      // Fetch user's bookings
      const userBookings = await prisma.booking.findMany({
        where: { userId },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          amount: true,
          status: true,
          createdAt: true,
          listing: {
            select: {
              id: true,
              title: true,
              city: true,
              address: true,
              price: true
            }
          }
        }
      });

      // Fetch user's reviews
      const userReviews = await prisma.review.findMany({
        where: { reviewerId: userId },
        select: {
          id: true,
          rating: true,
          comment: true,
          status: true,
          createdAt: true,
          listing: {
            select: {
              id: true,
              title: true,
              city: true
            }
          }
        }
      });

      // Fetch user's reports
      const userReports = await prisma.report.findMany({
        where: { reporterId: userId },
        select: {
          id: true,
          targetType: true,
          reason: true,
          details: true,
          status: true,
          createdAt: true
        }
      });

      // Try to fetch optional data (may not exist in all implementations)
      let savedSearches: Array<Record<string, unknown>> = [];
      let notifications: Array<Record<string, unknown>> = [];
      let transactions: Array<Record<string, unknown>> = [];

      try {
        savedSearches = await prisma.savedSearch.findMany({
          where: { userId },
          select: {
            id: true,
            filters: true,
            alertEnabled: true,
            createdAt: true
          }
        });
      } catch {
        console.log('SavedSearch table not available');
      }

      try {
        notifications = await prisma.notificationModel.findMany({
          where: { userId },
          select: {
            id: true,
            type: true,
            title: true,
            message: true,
            isRead: true,
            createdAt: true
          }
        });
      } catch {
        console.log('Notification table not available');
      }

      try {
        transactions = await prisma.transaction.findMany({
          where: { userId },
          select: {
            id: true,
            amount: true,
            type: true,
            status: true,
            description: true,
            createdAt: true
          }
        });
      } catch {
        console.log('Transaction table not available');
      }

      // Compile the export data
      const exportData = {
        exportInfo: {
          exportedBy: {
            id: userData.id,
            name: userData.name,
            email: userData.email
          },
          exportDate: new Date().toISOString(),
          dataVersion: '1.0.0',
          platform: 'Room Finder BD'
        },
        personalData: {
          profile: userData,
          accountSettings: {
            // These would come from user settings if stored in DB
            // For now, including placeholder structure
            notifications: {
              email: true,
              push: true,
              sms: false,
              newMessages: true,
              bookingUpdates: true,
              recommendations: true,
              marketing: false
            },
            privacy: {
              profileVisibility: 'PUBLIC',
              showContactInfo: true,
              showOnlineStatus: true
            },
            preferences: {
              language: 'en',
              timezone: 'Asia/Dhaka',
              currency: 'BDT',
              theme: 'light'
            }
          }
        },
        activityData: {
          listings: {
            count: userListings.length,
            data: userListings
          },
          bookings: {
            count: userBookings.length,
            data: userBookings
          },
          reviews: {
            count: userReviews.length,
            data: userReviews
          },
          reports: {
            count: userReports.length,
            data: userReports
          },
          savedSearches: {
            count: savedSearches.length,
            data: savedSearches
          },
          notifications: {
            count: notifications.length,
            data: notifications
          },
          transactions: {
            count: transactions.length,
            data: transactions
          }
        },
        summary: {
          totalListings: userListings.length,
          totalBookings: userBookings.length,
          totalReviews: userReviews.length,
          totalReports: userReports.length,
          accountAge: Math.floor((Date.now() - new Date(userData.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
          memberSince: userData.createdAt,
          lastLogin: userData.lastLogin,
          exportSize: 0 // Will be calculated after JSON stringification
        }
      };

      // Calculate export size
      const jsonString = JSON.stringify(exportData, null, 2);
      exportData.summary.exportSize = jsonString.length;

      // Log the export for audit purposes
      console.log('User data export completed:', {
        userId,
        dataCategories: Object.keys(exportData.activityData),
        totalItems: Object.values(exportData.activityData).reduce((sum, category) => sum + (category as { count: number }).count, 0),
        exportSize: exportData.summary.exportSize
      });

      // Return the data as a downloadable JSON file
      return new NextResponse(jsonString, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="my-data-export-${new Date().toISOString().split('T')[0]}.json"`,
          'Content-Length': jsonString.length.toString(),
        },
      });

    } catch (dbError) {
      console.error('Database error during user data export:', dbError);
      return NextResponse.json(
        { 
          error: 'Database error during export',
          message: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error processing user data export:', error);
    return NextResponse.json(
      { 
        error: 'Failed to export user data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check what data can be exported
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        availableData: [
          { category: 'personalData', description: 'Profile information and account settings' },
          { category: 'listings', description: 'Your property listings (if landlord)' },
          { category: 'bookings', description: 'Your booking history' },
          { category: 'reviews', description: 'Reviews you have written' },
          { category: 'reports', description: 'Reports you have submitted' },
          { category: 'savedSearches', description: 'Your saved searches' },
          { category: 'notifications', description: 'Your notification history' },
          { category: 'transactions', description: 'Your transaction history' }
        ],
        exportFormat: 'JSON',
        estimatedProcessingTime: '5-15 seconds'
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
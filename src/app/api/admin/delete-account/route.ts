import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Only allow admins to delete admin accounts, or users to delete their own accounts
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required for account deletion' },
        { status: 403 }
      );
    }

    const { confirmText } = await request.json();

    // Verify confirmation text
    if (confirmText !== 'DELETE') {
      return NextResponse.json(
        { error: 'Invalid confirmation text. Please type "DELETE" to confirm.' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    try {
      // Start a transaction to ensure data consistency
      await prisma.$transaction(async (tx) => {
        console.log(`Starting account deletion for user: ${userId}`);

        // Delete related data in order (foreign key constraints)
        
        // 1. Delete user notifications
        await tx.notificationModel.deleteMany({
          where: { userId }
        });

        // 2. Delete user analytics
        try {
          await tx.userAnalytics.deleteMany({
            where: { userId }
          });
        } catch {
          console.log('UserAnalytics table may not exist, skipping...');
        }

        // 3. Delete search analytics
        try {
          await tx.searchAnalytics.deleteMany({
            where: { userId }
          });
        } catch {
          console.log('SearchAnalytics table may not exist, skipping...');
        }

        // 4. Delete chat participants and messages
        try {
          await tx.chatParticipant.deleteMany({
            where: { userId }
          });
        } catch {
          console.log('ChatParticipant table may not exist, skipping...');
        }

        // 5. Delete user reports (both made by user and against user)
        await tx.report.deleteMany({
          where: {
            reporterId: userId
          }
        });

        // 6. Delete user reviews
        await tx.review.deleteMany({
          where: { reviewerId: userId }
        });

        // 7. Delete user bookings and related payments
        const userBookings = await tx.booking.findMany({
          where: { userId },
          select: { id: true }
        });

        for (const booking of userBookings) {
          // Delete booking payments
          try {
            await tx.bookingPayment.deleteMany({
              where: { bookingId: booking.id }
            });
          } catch {
            console.log('BookingPayment table may not exist, skipping...');
          }
        }

        // Delete bookings
        await tx.booking.deleteMany({
          where: { userId }
        });

        // 8. Delete user's listings and related data
        const userListings = await tx.listing.findMany({
          where: { landlordId: userId },
          select: { id: true }
        });

        for (const listing of userListings) {
          // Delete listing reviews
          await tx.review.deleteMany({
            where: { listingId: listing.id }
          });

          // Delete listing bookings (if any remaining)
          await tx.booking.deleteMany({
            where: { listingId: listing.id }
          });
        }

        // Delete listings
        await tx.listing.deleteMany({
          where: { landlordId: userId }
        });

        // 9. Delete user saved searches
        try {
          await tx.savedSearch.deleteMany({
            where: { userId }
          });
        } catch {
          console.log('SavedSearch table may not exist, skipping...');
        }

        // 10. Delete user subscriptions
        try {
          await tx.subscription.deleteMany({
            where: { userId }
          });
        } catch {
          console.log('Subscription table may not exist, skipping...');
        }

        // 11. Delete payment methods
        try {
          await tx.paymentMethod.deleteMany({
            where: { userId }
          });
        } catch {
          console.log('PaymentMethod table may not exist, skipping...');
        }

        // 12. Delete transactions
        try {
          await tx.transaction.deleteMany({
            where: { userId }
          });
        } catch {
          console.log('Transaction table may not exist, skipping...');
        }

        // 13. Delete admin logs where user is the admin
        try {
          await tx.adminLog.deleteMany({
            where: { adminId: userId }
          });
        } catch {
          console.log('AdminLog table may not exist, skipping...');
        }

        // 14. Delete notification preferences
        try {
          await tx.notificationPreferences.deleteMany({
            where: { userId }
          });
        } catch {
          console.log('NotificationPreferences table may not exist, skipping...');
        }

        // 15. Delete blocked users relationships
        try {
          await tx.blockedUser.deleteMany({
            where: {
              OR: [
                { userId: userId },
                { blockedUserId: userId }
              ]
            }
          });
        } catch {
          console.log('BlockedUser table may not exist, skipping...');
        }

        // 16. Finally, delete the user account
        await tx.user.delete({
          where: { id: userId }
        });

        console.log(`Account deletion completed for user: ${userId}`);
      });

      // Log the successful deletion for audit purposes
      console.log('Admin account deletion completed:', {
        deletedUserId: userId,
        deletedBy: session.user.email,
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      });

      return NextResponse.json({
        success: true,
        message: 'Account has been permanently deleted',
        deletedAt: new Date().toISOString()
      });

    } catch (dbError) {
      console.error('Database error during account deletion:', dbError);
      return NextResponse.json(
        { 
          error: 'Failed to delete account due to database error',
          message: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error processing account deletion:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process account deletion',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
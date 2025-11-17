import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();
    const { listingId } = await params;

    let status: string;
    switch (action) {
      case 'approve':
        status = 'APPROVED';
        break;
      case 'reject':
        status = 'REJECTED';
        break;
      case 'ban':
        status = 'BANNED';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: { status },
      select: {
        id: true,
        title: true,
        status: true,
        landlord: {
          select: {
            email: true
          }
        }
      }
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        action: `LISTING_${action.toUpperCase()}`,
        targetId: listingId,
        targetType: 'LISTING',
        details: `${action} listing "${updatedListing.title}"`
      }
    });

    // Send notification to landlord (you can implement email notification here)
    // await sendListingStatusNotification(updatedListing.landlord.email, status);

    return NextResponse.json({ success: true, listing: updatedListing });
  } catch (error) {
    console.error('Listing action error:', error);
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}
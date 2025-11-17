import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();
    const { reviewId } = await params;

    let status: string;
    switch (action) {
      case 'approve':
        status = 'APPROVED';
        break;
      case 'reject':
        status = 'REJECTED';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: { status },
      select: {
        id: true,
        comment: true,
        status: true,
        reviewer: {
          select: {
            email: true
          }
        },
        listing: {
          select: {
            title: true
          }
        }
      }
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        action: `REVIEW_${action.toUpperCase()}`,
        targetId: reviewId,
        targetType: 'REVIEW',
        details: `${action} review for "${updatedReview.listing.title}"`
      }
    });

    // Update listing average rating if approved
    if (status === 'APPROVED') {
      const listingReviews = await prisma.review.findMany({
        where: {
          listingId: (await prisma.review.findUnique({ 
            where: { id: reviewId }, 
            select: { listingId: true } 
          }))?.listingId,
          status: 'APPROVED'
        },
        select: { rating: true }
      });

      const averageRating = listingReviews.reduce((sum, review) => sum + review.rating, 0) / listingReviews.length;

      await prisma.listing.update({
        where: { 
          id: (await prisma.review.findUnique({ 
            where: { id: reviewId }, 
            select: { listingId: true } 
          }))?.listingId 
        },
        data: { averageRating }
      });
    }

    return NextResponse.json({ success: true, review: updatedReview });
  } catch (error) {
    console.error('Review action error:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}
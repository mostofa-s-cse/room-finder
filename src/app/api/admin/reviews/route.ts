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

    const reviews = await prisma.review.findMany({
      select: {
        id: true,
        rating: true,
        comment: true,
        status: true,
        createdAt: true,
        reviewer: {
          select: {
            name: true
          }
        },
        listing: {
          select: {
            title: true
          }
        },
        _count: {
          select: {
            reports: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      status: review.status,
      createdAt: review.createdAt.toISOString(),
      reviewerName: review.reviewer.name,
      listingTitle: review.listing.title,
      reportCount: review._count.reports
    }));

    return NextResponse.json(formattedReviews);
  } catch (error) {
    console.error('Admin reviews fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
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

    const listings = await prisma.listing.findMany({
      select: {
        id: true,
        title: true,
        location: true,
        monthlyRent: true,
        status: true,
        createdAt: true,
        landlord: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            reports: true
          }
        },
        reports: {
          select: {
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedListings = listings.map(listing => ({
      id: listing.id,
      title: listing.title,
      location: listing.location,
      monthlyRent: listing.monthlyRent,
      status: listing.status,
      createdAt: listing.createdAt.toISOString(),
      landlordName: listing.landlord.name,
      reportCount: listing._count.reports,
      lastReported: listing.reports[0]?.createdAt.toISOString()
    }));

    return NextResponse.json(formattedListings);
  } catch (error) {
    console.error('Admin listings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}
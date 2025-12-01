import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, successResponse, requireAuth, getPaginationParams, paginatedSuccessResponse } from '@/lib/api-utils';
import { listingSchema } from '@/lib/validations';
import { Prisma } from '@prisma/client';
import { UserRole } from '@prisma/client';

// GET /api/listings - Get all listings with search and filters
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);

  // Parse search filters
  const query = searchParams.get('q') || '';
  const city = searchParams.get('city') || undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const roomType = searchParams.get('roomType') as 'SINGLE' | 'SHARED' | undefined;
  const amenities = searchParams.get('amenities') ? searchParams.get('amenities')!.split(',') : [];

  // Parse sortBy parameter and normalize it
  const sortByParam = searchParams.get('sortBy') || 'newest';
  let sortBy: 'price' | 'rating' | 'newest' = 'newest';
  let sortOrder: 'asc' | 'desc' = 'desc';

  if (sortByParam === 'price_asc') {
    sortBy = 'price';
    sortOrder = 'asc';
  } else if (sortByParam === 'price_desc') {
    sortBy = 'price';
    sortOrder = 'desc';
  } else if (sortByParam === 'rating') {
    sortBy = 'rating';
    sortOrder = 'desc';
  } else if (sortByParam === 'newest') {
    sortBy = 'newest';
    sortOrder = 'desc';
  }

  const where: Prisma.ListingWhereInput = {
    isPublished: true,
    ...(query && {
      OR: [
        { title: { contains: query } },
        { description: { contains: query } },
        { address: { contains: query } },
        { city: { contains: query } },
      ],
    }),
    ...(city && { city: { contains: city } }),
    ...(maxPrice && { price: { lte: maxPrice } }),
    ...(minPrice && { price: { gte: minPrice, ...(maxPrice && { lte: maxPrice }) } }),
    ...(roomType && { roomType }),
    // Note: JSON array filtering would need custom logic or database-specific queries
    // For now, we'll filter amenities in application logic after fetching
  };

  // Calculate order by
  let orderBy: Prisma.ListingOrderByWithRelationInput = {};
  switch (sortBy) {
    case 'price':
      orderBy = { price: sortOrder };
      break;
    case 'rating':
      orderBy = { ratingAvg: sortOrder };
      break;
    case 'newest':
    default:
      orderBy = { createdAt: sortOrder };
      break;
  }

  const [allListings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        landlord: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            bookings: true,
          },
        },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  // Filter by amenities in application logic (since amenities is JSON)
  const listings = amenities.length > 0 
    ? allListings.filter(listing => {
        const listingAmenities = Array.isArray(listing.amenities) ? listing.amenities : [];
        return amenities.every(amenity => listingAmenities.includes(amenity));
      })
    : allListings;

  return paginatedSuccessResponse(listings, total, page, limit);
});

// POST /api/listings - Create new listing (landlords only)
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAuth(request, [UserRole.LANDLORD]);
  
  const body = await request.json();
  const validatedData = listingSchema.parse(body);

  // Convert availableFrom string to Date if provided
  const { availableFrom, ...listingData } = validatedData;
  const availableFromDate = availableFrom ? new Date(availableFrom) : null;

  const listing = await prisma.listing.create({
    data: {
      ...listingData,
      availableFrom: availableFromDate,
      landlordId: session.user.id,
      lat: listingData.lat || null,
      lng: listingData.lng || null,
    },
    include: {
      landlord: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  return successResponse(listing, 201);
});
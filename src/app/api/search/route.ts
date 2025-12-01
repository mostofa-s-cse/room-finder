import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, successResponse, getPaginationParams, paginatedSuccessResponse } from '@/lib/api-utils';
import { searchSchema } from '@/lib/validations';
import { Prisma } from '@prisma/client';

// POST /api/search - Advanced search for listings
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const validatedData = searchSchema.parse(body);
  
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);

  // Build where clause
  const where: Prisma.ListingWhereInput = {
    isPublished: true,
    ...(validatedData.city && {
      city: {
        contains: validatedData.city,
      },
    }),
    ...(validatedData.maxPrice && {
      price: {
        lte: validatedData.maxPrice,
      },
    }),
    ...(validatedData.minPrice && {
      price: {
        ...validatedData.maxPrice ? { lte: validatedData.maxPrice } : {},
        gte: validatedData.minPrice,
      },
    }),
    ...(validatedData.roomType && {
      roomType: validatedData.roomType,
    }),
  };

  // Build order by
  let orderBy: Prisma.ListingOrderByWithRelationInput = {};
  switch (validatedData.sortBy) {
    case 'price':
      orderBy = { price: validatedData.sortOrder || 'asc' };
      break;
    case 'rating':
      orderBy = { ratingAvg: validatedData.sortOrder || 'desc' };
      break;
    case 'distance':
      // TODO: Implement distance-based sorting when location is provided
      orderBy = { createdAt: 'desc' };
      break;
    case 'newest':
    default:
      orderBy = { createdAt: validatedData.sortOrder || 'desc' };
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

  // Filter by amenities and minimum rating in application logic
  let filteredListings = allListings;

  if (validatedData.amenities && validatedData.amenities.length > 0) {
    filteredListings = filteredListings.filter(listing => {
      const listingAmenities = Array.isArray(listing.amenities) ? listing.amenities : [];
      return validatedData.amenities!.every(amenity => 
        listingAmenities.includes(amenity)
      );
    });
  }

  if (validatedData.minRating) {
    filteredListings = filteredListings.filter(listing => 
      listing.ratingAvg >= validatedData.minRating!
    );
  }

  // Calculate distance if user location is provided
  type ListingWithDistance = typeof filteredListings[0] & { distance?: number };
  let listingsWithDistance: ListingWithDistance[] = filteredListings;

  if (validatedData.userLat && validatedData.userLng) {
    listingsWithDistance = filteredListings
      .filter(listing => listing.lat !== null && listing.lng !== null)
      .map(listing => ({
        ...listing,
        distance: calculateDistance(
          validatedData.userLat!,
          validatedData.userLng!,
          listing.lat!,
          listing.lng!
        ),
      }));

    // Filter by max distance if specified
    if (validatedData.maxDistance) {
      listingsWithDistance = listingsWithDistance.filter(listing => 
        (listing.distance || 0) <= validatedData.maxDistance!
      );
    }

    // Sort by distance if requested
    if (validatedData.sortBy === 'distance') {
      listingsWithDistance.sort((a, b) => {
        const distanceA = a.distance || 0;
        const distanceB = b.distance || 0;
        return validatedData.sortOrder === 'desc' ? distanceB - distanceA : distanceA - distanceB;
      });
    }

    filteredListings = listingsWithDistance;
  }

  return paginatedSuccessResponse(filteredListings, total, page, limit);
});

// GET /api/search - Search listings with query parameters (for frontend compatibility)
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);

  // Check if this is a suggestions request
  const suggestionsQuery = searchParams.get('suggestions');
  if (suggestionsQuery !== null) {
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      return successResponse([]);
    }

    // Get city suggestions
    const citySuggestions = await prisma.listing.findMany({
      where: {
        isPublished: true,
        city: {
          contains: query,
        },
      },
      select: {
        city: true,
      },
      distinct: ['city'],
      take: 5,
    });

    // Get area suggestions from addresses
    const areaSuggestions = await prisma.listing.findMany({
      where: {
        isPublished: true,
        address: {
          contains: query,
        },
      },
      select: {
        address: true,
      },
      take: 5,
    });

    const suggestions = [
      ...citySuggestions.map(item => ({
        type: 'city',
        value: item.city,
        label: `${item.city} - City`,
      })),
      ...areaSuggestions.map(item => ({
        type: 'area',
        value: item.address,
        label: `${item.address} - Area`,
      })),
    ];

    return successResponse(suggestions);
  }

  // Parse search filters from query parameters
  const query = searchParams.get('q') || '';
  const city = searchParams.get('city') || '';
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const roomType = searchParams.get('roomType') as 'SINGLE' | 'SHARED' | undefined;
  const amenities = searchParams.get('amenities') ? searchParams.get('amenities')!.split(',') : [];
  const minRating = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined;
  const lat = searchParams.get('lat') ? Number(searchParams.get('lat')) : undefined;
  const lng = searchParams.get('lng') ? Number(searchParams.get('lng')) : undefined;
  const radius = searchParams.get('radius') ? Number(searchParams.get('radius')) : undefined;

  // Parse sortBy parameter and normalize it
  const sortByParam = searchParams.get('sortBy') || 'newest';
  let sortBy: 'price' | 'rating' | 'distance' | 'newest' = 'newest';
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
  } else if (sortByParam === 'distance') {
    sortBy = 'distance';
    sortOrder = 'asc';
  } else if (sortByParam === 'newest') {
    sortBy = 'newest';
    sortOrder = 'desc';
  }

  // Build where clause
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
    ...(city && {
      city: {
        contains: city,
      },
    }),
    ...(maxPrice && {
      price: {
        lte: maxPrice,
      },
    }),
    ...(minPrice && {
      price: {
        ...maxPrice ? { lte: maxPrice } : {},
        gte: minPrice,
      },
    }),
    ...(roomType && {
      roomType: roomType,
    }),
  };

  // Build order by
  let orderBy: Prisma.ListingOrderByWithRelationInput = {};
  switch (sortBy) {
    case 'price':
      orderBy = { price: sortOrder };
      break;
    case 'rating':
      orderBy = { ratingAvg: sortOrder };
      break;
    case 'distance':
      // Distance sorting will be handled after fetching
      orderBy = { createdAt: 'desc' };
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

  // Filter by amenities and minimum rating in application logic
  let filteredListings = allListings;

  if (amenities && amenities.length > 0) {
    filteredListings = filteredListings.filter(listing => {
      const listingAmenities = Array.isArray(listing.amenities) ? listing.amenities : [];
      return amenities.every(amenity => 
        listingAmenities.includes(amenity)
      );
    });
  }

  if (minRating) {
    filteredListings = filteredListings.filter(listing => 
      listing.ratingAvg >= minRating
    );
  }

  // Calculate distance if user location is provided
  type ListingWithDistance = typeof filteredListings[0] & { distance?: number };
  let listingsWithDistance: ListingWithDistance[] = filteredListings;

  if (lat && lng) {
    listingsWithDistance = filteredListings
      .filter(listing => listing.lat !== null && listing.lng !== null)
      .map(listing => ({
        ...listing,
        distance: calculateDistance(
          lat,
          lng,
          listing.lat!,
          listing.lng!
        ),
      }));

    // Filter by max distance if specified
    if (radius) {
      listingsWithDistance = listingsWithDistance.filter(listing => 
        (listing.distance || 0) <= radius
      );
    }

    // Sort by distance if requested
    if (sortBy === 'distance') {
      listingsWithDistance.sort((a, b) => {
        const distanceA = a.distance || 0;
        const distanceB = b.distance || 0;
        return sortOrder === 'desc' ? distanceB - distanceA : distanceA - distanceB;
      });
    }

    filteredListings = listingsWithDistance;
  }

  return paginatedSuccessResponse(filteredListings, total, page, limit);
});

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}
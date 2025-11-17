import { Prisma } from '@prisma/client';

// Base Prisma types for type safety
export type ListingWithRelations = Prisma.ListingGetPayload<{
  include: {
    landlord: {
      select: {
        id: true;
        name: true;
        profilePicture: true;
        status: true;
        createdAt: true;
        _count: {
          select: {
            listings: true;
            reviews: true;
          };
        };
      };
    };
    reviews: {
      select: {
        rating: true;
        createdAt: true;
      };
    };
    _count: {
      select: {
        reviews: true;
        bookings: true;
      };
    };
  };
}>;

export type Review = {
  rating: number;
  createdAt: Date;
};

export type ListingWhereInput = Prisma.ListingWhereInput;
export type ListingOrderByWithRelationInput = Prisma.ListingOrderByWithRelationInput;

export interface SearchQuery {
  where: ListingWhereInput;
  include: {
    landlord: {
      select: {
        id: true;
        name: true;
        profilePicture: true;
        status: true;
        createdAt: true;
        _count: {
          select: {
            listings: true;
            reviews: true;
          };
        };
      };
    };
    reviews: {
      select: {
        rating: true;
        createdAt: true;
      };
      take: number;
      orderBy: { createdAt: 'desc' };
    };
    _count: {
      select: {
        reviews: true;
        bookings: true;
      };
    };
  };
}
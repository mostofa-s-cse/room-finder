import { prisma } from './prisma';
import { SearchFilters } from '@/types';

// User utilities
export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      income: true,
      affordablePrice: true,
      transportMode: true,
      createdAt: true,
      updatedAt: true,
    }
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email }
  });
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  role: 'BACHELOR' | 'LANDLORD' | 'ADMIN';
  phone?: string;
}) {
  return prisma.user.create({
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    }
  });
}

// Listing utilities
export async function getListings(filters: SearchFilters = {}) {
  const {
    city,
    maxPrice,
    minPrice,
    roomType,
    amenities,
    minRating,
    sortBy = 'newest',
    sortOrder = 'desc'
  } = filters;

  const where: Record<string, unknown> = {
    isPublished: true,
  };

  if (city) {
    where.city = {
      contains: city,
      mode: 'insensitive'
    };
  }

  if (maxPrice !== undefined || minPrice !== undefined) {
    where.price = {};
    if (maxPrice !== undefined) {
      (where.price as Record<string, unknown>).lte = maxPrice;
    }
    if (minPrice !== undefined) {
      (where.price as Record<string, unknown>).gte = minPrice;
    }
  }

  if (roomType) {
    where.roomType = roomType;
  }

  if (amenities && amenities.length > 0) {
    where.amenities = {
      array_contains: amenities
    };
  }

  if (minRating !== undefined) {
    where.ratingAvg = { gte: minRating };
  }

  const orderBy: Record<string, string> = {};
  switch (sortBy) {
    case 'price':
      orderBy.price = sortOrder;
      break;
    case 'rating':
      orderBy.ratingAvg = sortOrder;
      break;
    case 'newest':
    default:
      orderBy.createdAt = sortOrder;
      break;
  }

  return prisma.listing.findMany({
    where,
    include: {
      landlord: {
        select: {
          id: true,
          name: true,
          phone: true,
        }
      },
      reviews: {
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      }
    },
    orderBy
  });
}

export async function getListingById(id: string, userId?: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      landlord: {
        select: {
          id: true,
          name: true,
          phone: true,
        }
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      },
      bookings: userId ? {
        where: { userId },
        select: {
          id: true,
          status: true,
          amount: true,
          createdAt: true,
        }
      } : false
    }
  });

  return listing;
}

export async function createListing(data: {
  landlordId: string;
  title: string;
  description: string;
  price: number;
  city: string;
  address: string;
  lat: number;
  lng: number;
  roomType: 'SINGLE' | 'SHARED';
  amenities: string[];
  images: string[];
}) {
  return prisma.listing.create({
    data,
    include: {
      landlord: {
        select: {
          id: true,
          name: true,
          phone: true,
        }
      }
    }
  });
}

export async function updateListing(id: string, landlordId: string, data: Partial<{
  title: string;
  description: string;
  price: number;
  city: string;
  address: string;
  lat: number;
  lng: number;
  roomType: 'SINGLE' | 'SHARED';
  amenities: string[];
  images: string[];
  isPublished: boolean;
}>) {
  return prisma.listing.update({
    where: { 
      id,
      landlordId // Ensure only the owner can update
    },
    data
  });
}

export async function deleteListing(id: string, landlordId: string) {
  return prisma.listing.delete({
    where: { 
      id,
      landlordId // Ensure only the owner can delete
    }
  });
}

// Review utilities
export async function createReview(data: {
  listingId: string;
  reviewerId: string;
  rating: number;
  comment: string;
}) {
  // Create the review
  const review = await prisma.review.create({
    data,
    include: {
      reviewer: {
        select: {
          id: true,
          name: true,
        }
      }
    }
  });

  // Update listing rating
  await updateListingRating(data.listingId);

  return review;
}

export async function updateListingRating(listingId: string) {
  const reviews = await prisma.review.findMany({
    where: { listingId },
    select: { rating: true }
  });

  if (reviews.length > 0) {
    const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    
    await prisma.listing.update({
      where: { id: listingId },
      data: {
        ratingAvg: parseFloat(avgRating.toFixed(1)),
        ratingCount: reviews.length
      }
    });
  }
}

// Booking utilities
export async function createBooking(data: {
  listingId: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  amount: number;
  currency?: string;
}) {
  return prisma.booking.create({
    data: {
      ...data,
      currency: data.currency || 'BDT',
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          price: true,
          landlord: {
            select: {
              id: true,
              name: true,
              phone: true,
            }
          }
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        }
      }
    }
  });
}

export async function updateBookingStatus(id: string, status: 'PENDING' | 'PAID' | 'CANCELLED', stripeSessionId?: string) {
  return prisma.booking.update({
    where: { id },
    data: {
      status,
      ...(stripeSessionId && { stripeSessionId })
    }
  });
}

// Chat utilities
export async function getChatThreads(userId: string) {
  return prisma.chatThread.findMany({
    where: {
      participants: {
        some: {
          userId: userId
        }
      }
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          createdAt: true,
          senderId: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

export async function getChatThread(userId: string, otherUserId: string) {
  return prisma.chatThread.findFirst({
    where: {
      AND: [
        {
          participants: {
            some: {
              userId: userId
            }
          }
        },
        {
          participants: {
            some: {
              userId: otherUserId
            }
          }
        }
      ]
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      },
      messages: {
        include: {
          sender: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });
}

export async function createOrGetChatThread(userId: string, otherUserId: string) {
  let thread = await getChatThread(userId, otherUserId);
  
  if (!thread) {
    thread = await prisma.chatThread.create({
      data: {
        participants: {
          create: [
            { userId: userId },
            { userId: otherUserId }
          ]
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        messages: {
          include: {
            sender: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }
  
  return thread;
}

export async function createChatMessage(data: {
  threadId: string;
  senderId: string;
  content: string;
}) {
  return prisma.chatMessage.create({
    data,
    include: {
      sender: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      }
    }
  });
}

// Admin utilities
export async function getAdminStats() {
  const [
    totalUsers,
    totalBachelors,
    totalLandlords,
    totalListings,
    publishedListings,
    totalReviews,
    totalBookings,
    paidBookings
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'BACHELOR' } }),
    prisma.user.count({ where: { role: 'LANDLORD' } }),
    prisma.listing.count(),
    prisma.listing.count({ where: { isPublished: true } }),
    prisma.review.count(),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'PAID' } })
  ]);

  return {
    users: {
      total: totalUsers,
      bachelors: totalBachelors,
      landlords: totalLandlords,
    },
    listings: {
      total: totalListings,
      published: publishedListings,
    },
    reviews: totalReviews,
    bookings: {
      total: totalBookings,
      paid: paidBookings,
    }
  };
}

export async function getTopRatedAreas(limit: number = 10) {
  const result = await prisma.listing.groupBy({
    by: ['city'],
    where: {
      isPublished: true,
      ratingCount: { gt: 0 }
    },
    _avg: {
      ratingAvg: true
    },
    _count: {
      id: true
    },
    orderBy: {
      _avg: {
        ratingAvg: 'desc'
      }
    },
    take: limit
  });

  return result.map(item => ({
    city: item.city,
    averageRating: item._avg.ratingAvg || 0,
    listingCount: item._count.id
  }));
}

export async function getMostAffordableAreas(limit: number = 10) {
  const result = await prisma.listing.groupBy({
    by: ['city'],
    where: {
      isPublished: true
    },
    _avg: {
      price: true
    },
    _count: {
      id: true
    },
    orderBy: {
      _avg: {
        price: 'asc'
      }
    },
    take: limit
  });

  return result.map(item => ({
    city: item.city,
    averagePrice: item._avg.price || 0,
    listingCount: item._count.id
  }));
}
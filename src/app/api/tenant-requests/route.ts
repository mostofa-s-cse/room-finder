import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, requireAuth, ApiErrorClass, errorResponse } from '@/lib/api-utils';
import { tenantRequestSchema } from '@/lib/validations';
import { UserRole } from '@prisma/client';

// POST /api/tenant-requests - Create tenant request (Bachelor only)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request, [UserRole.BACHELOR]);
    const body = await request.json();

    // Validate input
    const validatedData = tenantRequestSchema.parse(body);

    // Get listing info and landlord
    const listing = await prisma.listing.findUnique({
      where: { id: validatedData.listingId },
      include: {
        landlord: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!listing) {
      throw new ApiErrorClass('Listing not found', 'NOT_FOUND', 404);
    }

    if (listing.landlordId === session.user.id) {
      throw new ApiErrorClass('Cannot request your own listing', 'INVALID_REQUEST', 400);
    }

    // Check if request already exists
    const existingRequest = await prisma.tenantRequest.findFirst({
      where: {
        bachelorId: session.user.id,
        listingId: validatedData.listingId,
        status: { in: ['PENDING', 'APPROVED'] }
      }
    });

    if (existingRequest) {
      throw new ApiErrorClass('You already have an active request for this listing', 'DUPLICATE_REQUEST', 400);
    }

    // Create tenant request
    const tenantRequest = await prisma.tenantRequest.create({
      data: {
        bachelorId: session.user.id,
        landlordId: listing.landlordId,
        listingId: validatedData.listingId,
        message: validatedData.message,
        moveInDate: new Date(validatedData.moveInDate),
        duration: validatedData.duration,
        budget: validatedData.budget,
        profession: validatedData.profession,
        company: validatedData.company,
        monthlyIncome: validatedData.monthlyIncome,
        references: validatedData.references || [],
        emergencyContact: validatedData.emergencyContact,
      },
      include: {
        bachelor: {
          select: { id: true, name: true, email: true, phone: true }
        },
        landlord: {
          select: { id: true, name: true, email: true }
        },
        listing: {
          select: { id: true, title: true, address: true, price: true }
        }
      }
    });

    // Create notification for landlord
    await prisma.notificationModel.create({
      data: {
        userId: listing.landlordId,
        type: 'TENANT_REQUEST',
        title: 'New Tenant Application',
        message: `${session.user.name} has applied for your listing "${listing.title}"`,
        data: {
          requestId: tenantRequest.id,
          listingId: listing.id,
          bachelorId: session.user.id,
        },
        priority: 'MEDIUM',
        category: 'REQUEST',
        actionUrl: `/dashboard/landlord?tab=requests&requestId=${tenantRequest.id}`,
      }
    });

    return successResponse(tenantRequest);
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiErrorClass) {
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Internal server error', 'INTERNAL_ERROR', 500));
  }
}

// GET /api/tenant-requests - Get tenant requests (Bachelor: own requests, Landlord: received requests)
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request, [UserRole.BACHELOR, UserRole.LANDLORD]);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const whereCondition: Record<string, unknown> = {};
    const include = {
      bachelor: {
        select: { id: true, name: true, email: true, phone: true }
      },
      landlord: {
        select: { id: true, name: true, email: true }
      },
      listing: {
        select: { id: true, title: true, address: true, price: true, images: true }
      }
    };

    if (session.user.role === 'BACHELOR') {
      whereCondition.bachelorId = session.user.id;
    } else if (session.user.role === 'LANDLORD') {
      whereCondition.landlordId = session.user.id;
    }

    if (status) {
      whereCondition.status = status;
    }

    const [requests, total] = await Promise.all([
      prisma.tenantRequest.findMany({
        where: whereCondition,
        include,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tenantRequest.count({ where: whereCondition })
    ]);

    return successResponse({
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiErrorClass) {
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Internal server error', 'INTERNAL_ERROR', 500));
  }
}
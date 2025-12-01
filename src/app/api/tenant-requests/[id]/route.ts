import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, requireAuth, ApiErrorClass, errorResponse } from '@/lib/api-utils';
import { tenantRequestResponseSchema } from '@/lib/validations';
import { UserRole } from '@prisma/client';

// GET /api/tenant-requests/[id] - Get specific tenant request
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    if (!resolvedParams?.id) {
      throw new ApiErrorClass('Request ID is required', 'MISSING_PARAMETER', 400);
    }

    const session = await requireAuth(request, [UserRole.BACHELOR, UserRole.LANDLORD]);

    const tenantRequest = await prisma.tenantRequest.findUnique({
      where: { id: resolvedParams.id },
      include: {
        bachelor: {
          select: { id: true, name: true, email: true, phone: true }
        },
        landlord: {
          select: { id: true, name: true, email: true }
        },
        listing: {
          select: { 
            id: true, 
            title: true, 
            address: true, 
            price: true, 
            images: true,
            amenities: true,
            roomType: true
          }
        }
      }
    });

    if (!tenantRequest) {
      throw new ApiErrorClass('Tenant request not found', 'NOT_FOUND', 404);
    }

    // Check permissions
    if (session.user.role === 'BACHELOR' && tenantRequest.bachelorId !== session.user.id) {
      throw new ApiErrorClass('Access denied', 'ACCESS_DENIED', 403);
    }
    if (session.user.role === 'LANDLORD' && tenantRequest.landlordId !== session.user.id) {
      throw new ApiErrorClass('Access denied', 'ACCESS_DENIED', 403);
    }

    return successResponse(tenantRequest);
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiErrorClass) {
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Internal server error', 'INTERNAL_ERROR', 500));
  }
}

// PUT /api/tenant-requests/[id] - Respond to tenant request (Landlord only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    if (!resolvedParams?.id) {
      throw new ApiErrorClass('Request ID is required', 'MISSING_PARAMETER', 400);
    }

    const session = await requireAuth(request, [UserRole.LANDLORD]);
    const body = await request.json();

    // Validate input
    const validatedData = tenantRequestResponseSchema.parse(body);

    // Get existing request
    const existingRequest = await prisma.tenantRequest.findUnique({
      where: { id: resolvedParams.id },
      include: {
        bachelor: {
          select: { id: true, name: true, email: true }
        },
        listing: {
          select: { id: true, title: true }
        }
      }
    });

    if (!existingRequest) {
      throw new ApiErrorClass('Tenant request not found', 'NOT_FOUND', 404);
    }

    if (existingRequest.landlordId !== session.user.id) {
      throw new ApiErrorClass('Access denied', 'ACCESS_DENIED', 403);
    }

    if (existingRequest.status !== 'PENDING') {
      throw new ApiErrorClass('Request has already been responded to', 'INVALID_STATE', 400);
    }

    // Update request
    const updatedRequest = await prisma.tenantRequest.update({
      where: { id: resolvedParams.id },
      data: {
        status: validatedData.status,
        landlordResponse: validatedData.response,
        respondedAt: new Date(),
      },
      include: {
        bachelor: {
          select: { id: true, name: true, email: true }
        },
        landlord: {
          select: { id: true, name: true, email: true }
        },
        listing: {
          select: { id: true, title: true, address: true, price: true }
        }
      }
    });

    // Create notification for bachelor
    await prisma.notificationModel.create({
      data: {
        userId: existingRequest.bachelorId,
        type: 'REQUEST_RESPONSE',
        title: `Tenant Request ${validatedData.status}`,
        message: `Your application for "${existingRequest.listing.title}" has been ${validatedData.status.toLowerCase()}`,
        data: {
          requestId: updatedRequest.id,
          listingId: existingRequest.listing.id,
          landlordId: session.user.id,
          status: validatedData.status,
        },
        priority: validatedData.status === 'APPROVED' ? 'HIGH' : 'MEDIUM',
        category: 'RESPONSE',
        actionUrl: `/dashboard/bachelor?tab=requests&requestId=${updatedRequest.id}`,
      }
    });

    return successResponse(updatedRequest);
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiErrorClass) {
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Internal server error', 'INTERNAL_ERROR', 500));
  }
}

// DELETE /api/tenant-requests/[id] - Withdraw tenant request (Bachelor only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    if (!resolvedParams?.id) {
      throw new ApiErrorClass('Request ID is required', 'MISSING_PARAMETER', 400);
    }

    const session = await requireAuth(request, [UserRole.BACHELOR]);

    // Get existing request
    const existingRequest = await prisma.tenantRequest.findUnique({
      where: { id: resolvedParams.id },
      include: {
        listing: {
          select: { id: true, title: true }
        }
      }
    });

    if (!existingRequest) {
      throw new ApiErrorClass('Tenant request not found', 'NOT_FOUND', 404);
    }

    if (existingRequest.bachelorId !== session.user.id) {
      throw new ApiErrorClass('Access denied', 'ACCESS_DENIED', 403);
    }

    if (existingRequest.status !== 'PENDING') {
      throw new ApiErrorClass('Cannot withdraw request that has been responded to', 'INVALID_STATE', 400);
    }

    // Update status to withdrawn
    const withdrawnRequest = await prisma.tenantRequest.update({
      where: { id: resolvedParams.id },
      data: {
        status: 'WITHDRAWN',
      }
    });

    return successResponse(withdrawnRequest);
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiErrorClass) {
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Internal server error', 'INTERNAL_ERROR', 500));
  }
}
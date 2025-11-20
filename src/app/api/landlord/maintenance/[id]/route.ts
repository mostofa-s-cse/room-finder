import { NextRequest } from 'next/server';
import { successResponse, requireAuth, ApiErrorClass, errorResponse } from '@/lib/api-utils';
import { UserRole } from '@prisma/client';

// PATCH /api/landlord/maintenance/[id] - Update maintenance request status
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    if (!resolvedParams?.id) {
      throw new ApiErrorClass('Maintenance ID is required', 'MISSING_PARAMETER', 400);
    }

    await requireAuth(request, [UserRole.LANDLORD]);
    const body = await request.json();
    const { status } = body;

    if (!status) {
      throw new ApiErrorClass('Status is required', 'MISSING_PARAMETER', 400);
    }

    // For now, just return success since we don't have maintenance model yet
    // TODO: Implement proper maintenance request update with database
    const updatedRequest = {
      id: resolvedParams.id,
      status,
      updatedAt: new Date().toISOString(),
    };

    return successResponse(updatedRequest);
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiErrorClass) {
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Internal server error', 'INTERNAL_ERROR', 500));
  }
}
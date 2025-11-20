import { NextRequest } from 'next/server';
import { successResponse, requireAuth, ApiErrorClass, errorResponse } from '@/lib/api-utils';
import { UserRole } from '@prisma/client';

// GET /api/landlord/maintenance - Get landlord's maintenance requests
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, [UserRole.LANDLORD]);

    // For now, return mock data since we don't have maintenance model yet
    // TODO: Implement proper maintenance request system with database
    const maintenanceRequests = [
      {
        id: '1',
        title: 'Leaking Faucet',
        description: 'Kitchen faucet is leaking and needs repair',
        status: 'PENDING',
        priority: 'MEDIUM',
        tenant: {
          id: 'tenant1',
          name: 'John Doe',
          email: 'john@example.com',
        },
        listing: {
          id: 'listing1',
          title: 'Single Room in Dhanmondi',
          address: 'Road 2, Dhanmondi',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'AC Not Working',
        description: 'Air conditioning unit stopped working',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        tenant: {
          id: 'tenant2',
          name: 'Jane Smith',
          email: 'jane@example.com',
        },
        listing: {
          id: 'listing2',
          title: 'Shared Room in Gulshan',
          address: 'Road 11, Gulshan',
        },
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updatedAt: new Date().toISOString(),
      },
    ];

    return successResponse(maintenanceRequests);
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiErrorClass) {
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Internal server error', 'INTERNAL_ERROR', 500));
  }
}
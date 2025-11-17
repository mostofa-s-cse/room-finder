import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, successResponse, requireAuth, ApiErrorClass } from '@/lib/api-utils';
import { profileUpdateSchema } from '@/lib/validations';

// GET /api/users/profile - Get current user profile
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAuth(request);
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
      _count: {
        select: {
          listings: true,
          reviews: true,
          bookings: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiErrorClass('User not found', 'USER_NOT_FOUND', 404);
  }

  return successResponse(user);
});

// PUT /api/users/profile - Update current user profile
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAuth(request);
  
  const body = await request.json();
  const validatedData = profileUpdateSchema.parse(body);

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(validatedData.name && { name: validatedData.name }),
      ...(validatedData.phone && { phone: validatedData.phone }),
      ...(validatedData.income !== undefined && { income: validatedData.income }),
      ...(validatedData.affordablePrice !== undefined && { affordablePrice: validatedData.affordablePrice }),
      ...(validatedData.transportMode && { transportMode: validatedData.transportMode }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      income: true,
      affordablePrice: true,
      transportMode: true,
      updatedAt: true,
    },
  });

  return successResponse(updatedUser);
});
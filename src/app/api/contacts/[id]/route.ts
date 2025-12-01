import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, successResponse, requireAuth, ApiErrorClass } from '@/lib/api-utils';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const responseSchema = z.object({
  response: z.string().min(10, 'Response must be at least 10 characters').max(2000, 'Response must be less than 2000 characters'),
  status: z.enum(['PENDING', 'RESPONDED', 'CLOSED']).optional().default('RESPONDED'),
});

// GET /api/contacts/[id] - Get specific contact (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    await requireAuth(request, [UserRole.ADMIN]);
    const { id } = await params;

    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new ApiErrorClass('Contact not found', 'CONTACT_NOT_FOUND', 404);
    }

    return successResponse(contact);
  })(request);
}

// PUT /api/contacts/[id] - Respond to contact (admin only)  
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const session = await requireAuth(request, [UserRole.ADMIN]);
    const body = await request.json();
    const validatedData = responseSchema.parse(body);
    const { id } = await params;

    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new ApiErrorClass('Contact not found', 'CONTACT_NOT_FOUND', 404);
    }

    const updatedContact = await prisma.contact.update({
      where: { id },
      data: {
        response: validatedData.response,
        status: validatedData.status,
        respondedAt: new Date(),
        respondedBy: session.user.id,
      },
    });

    // TODO: Send email response to user
    // You can integrate with email service here

    return successResponse(updatedContact);
  })(request);
}

// DELETE /api/contacts/[id] - Delete contact (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    await requireAuth(request, [UserRole.ADMIN]);
    const { id } = await params;

    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new ApiErrorClass('Contact not found', 'CONTACT_NOT_FOUND', 404);
    }

    await prisma.contact.delete({
      where: { id },
    });

    return successResponse({ message: 'Contact deleted successfully' });
  })(request);
}
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, successResponse, requireAuth, getPaginationParams, paginatedSuccessResponse } from '@/lib/api-utils';
import { contactSchema } from '@/lib/validations';
import { UserRole } from '@prisma/client';

// POST /api/contacts - Submit contact form
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const validatedData = contactSchema.parse(body);

  // Create contact submission
  const contact = await prisma.contact.create({
    data: {
      name: validatedData.name,
      email: validatedData.email,
      subject: validatedData.subject,
      category: validatedData.category,
      message: validatedData.message,
    },
  });

  // TODO: Send email notification to admin team
  // You can integrate with email service like SendGrid, Nodemailer, etc.
  
  return successResponse(
    { 
      id: contact.id,
      message: 'Thank you for your message! We will get back to you within 24 hours.' 
    }, 
    201
  );
});

// GET /api/contacts - Get all contact submissions (admin only)
export const GET = withErrorHandling(async (request: NextRequest) => {
  await requireAuth(request, [UserRole.ADMIN]);
  
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);
  const status = searchParams.get('status') || undefined;

  const where = {
    ...(status && { status }),
  };

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.contact.count({ where }),
  ]);

  return paginatedSuccessResponse(contacts, total, page, limit);
});
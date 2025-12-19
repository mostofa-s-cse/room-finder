import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, ApiErrorClass } from '@/lib/api-utils';

const verifySchema = z.object({
  userId: z.string().cuid().optional(),
  email: z.string().email('Invalid email').optional(),
  code: z.string().length(6, 'OTP must be 6 digits'),
}).refine((data) => data.userId || data.email, {
  message: 'User identifier is required',
  path: ['userId'],
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const validated = verifySchema.parse(body);

  let userId = validated.userId;

  if (!userId && validated.email) {
    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
      select: { id: true, emailVerifiedAt: true },
    });

    if (!user) {
      throw new ApiErrorClass('Account not found for this email.', 'USER_NOT_FOUND', 404);
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json({ success: true, message: 'Email already verified.' });
    }

    userId = user.id;
  }

  if (!userId) {
    throw new ApiErrorClass('Missing user identifier', 'MISSING_USER', 400);
  }

  const token = await prisma.emailVerificationToken.findFirst({
    where: {
      userId,
      code: validated.code,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!token) {
    throw new ApiErrorClass('Invalid or expired code. Please request a new one.', 'INVALID_OTP', 400);
  }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: 'Email verified successfully. You can now sign in.',
  });
});

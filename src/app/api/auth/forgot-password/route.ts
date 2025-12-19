import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/api-utils';
import { emailService } from '@/lib/notifications/email-service';

const requestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { email } = requestSchema.parse(body);
  const normalizedEmail = email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, name: true },
  });

  // Always return success to avoid account enumeration
  if (!user) {
    return NextResponse.json({
      success: true,
      message: 'If an account exists, a reset link has been sent to the email provided.',
    });
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    }),
  ]);

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${rawToken}`;
  await emailService.sendPasswordResetEmail(
    user.email,
    user.name || 'there',
    rawToken,
  );

  return NextResponse.json({
    success: true,
    message: 'If an account exists, a reset link has been sent to the email provided.',
    resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined,
  });
});

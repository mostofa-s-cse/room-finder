import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, ApiErrorClass } from '@/lib/api-utils';

const resetSchema = z.object({
  token: z.string().min(10, 'Invalid reset token'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { token, password } = resetSchema.parse(body);

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true, userId: true },
  });

  if (!resetToken) {
    throw new ApiErrorClass('Reset link is invalid or has expired. Please request a new one.', 'INVALID_TOKEN', 400);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: {
        userId: resetToken.userId,
        id: { not: resetToken.id },
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: 'Password has been reset successfully. You can now sign in with your new password.',
  });
});

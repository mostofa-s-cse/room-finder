import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, ApiErrorClass } from '@/lib/api-utils';
import { emailService } from '@/lib/notifications/email-service';

const resendSchema = z.object({
  email: z.string().email('Invalid email'),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { email } = resendSchema.parse(body);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true, name: true, emailVerifiedAt: true },
  });

  if (!user) {
    throw new ApiErrorClass('Account not found for this email.', 'USER_NOT_FOUND', 404);
  }

  if (user.emailVerifiedAt) {
    return NextResponse.json({ success: true, message: 'Email already verified.' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } }),
    prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    }),
  ]);

  const bodyHtml = `Your Room Finder verification code is <strong>${code}</strong>. It expires in 10 minutes.`;
  await emailService.sendRawEmail({
    to: user.email,
    subject: 'Verify your Room Finder account',
    html: bodyHtml,
    text: `Your Room Finder verification code is ${code}. It expires in 10 minutes.`,
  });

  return NextResponse.json({ success: true, message: 'A new verification code was sent to your email.' });
});

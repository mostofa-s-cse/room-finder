import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { withErrorHandling, ApiErrorClass } from '@/lib/api-utils';
import { emailService } from '@/lib/notifications/email-service';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['BACHELOR', 'LANDLORD']),
  phone: z.string().optional(),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const validatedData = signupSchema.parse(body);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: validatedData.email }
  });

  if (existingUser) {
    throw new ApiErrorClass(
      'An account with this email address already exists. Please use a different email or try signing in.',
      'DUPLICATE_EMAIL',
      409
    );
  }

  // Validate password strength
  if (validatedData.password.length < 8) {
    throw new ApiErrorClass(
      'Password must be at least 8 characters long for security.',
      'WEAK_PASSWORD',
      400
    );
  }

  // Hash password
  const passwordHash = await bcrypt.hash(validatedData.password, 12);

  // Create user as unverified
  const user = await prisma.user.create({
    data: {
      name: validatedData.name,
      email: validatedData.email,
      passwordHash,
      role: validatedData.role as UserRole,
      phone: validatedData.phone,
      emailVerifiedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      createdAt: true,
      emailVerifiedAt: true,
    }
  });

  // Generate a 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Clean up any previous tokens for this user
  await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });

  // Store the OTP with expiry (10 minutes)
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  // Send verification email (no-op if email not configured)
  const bodyHtml = `Your Room Finder verification code is <strong>${code}</strong>. It expires in 10 minutes.`;
  await emailService.sendRawEmail({
    to: user.email,
    subject: 'Verify your Room Finder account',
    html: bodyHtml,
    text: `Your Room Finder verification code is ${code}. It expires in 10 minutes.`
  });

  return NextResponse.json({
    success: true,
    message: 'Account created successfully. Enter the verification code sent to your email to finish signup.',
    user,
  }, { status: 201 });
});
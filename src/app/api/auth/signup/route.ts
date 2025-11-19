import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { withErrorHandling, ApiErrorClass } from '@/lib/api-utils';

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

  // Create user
  const user = await prisma.user.create({
    data: {
      name: validatedData.name,
      email: validatedData.email,
      passwordHash,
      role: validatedData.role as UserRole,
      phone: validatedData.phone,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      createdAt: true,
    }
  });

  return NextResponse.json({
    success: true,
    message: 'Account created successfully! You can now sign in.',
    user
  }, { status: 201 });
});
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { ZodSchema } from 'zod';

export interface ApiError {
  message: string;
  code: string;
  details?: unknown;
}

export class ApiErrorClass extends Error {
  public code: string;
  public statusCode: number;
  public details?: unknown;

  constructor(message: string, code: string, statusCode: number = 500, details?: unknown) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Error response helper
export function errorResponse(error: ApiErrorClass | Error, statusCode?: number): NextResponse {
  if (error instanceof ApiErrorClass) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  return NextResponse.json(
    {
      error: {
        message: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    },
    { status: statusCode || 500 }
  );
}

// Success response helper
export function successResponse<T>(data: T, statusCode: number = 200): NextResponse {
  return NextResponse.json({ data }, { status: statusCode });
}

// Success response helper for paginated data (avoids double wrapping)
export function paginatedSuccessResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  statusCode: number = 200
): NextResponse {
  const totalPages = Math.ceil(total / limit);
  
  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  }, { status: statusCode });
}

// Authentication middleware
export async function requireAuth(request: NextRequest, allowedRoles?: UserRole[]) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new ApiErrorClass('Authentication required', 'UNAUTHORIZED', 401);
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role as UserRole)) {
    throw new ApiErrorClass('Insufficient permissions', 'FORBIDDEN', 403);
  }

  return session;
}

// Validation helper
export async function validateBody<T>(request: NextRequest, schema: ZodSchema<T>): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiErrorClass('Invalid request body', 'VALIDATION_ERROR', 400, error.message);
    }
    throw new ApiErrorClass('Invalid request body', 'VALIDATION_ERROR', 400);
  }
}

// Pagination helper
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function getPaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// Pagination response helper
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}

// Handle API route with error catching
type RouteContext = { params: Record<string, string> } | { params: Promise<Record<string, string>> } | undefined;

export function withErrorHandling(
  handler: (request: NextRequest, context?: RouteContext) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: RouteContext): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof ApiErrorClass) {
        return errorResponse(error);
      }
      
      return errorResponse(new ApiErrorClass(
        'Internal server error',
        'INTERNAL_ERROR',
        500
      ));
    }
  };
}

// Request method helper
export function onlyMethods(allowedMethods: string[]) {
  return (request: NextRequest) => {
    if (!allowedMethods.includes(request.method)) {
      throw new ApiErrorClass(
        `Method ${request.method} not allowed`,
        'METHOD_NOT_ALLOWED',
        405
      );
    }
  };
}

// Rate limiting helper (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  key: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now();
  const rateLimitInfo = rateLimitMap.get(key);

  if (!rateLimitInfo || now > rateLimitInfo.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (rateLimitInfo.count >= maxRequests) {
    return false;
  }

  rateLimitInfo.count++;
  return true;
}

// Get client IP
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}
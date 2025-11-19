import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { ZodSchema, ZodError } from 'zod';
import { Prisma } from '@prisma/client';

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

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.issues.map((issue: any) => ({
            field: issue.path.join('.'),
            message: issue.message,
            code: issue.code
          }))
        },
      },
      { status: 400 }
    );
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    let message = 'Database error occurred';
    let statusCode = 500;
    
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        const target = error.meta?.target as string[] | undefined;
        message = `A record with this ${target?.[0] || 'field'} already exists`;
        statusCode = 409;
        break;
      case 'P2025': // Record not found
        message = 'The requested resource was not found';
        statusCode = 404;
        break;
      case 'P2003': // Foreign key constraint violation
        message = 'Invalid reference to related resource';
        statusCode = 400;
        break;
      case 'P2014': // Required relation missing
        message = 'Missing required relationship data';
        statusCode = 400;
        break;
      default:
        message = 'Database operation failed';
        break;
    }
    
    return NextResponse.json(
      {
        error: {
          message,
          code: 'DATABASE_ERROR',
          details: { prismaCode: error.code }
        },
      },
      { status: statusCode }
    );
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      {
        error: {
          message: 'Invalid data provided to database',
          code: 'VALIDATION_ERROR',
          details: 'Please check the data format and try again'
        },
      },
      { status: 400 }
    );
  }

  // Handle JSON parse errors
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return NextResponse.json(
      {
        error: {
          message: 'Invalid JSON format',
          code: 'INVALID_JSON',
        },
      },
      { status: 400 }
    );
  }

  // Generic error fallback
  return NextResponse.json(
    {
      error: {
        message: 'An unexpected error occurred. Please try again later.',
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
    throw new ApiErrorClass('Please sign in to access this resource', 'UNAUTHORIZED', 401);
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role as UserRole)) {
    const roleNames = {
      [UserRole.ADMIN]: 'administrator',
      [UserRole.LANDLORD]: 'landlord',
      [UserRole.BACHELOR]: 'bachelor'
    };
    
    const requiredRoles = allowedRoles.map(role => roleNames[role]).join(' or ');
    throw new ApiErrorClass(
      `This action requires ${requiredRoles} privileges. Your current role: ${roleNames[session.user.role as UserRole]}`,
      'FORBIDDEN',
      403
    );
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
      // Log error with more context
      console.error('API Error:', {
        method: request.method,
        url: request.url,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Return appropriate error response
      return errorResponse(error as Error);
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
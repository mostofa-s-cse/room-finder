import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, successResponse, requireAuth, ApiErrorClass, getPaginationParams, paginatedSuccessResponse } from '@/lib/api-utils';
import { createChatThreadSchema } from '@/lib/validations';
import { UserRole, Prisma } from '@prisma/client';

// GET /api/chat/threads - Get chat threads for current user
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAuth(request);
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(searchParams);

  const where: Prisma.ChatThreadWhereInput = {
    participants: {
      some: {
        userId: session.user.id,
      },
    },
  };

  const [threads, total] = await Promise.all([
    prisma.chatThread.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      skip,
      take: limit,
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    }),
    prisma.chatThread.count({ where }),
  ]);

  return paginatedSuccessResponse(threads, total, page, limit);
});

// POST /api/chat/threads - Create new chat thread
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await requireAuth(request);
  
  const body = await request.json();
  const validatedData = createChatThreadSchema.parse(body);

  // Check if participant exists
  const participant = await prisma.user.findUnique({
    where: { id: validatedData.participantId },
    select: { id: true, role: true },
  });

  if (!participant) {
    throw new ApiErrorClass('Participant not found', 'USER_NOT_FOUND', 404);
  }

  // Validate role compatibility
  if (session.user.role === UserRole.BACHELOR) {
    if (participant.role !== UserRole.LANDLORD) {
      throw new ApiErrorClass('Can only start chat with landlords', 'INVALID_PARTICIPANT', 400);
    }
  } else if (session.user.role === UserRole.LANDLORD) {
    if (participant.role !== UserRole.BACHELOR) {
      throw new ApiErrorClass('Can only start chat with bachelors', 'INVALID_PARTICIPANT', 400);
    }
  } else {
    throw new ApiErrorClass('Admins cannot create chat threads', 'FORBIDDEN', 403);
  }

  // Check if thread already exists between these users
  const existingThread = await prisma.chatThread.findFirst({
    where: {
      AND: [
        {
          participants: {
            some: {
              userId: session.user.id,
            },
          },
        },
        {
          participants: {
            some: {
              userId: validatedData.participantId,
            },
          },
        },
      ],
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (existingThread) {
    return successResponse(existingThread);
  }

  // Create new thread with participants
  const result = await prisma.$transaction(async (tx) => {
    // Create the thread
    const thread = await tx.chatThread.create({
      data: {
        type: 'DIRECT',
        isActive: true,
      },
    });

    // Add participants
    await tx.chatParticipant.createMany({
      data: [
        {
          userId: session.user.id,
          threadId: thread.id,
          role: 'MEMBER',
        },
        {
          userId: validatedData.participantId,
          threadId: thread.id,
          role: 'MEMBER',
        },
      ],
    });

    return thread;
  });

  // Return the complete thread with relations
  const thread = await prisma.chatThread.findUnique({
    where: { id: result.id },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });

  return successResponse(thread, 201);
});
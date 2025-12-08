import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, requireAuth, ApiErrorClass, errorResponse } from '@/lib/api-utils';
import { UserRole } from '@prisma/client';

// GET /api/chat/threads - Get chat threads for current user
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);

    const threads = await prisma.chatThread.findMany({
      where: {
        participants: {
          some: {
            userId: session.user.id,
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                profilePicture: true,
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
                    email: true,
                    profilePicture: true,
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
            address: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                sender: {
                  userId: { not: session.user.id }
                },
                readAt: null
              }
            },
          },
        },
      },
    });

    // Transform the data to match frontend interface
    const transformedThreads = threads.map(thread => {
      const otherParticipant = thread.participants.find(p => p.userId !== session.user.id)?.user;
      const lastMessage = thread.messages[0];
      
      return {
        id: thread.id,
        participantId: otherParticipant?.id || '',
        participantName: otherParticipant?.name || 'Unknown User',
        participantAvatar: otherParticipant?.profilePicture || (
          otherParticipant?.email
            ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(otherParticipant.email)}`
            : undefined
        ),
        participantRole: otherParticipant?.role || 'BACHELOR',
        lastMessage: lastMessage?.content || 'No messages yet',
        lastMessageTime: lastMessage?.createdAt || thread.createdAt,
        unreadCount: thread._count.messages,
        listingId: thread.listingId,
        listingTitle: thread.listing?.title,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt
      };
    });

    return successResponse(transformedThreads);
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiErrorClass) {
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Internal server error', 'INTERNAL_ERROR', 500));
  }
}

// POST /api/chat/threads - Create new chat thread
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const { participantId, listingId, initialMessage } = await request.json();

    if (!participantId) {
      return errorResponse(new ApiErrorClass('Participant ID is required', 'VALIDATION_ERROR', 400));
    }

    // Check if participant exists
    const participant = await prisma.user.findUnique({
      where: { id: participantId },
      select: { id: true, role: true },
    });

    if (!participant) {
      return errorResponse(new ApiErrorClass('Participant not found', 'USER_NOT_FOUND', 404));
    }

    // Validate role compatibility
    if (session.user.role === UserRole.BACHELOR) {
      if (participant.role !== UserRole.LANDLORD) {
        return errorResponse(new ApiErrorClass('Can only start chat with landlords', 'INVALID_PARTICIPANT', 400));
      }
    } else if (session.user.role === UserRole.LANDLORD) {
      if (participant.role !== UserRole.BACHELOR) {
        return errorResponse(new ApiErrorClass('Can only start chat with bachelors', 'INVALID_PARTICIPANT', 400));
      }
    } else {
      return errorResponse(new ApiErrorClass('Admins cannot create chat threads', 'FORBIDDEN', 403));
    }

    // Check if thread already exists between these users for the same listing
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
                userId: participantId,
              },
            },
          },
          {
            listingId: listingId || null
          }
        ],
      }
    });

    if (existingThread) {
      return successResponse({ threadId: existingThread.id });
    }

    // Create new thread with participants
    const result = await prisma.$transaction(async (tx) => {
      // Create the thread
      const thread = await tx.chatThread.create({
        data: {
          type: 'DIRECT',
          isActive: true,
          listingId: listingId || null,
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
            userId: participantId,
            threadId: thread.id,
            role: 'MEMBER',
          },
        ],
      });

      // Send initial message if provided
      if (initialMessage) {
        const senderParticipant = await tx.chatParticipant.findFirst({
          where: {
            threadId: thread.id,
            userId: session.user.id
          }
        });

        if (senderParticipant) {
          await tx.chatMessage.create({
            data: {
              threadId: thread.id,
              senderId: senderParticipant.id,
              content: initialMessage
            }
          });

          // Update thread's lastMessageAt
          await tx.chatThread.update({
            where: { id: thread.id },
            data: { lastMessageAt: new Date() }
          });
        }
      }

      return thread;
    });

    return successResponse({ threadId: result.id }, 201);
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiErrorClass) {
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Internal server error', 'INTERNAL_ERROR', 500));
  }
}
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, requireAuth, ApiErrorClass, errorResponse } from '@/lib/api-utils';

// GET /api/chat/threads/[id] - Get specific chat thread
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { id: threadId } = await params;

    const thread = await prisma.chatThread.findFirst({
      where: {
        id: threadId,
        participants: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        },
        listing: {
          select: {
            id: true,
            title: true,
            address: true
          }
        }
      }
    });

    if (!thread) {
      return errorResponse(new ApiErrorClass('Chat thread not found', 'THREAD_NOT_FOUND', 404));
    }

    // Find the other participant
    const otherParticipantData = thread.participants.find(
      (p: { userId: string; user: { id: string; name: string; role: string } }) => p.userId !== session.user.id
    )?.user;
    
    if (!otherParticipantData) {
      return errorResponse(new ApiErrorClass('Other participant not found', 'PARTICIPANT_NOT_FOUND', 404));
    }

    const transformedThread = {
      id: thread.id,
      participantId: otherParticipantData.id,
      participantName: otherParticipantData.name,
      participantAvatar: undefined,
      participantRole: otherParticipantData.role,
      listingId: thread.listingId,
      listingTitle: thread.listing?.title,
      lastMessageAt: thread.lastMessageAt || thread.createdAt,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt
    };

    return successResponse(transformedThread);
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiErrorClass) {
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Internal server error', 'INTERNAL_ERROR', 500));
  }
}
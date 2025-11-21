import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, requireAuth, ApiErrorClass, errorResponse } from '@/lib/api-utils';

// POST /api/chat/threads/[id]/mark-read - Mark all messages in thread as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { id: threadId } = await params;

    // Find the user's participant record for this thread
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        threadId: threadId,
        userId: session.user.id
      }
    });

    if (!participant) {
      return errorResponse(new ApiErrorClass('Access denied to this chat thread', 'ACCESS_DENIED', 403));
    }

    // Update all unread messages to read for this user
    // Mark messages as read by updating the readAt field for messages not sent by the current user
    await prisma.chatMessage.updateMany({
      where: {
        threadId: threadId,
        sender: {
          userId: { not: session.user.id }
        },
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    // Update participant's last seen time
    await prisma.chatParticipant.update({
      where: { id: participant.id },
      data: { lastSeenAt: new Date() }
    });

    return successResponse({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiErrorClass) {
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Internal server error', 'INTERNAL_ERROR', 500));
  }
}
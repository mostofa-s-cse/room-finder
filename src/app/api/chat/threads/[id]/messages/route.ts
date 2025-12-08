import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, requireAuth, ApiErrorClass, errorResponse } from '@/lib/api-utils';

// GET /api/chat/threads/[id]/messages - Get messages for a chat thread
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { id: threadId } = await params;

    // Verify user is participant in this thread
    const participantCheck = await prisma.chatParticipant.findFirst({
      where: {
        threadId: threadId,
        userId: session.user.id
      }
    });

    if (!participantCheck) {
      return errorResponse(new ApiErrorClass('Access denied to this chat thread', 'ACCESS_DENIED', 403));
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        threadId: threadId
      },
      include: {
        sender: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                email: true,
                profilePicture: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Transform messages to match frontend interface
    const transformedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      senderId: message.sender.userId,
      senderName: message.sender.user.name,
      senderAvatar: message.sender.user.profilePicture || (
        message.sender.user.email 
          ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(message.sender.user.email)}`
          : undefined
      ),
      createdAt: message.createdAt,
      isRead: message.readAt !== null,
      type: message.type || 'TEXT',
      metadata: message.metadata || undefined
    }));

    return successResponse(transformedMessages);
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiErrorClass) {
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Internal server error', 'INTERNAL_ERROR', 500));
  }
}

// POST /api/chat/threads/[id]/messages - Send a message to a chat thread
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    const { id: threadId } = await params;
    const { content, type = 'TEXT', metadata } = await request.json();

    if (!content && type === 'TEXT') {
      return errorResponse(new ApiErrorClass('Message content is required', 'VALIDATION_ERROR', 400));
    }

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

    // Create the message
    const message = await prisma.chatMessage.create({
      data: {
        threadId: threadId,
        senderId: participant.id,
        content: content?.trim() || '',
        type: type || 'TEXT',
        metadata: metadata || null
      },
      include: {
        sender: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Update the thread's lastMessageAt
    await prisma.chatThread.update({
      where: { id: threadId },
      data: { 
        lastMessageAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Transform message to match frontend interface
    const transformedMessage = {
      id: message.id,
      content: message.content,
      senderId: message.sender.userId,
      senderName: message.sender.user.name,
      senderAvatar: message.sender.user.email 
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(message.sender.user.email)}`
        : undefined,
      createdAt: message.createdAt,
      isRead: false,
      type: message.type || 'TEXT',
      metadata: message.metadata || undefined
    };

    return successResponse(transformedMessage, 201);
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiErrorClass) {
      return errorResponse(error);
    }
    return errorResponse(new ApiErrorClass('Internal server error', 'INTERNAL_ERROR', 500));
  }
}
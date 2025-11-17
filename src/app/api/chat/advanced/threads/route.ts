import { NextRequest } from 'next/server';
import { withErrorHandling, successResponse, errorResponse } from '@/lib/api-utils';
import { chatService } from '@/lib/chat/chat-service';
import { ThreadType } from '@/lib/chat/types';

// Simple session helper since we don't have access to the auth system
async function getSession(request: NextRequest) {
  // This would normally use NextAuth's getServerSession
  // For now, we'll mock a user ID from headers or cookies
  const userId = request.headers.get('x-user-id') || 'mock-user-id';
  return { user: { id: userId } };
}

// GET /api/chat/advanced/threads - Get user's chat threads
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getSession(request);
  if (!session?.user?.id) {
    return errorResponse(new Error('Unauthorized'), 401);
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || undefined;
  const type = searchParams.get('type') as ThreadType || undefined;
  const includeArchived = searchParams.get('includeArchived') === 'true';

  const result = await chatService.getThreads({
    page,
    limit,
    search,
    type,
    includeArchived
  }, session.user.id);

  return successResponse(result);
});

// POST /api/chat/advanced/threads - Create a new chat thread
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await getSession(request);
  if (!session?.user?.id) {
    return errorResponse(new Error('Unauthorized'), 401);
  }

  const body = await request.json();
  const { type, title, participantIds, listingId, initialMessage } = body;

  if (!type || !participantIds || !Array.isArray(participantIds)) {
    return errorResponse(new Error('Missing required fields: type, participantIds'), 400);
  }

  const result = await chatService.createThread({
    type,
    title,
    participantIds,
    listingId,
    initialMessage
  }, session.user.id);

  if (!result.success) {
    return errorResponse(new Error(result.error || 'Failed to create thread'), 400);
  }

  return successResponse(result.thread);
});
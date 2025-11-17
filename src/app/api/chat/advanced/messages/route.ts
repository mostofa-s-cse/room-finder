import { NextRequest, NextResponse } from 'next/server';
import { chatService } from '@/lib/chat/chat-service';
import { MessageType } from '@/lib/chat/types';

// Simple session helper
async function getSession(request: NextRequest) {
  const userId = request.headers.get('x-user-id') || 'mock-user-id';
  return { user: { id: userId } };
}

// GET /api/chat/advanced/messages - Get messages for a thread
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before') || undefined;
    const after = searchParams.get('after') || undefined;

    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
    }

    const result = await chatService.getMessages({
      threadId,
      page,
      limit,
      before,
      after
    }, session.user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/chat/advanced/messages - Send a message
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { threadId, content, type = MessageType.TEXT, replyTo, metadata } = body;

    if (!threadId || !content) {
      return NextResponse.json({ error: 'Thread ID and content are required' }, { status: 400 });
    }

    const result = await chatService.sendMessage({
      threadId,
      content,
      type,
      replyTo,
      metadata
    }, session.user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send message' }, { status: 400 });
    }

    return NextResponse.json(result.message);
  } catch (error) {
    console.error('POST message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/chat/advanced/messages - Mark messages as read
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { threadId, messageIds } = body;

    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 });
    }

    const success = await chatService.markMessagesAsRead(threadId, session.user.id, messageIds);

    if (!success) {
      return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
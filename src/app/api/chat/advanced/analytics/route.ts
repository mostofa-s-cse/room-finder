import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simple authentication helper
async function getUser(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return null;
    }
    
    return await prisma.user.findUnique({
      where: { id: userId }
    });
  } catch {
    return null;
  }
}

// GET /api/chat/advanced/analytics - Get chat analytics
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    const threadId = searchParams.get('threadId');

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Base where clause for user's threads
    const baseWhere = {
      participants: {
        some: {
          userId: user.id
        }
      },
      createdAt: {
        gte: startDate
      }
    };

    // Add thread filter if specified
    const whereClause = threadId ? { ...baseWhere, id: threadId } : baseWhere;

    // Get message counts
    const totalMessages = await prisma.chatMessage.count({
      where: {
        thread: whereClause,
        createdAt: {
          gte: startDate
        }
      }
    });

    const sentMessages = await prisma.chatMessage.count({
      where: {
        thread: whereClause,
        senderId: user.id,
        createdAt: {
          gte: startDate
        }
      }
    });

    const receivedMessages = totalMessages - sentMessages;

    // Get thread count
    const activeThreads = await prisma.chatThread.count({
      where: whereClause
    });

    // Get message count for response metrics
    const messageCount = await prisma.chatMessage.count({
      where: {
        thread: whereClause,
        senderId: user.id,
        createdAt: {
          gte: startDate
        }
      }
    });

    const analytics = {
      period,
      metrics: {
        totalMessages,
        sentMessages,
        receivedMessages,
        activeThreads,
        userMessageCount: messageCount,
        avgResponseTime: null // Would need more complex query for actual response time
      },
      trends: {
        messagesPerDay: Math.round(totalMessages / (period === '1d' ? 1 : period === '7d' ? 7 : 30)),
        activeThreadsGrowth: 0 // Would need historical data
      }
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/chat/advanced/analytics - Record analytics event
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { threadId, eventType, metadata } = body;

    if (!threadId || !eventType) {
      return NextResponse.json({ error: 'Thread ID and event type are required' }, { status: 400 });
    }

    // For now, just log the analytics event
    // In a real app, you'd store this in an analytics table
    console.log('Analytics event:', {
      userId: user.id,
      threadId,
      eventType,
      metadata,
      timestamp: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics recording error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
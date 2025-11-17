import { prisma } from '../prisma';
import {
  ChatThread,
  ChatMessage,
  CreateThreadRequest,
  CreateThreadResponse,
  SendMessageRequest,
  SendMessageResponse,
  GetThreadsRequest,
  GetThreadsResponse,
  GetMessagesRequest,
  GetMessagesResponse,
  ThreadType,
  MessageType,
  MessageStatus,
  ParticipantRole
} from './types';
import { getChatSocketServer } from './socket-server';

export class ChatService {
  private static instance: ChatService;

  private constructor() {}

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /**
   * Create a new chat thread
   */
  async createThread(request: CreateThreadRequest, creatorId: string): Promise<CreateThreadResponse> {
    try {
      const { type, title, participantIds, listingId, initialMessage } = request;

      // Validate participants
      if (!participantIds.includes(creatorId)) {
        participantIds.push(creatorId);
      }

      // For direct threads, ensure only 2 participants
      if (type === ThreadType.DIRECT && participantIds.length !== 2) {
        return {
          thread: undefined as unknown as ChatThread,
          success: false,
          error: 'Direct threads must have exactly 2 participants'
        };
      }

      // Check if direct thread already exists between these users
      if (type === ThreadType.DIRECT) {
        const existingThread = await this.findDirectThread(participantIds[0], participantIds[1]);
        if (existingThread) {
          return {
            thread: existingThread,
            success: true
          };
        }
      }

      // Create thread
      const thread = await prisma.chatThread.create({
        data: {
          type,
          title,
          listingId,
          participants: {
            create: participantIds.map((userId) => ({
              userId,
              role: userId === creatorId ? ParticipantRole.OWNER : ParticipantRole.MEMBER,
              isOnline: false
            }))
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
              monthlyRent: true,
              images: true
            }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Send initial message if provided
      if (initialMessage) {
        const creatorParticipant = thread.participants.find(p => p.userId === creatorId);
        if (creatorParticipant) {
          await this.sendMessage({
            threadId: thread.id,
            content: initialMessage,
            type: MessageType.TEXT
          }, creatorParticipant.id);
        }
      }

      // Transform to client format
      const clientThread = this.transformThreadForClient(thread);

      // Notify participants via socket
      const socketServer = getChatSocketServer();
      if (socketServer) {
        socketServer.sendMessageToThread(thread.id, 'thread:created', { thread: clientThread });
      }

      return {
        thread: clientThread,
        success: true
      };
    } catch (error) {
      console.error('Create thread error:', error);
      return {
        thread: undefined as unknown as ChatThread,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create thread'
      };
    }
  }

  /**
   * Send a message in a thread
   */
  async sendMessage(request: SendMessageRequest, senderId: string): Promise<SendMessageResponse> {
    try {
      const { threadId, content, type, replyTo, metadata } = request;

      // Get participant
      const participant = await prisma.chatParticipant.findFirst({
        where: {
          userId: senderId,
          threadId
        }
      });

      if (!participant) {
        return {
          message: undefined as unknown as ChatMessage,
          success: false,
          error: 'Not authorized to send message in this thread'
        };
      }

      // Create message
      const message = await prisma.chatMessage.create({
        data: {
          threadId,
          senderId: participant.id,
          content,
          type,
          replyToId: replyTo,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
        },
        include: {
          sender: {
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
          replyTo: {
            include: {
              sender: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Update thread last message timestamp
      await prisma.chatThread.update({
        where: { id: threadId },
        data: { lastMessageAt: new Date() }
      });

      // Transform to client format
      const clientMessage = this.transformMessageForClient(message);

      // Notify via socket
      const socketServer = getChatSocketServer();
      if (socketServer) {
        socketServer.sendMessageToThread(threadId, 'message:sent', {
          message: clientMessage,
          threadId
        });
      }

      return {
        message: clientMessage,
        success: true
      };
    } catch (error) {
      console.error('Send message error:', error);
      return {
        message: undefined as unknown as ChatMessage,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      };
    }
  }

  /**
   * Get threads for a user
   */
  async getThreads(request: GetThreadsRequest, userId: string): Promise<GetThreadsResponse> {
    try {
      const { page = 1, limit = 20, search, type, includeArchived = false } = request;
      const skip = (page - 1) * limit;

      const whereClause: Record<string, unknown> = {
        participants: {
          some: {
            userId
          }
        },
        isActive: includeArchived ? undefined : true
      };

      if (type) {
        whereClause.type = type;
      }

      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          {
            participants: {
              some: {
                user: {
                  name: { contains: search, mode: 'insensitive' }
                }
              }
            }
          }
        ];
      }

      const [threads, total] = await Promise.all([
        prisma.chatThread.findMany({
          where: whereClause,
          orderBy: [
            { isPinned: 'desc' },
            { lastMessageAt: 'desc' },
            { createdAt: 'desc' }
          ],
          skip,
          take: limit,
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
                monthlyRent: true,
                images: true
              }
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: {
                sender: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        }),
        prisma.chatThread.count({ where: whereClause })
      ]);

      // Transform to client format and calculate unread counts
      const clientThreads = await Promise.all(
        threads.map(async (thread) => {
          const clientThread = this.transformThreadForClient(thread);
          
          // Calculate unread count for this user
          const userParticipant = thread.participants.find(p => p.userId === userId);
          if (userParticipant) {
            const unreadCount = await this.getUnreadMessageCount(thread.id, userParticipant.id);
            clientThread.unreadCount = unreadCount;
          }

          return clientThread;
        })
      );

      return {
        threads: clientThreads,
        total,
        page,
        limit,
        hasMore: total > page * limit
      };
    } catch (error) {
      console.error('Get threads error:', error);
      return {
        threads: [],
        total: 0,
        page: request.page || 1,
        limit: request.limit || 20,
        hasMore: false
      };
    }
  }

  /**
   * Get messages in a thread
   */
  async getMessages(request: GetMessagesRequest, userId: string): Promise<GetMessagesResponse> {
    try {
      const { threadId, page = 1, limit = 50, before, after } = request;

      // Verify user is participant
      const participant = await prisma.chatParticipant.findFirst({
        where: {
          userId,
          threadId
        }
      });

      if (!participant) {
        return {
          messages: [],
          total: 0,
          page,
          limit,
          hasMore: false
        };
      }

      const whereClause: Record<string, unknown> = { threadId };

      if (before) {
        whereClause.createdAt = { lt: new Date(before) };
      }

      if (after) {
        whereClause.createdAt = { gt: new Date(after) };
      }

      const [messages, total] = await Promise.all([
        prisma.chatMessage.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            sender: {
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
            replyTo: {
              include: {
                sender: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            },
            readReceipts: {
              include: {
                participant: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        }),
        prisma.chatMessage.count({ where: whereClause })
      ]);

      // Transform to client format
      const clientMessages = messages.map(message => this.transformMessageForClient(message));

      // Reverse to get chronological order
      clientMessages.reverse();

      return {
        messages: clientMessages,
        total,
        page,
        limit,
        hasMore: total > page * limit
      };
    } catch (error) {
      console.error('Get messages error:', error);
      return {
        messages: [],
        total: 0,
        page: request.page || 1,
        limit: request.limit || 50,
        hasMore: false
      };
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(threadId: string, userId: string, messageIds?: string[]): Promise<boolean> {
    try {
      const participant = await prisma.chatParticipant.findFirst({
        where: {
          userId,
          threadId
        }
      });

      if (!participant) {
        return false;
      }

      const whereClause: Record<string, unknown> = {
        threadId,
        senderId: { not: participant.id } // Don't mark own messages as read
      };

      if (messageIds && messageIds.length > 0) {
        whereClause.id = { in: messageIds };
      }

      // Get messages to mark as read
      const messages = await prisma.chatMessage.findMany({
        where: whereClause,
        select: { id: true }
      });

      // Create read receipts
      const readReceipts = messages.map(message => ({
        messageId: message.id,
        participantId: participant.id
      }));

      if (readReceipts.length > 0) {
        await prisma.messageReadReceipt.createMany({
          data: readReceipts,
          skipDuplicates: true
        });

        // Notify via socket
        const socketServer = getChatSocketServer();
        if (socketServer) {
          messages.forEach(message => {
            socketServer.sendMessageToThread(threadId, 'message:read', {
              messageId: message.id,
              threadId,
              participantId: participant.id
            });
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Mark messages as read error:', error);
      return false;
    }
  }

  /**
   * Search messages
   */
  async searchMessages(query: string, userId: string, threadId?: string): Promise<ChatMessage[]> {
    try {
      const whereClause: Record<string, unknown> = {
        content: { contains: query, mode: 'insensitive' },
        thread: {
          participants: {
            some: { userId }
          }
        }
      };

      if (threadId) {
        whereClause.threadId = threadId;
      }

      const messages = await prisma.chatMessage.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          sender: {
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
          thread: {
            select: {
              id: true,
              title: true,
              type: true
            }
          }
        }
      });

      return messages.map(message => this.transformMessageForClient(message));
    } catch (error) {
      console.error('Search messages error:', error);
      return [];
    }
  }

  // Helper methods
  private async findDirectThread(userId1: string, userId2: string): Promise<ChatThread | null> {
    const thread = await prisma.chatThread.findFirst({
      where: {
        type: ThreadType.DIRECT,
        participants: {
          every: {
            userId: { in: [userId1, userId2] }
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
            monthlyRent: true,
            images: true
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return thread ? this.transformThreadForClient(thread) : null;
  }

  private async getUnreadMessageCount(threadId: string, participantId: string): Promise<number> {
    return await prisma.chatMessage.count({
      where: {
        threadId,
        senderId: { not: participantId },
        readReceipts: {
          none: {
            participantId
          }
        }
      }
    });
  }

  private transformThreadForClient(thread: Record<string, unknown>): ChatThread {
    return {
      id: thread.id as string,
      type: thread.type as ThreadType,
      title: thread.title as string,
      description: thread.description as string,
      avatar: thread.avatar as string,
      listingId: thread.listingId as string,
      isActive: thread.isActive as boolean,
      isPinned: thread.isPinned as boolean,
      isMuted: thread.isMuted as boolean,
      lastMessageAt: thread.lastMessageAt as Date,
      createdAt: thread.createdAt as Date,
      updatedAt: thread.updatedAt as Date,
      participants: (thread.participants as Array<Record<string, unknown>>).map((p) => ({
        id: p.id as string,
        userId: p.userId as string,
        threadId: p.threadId as string,
        role: p.role as ParticipantRole,
        joinedAt: p.joinedAt as Date,
        lastSeenAt: p.lastSeenAt as Date,
        isOnline: p.isOnline as boolean,
        isMuted: p.isMuted as boolean,
        isBlocked: p.isBlocked as boolean,
        user: p.user as unknown,
        name: (p.user as Record<string, unknown>).name as string,
        avatar: undefined,
        thread: undefined as unknown as ChatThread
      })) as unknown[],
      messages: (thread.messages as Array<Record<string, unknown>>)?.map((m) => this.transformMessageForClient(m)) || [],
      listing: thread.listing ? {
        id: (thread.listing as Record<string, unknown>).id as string,
        title: (thread.listing as Record<string, unknown>).title as string,
        price: (thread.listing as Record<string, unknown>).monthlyRent as number,
        images: (thread.listing as Record<string, unknown>).images as string[]
      } : undefined,
      lastMessage: (thread.messages as Array<Record<string, unknown>>)?.[0] ? this.transformMessageForClient((thread.messages as Array<Record<string, unknown>>)[0]) : undefined
    } as ChatThread;
  }

  private transformMessageForClient(message: Record<string, unknown>): ChatMessage {
    return {
      id: message.id as string,
      threadId: message.threadId as string,
      senderId: message.senderId as string,
      content: message.content as string,
      type: message.type as MessageType,
      status: message.status as MessageStatus,
      metadata: message.metadata as Record<string, unknown>,
      replyTo: message.replyToId as string,
      createdAt: message.createdAt as Date,
      updatedAt: message.updatedAt as Date,
      deliveredAt: message.deliveredAt as Date,
      readAt: message.readAt as Date,
      editedAt: message.editedAt as Date,
      sender: {
        id: (message.sender as Record<string, unknown>).id as string,
        userId: (message.sender as Record<string, unknown>).userId as string,
        threadId: (message.sender as Record<string, unknown>).threadId as string,
        role: (message.sender as Record<string, unknown>).role as ParticipantRole,
        joinedAt: (message.sender as Record<string, unknown>).joinedAt as Date,
        lastSeenAt: (message.sender as Record<string, unknown>).lastSeenAt as Date,
        isOnline: (message.sender as Record<string, unknown>).isOnline as boolean,
        isMuted: (message.sender as Record<string, unknown>).isMuted as boolean,
        isBlocked: (message.sender as Record<string, unknown>).isBlocked as boolean,
        user: (message.sender as Record<string, unknown>).user as unknown,
        name: ((message.sender as Record<string, unknown>).user as Record<string, unknown>).name as string,
        avatar: undefined,
        thread: undefined as unknown as ChatThread
      } as unknown,
      thread: undefined as unknown as ChatThread,
      replies: (message.replies as Array<Record<string, unknown>>)?.map((r) => this.transformMessageForClient(r)) || [],
      parentMessage: message.replyTo ? this.transformMessageForClient(message.replyTo as Record<string, unknown>) : undefined,
      readReceipts: ((message.readReceipts as Array<Record<string, unknown>>)?.map((r) => ({
        id: r.id as string,
        messageId: r.messageId as string,
        participantId: r.participantId as string,
        readAt: r.readAt as Date,
        message: undefined as unknown as ChatMessage,
        participant: {
          id: (r.participant as Record<string, unknown>).id as string,
          userId: (r.participant as Record<string, unknown>).userId as string,
          threadId: (r.participant as Record<string, unknown>).threadId as string,
          role: (r.participant as Record<string, unknown>).role as ParticipantRole,
          joinedAt: (r.participant as Record<string, unknown>).joinedAt as Date,
          lastSeenAt: (r.participant as Record<string, unknown>).lastSeenAt as Date,
          isOnline: (r.participant as Record<string, unknown>).isOnline as boolean,
          isMuted: (r.participant as Record<string, unknown>).isMuted as boolean,
          isBlocked: (r.participant as Record<string, unknown>).isBlocked as boolean,
          user: (r.participant as Record<string, unknown>).user as unknown,
          name: ((r.participant as Record<string, unknown>).user as Record<string, unknown>).name as string,
          avatar: undefined,
          thread: undefined as unknown as ChatThread
        }
      }) as unknown) || []) as unknown[],
      attachments: ((message.attachments as Array<Record<string, unknown>>)?.map((a) => ({
        id: a.id as string,
        messageId: a.messageId as string,
        fileName: a.fileName as string,
        fileUrl: a.fileUrl as string,
        fileType: a.fileType as string,
        fileSize: a.fileSize as number,
        thumbnailUrl: a.thumbnailUrl as string,
        message: undefined as unknown as ChatMessage
      })) || []) as unknown[]
    } as ChatMessage;
  }
}

export const chatService = ChatService.getInstance();
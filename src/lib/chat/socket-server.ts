import { Server as NetServer } from 'http';
import { NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
// JWT verification will be handled differently
import { prisma } from '../prisma';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  SocketUser
} from './types';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: ServerIO<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
    };
  };
};

// Store active users and their socket connections
const activeUsers = new Map<string, { socketId: string; user: SocketUser; lastSeen: Date }>();
const userSockets = new Map<string, string>(); // userId -> socketId
const socketUsers = new Map<string, string>(); // socketId -> userId

export class ChatSocketServer {
  private io: ServerIO<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
  private typingUsers = new Map<string, Set<string>>(); // threadId -> Set of userIds typing

  constructor(server: NetServer) {
    this.io = new ServerIO(server, {
      path: '/api/socket/chat',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.initializeHandlers();
  }

  private initializeHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Authentication handler
      socket.on('auth', async (data) => {
        try {
          const { token } = data;
          // Simple token validation - in production, use proper JWT verification
          const decoded = JSON.parse(atob(token.split('.')[1])) as { sub?: string; id?: string };
          
          // Get user from database
          const user = await prisma.user.findUnique({
            where: { id: decoded.sub || decoded.id },
            select: {
              id: true,
              name: true,
              role: true,
            },
          });

          if (!user) {
            socket.emit('error', { message: 'User not found' });
            socket.disconnect();
            return;
          }

          const socketUser: SocketUser = {
            id: user.id,
            name: user.name,
            avatar: undefined,
            role: user.role,
          };

          // Store user data in socket
          socket.data.user = socketUser;
          socket.data.activeThreads = new Set();

          // Update user mappings
          activeUsers.set(user.id, {
            socketId: socket.id,
            user: socketUser,
            lastSeen: new Date(),
          });
          userSockets.set(user.id, socket.id);
          socketUsers.set(socket.id, user.id);

          // Update user online status in database
          await this.updateUserOnlineStatus(user.id, true);

          // Emit connected event
          socket.emit('connected', { user: socketUser });

          // Notify other users about online status
          await this.broadcastUserOnlineStatus(user.id, true);

          console.log(`User authenticated: ${user.name} (${user.id})`);
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('error', { message: 'Authentication failed' });
          socket.disconnect();
        }
      });

      // Join thread handler
      socket.on('join:thread', async (data) => {
        try {
          const { threadId } = data;
          const userId = socket.data.user?.id;

          if (!userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          // Verify user is participant of this thread
          const participant = await prisma.chatParticipant.findUnique({
            where: {
              userId_threadId: {
                userId,
                threadId,
              },
            },
          });

          if (!participant) {
            socket.emit('error', { message: 'Not authorized to join this thread' });
            return;
          }

          // Join socket room
          socket.join(threadId);
          socket.data.activeThreads?.add(threadId);

          // Update last seen
          await prisma.chatParticipant.update({
            where: { id: participant.id },
            data: { lastSeenAt: new Date(), isOnline: true },
          });

          console.log(`User ${userId} joined thread ${threadId}`);
        } catch (error) {
          console.error('Join thread error:', error);
          socket.emit('error', { message: 'Failed to join thread' });
        }
      });

      // Leave thread handler
      socket.on('leave:thread', async (data) => {
        try {
          const { threadId } = data;
          const userId = socket.data.user?.id;

          if (!userId) return;

          socket.leave(threadId);
          socket.data.activeThreads?.delete(threadId);

          // Update participant status
          await prisma.chatParticipant.updateMany({
            where: {
              userId,
              threadId,
            },
            data: {
              lastSeenAt: new Date(),
              isOnline: false,
            },
          });

          console.log(`User ${userId} left thread ${threadId}`);
        } catch (error) {
          console.error('Leave thread error:', error);
        }
      });

      // Message send handler
      socket.on('message:send', async (data) => {
        try {
          const userId = socket.data.user?.id;
          if (!userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          const { threadId, content, type, replyTo, metadata } = data;

          // Get participant
          const participant = await prisma.chatParticipant.findUnique({
            where: {
              userId_threadId: {
                userId,
                threadId,
              },
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

          if (!participant) {
            socket.emit('error', { message: 'Not authorized to send message' });
            return;
          }

          // Create message
          const message = await prisma.chatMessage.create({
            data: {
              threadId,
              senderId: participant.id,
              content,
              type,
              replyToId: replyTo,
              metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
            },
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
              replyTo: {
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
            },
          });

          // Update thread last message timestamp
          await prisma.chatThread.update({
            where: { id: threadId },
            data: { lastMessageAt: new Date() },
          });

          // Transform message for client
          const clientMessage = {
            ...message,
            sender: message.sender,
            thread: null,
            readReceipts: [],
            attachments: []
          };

          // Broadcast message to thread participants
          this.io.to(threadId).emit('message:sent', {
            message: clientMessage as never,
            threadId,
          });

          // Stop typing for this user
          this.handleStopTyping(userId, threadId);

          console.log(`Message sent in thread ${threadId} by ${userId}`);
        } catch (error) {
          console.error('Send message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Message read handler
      socket.on('message:read', async (data) => {
        try {
          const { messageId, threadId } = data;
          const userId = socket.data.user?.id;

          if (!userId) return;

          // Get participant
          const participant = await prisma.chatParticipant.findUnique({
            where: {
              userId_threadId: {
                userId,
                threadId,
              },
            },
          });

          if (!participant) return;

          // Create or update read receipt
          await prisma.messageReadReceipt.upsert({
            where: {
              messageId_participantId: {
                messageId,
                participantId: participant.id,
              },
            },
            create: {
              messageId,
              participantId: participant.id,
            },
            update: {
              readAt: new Date(),
            },
          });

          // Broadcast read receipt
          this.io.to(threadId).emit('message:read', {
            messageId,
            threadId,
            participantId: participant.id,
          });
        } catch (error) {
          console.error('Mark message read error:', error);
        }
      });

      // Typing start handler
      socket.on('typing:start', (data) => {
        const { threadId } = data;
        const userId = socket.data.user?.id;

        if (!userId) return;
        this.handleStartTyping(userId, threadId, socket.data);
      });

      // Typing stop handler
      socket.on('typing:stop', (data) => {
        const { threadId } = data;
        const userId = socket.data.user?.id;

        if (!userId) return;
        this.handleStopTyping(userId, threadId);
      });

      // Online status handlers
      socket.on('status:online', async () => {
        const userId = socket.data.user?.id;
        if (!userId) return;

        await this.updateUserOnlineStatus(userId, true);
        await this.broadcastUserOnlineStatus(userId, true);
      });

      socket.on('status:offline', async () => {
        const userId = socket.data.user?.id;
        if (!userId) return;

        await this.updateUserOnlineStatus(userId, false);
        await this.broadcastUserOnlineStatus(userId, false);
      });

      // Disconnect handler
      socket.on('disconnect', async (reason) => {
        const userId = socketUsers.get(socket.id);
        
        if (userId) {
          console.log(`User ${userId} disconnected: ${reason}`);

          // Clean up mappings
          activeUsers.delete(userId);
          userSockets.delete(userId);
          socketUsers.delete(socket.id);

          // Update online status
          await this.updateUserOnlineStatus(userId, false);
          await this.broadcastUserOnlineStatus(userId, false);

          // Clean up typing indicators
          for (const [threadId, typingSet] of this.typingUsers.entries()) {
            if (typingSet.has(userId)) {
              this.handleStopTyping(userId, threadId);
            }
          }
        }
      });
    });
  }

  private handleStartTyping(userId: string, threadId: string, socketData: SocketData) {
    if (!this.typingUsers.has(threadId)) {
      this.typingUsers.set(threadId, new Set());
    }

    const typingSet = this.typingUsers.get(threadId)!;
    if (!typingSet.has(userId)) {
      typingSet.add(userId);

      const user = socketData.user;
      this.io.to(threadId).emit('user:typing', {
        threadId,
        participant: {
          id: userId,
          userId,
          name: user?.name || '',
          isTyping: true,
        } as never,
      });

      // Auto-stop typing after 3 seconds
      setTimeout(() => {
        if (this.typingUsers.get(threadId)?.has(userId)) {
          this.handleStopTyping(userId, threadId);
        }
      }, 3000);
    }
  }

  private handleStopTyping(userId: string, threadId: string) {
    const typingSet = this.typingUsers.get(threadId);
    if (typingSet && typingSet.has(userId)) {
      typingSet.delete(userId);

      this.io.to(threadId).emit('user:stopped-typing', {
        threadId,
        participantId: userId,
      });

      if (typingSet.size === 0) {
        this.typingUsers.delete(threadId);
      }
    }
  }

  private async updateUserOnlineStatus(userId: string, isOnline: boolean) {
    try {
      await prisma.chatParticipant.updateMany({
        where: { userId },
        data: {
          isOnline,
          lastSeenAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Update online status error:', error);
    }
  }

  private async broadcastUserOnlineStatus(userId: string, isOnline: boolean) {
    try {
      // Get all threads this user participates in
      const participations = await prisma.chatParticipant.findMany({
        where: { userId },
        select: { threadId: true, id: true },
      });

      // Broadcast to each thread
      for (const participation of participations) {
        if (isOnline) {
          this.io.to(participation.threadId).emit('user:online', {
            participantId: participation.id,
            threadId: participation.threadId,
          });
        } else {
          this.io.to(participation.threadId).emit('user:offline', {
            participantId: participation.id,
            threadId: participation.threadId,
            lastSeenAt: new Date(),
          });
        }
      }
    } catch (error) {
      console.error('Broadcast online status error:', error);
    }
  }

  // Public methods for external use
  public sendMessageToThread(threadId: string, event: string, data: unknown) {
    this.io.to(threadId).emit(event as keyof ServerToClientEvents, data as never);
  }

  public sendMessageToUser(userId: string, event: string, data: unknown) {
    const socketId = userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event as keyof ServerToClientEvents, data as never);
    }
  }

  public getActiveUsers() {
    return Array.from(activeUsers.values());
  }

  public isUserOnline(userId: string): boolean {
    return activeUsers.has(userId);
  }
}

// Global socket server instance
let chatSocketServer: ChatSocketServer | null = null;

export function initializeChatSocket(server: NetServer): ChatSocketServer {
  if (!chatSocketServer) {
    chatSocketServer = new ChatSocketServer(server);
  }
  return chatSocketServer;
}

export function getChatSocketServer(): ChatSocketServer | null {
  return chatSocketServer;
}
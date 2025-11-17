import { User } from '@prisma/client';

// Enums for chat system
export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
  LOCATION = 'LOCATION',
  LISTING_SHARE = 'LISTING_SHARE'
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED'
}

export enum ThreadType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
  LISTING_INQUIRY = 'LISTING_INQUIRY'
}

export enum ParticipantRole {
  OWNER = 'OWNER',
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN'
}

export enum ChatEventType {
  MESSAGE_SENT = 'MESSAGE_SENT',
  MESSAGE_DELIVERED = 'MESSAGE_DELIVERED',
  MESSAGE_READ = 'MESSAGE_READ',
  USER_TYPING = 'USER_TYPING',
  USER_STOPPED_TYPING = 'USER_STOPPED_TYPING',
  USER_JOINED = 'USER_JOINED',
  USER_LEFT = 'USER_LEFT',
  THREAD_CREATED = 'THREAD_CREATED',
  THREAD_UPDATED = 'THREAD_UPDATED',
  USER_ONLINE = 'USER_ONLINE',
  USER_OFFLINE = 'USER_OFFLINE'
}

// Core chat interfaces
export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  metadata?: MessageMetadata;
  replyTo?: string; // ID of message being replied to
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  editedAt?: Date;
  
  // Relations
  sender: ChatParticipant;
  thread: ChatThread;
  replies?: ChatMessage[];
  parentMessage?: ChatMessage;
  readReceipts: MessageReadReceipt[];
  attachments: MessageAttachment[];
}

export interface ChatThread {
  id: string;
  type: ThreadType;
  title?: string;
  description?: string;
  avatar?: string;
  listingId?: string; // For listing inquiries
  isActive: boolean;
  isPinned: boolean;
  isMuted: boolean;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  participants: ChatParticipant[];
  messages: ChatMessage[];
  listing?: {
    id: string;
    title: string;
    price: number;
    images: string[];
  }; // Listing relation
  lastMessage?: ChatMessage;
  
  // Computed properties
  unreadCount?: number;
  isOnline?: boolean;
  otherParticipant?: ChatParticipant; // For direct chats
}

export interface ChatParticipant {
  id: string;
  userId: string;
  threadId: string;
  role: ParticipantRole;
  joinedAt: Date;
  lastSeenAt?: Date;
  isOnline: boolean;
  isMuted: boolean;
  isBlocked: boolean;
  
  // Relations
  user: User;
  thread: ChatThread;
  
  // User display info
  name: string;
  avatar?: string;
  isTyping?: boolean;
}

export interface MessageReadReceipt {
  id: string;
  messageId: string;
  participantId: string;
  readAt: Date;
  
  // Relations
  message: ChatMessage;
  participant: ChatParticipant;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  thumbnailUrl?: string;
  
  // Relations
  message: ChatMessage;
}

export interface MessageMetadata {
  // For system messages
  systemEventType?: string;
  systemEventData?: Record<string, unknown>;
  
  // For location messages
  latitude?: number;
  longitude?: number;
  address?: string;
  
  // For listing shares
  listingId?: string;
  listingTitle?: string;
  listingImage?: string;
  listingPrice?: number;
  
  // For file/image messages
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  
  // Message formatting
  mentions?: string[]; // User IDs mentioned in message
  isEdited?: boolean;
  editHistory?: {
    content: string;
    editedAt: Date;
  }[];
}

// Real-time chat events
export interface ChatEvent {
  type: ChatEventType;
  threadId: string;
  userId: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

export interface TypingEvent extends ChatEvent {
  type: ChatEventType.USER_TYPING | ChatEventType.USER_STOPPED_TYPING;
  data: {
    participantId: string;
    userName: string;
  };
}

export interface MessageEvent extends ChatEvent {
  type: ChatEventType.MESSAGE_SENT | ChatEventType.MESSAGE_DELIVERED | ChatEventType.MESSAGE_READ;
  data: {
    message: ChatMessage;
  };
}

export interface OnlineStatusEvent extends ChatEvent {
  type: ChatEventType.USER_ONLINE | ChatEventType.USER_OFFLINE;
  data: {
    participantId: string;
    isOnline: boolean;
    lastSeenAt?: Date;
  };
}

// API request/response types
export interface CreateThreadRequest {
  type: ThreadType;
  title?: string;
  participantIds: string[];
  listingId?: string;
  initialMessage?: string;
}

export interface CreateThreadResponse {
  thread: ChatThread;
  success: boolean;
  error?: string;
}

export interface SendMessageRequest {
  threadId: string;
  content: string;
  type: MessageType;
  replyTo?: string;
  metadata?: MessageMetadata;
  attachments?: File[];
}

export interface SendMessageResponse {
  message: ChatMessage;
  success: boolean;
  error?: string;
}

export interface GetThreadsRequest {
  page?: number;
  limit?: number;
  search?: string;
  type?: ThreadType;
  includeArchived?: boolean;
}

export interface GetThreadsResponse {
  threads: ChatThread[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface GetMessagesRequest {
  threadId: string;
  page?: number;
  limit?: number;
  before?: string; // Message ID
  after?: string; // Message ID
}

export interface GetMessagesResponse {
  messages: ChatMessage[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Chat settings and preferences
export interface ChatSettings {
  id: string;
  userId: string;
  
  // Notification preferences
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  enableSoundNotifications: boolean;
  
  // Privacy settings
  allowMessagesFromStrangers: boolean;
  showOnlineStatus: boolean;
  showReadReceipts: boolean;
  showTypingIndicators: boolean;
  
  // Display preferences
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  
  // Auto-archive settings
  autoArchiveAfterDays?: number;
  autoDeleteMessagesAfterDays?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

// Socket.IO types
export interface SocketUser {
  id: string;
  name: string;
  avatar?: string;
  role: string;
}

export interface ServerToClientEvents {
  // Message events
  'message:sent': (data: { message: ChatMessage; threadId: string }) => void;
  'message:delivered': (data: { messageId: string; threadId: string }) => void;
  'message:read': (data: { messageId: string; threadId: string; participantId: string }) => void;
  
  // Typing events
  'user:typing': (data: { threadId: string; participant: ChatParticipant }) => void;
  'user:stopped-typing': (data: { threadId: string; participantId: string }) => void;
  
  // Online status events
  'user:online': (data: { participantId: string; threadId: string }) => void;
  'user:offline': (data: { participantId: string; threadId: string; lastSeenAt: Date }) => void;
  
  // Thread events
  'thread:created': (data: { thread: ChatThread }) => void;
  'thread:updated': (data: { thread: ChatThread }) => void;
  'thread:archived': (data: { threadId: string }) => void;
  
  // Connection events
  'connected': (data: { user: SocketUser }) => void;
  'disconnected': (data: { reason: string }) => void;
  
  // Error events
  'error': (data: { message: string; code?: string }) => void;
}

export interface ClientToServerEvents {
  // Authentication
  'auth': (data: { token: string }) => void;
  
  // Join/leave rooms
  'join:thread': (data: { threadId: string }) => void;
  'leave:thread': (data: { threadId: string }) => void;
  
  // Message events
  'message:send': (data: SendMessageRequest) => void;
  'message:read': (data: { messageId: string; threadId: string }) => void;
  
  // Typing events
  'typing:start': (data: { threadId: string }) => void;
  'typing:stop': (data: { threadId: string }) => void;
  
  // Online status
  'status:online': () => void;
  'status:offline': () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  user: SocketUser;
  activeThreads: Set<string>;
}

// Chat statistics and analytics
export interface ChatAnalytics {
  id: string;
  userId: string;
  threadId: string;
  messagesSent: number;
  messagesReceived: number;
  averageResponseTime: number; // in minutes
  totalChatTime: number; // in minutes
  lastActivityAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Search and filtering
export interface ChatSearchFilters {
  query?: string;
  threadType?: ThreadType;
  hasUnread?: boolean;
  isActive?: boolean;
  participantId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ChatSearchResult {
  threads: ChatThread[];
  messages: ChatMessage[];
  total: number;
  searchTime: number;
}

// Moderation and reporting
export interface ChatReport {
  id: string;
  reporterId: string;
  threadId: string;
  messageId?: string;
  reason: string;
  description: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  reviewedAt?: Date;
  reviewedBy?: string;
  createdAt: Date;
}

export interface BlockedUser {
  id: string;
  userId: string;
  blockedUserId: string;
  reason?: string;
  blockedAt: Date;
  
  // Relations
  user: User;
  blockedUser: User;
}
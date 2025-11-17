import { useState, useEffect, useCallback, useMemo } from 'react';
import { io } from 'socket.io-client';
import { 
  ChatMessage, 
  ChatThread, 
  ChatParticipant, 
  MessageType,
  ThreadType
} from '@/lib/chat/types';

interface UseChatSocketOptions {
  enabled?: boolean;
  userId?: string;
  token?: string;
}

export function useChatSocket({ enabled = true, userId, token }: UseChatSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create socket instance with useMemo to avoid recreating on every render
  const socket = useMemo(() => {
    if (!enabled || !userId || !token) return null;

    const newSocket = io('/chat', {
      auth: { token },
      query: { userId }
    });

    return newSocket;
  }, [enabled, userId, token]);

  // Handle socket connection events
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      setIsConnected(true);
      setError(null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleError = (err: Error) => {
      setError(err.message);
      setIsConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleError);
    };
  }, [socket]);

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  // Socket event handlers
  const joinRoom = useCallback((threadId: string) => {
    socket?.emit('join:thread', { threadId });
  }, [socket]);

  const leaveRoom = useCallback((threadId: string) => {
    socket?.emit('leave:thread', { threadId });
  }, [socket]);

  const sendMessage = useCallback((message: {
    threadId: string;
    content: string;
    type?: MessageType;
    replyTo?: string;
    metadata?: Record<string, unknown>;
  }) => {
    socket?.emit('message:send', {
      ...message,
      type: message.type || MessageType.TEXT
    });
  }, [socket]);

  const startTyping = useCallback((threadId: string) => {
    socket?.emit('typing:start', { threadId });
  }, [socket]);

  const stopTyping = useCallback((threadId: string) => {
    socket?.emit('typing:stop', { threadId });
  }, [socket]);

  const markAsRead = useCallback((threadId: string, messageId: string) => {
    socket?.emit('message:read', { threadId, messageId });
  }, [socket]);

  return {
    socket,
    isConnected,
    error,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead
  };
}

interface UseChatThreadsOptions {
  userId?: string;
  enabled?: boolean;
}

export function useChatThreads({ userId, enabled = true }: UseChatThreadsOptions = {}) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useChatSocket({ enabled, userId });

  // Fetch threads
  const fetchThreads = useCallback(async () => {
    if (!enabled || !userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat/advanced/threads', {
        headers: {
          'x-user-id': userId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch threads');
      }

      const data = await response.json();
      setThreads(data.threads || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [enabled, userId]);

  // Create new thread
  const createThread = useCallback(async (data: {
    participantIds: string[];
    type: ThreadType;
    name?: string;
    listingId?: string;
    metadata?: Record<string, unknown>;
  }) => {
    if (!userId) throw new Error('User ID required');

    const response = await fetch('/api/chat/advanced/threads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to create thread');
    }

    const thread = await response.json();
    setThreads(prev => [thread, ...prev]);
    return thread;
  }, [userId]);

  // Delete thread
  const deleteThread = useCallback(async (threadId: string) => {
    if (!userId) throw new Error('User ID required');

    const response = await fetch(`/api/chat/advanced/threads?threadId=${threadId}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': userId
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete thread');
    }

    setThreads(prev => prev.filter(t => t.id !== threadId));
  }, [userId]);

  // Update thread settings
  const updateThreadSettings = useCallback(async (threadId: string, settings: {
    name?: string;
    muted?: boolean;
    archived?: boolean;
  }) => {
    if (!userId) throw new Error('User ID required');

    const response = await fetch('/api/chat/advanced/threads', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({ threadId, ...settings })
    });

    if (!response.ok) {
      throw new Error('Failed to update thread');
    }

    const updatedThread = await response.json();
    setThreads(prev => prev.map(t => t.id === threadId ? updatedThread : t));
    return updatedThread;
  }, [userId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewThread = (data: { thread: ChatThread }) => {
      setThreads(prev => {
        if (prev.some(t => t.id === data.thread.id)) return prev;
        return [data.thread, ...prev];
      });
    };

    const handleThreadUpdated = (data: { thread: ChatThread }) => {
      setThreads(prev => prev.map(t => t.id === data.thread.id ? data.thread : t));
    };

    socket.on('thread:created', handleNewThread);
    socket.on('thread:updated', handleThreadUpdated);

    return () => {
      socket.off('thread:created', handleNewThread);
      socket.off('thread:updated', handleThreadUpdated);
    };
  }, [socket]);

  // Initial fetch
  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  return {
    threads,
    loading,
    error,
    fetchThreads,
    createThread,
    deleteThread,
    updateThreadSettings
  };
}

interface UseChatMessagesOptions {
  threadId?: string;
  userId?: string;
  enabled?: boolean;
  limit?: number;
}

export function useChatMessages({ 
  threadId, 
  userId, 
  enabled = true, 
  limit = 50 
}: UseChatMessagesOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const { socket } = useChatSocket({ enabled, userId });

  // Fetch messages
  const fetchMessages = useCallback(async (page = 1, append = false) => {
    if (!enabled || !threadId || !userId) return;

    setLoading(true);
    if (!append) setError(null);

    try {
      const params = new URLSearchParams({
        threadId,
        page: page.toString(),
        limit: limit.toString()
      });

      const response = await fetch(`/api/chat/advanced/messages?${params}`, {
        headers: {
          'x-user-id': userId
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      
      if (append) {
        setMessages(prev => [...prev, ...(data.messages || [])]);
      } else {
        setMessages(data.messages || []);
      }
      
      setHasMore(data.hasMore || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [enabled, threadId, userId, limit]);

  // Send message
  const sendMessage = useCallback(async (content: string, type: MessageType = MessageType.TEXT, replyTo?: string) => {
    if (!threadId || !userId) throw new Error('Thread ID and User ID required');

    const response = await fetch('/api/chat/advanced/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({
        threadId,
        content,
        type,
        replyTo
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return await response.json();
  }, [threadId, userId]);

  // Mark messages as read
  const markAsRead = useCallback(async (messageId?: string) => {
    if (!threadId || !userId || !messageId) return;

    const response = await fetch('/api/chat/advanced/messages', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({
        threadId,
        messageIds: [messageId]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to mark messages as read');
    }
  }, [threadId, userId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !threadId) return;

    // Join room for this thread
    socket.emit('join:thread', { threadId });

    const handleNewMessage = (data: { message: ChatMessage }) => {
      if (data.message.threadId === threadId) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    };



    const handleTyping = (data: { threadId: string; participant: ChatParticipant }) => {
      if (data.threadId === threadId) {
        setTypingUsers(prev => {
          // This event represents a user starting to type
          return prev.includes(data.participant.userId) ? prev : [...prev, data.participant.userId];
        });
      }
    };

    const handleStoppedTyping = (data: { threadId: string; participantId: string }) => {
      if (data.threadId === threadId) {
        setTypingUsers(prev => prev.filter(id => id !== data.participantId));
      }
    };

    socket.on('message:sent', handleNewMessage);
    socket.on('user:typing', handleTyping);
    socket.on('user:stopped-typing', handleStoppedTyping);

    return () => {
      socket.emit('leave:thread', { threadId });
      socket.off('message:sent', handleNewMessage);
      socket.off('user:typing', handleTyping);
      socket.off('user:stopped-typing', handleStoppedTyping);
    };
  }, [socket, threadId]);

  // Initial fetch when threadId changes
  useEffect(() => {
    if (threadId) {
      setMessages([]);
      setHasMore(true);
      fetchMessages(1, false);
    }
  }, [threadId, fetchMessages]);

  return {
    messages,
    loading,
    error,
    hasMore,
    typingUsers,
    fetchMessages,
    sendMessage,
    markAsRead,
    loadMore: () => fetchMessages(Math.floor(messages.length / limit) + 1, true)
  };
}
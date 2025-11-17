import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChatMessage, ChatThread, MessageType } from '@/lib/chat/types';
import { formatDistanceToNow } from 'date-fns';

interface MessageInputProps {
  onSendMessage: (content: string, type?: MessageType, replyTo?: string) => Promise<void>;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ 
  onSendMessage, 
  onStartTyping, 
  onStopTyping, 
  disabled = false,
  placeholder = "Type a message..."
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSend = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage(message.trim());
      setMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Handle typing indicators
    if (onStartTyping && e.target.value) {
      onStartTyping();
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        onStopTyping?.();
      }, 2000);
    } else if (onStopTyping && !e.target.value) {
      onStopTyping();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="border-t bg-white p-4">
      <div className="flex space-x-3">
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || sending}
            rows={1}
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!message.trim() || sending || disabled}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  typingUsers?: string[];
}

export function MessageList({ 
  messages, 
  currentUserId, 
  loading = false, 
  hasMore = false, 
  onLoadMore,
  typingUsers = []
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatMessageTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const isOwnMessage = (message: ChatMessage) => {
    return message.senderId === currentUserId;
  };

  const handleScroll = () => {
    if (!containerRef.current || !onLoadMore || !hasMore || loading) return;
    
    const { scrollTop } = containerRef.current;
    if (scrollTop === 0) {
      onLoadMore();
    }
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
      onScroll={handleScroll}
    >
      {hasMore && (
        <div className="text-center">
          {loading ? (
            <div className="text-gray-500">Loading more messages...</div>
          ) : (
            <button
              onClick={onLoadMore}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Load more messages
            </button>
          )}
        </div>
      )}

      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              isOwnMessage(message)
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-900'
            }`}
          >
            {!isOwnMessage(message) && (
              <div className="text-xs opacity-75 mb-1">
                {message.sender?.user?.name || 'Unknown User'}
              </div>
            )}
            
            <div className="break-words">{message.content}</div>
            
            <div className={`text-xs mt-1 ${
              isOwnMessage(message) ? 'text-blue-100' : 'text-gray-500'
            }`}>
              {formatMessageTime(message.createdAt)}
              {message.status && isOwnMessage(message) && (
                <span className="ml-2">
                  {message.status === 'DELIVERED' && '✓'}
                  {message.status === 'READ' && '✓✓'}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}

      {typingUsers.length > 0 && (
        <div className="flex justify-start">
          <div className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm">
                {typingUsers.length === 1 ? 'Someone is' : `${typingUsers.length} people are`} typing...
              </span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

interface ChatWindowProps {
  thread: ChatThread;
  currentUserId: string;
  messages: ChatMessage[];
  loading?: boolean;
  hasMore?: boolean;
  typingUsers?: string[];
  onSendMessage: (content: string, type?: MessageType, replyTo?: string) => Promise<void>;
  onLoadMore?: () => void;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  onClose?: () => void;
}

export function ChatWindow({
  thread,
  currentUserId,
  messages,
  loading = false,
  hasMore = false,
  typingUsers = [],
  onSendMessage,
  onLoadMore,
  onStartTyping,
  onStopTyping,
  onClose
}: ChatWindowProps) {
  const getThreadTitle = () => {
    if (thread.title) return thread.title;
    
    // For direct messages, show the other participant's name
    if (thread.type === 'DIRECT' && thread.otherParticipant) {
      return thread.otherParticipant.user?.name || 'Direct Message';
    }
    
    return 'Chat';
  };

  const getThreadSubtitle = () => {
    if (thread.listing) {
      return `About: ${thread.listing.title}`;
    }
    
    if (thread.participants.length > 2) {
      return `${thread.participants.length} participants`;
    }
    
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-white border rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="border-b bg-gray-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {thread.avatar && (
            <Image
              src={thread.avatar}
              alt="Chat avatar"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full"
            />
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{getThreadTitle()}</h3>
            {getThreadSubtitle() && (
              <p className="text-sm text-gray-500">{getThreadSubtitle()}</p>
            )}
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        typingUsers={typingUsers}
      />

      {/* Message Input */}
      <MessageInput
        onSendMessage={onSendMessage}
        onStartTyping={onStartTyping}
        onStopTyping={onStopTyping}
        placeholder={`Message ${getThreadTitle()}...`}
      />
    </div>
  );
}
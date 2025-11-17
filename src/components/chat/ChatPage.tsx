import React, { useState, useEffect } from 'react';
import { ChatThread, MessageType } from '@/lib/chat/types';
import { useChatThreads, useChatMessages, useChatSocket } from '@/hooks/useChat';
import { ThreadList } from '@/components/chat/ThreadList';
import { ChatWindow } from '@/components/chat/ChatWindow';

interface ChatPageProps {
  userId: string;
  token: string;
}

export function ChatPage({ userId, token }: ChatPageProps) {
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Chat hooks
  const { threads, loading: threadsLoading, createThread } = useChatThreads({ userId, enabled: true });
  
  const { 
    messages, 
    loading: messagesLoading, 
    hasMore, 
    typingUsers,
    sendMessage, 
    markAsRead,
    loadMore
  } = useChatMessages({ 
    threadId: selectedThread?.id, 
    userId, 
    enabled: !!selectedThread 
  });

  const { 
    isConnected, 
    error: socketError,
    startTyping,
    stopTyping
  } = useChatSocket({ 
    userId, 
    token, 
    enabled: true 
  });

  // Handle mobile responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate whether to show thread list based on mobile state
  const showThreadList = isMobile ? !selectedThread : true;

  const handleThreadSelect = (thread: ChatThread) => {
    setSelectedThread(thread);
    
    // Mark latest message as read when opening thread
    if (thread.lastMessage) {
      markAsRead(thread.lastMessage.id);
    }
  };

  const handleSendMessage = async (content: string, type?: MessageType, replyTo?: string) => {
    if (!selectedThread) return;
    
    try {
      await sendMessage(content, type, replyTo);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  const handleStartTyping = () => {
    if (selectedThread) {
      startTyping(selectedThread.id);
    }
  };

  const handleStopTyping = () => {
    if (selectedThread) {
      stopTyping(selectedThread.id);
    }
  };

  const handleCloseChatWindow = () => {
    setSelectedThread(null);
  };

  const handleCreateThread = async () => {
    // TODO: Implement thread creation dialog
    console.log('Create thread clicked');
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Connection status indicator */}
      {socketError && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white px-4 py-2 text-center z-50">
          Connection error: {socketError}
        </div>
      )}
      
      {!isConnected && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-600 text-white px-4 py-2 text-center z-50">
          Connecting to chat...
        </div>
      )}

      {/* Thread List Sidebar */}
      {showThreadList && (
        <div className={`${isMobile ? 'w-full' : 'w-80'} border-r border-gray-200 bg-white flex flex-col`}>
          {/* Header */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
              <button
                onClick={handleCreateThread}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto">
            <ThreadList
              threads={threads}
              currentUserId={userId}
              selectedThreadId={selectedThread?.id}
              loading={threadsLoading}
              onThreadSelect={handleThreadSelect}
              onThreadCreate={handleCreateThread}
            />
          </div>
        </div>
      )}

      {/* Chat Window */}
      <div className={`flex-1 flex flex-col ${isMobile && showThreadList ? 'hidden' : ''}`}>
        {selectedThread ? (
          <ChatWindow
            thread={selectedThread}
            currentUserId={userId}
            messages={messages}
            loading={messagesLoading}
            hasMore={hasMore}
            typingUsers={typingUsers}
            onSendMessage={handleSendMessage}
            onLoadMore={loadMore}
            onStartTyping={handleStartTyping}
            onStopTyping={handleStopTyping}
            onClose={isMobile ? handleCloseChatWindow : undefined}
          />
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
              <p className="text-gray-500">Choose a conversation from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
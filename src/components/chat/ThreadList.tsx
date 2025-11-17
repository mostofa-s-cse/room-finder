import React from 'react';
import { ChatThread, ThreadType } from '@/lib/chat/types';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

interface ThreadListItemProps {
  thread: ChatThread;
  currentUserId: string;
  isSelected?: boolean;
  onClick: (thread: ChatThread) => void;
  onArchive?: (threadId: string) => void;
  onDelete?: (threadId: string) => void;
}

export function ThreadListItem({
  thread,
  currentUserId,
  isSelected = false,
  onClick,
  onArchive,
  onDelete
}: ThreadListItemProps) {
  const getThreadTitle = () => {
    if (thread.title) return thread.title;
    
    // For direct messages, show the other participant's name
    if (thread.type === ThreadType.DIRECT && thread.otherParticipant) {
      return thread.otherParticipant.user?.name || 'Direct Message';
    }
    
    // For listing inquiries, show listing title
    if (thread.type === ThreadType.LISTING_INQUIRY && thread.listing) {
      return thread.listing.title;
    }
    
    return 'Group Chat';
  };

  const getLastMessagePreview = () => {
    if (!thread.lastMessage) return 'No messages yet';
    
    const isOwn = thread.lastMessage.senderId === currentUserId;
    const prefix = isOwn ? 'You: ' : '';
    
    return `${prefix}${thread.lastMessage.content}`;
  };

  const getThreadAvatar = () => {
    if (thread.avatar) return thread.avatar;
    
    // For direct messages, use other participant's avatar (placeholder for now)
    if (thread.type === ThreadType.DIRECT && thread.otherParticipant?.user) {
      // TODO: Add profilePicture field to User model
      return null; // Will use initials instead
    }
    
    // For listing inquiries, use listing image
    if (thread.type === ThreadType.LISTING_INQUIRY && thread.listing?.images?.[0]) {
      return thread.listing.images[0];
    }
    
    return null;
  };

  const formatLastMessageTime = () => {
    if (!thread.lastMessageAt) return '';
    return formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: true });
  };

  const getThreadTypeIcon = () => {
    switch (thread.type) {
      case ThreadType.DIRECT:
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case ThreadType.GROUP:
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case ThreadType.LISTING_INQUIRY:
        return (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        );
      default:
        return null;
    }
  };

  const avatar = getThreadAvatar();

  return (
    <div
      onClick={() => onClick(thread)}
      className={`flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b ${
        isSelected ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {avatar ? (
          <Image
            src={avatar}
            alt="Avatar"
            width={48}
            height={48}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
            {getThreadTypeIcon() || (
              <span className="text-gray-600 font-medium">
                {getThreadTitle().charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {getThreadTitle()}
          </h4>
          <div className="flex items-center space-x-2">
            {thread.isPinned && (
              <svg className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            )}
            {thread.isMuted && (
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
            {thread.unreadCount && thread.unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                {thread.unreadCount > 99 ? '99+' : thread.unreadCount}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-gray-500 truncate">
            {getLastMessagePreview()}
          </p>
          <span className="text-xs text-gray-400">
            {formatLastMessageTime()}
          </span>
        </div>

        {/* Listing info for listing inquiries */}
        {thread.type === ThreadType.LISTING_INQUIRY && thread.listing && (
          <div className="mt-2 text-xs text-gray-600">
            <span className="font-medium">${thread.listing.price}</span>
          </div>
        )}
      </div>

      {/* Actions Menu */}
      <div className="flex-shrink-0">
        <div className="relative">
          <button className="text-gray-400 hover:text-gray-600 focus:outline-none">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path d="M10 4a2 2 0 100-4 2 2 0 000 4z" />
              <path d="M10 20a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

interface ThreadListProps {
  threads: ChatThread[];
  currentUserId: string;
  selectedThreadId?: string;
  loading?: boolean;
  onThreadSelect: (thread: ChatThread) => void;
  onThreadCreate?: () => void;
  onThreadArchive?: (threadId: string) => void;
  onThreadDelete?: (threadId: string) => void;
}

export function ThreadList({
  threads,
  currentUserId,
  selectedThreadId,
  loading = false,
  onThreadSelect,
  onThreadCreate,
  onThreadArchive,
  onThreadDelete
}: ThreadListProps) {
  const sortedThreads = threads.sort((a, b) => {
    // Pinned threads first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // Then by last message time
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
        <p className="text-gray-500 mb-4">Start a conversation with a landlord about a listing</p>
        {onThreadCreate && (
          <button
            onClick={onThreadCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Start a conversation
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {sortedThreads.map((thread) => (
        <ThreadListItem
          key={thread.id}
          thread={thread}
          currentUserId={currentUserId}
          isSelected={selectedThreadId === thread.id}
          onClick={onThreadSelect}
          onArchive={onThreadArchive}
          onDelete={onThreadDelete}
        />
      ))}
    </div>
  );
}
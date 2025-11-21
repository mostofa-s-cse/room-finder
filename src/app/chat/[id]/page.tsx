'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useParams, redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  Send, 
  ArrowLeft, 
  Phone, 
  Video, 
  MoreVertical,
  Paperclip,
  Smile
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  createdAt: string;
  isRead: boolean;
}

interface ChatThread {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  participantRole: 'BACHELOR' | 'LANDLORD';
  listingId?: string;
  listingTitle?: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export default function ChatThreadPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const chatId = params.id as string;
  
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);




  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
    }
    
    const loadChatData = async () => {
      try {
        setIsLoading(true);
        
        const [threadResponse, messagesResponse] = await Promise.all([
          fetch(`/api/chat/threads/${chatId}`),
          fetch(`/api/chat/threads/${chatId}/messages`)
        ]);
        
        if (threadResponse.ok) {
          const threadData = await threadResponse.json();
          setThread(threadData.data);
        } else {
          console.error('Failed to fetch thread:', threadResponse.status);
        }
        
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          const messagesList = Array.isArray(messagesData.data) ? messagesData.data : [];
          setMessages(messagesList);
          
          // Mark messages as read after a short delay (only once per load)
          setTimeout(() => {
            const hasUnread = messagesList.some((msg: Message) => 
              !msg.isRead && msg.senderId !== session?.user.id
            );
            if (hasUnread) {
              fetch(`/api/chat/threads/${chatId}/mark-read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              }).then(response => {
                if (response.ok) {
                  setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
                  window.dispatchEvent(new CustomEvent('chatReadUpdate', { detail: { threadId: chatId } }));
                }
              }).catch(error => {
                console.error('Error marking messages as read:', error);
              });
            }
          }, 1000);
        } else {
          console.error('Failed to fetch messages:', messagesResponse.status);
          setMessages([]);
        }
      } catch (error) {
        console.error('Error fetching chat data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChatData();
  }, [session, status, chatId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      
      // Create optimistic message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: newMessage,
        senderId: session?.user.id || 'current-user',
        senderName: session?.user.name || 'You',
        senderAvatar: session?.user.image || undefined,
        createdAt: new Date().toISOString(),
        isRead: false
      };

      // Add message optimistically
      setMessages(prev => [...prev, optimisticMessage]);
      const messageContent = newMessage;
      setNewMessage('');

      // Send message to API
      const response = await fetch(`/api/chat/threads/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageContent })
      });
      
      if (response.ok) {
        const sentMessage = await response.json();
        // Replace optimistic message with real message
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticMessage.id ? sentMessage.data : msg
        ));
      } else {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Optimistic message already removed in the error case above
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading chat..." />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="h-screen flex items-center justify-center flex-col space-y-4">
        <h2 className="text-xl font-semibold">Chat not found</h2>
        <Link href="/chat">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Messages
          </Button>
        </Link>
      </div>
    );
  }

  return (
     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto py-6 space-y-6">
      {/* Chat Header */}
      <div className="border-b bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/chat">
              <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Avatar className="h-12 w-12">
              <AvatarImage src={thread.participantAvatar} />
              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                {thread.participantName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{thread.participantName}</h3>
              <p className="text-sm text-gray-600">
                {thread.participantRole === 'LANDLORD' ? '🏠 Landlord' : '👤 Tenant'}
                {thread.listingTitle && ` • ${thread.listingTitle}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="hover:bg-gray-100">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-gray-100">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-gray-100">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
        {messages.map((message) => {
          const isCurrentUser = message.senderId === session?.user.id || message.senderName === 'You';
          
          return (
            <div
              key={message.id}
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-3 max-w-[75%] ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {!isCurrentUser && (
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={message.senderAvatar} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                      {message.senderName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                  isCurrentUser 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    isCurrentUser 
                      ? 'text-blue-100' 
                      : 'text-gray-500'
                  }`}>
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Message Input */}
      <div className="border-t bg-white shadow-lg p-4">
        <div className="flex items-center space-x-3 max-w-4xl mx-auto">
          <Button variant="ghost" size="sm" className="hover:bg-gray-100">
            <Paperclip className="h-4 w-4 text-gray-500" />
          </Button>
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="pr-12 py-3 rounded-full border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              disabled={isSending}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-gray-100"
            >
              <Smile className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || isSending}
            className="rounded-full h-10 w-10 p-0 bg-blue-500 hover:bg-blue-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
    </div>
  );
}
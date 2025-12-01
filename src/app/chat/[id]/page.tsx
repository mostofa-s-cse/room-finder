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
  Smile,
  MessageCircle
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
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl rounded-t-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/chat">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 rounded-xl">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <Avatar className="h-14 w-14 ring-4 ring-white/30">
                <AvatarImage src={thread.participantAvatar} />
                <AvatarFallback className="bg-white text-blue-600 font-bold text-xl">
                  {thread.participantName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-xl">{thread.participantName}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                    {thread.participantRole === 'LANDLORD' ? '🏠 Landlord' : '👤 Tenant'}
                  </span>
                  {thread.listingTitle && (
                    <span className="text-blue-100 text-sm truncate max-w-xs">
                      📍 {thread.listingTitle}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 rounded-xl h-10 w-10">
                <Phone className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 rounded-xl h-10 w-10">
                <Video className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 rounded-xl h-10 w-10">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white min-h-[500px]">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No messages yet</p>
              <p className="text-gray-400 text-sm">Send your first message to get the conversation started!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.senderId === session?.user.id || message.senderName === 'You';
            
            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
              >
              <div className={`flex items-end space-x-2 max-w-[80%] md:max-w-[70%] ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {!isCurrentUser && (
                  <Avatar className="w-8 h-8 mb-1">
                    <AvatarImage src={message.senderAvatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-medium text-sm">
                      {message.senderName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`relative group ${isCurrentUser ? 'ml-12' : 'mr-12'}`}>
                  <div className={`rounded-2xl px-4 py-3 shadow-lg transition-all duration-200 group-hover:shadow-xl ${
                    isCurrentUser 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md'
                  }`}>
                    <p className="text-sm leading-relaxed break-words">{message.content}</p>
                  </div>
                  <p className={`text-xs mt-1 transition-opacity opacity-0 group-hover:opacity-100 ${
                    isCurrentUser 
                      ? 'text-right text-gray-400' 
                      : 'text-left text-gray-400'
                  }`}>
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          );
        }))}
      </div>

      {/* Message Input */}
      <div className="bg-white shadow-2xl rounded-b-2xl border-t">
        <div className="p-6">
          <div className="flex items-center space-x-4 max-w-4xl mx-auto">
            <Button variant="ghost" size="sm" className="hover:bg-gray-100 rounded-xl h-12 w-12">
              <Paperclip className="h-5 w-5 text-gray-400" />
            </Button>
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${thread.participantName}...`}
                className="h-12 px-6 pr-14 text-base rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-all bg-gray-50 focus:bg-white"
                disabled={isSending}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-gray-200 rounded-xl h-8 w-8"
              >
                <Smile className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim() || isSending}
              className={`rounded-2xl h-12 w-12 p-0 transition-all duration-200 ${
                !newMessage.trim() || isSending
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              <Send className={`h-5 w-5 ${isSending ? 'animate-pulse' : ''}`} />
            </Button>
          </div>
          {isSending && (
            <div className="flex items-center justify-center mt-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <span className="ml-2 text-sm text-gray-500">Sending...</span>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
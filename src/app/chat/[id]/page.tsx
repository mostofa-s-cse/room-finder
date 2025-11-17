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
  participantName: string;
  participantAvatar?: string;
  participantRole: 'BACHELOR' | 'LANDLORD';
  listingTitle?: string;
  lastMessageAt: string;
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
        
        // For now, use mock data since the chat system isn't fully implemented
        const mockThread: ChatThread = {
          id: chatId,
          participantName: session?.user.role === 'BACHELOR' ? 'Ahmed Khan' : 'John Doe',
          participantAvatar: '',
          participantRole: session?.user.role === 'BACHELOR' ? 'LANDLORD' : 'BACHELOR',
          listingTitle: 'Cozy Studio in Dhanmondi',
          lastMessageAt: new Date().toISOString()
        };

        const mockMessages: Message[] = [
          {
            id: '1',
            content: 'Hello! I saw your listing for the studio apartment. Is it still available?',
            senderId: session?.user.role === 'BACHELOR' ? session?.user.id || 'current-user' : 'other-user',
            senderName: session?.user.role === 'BACHELOR' ? session?.user.name || 'You' : mockThread.participantName,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            isRead: true
          },
          {
            id: '2',
            content: 'Yes, it&apos;s still available! When would you like to schedule a viewing?',
            senderId: session?.user.role === 'BACHELOR' ? 'other-user' : session?.user.id || 'current-user',
            senderName: session?.user.role === 'BACHELOR' ? mockThread.participantName : session?.user.name || 'You',
            createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
            isRead: true
          },
          {
            id: '3',
            content: 'How about tomorrow evening? I&apos;m free after 5 PM.',
            senderId: session?.user.role === 'BACHELOR' ? session?.user.id || 'current-user' : 'other-user',
            senderName: session?.user.role === 'BACHELOR' ? session?.user.name || 'You' : mockThread.participantName,
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
            isRead: false
          }
        ];

        setThread(mockThread);
        setMessages(mockMessages);
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
        createdAt: new Date().toISOString(),
        isRead: false
      };

      // Add message optimistically
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');

      // TODO: Replace with actual API call
      // await fetch(`/api/chat/threads/${chatId}/messages`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ content: newMessage })
      // });

      console.log('Message sent:', newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
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
        <Link href="/dashboard/bachelor?tab=chats">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Messages
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Chat Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href={`/dashboard/${session?.user.role?.toLowerCase()}?tab=chats`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Avatar>
              <AvatarImage src={thread.participantAvatar} />
              <AvatarFallback>{thread.participantName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{thread.participantName}</h3>
              <p className="text-sm text-muted-foreground">
                {thread.listingTitle && `About: ${thread.listingTitle}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isCurrentUser = message.senderId === session?.user.id || message.senderName === 'You';
          
          return (
            <div
              key={message.id}
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[70%] ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {!isCurrentUser && (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={message.senderAvatar} />
                    <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`rounded-lg p-3 ${
                  isCurrentUser 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    isCurrentUser 
                      ? 'text-primary-foreground/70' 
                      : 'text-muted-foreground'
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
      <div className="border-t bg-card p-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Paperclip className="h-4 w-4" />
          </Button>
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="pr-10"
              disabled={isSending}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || isSending}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
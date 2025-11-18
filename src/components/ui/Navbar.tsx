'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Search, 
  Plus, 
  Bell, 
  User, 
  Users,
  Menu,
  MessageSquare,
  Building2,
  Heart,
  Settings,
  LogOut,
  X,
  ChevronDown
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { type Session } from 'next-auth';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
  return date.toLocaleDateString();
};

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'BOOKING' | 'MESSAGE' | 'PAYMENT' | 'PROFILE' | 'LISTING';
  read: boolean;
  relatedId?: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
}

interface Participant {
  id: string;
  userId: string;
  threadId: string;
  role: string;
  joinedAt: string;
  lastSeenAt: string | null;
  isOnline: boolean;
  isMuted: boolean;
  isBlocked: boolean;
  user: User;
}

interface Message {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  type: string;
  status: string;
  metadata: Record<string, unknown> | null;
  replyToId: string | null;
  createdAt: string;
  updatedAt: string;
  deliveredAt: string | null;
  readAt: string | null;
  editedAt: string | null;
  sender: Participant;
}

interface Listing {
  id: string;
  title: string;
}

interface ChatThread {
  id: string;
  type: string;
  title: string | null;
  description: string | null;
  avatar: string | null;
  listingId: string | null;
  isActive: boolean;
  isPinned: boolean;
  isMuted: boolean;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
  messages: Message[];
  listing: Listing | null;
  _count: {
    messages: number;
  };
}

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'About', href: '/about', icon: Users },
  { name: 'Contact', href: '/contact', icon: MessageSquare },
];

const NavLinks = ({ session, pathname, className, onClick }: { 
  session: Session | null;
  pathname: string;
  className?: string;
  onClick?: () => void;
}) => (
  <div className={cn("flex items-center space-x-1", className)}>
    {navItems.map((item) => {
      const Icon = item.icon;
      const isActive = pathname === item.href;
      return (
        <Link 
          key={item.href}
          href={item.href} 
          onClick={onClick}
          className={cn(
            "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
            isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          <span>{item.name}</span>
        </Link>
      );
    })}
    
    {/* Role-specific links */}
    {session?.user?.role === 'BACHELOR' && (
      <Link 
        href="/recommendations" 
        onClick={onClick}
        className={cn(
          "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
          pathname === '/recommendations' ? "bg-accent text-accent-foreground" : "text-muted-foreground"
        )}
      >
        <Heart className="h-4 w-4" />
        <span>Recommendations</span>
      </Link>
    )}
    
    {session?.user?.role === 'LANDLORD' && (
      <Link 
        href="/dashboard/landlord" 
        onClick={onClick}
        className={cn(
          "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
          pathname === '/dashboard/landlord' ? "bg-accent text-accent-foreground" : "text-muted-foreground"
        )}
      >
        <Building2 className="h-4 w-4" />
        <span>Dashboard</span>
      </Link>
    )}
    
    {session?.user?.role === 'BACHELOR' && (
      <Link 
        href="/dashboard/bachelor" 
        onClick={onClick}
        className={cn(
          "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
          pathname === '/dashboard/bachelor' ? "bg-accent text-accent-foreground" : "text-muted-foreground"
        )}
      >
        <User className="h-4 w-4" />
        <span>Dashboard</span>
      </Link>
    )}
  </div>
);

const AuthButtons = ({ 
  session, 
  isMobile = false,
  isNotificationOpen,
  setIsNotificationOpen,
  isMessageOpen,
  setIsMessageOpen,
  notifications,
  messages,
  notificationCount,
  messageCount
}: { 
  session: Session | null; 
  isMobile?: boolean;
  isNotificationOpen: boolean;
  setIsNotificationOpen: (open: boolean) => void;
  isMessageOpen: boolean;
  setIsMessageOpen: (open: boolean) => void;
  notifications: Notification[];
  messages: ChatThread[];
  notificationCount: number;
  messageCount: number;
}) => {
  if (session) {
    return (
      <div className={cn("flex items-center", isMobile ? "flex-col space-y-3 w-full" : "gap-3")}>
        {/* Action Buttons */}
        <div className={cn("flex items-center", isMobile ? "justify-between w-full" : "gap-2")}>
          {/* Notifications */}
          <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:bg-accent">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4">
                <h3 className="font-semibold text-sm mb-3">Notifications</h3>
                <div className="space-y-3">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 3).map((notification) => {
                      const getNotificationColor = (type: string) => {
                        switch (type) {
                          case 'BOOKING': return 'bg-blue-500';
                          case 'MESSAGE': return 'bg-green-500';
                          case 'PAYMENT': return 'bg-yellow-500';
                          case 'PROFILE': return 'bg-purple-500';
                          case 'LISTING': return 'bg-red-500';
                          default: return 'bg-gray-500';
                        }
                      };
                      
                      const getNotificationLink = (notification: Notification) => {
                        switch (notification.type) {
                          case 'BOOKING': return '/dashboard/bachelor?tab=bookings';
                          case 'MESSAGE': return notification.relatedId ? `/chat/${notification.relatedId}` : '/dashboard/bachelor?tab=chats';
                          case 'PAYMENT': return '/dashboard/bachelor?tab=payments';
                          case 'PROFILE': return '/profile/edit';
                          case 'LISTING': return '/dashboard/bachelor?tab=favorites';
                          default: return '/notifications';
                        }
                      };
                      
                      return (
                        <Link key={notification.id} href={getNotificationLink(notification)} className="block" onClick={() => setIsNotificationOpen(false)}>
                          <div className="flex items-start space-x-3 p-2 hover:bg-accent rounded-lg cursor-pointer">
                            <div className={`w-2 h-2 ${getNotificationColor(notification.type)} rounded-full mt-2 flex-shrink-0`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{notification.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(notification.createdAt)}</p>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t">
                  <Link href="/notifications" className="w-full" onClick={() => setIsNotificationOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">
                      View All Notifications
                    </Button>
                  </Link>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Messages */}
          <Popover open={isMessageOpen} onOpenChange={setIsMessageOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:bg-accent">
                <MessageSquare className="h-5 w-5" />
                {messageCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center">
                    {messageCount > 99 ? '99+' : messageCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4">
                <h3 className="font-semibold text-sm mb-3">Messages</h3>
                <div className="space-y-3">
                  {messages.length > 0 ? (
                    messages.slice(0, 3).map((thread) => {
                      const getAvatarColor = (name: string) => {
                        const colors = [
                          'from-blue-500 to-purple-500',
                          'from-green-500 to-teal-500',
                          'from-orange-500 to-red-500',
                          'from-purple-500 to-pink-500',
                          'from-indigo-500 to-blue-500'
                        ];
                        return colors[name.length % colors.length];
                      };
                      
                      const getInitials = (name: string) => {
                        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                      };
                      
                      // Get the other user (not the current session user)
                      const currentUserId = session?.user?.id;
                      const otherUser = thread.participants.find(p => p.userId !== currentUserId)?.user;
                      const currentUserParticipant = thread.participants.find(p => p.userId === currentUserId);
                      const lastMessage = thread.messages[thread.messages.length - 1];
                      
                      // Check if there are unread messages
                      const hasUnreadMessages = lastMessage && currentUserParticipant && 
                        lastMessage.sender.userId !== currentUserId && 
                        (!currentUserParticipant.lastSeenAt || 
                         new Date(lastMessage.createdAt) > new Date(currentUserParticipant.lastSeenAt));
                      
                      return (
                        <Link key={thread.id} href={`/chat/${thread.id}`} className="block" onClick={() => setIsMessageOpen(false)}>
                          <div className="flex items-start space-x-3 p-2 hover:bg-accent rounded-lg cursor-pointer">
                            <div className={`w-8 h-8 bg-gradient-to-br ${getAvatarColor(otherUser?.name || 'User')} rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                              {getInitials(otherUser?.name || 'U')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">{otherUser?.name || 'Unknown User'}</p>
                                {hasUnreadMessages && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{thread.listing?.title || 'General Chat'}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{lastMessage?.content || 'No messages yet'}</p>
                              <p className="text-xs text-muted-foreground mt-1">{lastMessage ? formatTimeAgo(lastMessage.createdAt) : ''}</p>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No messages yet</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t">
                  <Link href={session.user.role === 'BACHELOR' ? '/dashboard/bachelor?tab=chats' : '/messages'} className="w-full" onClick={() => setIsMessageOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full">
                      View All Messages
                    </Button>
                  </Link>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Add Listing (Landlords only) */}
        {session.user.role === 'LANDLORD' && (
          <Link href="/dashboard/landlord/listings/new" className={isMobile ? "w-full" : ""}>
            <Button size="sm" className={cn("bg-primary hover:bg-primary/90", isMobile && "w-full justify-center")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Listing
            </Button>
          </Link>
        )}

        {/* User Menu */}
        <div className={isMobile ? "w-full" : ""}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={cn(
                "relative rounded-full p-1 hover:bg-accent",
                isMobile ? "w-full justify-start p-3" : "h-10 w-10"
              )}>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {session.user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {isMobile && (
                    <div className="flex-1">
                      <p className="text-sm font-medium">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground">{session.user.email}</p>
                    </div>
                  )}
                  {isMobile && <ChevronDown className="h-4 w-4" />}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align={isMobile ? "start" : "end"} forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{session.user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session.user.email}
                  </p>
                  <Badge variant="secondary" className="w-fit text-xs mt-1">
                    {session.user.role}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/profile/edit" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Edit Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/${session.user.role.toLowerCase()}`} className="cursor-pointer">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 cursor-pointer"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", isMobile ? "flex-col space-y-3 w-full" : "gap-3")}>
      <Link href="/auth/signin" className={isMobile ? "w-full" : ""}>
        <Button variant="ghost" className={isMobile ? "w-full" : ""}>
          Sign In
        </Button>
      </Link>
      <Link href="/auth/signup" className={isMobile ? "w-full" : ""}>
        <Button className={cn("bg-primary hover:bg-primary/90", isMobile && "w-full")}>
          Sign Up
        </Button>
      </Link>
    </div>
  );
};

export function Navbar() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<ChatThread[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const pathname = usePathname();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch notifications and messages
  useEffect(() => {
    if (session?.user) {
      // Fetch notifications
      fetch('/api/notifications')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setNotifications(data.data || []);
            setNotificationCount(data.data?.filter((n: Notification) => !n.read).length || 0);
          }
        })
        .catch(err => console.error('Failed to fetch notifications:', err));

      // Fetch messages/chat threads
      fetch('/api/chat/threads')
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            setMessages(data.data || []);
            // Count threads with unread messages (using lastSeenAt logic)
            const unreadCount = data.data?.filter((thread: ChatThread) => {
              const currentUserId = session.user.id;
              const currentUserParticipant = thread.participants.find(p => p.userId === currentUserId);
              const lastMessage = thread.messages[thread.messages.length - 1];
              
              if (!lastMessage || !currentUserParticipant) return false;
              
              // Check if last message is from another user and not seen
              return lastMessage.sender.userId !== currentUserId && 
                     (!currentUserParticipant.lastSeenAt || 
                      new Date(lastMessage.createdAt) > new Date(currentUserParticipant.lastSeenAt));
            }).length || 0;
            
            setMessageCount(unreadCount);
          }
        })
        .catch(err => console.error('Failed to fetch messages:', err));
    }
  }, [session]);

  return (
    <nav className={cn(
      "sticky top-0 z-50 w-full border-b transition-all duration-200",
      isScrolled 
        ? "bg-background/95 backdrop-blur-md shadow-lg supports-[backdrop-filter]:bg-background/80" 
        : "bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="relative">
              <Home className="h-7 w-7 text-primary" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary/20 rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                RoomFinder
              </span>
              <span className="text-xs text-muted-foreground -mt-1">Find Your Perfect Room</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center flex-1 justify-center max-w-2xl mx-8">
            <div className="flex items-center space-x-1 bg-accent/30 rounded-full p-1">
              <NavLinks session={session} pathname={pathname} />
            </div>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden xl:flex items-center max-w-sm mx-4">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search rooms, locations..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-full bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 hover:bg-background"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const query = (e.target as HTMLInputElement).value;
                    if (query) {
                      window.location.href = `/search?q=${encodeURIComponent(query)}`;
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Desktop Auth */}
          <div className="hidden lg:flex">
            <AuthButtons 
              session={session} 
              isNotificationOpen={isNotificationOpen}
              setIsNotificationOpen={setIsNotificationOpen}
              isMessageOpen={isMessageOpen}
              setIsMessageOpen={setIsMessageOpen}
              notifications={notifications}
              messages={messages}
              notificationCount={notificationCount}
              messageCount={messageCount}
            />
          </div>

          {/* Mobile Menu */}
          <div className="lg:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-accent">
                  {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[350px] sm:w-[400px] p-0">
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between p-6 border-b">
                    <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMenuOpen(false)}>
                      <Home className="h-6 w-6 text-primary" />
                      <span className="font-bold text-lg">RoomFinder</span>
                    </Link>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6">
                    {/* Mobile Search */}
                    <div className="relative mb-6">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search rooms..."
                        className="w-full pl-10 pr-4 py-3 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const query = (e.target as HTMLInputElement).value;
                            if (query) {
                              window.location.href = `/search?q=${encodeURIComponent(query)}`;
                              setIsMenuOpen(false);
                            }
                          }
                        }}
                      />
                    </div>

                    {/* Mobile Navigation */}
                    <div className="space-y-1 mb-6">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Navigation</h3>
                      <NavLinks 
                        session={session} 
                        pathname={pathname}
                        className="flex-col items-start space-x-0 space-y-1"
                        onClick={() => setIsMenuOpen(false)}
                      />
                    </div>

                    {/* Mobile Auth */}
                    <div className="border-t pt-6">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Account</h3>
                      <AuthButtons 
                        session={session} 
                        isMobile={true}
                        isNotificationOpen={isNotificationOpen}
                        setIsNotificationOpen={setIsNotificationOpen}
                        isMessageOpen={isMessageOpen}
                        setIsMessageOpen={setIsMessageOpen}
                        notifications={notifications}
                        messages={messages}
                        notificationCount={notificationCount}
                        messageCount={messageCount}
                      />
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'For Rent', href: '/for-rent', icon: Building2 },
  { name: 'Search', href: '/search', icon: Search },
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

const AuthButtons = ({ session, isMobile = false }: { session: Session | null; isMobile?: boolean }) => {
  if (session) {
    return (
      <div className={cn("flex items-center", isMobile ? "flex-col space-y-3 w-full" : "gap-3")}>
        {/* Action Buttons */}
        <div className={cn("flex items-center", isMobile ? "justify-between w-full" : "gap-2")}>
          {/* Notifications */}
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="relative hover:bg-accent">
              <Bell className="h-5 w-5" />
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center">
                3
              </Badge>
            </Button>
          </Link>

          {/* Messages */}
          <Link href={session.user.role === 'BACHELOR' ? '/dashboard/bachelor?tab=chats' : '/messages'}>
            <Button variant="ghost" size="icon" className="relative hover:bg-accent">
              <MessageSquare className="h-5 w-5" />
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center">
                2
              </Badge>
            </Button>
          </Link>
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
  const pathname = usePathname();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
            <AuthButtons session={session} />
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
                      <AuthButtons session={session} isMobile={true} />
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
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Heart, Share2, Star, Copy, Smartphone } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { formatPrice } from '@/utils/helpers';
import { useIsFavorited } from '@/hooks/useFavorites';

interface Listing {
  id: string;
  title: string;
  description: string;
  price?: number;
  city?: string;
  address?: string;
  images: string[];
  amenities: string[];
  roomType: 'SINGLE' | 'SHARED' | 'ENTIRE_APARTMENT';
  isAvailable: boolean;
  availableFrom: string;
  landlord: {
    id: string;
    name: string;
    profilePicture?: string;
  };
  createdAt: string;
  // Backward compatibility
  rent?: number;
  location?: string;
}

interface ListingCardProps {
  listing: Listing;
  className?: string;
  isFavorited?: boolean;
  onFavoriteChange?: (listingId: string, isFavorited: boolean) => void;
}

export function ListingCard({ listing, className = "", isFavorited: initialFavorited = false, onFavoriteChange }: ListingCardProps) {
  const { data: session } = useSession();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Use the favorites hook for automatic checking and management
  const { isFavorited: isFavoritedFromHook, toggleFavorite, loading: favoriteLoading, initialLoading } = useIsFavorited(listing.id);
  
  // Use hook data if available, otherwise fall back to prop
  const isFavorited = initialLoading ? initialFavorited : isFavoritedFromHook;

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Favorite button clicked', { isFavorited, loading: favoriteLoading, session: !!session, listingId: listing.id });
    
    // Prevent multiple simultaneous requests
    if (favoriteLoading) return;
    
    const newIsFavorited = await toggleFavorite();
    onFavoriteChange?.(listing.id, newIsFavorited);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Share button clicked', { listingId: listing.id });
    setShowShareModal(true);
  };

  const copyToClipboard = async (url: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        if (successful) {
          toast.success('Link copied to clipboard!');
        } else {
          throw new Error('Copy command failed');
        }
        
        document.body.removeChild(textArea);
      }
      setShowShareModal(false);
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      toast.error('Failed to copy link');
    }
  };

  const shareViaWeb = async () => {
    const shareUrl = `${window.location.origin}/rooms/${listing.id}`;
    const shareData = {
      title: listing.title,
      text: listing.description,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShowShareModal(false);
        toast.success('Shared successfully!');
      } catch (error) {
        console.error('Web share failed:', error);
        await copyToClipboard(shareUrl);
      }
    } else {
      await copyToClipboard(shareUrl);
    }
  };

  const shareToSocialMedia = (platform: string) => {
    const shareUrl = `${window.location.origin}/rooms/${listing.id}`;
    const text = `Check out this room: ${listing.title}`;
    
    let url = '';
    
    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      setShowShareModal(false);
    }
  };

  // Safe array handling for images
  const safeImages = Array.isArray(listing.images) ? listing.images : [];

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === safeImages.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? safeImages.length - 1 : prev - 1
    );
  };

  const getRoomTypeLabel = (type: string) => {
    switch (type) {
      case 'SINGLE': return 'Single Room';
      case 'SHARED': return 'Shared Room';
      case 'ENTIRE_APARTMENT': return 'Entire Apartment';
      default: return type;
    }
  };

  const shareUrl = `${window.location.origin}/rooms/${listing.id}`;

  return (
    <>
      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share this room
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              {/* Native Share (Mobile/Modern browsers) */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <Button
                  onClick={shareViaWeb}
                  className="flex items-center gap-2 h-12"
                  variant="outline"
                >
                  <Smartphone className="h-4 w-4" />
                  Share
                </Button>
              )}
              
              {/* Copy Link */}
              <Button
                onClick={() => copyToClipboard(shareUrl)}
                className="flex items-center gap-2 h-12"
                variant="outline"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
            </div>

            {/* Platform Detection */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Share via:</p>
              <div className="grid grid-cols-2 gap-2">
                {/* WhatsApp */}
                <Button
                  onClick={() => shareToSocialMedia('whatsapp')}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <span className="text-green-600">📱</span>
                  WhatsApp
                </Button>
                
                {/* Telegram */}
                <Button
                  onClick={() => shareToSocialMedia('telegram')}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <span className="text-blue-500">✈️</span>
                  Telegram
                </Button>
                
                {/* Facebook */}
                <Button
                  onClick={() => shareToSocialMedia('facebook')}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <span className="text-blue-600">📘</span>
                  Facebook
                </Button>
                
                {/* Twitter */}
                <Button
                  onClick={() => shareToSocialMedia('twitter')}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <span className="text-blue-400">🐦</span>
                  Twitter
                </Button>
              </div>
            </div>

            {/* URL Preview */}
            <div className="bg-muted p-3 rounded-md">
              <p className="text-xs text-muted-foreground mb-1">Link:</p>
              <p className="text-sm font-mono break-all">{shareUrl}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className={`group hover:shadow-lg transition-shadow duration-200 ${className}`}>
      <div className="relative">
        <Link href={`/rooms/${listing.id}`} className="block">
          <div className="relative h-48 overflow-hidden rounded-t-lg">
            {safeImages.length > 0 && !safeImages[0]?.includes('/images/default-room.svg') ? (
              <>
                <Image
                  src={safeImages[currentImageIndex] || '/images/default-room.svg'}
                  alt={listing.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
                {safeImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Previous image"
                    >
                      ←
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Next image"
                    >
                      →
                    </button>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                      {safeImages.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="relative w-full h-full bg-gray-100 flex items-center justify-center">
                <Image
                  src="/images/default-room.svg"
                  alt={listing.title}
                  width={300}
                  height={200}
                  className="object-contain max-w-full max-h-full"
                />
              </div>
            )}
          </div>
        </Link>
        
        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-1 z-20">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleFavorite}
            disabled={favoriteLoading}
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white disabled:opacity-50 cursor-pointer shadow-sm z-10"
            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`h-4 w-4 transition-colors ${isFavorited ? 'fill-red-500 text-red-500' : 'hover:text-red-500'} ${favoriteLoading ? 'animate-pulse' : ''}`} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleShare}
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white disabled:opacity-50 cursor-pointer shadow-sm z-10"
            title="Share this room"
          >
            <Share2 className="h-4 w-4 hover:text-blue-600 transition-colors" />
          </Button>
        </div>

        {/* Availability badge */}
        <div className="absolute top-2 left-2">
          <Badge variant={listing.isAvailable ? "default" : "secondary"}>
            {listing.isAvailable ? 'Available' : 'Not Available'}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-1 mb-1">
              <Link href={`/rooms/${listing.id}`} className="hover:underline">
                {listing.title}
              </Link>
            </CardTitle>
            <div className="flex items-center text-muted-foreground text-sm mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="line-clamp-1">{listing.location || listing.address || listing.city || 'Location not specified'}</span>
            </div>
          </div>
          <div className="text-right ml-2">
            <div className="text-2xl font-bold">
              {((listing.price || listing.rent) && (listing.price || listing.rent)! > 0) ? formatPrice((listing.price || listing.rent)!) : '৳Contact for price'}
            </div>
            <div className="text-sm text-muted-foreground">per month</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <CardDescription className="line-clamp-2 mb-3">
          {listing.description}
        </CardDescription>

        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="outline">{getRoomTypeLabel(listing.roomType)}</Badge>
          {Array.isArray(listing.amenities) && listing.amenities.slice(0, 3).map((amenity) => (
            <Badge key={amenity} variant="outline" className="text-xs">
              {amenity}
            </Badge>
          ))}
          {Array.isArray(listing.amenities) && listing.amenities.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{listing.amenities.length - 3} more
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              {listing.landlord?.profilePicture ? (
                <Image
                  src={listing.landlord.profilePicture}
                  alt={listing.landlord.name || 'Landlord'}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <span className="text-xs font-medium">
                  {listing.landlord?.name?.charAt(0)?.toUpperCase() || 'L'}
                </span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {listing.landlord?.name || 'Unknown Landlord'}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">4.8</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t">
          <Link href={`/rooms/${listing.id}`}>
            <Button className="w-full cursor-pointer">
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
    </>
  );
}
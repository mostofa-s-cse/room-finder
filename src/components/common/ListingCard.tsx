'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MapPin,
  Star,
  Heart,
  MessageCircle,
  Calendar,
  Bed,
  Users,
  Wifi,
  Car,
  Shield,
  Zap,
} from 'lucide-react';
import { cn, formatPrice, formatDate, formatDistance } from '@/utils/helpers';
import { Listing, RoomType } from '@prisma/client';

interface ListingCardProps {
  listing: Listing & {
    landlord?: {
      id: string;
      name: string;
      phone?: string;
    };
    distance?: number;
  };
  variant?: 'default' | 'compact' | 'featured';
  showDistance?: boolean;
  onFavorite?: (listingId: string) => void;
  onContact?: (landlordId: string) => void;
  className?: string;
}

const amenityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  WiFi: Wifi,
  Parking: Car,
  Security: Shield,
  Generator: Zap,
};

export function ListingCard({
  listing,
  variant = 'default',
  showDistance = false,
  onFavorite,
  onContact,
  className,
}: ListingCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    onFavorite?.(listing.id);
  };

  const handleContact = () => {
    if (listing.landlord) {
      onContact?.(listing.landlord.id);
    }
  };

  const displayAmenities = Array.isArray(listing.amenities) 
    ? (listing.amenities as string[]).slice(0, 4) 
    : [];

  const imageUrl = listing.images?.[currentImageIndex] || '/placeholder-room.jpg';

  if (variant === 'compact') {
    return (
      <Card className={cn('overflow-hidden hover:shadow-md transition-shadow', className)}>
        <div className="flex">
          {/* Image */}
          <div className="relative w-32 h-24 flex-shrink-0">
            <Image
              src={imageUrl}
              alt={listing.title}
              fill
              className="object-cover"
            />
            <Badge
              variant={listing.roomType === RoomType.SINGLE ? 'default' : 'secondary'}
              className="absolute top-1 left-1 text-xs"
            >
              {listing.roomType === RoomType.SINGLE ? 'Single' : 'Shared'}
            </Badge>
          </div>

          {/* Content */}
          <CardContent className="flex-1 p-3">
            <div className="space-y-1">
              <Link href={`/rooms/${listing.id}`}>
                <h3 className="font-medium text-sm line-clamp-1 hover:text-primary">
                  {listing.title}
                </h3>
              </Link>
              
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                <span className="line-clamp-1">{listing.address}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-lg font-bold text-primary">
                  {formatPrice(listing.price)}/mo
                </div>
                
                {listing.ratingAvg > 0 && (
                  <div className="flex items-center text-xs">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                    <span>{listing.ratingAvg}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1',
      variant === 'featured' && 'ring-2 ring-primary/20',
      className
    )}>
      {/* Image Section */}
      <div className="relative">
        <div className="relative h-48 overflow-hidden">
          <Image
            src={imageUrl}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
          
          {/* Image Navigation */}
          {listing.images && listing.images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {listing.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Overlays */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          <Badge
            variant={listing.roomType === RoomType.SINGLE ? 'default' : 'secondary'}
          >
            {listing.roomType === RoomType.SINGLE ? (
              <><Bed className="h-3 w-3 mr-1" />Single</>
            ) : (
              <><Users className="h-3 w-3 mr-1" />Shared</>
            )}
          </Badge>
          
          {variant === 'featured' && (
            <Badge variant="destructive">Featured</Badge>
          )}
        </div>

        <div className="absolute top-2 right-2 flex space-x-1">
          {showDistance && listing.distance && (
            <Badge variant="outline" className="bg-background/80">
              {formatDistance(listing.distance)}
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 bg-background/80 hover:bg-background"
            onClick={handleFavorite}
          >
            <Heart
              className={cn(
                'h-4 w-4',
                isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
              )}
            />
          </Button>
        </div>

        {/* Price Overlay */}
        <div className="absolute bottom-2 right-2">
          <div className="bg-background/90 backdrop-blur-sm rounded-md px-2 py-1">
            <div className="text-lg font-bold text-primary">
              {formatPrice(listing.price)}
            </div>
            <div className="text-xs text-muted-foreground">per month</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Title and Rating */}
          <div className="flex items-start justify-between">
            <Link href={`/rooms/${listing.id}`}>
              <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors">
                {listing.title}
              </h3>
            </Link>
            
            {listing.ratingAvg > 0 && (
              <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{listing.ratingAvg}</span>
                <span className="text-xs text-muted-foreground">
                  ({listing.ratingCount})
                </span>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="line-clamp-1">{listing.address}</span>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {listing.description}
          </p>

          {/* Amenities */}
          {displayAmenities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {displayAmenities.map((amenity) => {
                const IconComponent = amenityIcons[amenity as keyof typeof amenityIcons];
                return (
                  <Badge key={amenity} variant="outline" className="text-xs">
                    {IconComponent && <IconComponent className="h-3 w-3 mr-1" />}
                    {amenity}
                  </Badge>
                );
              })}
              {Array.isArray(listing.amenities) && listing.amenities.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{listing.amenities.length - 4} more
                </Badge>
              )}
            </div>
          )}

          {/* Landlord Info */}
          {listing.landlord && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {listing.landlord.name?.charAt(0) || 'L'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-xs font-medium">{listing.landlord.name}</div>
                  <div className="text-xs text-muted-foreground">Landlord</div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 inline mr-1" />
                {formatDate(listing.createdAt, 'relative')}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Actions */}
      <CardFooter className="p-4 pt-0">
        <div className="flex space-x-2 w-full">
          <Link href={`/rooms/${listing.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              View Details
            </Button>
          </Link>
          
          {listing.landlord && (
            <Button onClick={handleContact} className="flex-1">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
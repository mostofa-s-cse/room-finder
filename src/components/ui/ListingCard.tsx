'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Heart, Share2, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface Listing {
  id: string;
  title: string;
  description: string;
  rent: number;
  location: string;
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
}

interface ListingCardProps {
  listing: Listing;
  className?: string;
}

export function ListingCard({ listing, className = "" }: ListingCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsFavorited(!isFavorited);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    if (navigator.share) {
      navigator.share({
        title: listing.title,
        text: listing.description,
        url: `/rooms/${listing.id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/rooms/${listing.id}`);
    }
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentImageIndex((prev) => 
      prev === listing.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentImageIndex((prev) => 
      prev === 0 ? listing.images.length - 1 : prev - 1
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

  return (
    <Card className={`group hover:shadow-lg transition-shadow duration-200 ${className}`}>
      <div className="relative">
        <Link href={`/rooms/${listing.id}`}>
          <div className="relative h-48 overflow-hidden rounded-t-lg">
            {listing.images.length > 0 ? (
              <>
                <Image
                  src={listing.images[currentImageIndex] || '/placeholder-room.jpg'}
                  alt={listing.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
                {listing.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ←
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      →
                    </button>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                      {listing.images.map((_, index) => (
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
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">No Image</span>
              </div>
            )}
          </div>
        </Link>
        
        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-1">
          <Button
            variant="secondary"
            size="icon-sm"
            onClick={handleFavorite}
            className="bg-white/90 hover:bg-white"
          >
            <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          <Button
            variant="secondary"
            size="icon-sm"
            onClick={handleShare}
            className="bg-white/90 hover:bg-white"
          >
            <Share2 className="h-4 w-4" />
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
              <span className="line-clamp-1">{listing.location}</span>
            </div>
          </div>
          <div className="text-right ml-2">
            <div className="text-2xl font-bold">৳{listing.rent.toLocaleString()}</div>
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
          {listing.amenities.slice(0, 3).map((amenity) => (
            <Badge key={amenity} variant="outline" className="text-xs">
              {amenity}
            </Badge>
          ))}
          {listing.amenities.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{listing.amenities.length - 3} more
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              {listing.landlord.profilePicture ? (
                <Image
                  src={listing.landlord.profilePicture}
                  alt={listing.landlord.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <span className="text-xs font-medium">
                  {listing.landlord.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {listing.landlord.name}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">4.8</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t">
          <Link href={`/rooms/${listing.id}`}>
            <Button className="w-full">
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
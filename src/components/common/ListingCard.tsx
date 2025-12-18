"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useIsFavorited } from "@/hooks/useFavorites";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Share2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { cn, formatPrice, formatDate, formatDistance } from "@/utils/helpers";
import { Listing, RoomType } from "@prisma/client";

// Booking conflict information
export interface BookingConflict {
  startDate: string;
  endDate: string;
  status: string;
}

// Availability status type from API
export interface AvailabilityStatus {
  listingId: string;
  status: "available" | "booked" | "unavailable";
  isAvailable: boolean;
  availableFrom: string | null;
  currentBookingEnds: string | null;
  nextBookingStarts: string | null;
  reason: string;
}

interface ListingCardProps {
  listing: Listing & {
    landlord?: {
      id: string;
      name: string;
      phone?: string;
    };
    distance?: number;
  };
  variant?: "default" | "compact" | "featured";
  showDistance?: boolean;
  onFavorite?: (listingId: string) => void;
  onContact?: (landlordId: string) => void;
  className?: string;
  // Optional: Pre-fetched availability status (for batch loading)
  availabilityStatus?: AvailabilityStatus;
}

const amenityIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  WiFi: Wifi,
  Parking: Car,
  Security: Shield,
  Generator: Zap,
};

// Helper function to check single listing availability using the listings/status endpoint
export async function checkListingAvailability(
  listingId: string
): Promise<AvailabilityStatus | null> {
  try {
    const response = await fetch(`/api/listings/status?listingId=${listingId}`);
    const result = await response.json();

    if (!response.ok) {
      console.error("Availability check failed:", result);
      return null;
    }

    // Map the API response to our AvailabilityStatus format
    const data = result.data;

    // Determine the reason based on booking status
    let reason = data.reason || "Available";
    if (data.status === "booked" && data.currentBookingEnds && data.availableFrom) {
      reason = `Booked until ${formatBookingDate(data.currentBookingEnds)}`;
    } else if (data.status === "available" && data.nextBookingStarts) {
      reason = `Available (next booking: ${formatBookingDate(
        data.nextBookingStarts
      )})`;
    }

    return {
      listingId,
      status: data.status === "booked" ? "booked" : data.status === "unavailable" ? "unavailable" : "available",
      isAvailable: data.isAvailable,
      availableFrom: data.availableFrom || null,
      currentBookingEnds: data.currentBookingEnds || null,
      nextBookingStarts: data.nextBookingStarts || null,
      reason,
    };
  } catch (error) {
    console.error("Error checking availability:", error);
    return null;
  }
}

// Helper to format booking dates
function formatBookingDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
}

// Helper function to check availability for multiple listings at once
export async function checkListingsAvailability(
  listingIds: string[]
): Promise<Record<string, AvailabilityStatus>> {
  if (listingIds.length === 0) return {};

  try {
    // Check each listing individually since we don't have a batch endpoint
    const results = await Promise.all(
      listingIds.map(async (id) => {
        const status = await checkListingAvailability(id);
        return { id, status };
      })
    );

    // Convert to record
    const record: Record<string, AvailabilityStatus> = {};
    results.forEach(({ id, status }) => {
      if (status) {
        record[id] = status;
      }
    });

    return record;
  } catch (error) {
    console.error("Error checking batch availability:", error);
    return {};
  }
}

export function ListingCard({
  listing,
  variant = "default",
  showDistance = false,
  onFavorite,
  onContact,
  className,
  availabilityStatus: preloadedStatus,
}: ListingCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [availabilityState, setAvailabilityState] =
    useState<AvailabilityStatus | null>(preloadedStatus || null);

  // Use the favorites hook for automatic checking and management
  const {
    isFavorited,
    toggleFavorite,
    loading: favoriteLoading,
  } = useIsFavorited(listing.id);

  // Check if listing is available via API
  useEffect(() => {
    // If we already have preloaded status, use it
    if (preloadedStatus) {
      setAvailabilityState(preloadedStatus);
      return;
    }

    const fetchAvailability = async () => {
      try {
        const status = await checkListingAvailability(listing.id);
        if (status) {
          setAvailabilityState(status);
        } else {
          // Fallback based on listing properties
          setAvailabilityState({
            listingId: listing.id,
            status: listing.isPublished ? "available" : "unavailable",
            isAvailable: listing.isPublished === true,
            availableFrom: listing.availableFrom
              ? new Date(listing.availableFrom).toISOString()
              : null,
            currentBookingEnds: null,
            nextBookingStarts: null,
            reason: listing.isPublished ? "Available" : "Not published",
          });
        }
      } catch (error) {
        console.error("Error fetching availability:", error);
        // Fallback
        setAvailabilityState({
          listingId: listing.id,
          status: "available",
          isAvailable: true,
          availableFrom: null,
          currentBookingEnds: null,
          nextBookingStarts: null,
          reason: "Available",
        });
      }
    };

    fetchAvailability();
  }, [listing.id, listing.isPublished, listing.availableFrom, preloadedStatus]);

  // Derived availability values
  const isAvailable = availabilityState?.isAvailable ?? true;
  const availableFromDate = availabilityState?.availableFrom
    ? new Date(availabilityState.availableFrom)
    : null;
  const currentBookingEndsDate = availabilityState?.currentBookingEnds
    ? new Date(availabilityState.currentBookingEnds)
    : null;
  const nextBookingStartsDate = availabilityState?.nextBookingStarts
    ? new Date(availabilityState.nextBookingStarts)
    : null;

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (favoriteLoading) return;

    await toggleFavorite();
    onFavorite?.(listing.id);
  };

  const handleContact = () => {
    if (listing.landlord) {
      onContact?.(listing.landlord.id);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent multiple concurrent share operations
    if (isSharing) return;

    setIsSharing(true);

    try {
      const shareData = {
        title: listing.title,
        text: `Check out this room: ${listing.title} - ${
          listing.price
            ? `৳${listing.price.toLocaleString()}`
            : "Contact for price"
        }/month`,
        url: `${window.location.origin}/rooms/${listing.id}`,
      };

      if (
        navigator.share &&
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      ) {
        await navigator.share(shareData);
        // Success feedback can be added here if needed
      } else {
        // Fallback to clipboard for desktop
        await navigator.clipboard.writeText(shareData.url);
        // Success feedback can be added here if needed
      }
    } catch (error) {
      console.error("Error sharing:", error);

      // If share fails, try clipboard as fallback
      try {
        await navigator.clipboard.writeText(
          `${window.location.origin}/rooms/${listing.id}`
        );
      } catch (clipboardError) {
        console.error("Clipboard error:", clipboardError);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const displayAmenities = Array.isArray(listing.amenities)
    ? (listing.amenities as string[]).slice(0, 4)
    : [];

  const imagesArray = Array.isArray(listing.images)
    ? (listing.images as string[])
    : [];
  const imageUrl = imagesArray[currentImageIndex] || "/placeholder-room.jpg";

  // Format the available from date
  const formatAvailableDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  // Get availability badge content - similar to BookingForm conflict display
  const getAvailabilityBadge = (compact = false) => {
    // Available now
    if (isAvailable) {
      // Has future booking but available now
      if (nextBookingStartsDate) {
        return {
          variant: "default" as const,
          className: "bg-green-600 hover:bg-green-700",
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
          text: compact
            ? "Available"
            : `Available (booked from ${formatAvailableDate(
                nextBookingStartsDate
              )})`,
          tooltip: `Available now, but booked starting ${formatAvailableDate(
            nextBookingStartsDate
          )}`,
        };
      }
      return {
        variant: "default" as const,
        className: "bg-green-600 hover:bg-green-700",
        icon: <CheckCircle className="h-3 w-3 mr-1" />,
        text: "Available",
        tooltip: "Available for booking now",
      };
    }

    // Currently booked - show conflict dates
    if (currentBookingEndsDate && availableFromDate) {
      return {
        variant: "secondary" as const,
        className: "bg-amber-500 hover:bg-amber-600 text-white",
        icon: <Calendar className="h-3 w-3 mr-1" />,
        text: compact
          ? `From ${formatAvailableDate(availableFromDate)}`
          : `Booked • Available ${formatAvailableDate(availableFromDate)}`,
        tooltip: `Currently booked until ${formatAvailableDate(
          currentBookingEndsDate
        )}. Available from ${formatAvailableDate(availableFromDate)}`,
      };
    }

    // Has available from date (future availability)
    if (availableFromDate) {
      return {
        variant: "secondary" as const,
        className: "bg-amber-500 hover:bg-amber-600 text-white",
        icon: <Calendar className="h-3 w-3 mr-1" />,
        text: compact
          ? formatAvailableDate(availableFromDate)
          : `Available ${formatAvailableDate(availableFromDate)}`,
        tooltip: `Will be available from ${formatAvailableDate(
          availableFromDate
        )}`,
      };
    }

    // Booked with no known available date
    return {
      variant: "destructive" as const,
      className: "",
      icon: <AlertCircle className="h-3 w-3 mr-1" />,
      text: "Booked",
      tooltip: "Currently booked",
    };
  };

  if (variant === "compact") {
    return (
      <Card
        className={cn(
          "overflow-hidden hover:shadow-md transition-shadow",
          className
        )}
      >
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
              variant={
                listing.roomType === RoomType.SINGLE ? "default" : "secondary"
              }
              className="absolute top-1 left-1 text-xs"
            >
              {listing.roomType === RoomType.SINGLE ? "Single" : "Shared"}
            </Badge>
            {/* Availability Status */}
            <div className="absolute top-1 right-1">
              {(() => {
                const badge = getAvailabilityBadge(true);
                return (
                  <Badge
                    variant={badge.variant}
                    className={cn("text-xs cursor-help", badge.className)}
                    title={badge.tooltip}
                  >
                    {badge.icon}
                    {badge.text}
                  </Badge>
                );
              })()}
            </div>
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
                  {listing.price && listing.price > 0
                    ? `${formatPrice(listing.price)}/mo`
                    : "৳Contact for price"}
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
    <Card
      className={cn(
        "overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1",
        variant === "featured" && "ring-2 ring-primary/20",
        className
      )}
    >
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
          {imagesArray.length > 1 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {imagesArray.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    index === currentImageIndex ? "bg-white" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Overlays */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          <Badge
            variant={
              listing.roomType === RoomType.SINGLE ? "default" : "secondary"
            }
          >
            {listing.roomType === RoomType.SINGLE ? (
              <>
                <Bed className="h-3 w-3 mr-1" />
                Single
              </>
            ) : (
              <>
                <Users className="h-3 w-3 mr-1" />
                Shared
              </>
            )}
          </Badge>

          {variant === "featured" && (
            <Badge variant="destructive">Featured</Badge>
          )}

          {/* Availability Status Badge */}
          {(() => {
            const badge = getAvailabilityBadge(false);
            return (
              <Badge
                variant={badge.variant}
                className={cn("cursor-help", badge.className)}
                title={badge.tooltip}
              >
                {badge.icon}
                {badge.text}
              </Badge>
            );
          })()}
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
            className="h-8 w-8 p-0 bg-background/80 hover:bg-background cursor-pointer"
            onClick={handleShare}
            disabled={isSharing}
            title="Share this room"
          >
            <Share2
              className={cn(
                "h-4 w-4 text-muted-foreground hover:text-primary transition-colors",
                isSharing && "animate-pulse"
              )}
            />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 bg-background/80 hover:bg-background cursor-pointer"
            onClick={handleFavorite}
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-colors cursor-pointer",
                isFavorited
                  ? "fill-red-500 text-red-500"
                  : "text-muted-foreground hover:text-red-500"
              )}
            />
          </Button>
        </div>

        {/* Price Overlay */}
        <div className="absolute bottom-2 right-2">
          <div className="bg-background/90 backdrop-blur-sm rounded-md px-2 py-1">
            <div className="text-lg font-bold text-primary">
              {listing.price && listing.price > 0
                ? formatPrice(listing.price)
                : "৳Contact for price"}
            </div>
            <div className="text-xs text-muted-foreground">
              {listing.price && listing.price > 0 ? "per month" : ""}
            </div>
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
                const IconComponent =
                  amenityIcons[amenity as keyof typeof amenityIcons];
                return (
                  <Badge key={amenity} variant="outline" className="text-xs">
                    {IconComponent && (
                      <IconComponent className="h-3 w-3 mr-1" />
                    )}
                    {amenity}
                  </Badge>
                );
              })}
              {Array.isArray(listing.amenities) &&
                listing.amenities.length > 4 && (
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
                    {listing.landlord.name?.charAt(0) || "L"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-xs font-medium">
                    {listing.landlord.name}
                  </div>
                  <div className="text-xs text-muted-foreground">Landlord</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 inline mr-1" />
                {formatDate(listing.createdAt, "relative")}
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
            <Button
              onClick={handleContact}
              className="flex-1 cursor-pointer"
              disabled={!isAvailable}
              title={
                !isAvailable
                  ? currentBookingEndsDate && availableFromDate
                    ? `Conflict with existing booking until ${formatAvailableDate(
                        currentBookingEndsDate
                      )}. Available from ${formatAvailableDate(
                        availableFromDate
                      )}`
                    : availableFromDate
                    ? `Available from ${formatAvailableDate(availableFromDate)}`
                    : "Currently booked"
                  : nextBookingStartsDate
                  ? `Book now (future booking starts ${formatAvailableDate(
                      nextBookingStartsDate
                    )})`
                  : "Book this room"
              }
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {isAvailable
                ? "Book Now"
                : currentBookingEndsDate && availableFromDate
                ? `From ${formatAvailableDate(availableFromDate)}`
                : availableFromDate
                ? `Available ${formatAvailableDate(availableFromDate)}`
                : "Booked"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

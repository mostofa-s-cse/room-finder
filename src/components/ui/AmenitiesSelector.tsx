'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import { useState } from 'react';

interface AmenitiesSelectorProps {
  selectedAmenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
  availableAmenities?: string[];
  className?: string;
}

const DEFAULT_AMENITIES = [
  'WiFi',
  'AC',
  'Heating',
  'Kitchen',
  'Laundry',
  'Parking',
  'Gym',
  'Pool',
  'Security',
  'Furnished',
  'Pet Friendly',
  'Balcony',
  'Elevator',
  'Garden',
  'Terrace',
  'Study Room',
  'Common Area',
  'Cleaning Service',
];

export function AmenitiesSelector({ 
  selectedAmenities, 
  onAmenitiesChange, 
  availableAmenities = DEFAULT_AMENITIES,
  className = '' 
}: AmenitiesSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      onAmenitiesChange(selectedAmenities.filter(a => a !== amenity));
    } else {
      onAmenitiesChange([...selectedAmenities, amenity]);
    }
  };

  const removeAmenity = (amenity: string) => {
    onAmenitiesChange(selectedAmenities.filter(a => a !== amenity));
  };

  const clearAll = () => {
    onAmenitiesChange([]);
  };

  const displayedAmenities = isExpanded 
    ? availableAmenities 
    : availableAmenities.slice(0, 12);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Amenities</CardTitle>
          {selectedAmenities.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected amenities */}
        {selectedAmenities.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Selected:</p>
            <div className="flex flex-wrap gap-1">
              {selectedAmenities.map(amenity => (
                <Badge key={amenity} variant="default" className="text-xs">
                  {amenity}
                  <button
                    onClick={() => removeAmenity(amenity)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Available amenities */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Available:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {displayedAmenities.map(amenity => (
              <Button
                key={amenity}
                variant={selectedAmenities.includes(amenity) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleAmenity(amenity)}
                className="justify-start text-xs h-8"
              >
                {amenity}
              </Button>
            ))}
          </div>
          
          {availableAmenities.length > 12 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mt-2"
            >
              {isExpanded ? 'Show Less' : `Show All (${availableAmenities.length - 12} more)`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Wifi,
  Car,
  UtensilsCrossed,
  Waves,
  Dumbbell,
  ShieldCheck,
  Wind,
  Zap,
  Tv,
  Coffee,
  Refrigerator,
  WashingMachine,
  Plus,
  X,
  Check,
  Search,
} from 'lucide-react';
import { cn } from '@/utils/helpers';

interface Amenity {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  popular?: boolean;
}

const PREDEFINED_AMENITIES: Amenity[] = [
  // Essential
  { id: 'wifi', name: 'WiFi', icon: Wifi, category: 'Essential', popular: true },
  { id: 'electricity', name: '24/7 Electricity', icon: Zap, category: 'Essential', popular: true },
  { id: 'water', name: 'Running Water', icon: Waves, category: 'Essential', popular: true },
  { id: 'security', name: 'Security Guard', icon: ShieldCheck, category: 'Essential', popular: true },

  // Kitchen & Dining
  { id: 'kitchen', name: 'Shared Kitchen', icon: UtensilsCrossed, category: 'Kitchen & Dining', popular: true },
  { id: 'refrigerator', name: 'Refrigerator', icon: Refrigerator, category: 'Kitchen & Dining' },
  { id: 'microwave', name: 'Microwave', icon: Coffee, category: 'Kitchen & Dining' },
  { id: 'gas_stove', name: 'Gas Stove', icon: UtensilsCrossed, category: 'Kitchen & Dining' },

  // Comfort & Climate
  { id: 'ac', name: 'Air Conditioning', icon: Wind, category: 'Comfort & Climate', popular: true },
  { id: 'fan', name: 'Ceiling Fan', icon: Wind, category: 'Comfort & Climate' },
  { id: 'heater', name: 'Room Heater', icon: Zap, category: 'Comfort & Climate' },

  // Entertainment
  { id: 'tv', name: 'Television', icon: Tv, category: 'Entertainment' },
  { id: 'cable', name: 'Cable TV', icon: Tv, category: 'Entertainment' },

  // Laundry
  { id: 'washing_machine', name: 'Washing Machine', icon: WashingMachine, category: 'Laundry' },
  { id: 'dryer', name: 'Dryer', icon: WashingMachine, category: 'Laundry' },

  // Parking & Transportation
  { id: 'parking', name: 'Parking Space', icon: Car, category: 'Parking & Transportation', popular: true },
  { id: 'bike_parking', name: 'Bike Parking', icon: Car, category: 'Parking & Transportation' },

  // Recreation
  { id: 'gym', name: 'Gym Access', icon: Dumbbell, category: 'Recreation' },
  { id: 'rooftop', name: 'Rooftop Access', icon: Plus, category: 'Recreation' },
];

interface AmenitiesSelectorProps {
  selectedAmenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
  customAmenities?: string[];
  onCustomAmenitiesChange?: (amenities: string[]) => void;
  maxSelections?: number;
  showCategories?: boolean;
  showCustom?: boolean;
  className?: string;
}

export function AmenitiesSelector({
  selectedAmenities,
  onAmenitiesChange,
  customAmenities = [],
  onCustomAmenitiesChange,
  maxSelections,
  showCategories = true,
  showCustom = true,
  className,
}: AmenitiesSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [newCustomAmenity, setNewCustomAmenity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter amenities based on search query and category
  const filteredAmenities = PREDEFINED_AMENITIES.filter((amenity) => {
    const matchesSearch = amenity.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || amenity.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(PREDEFINED_AMENITIES.map((a) => a.category)));

  // Get popular amenities
  const popularAmenities = PREDEFINED_AMENITIES.filter((a) => a.popular);

  const toggleAmenity = (amenityId: string) => {
    const isSelected = selectedAmenities.includes(amenityId);
    
    if (isSelected) {
      onAmenitiesChange(selectedAmenities.filter((id) => id !== amenityId));
    } else {
      if (maxSelections && selectedAmenities.length >= maxSelections) {
        return; // Don't allow more selections
      }
      onAmenitiesChange([...selectedAmenities, amenityId]);
    }
  };

  const addCustomAmenity = () => {
    if (!newCustomAmenity.trim() || !onCustomAmenitiesChange) return;
    
    const trimmedAmenity = newCustomAmenity.trim();
    if (!customAmenities.includes(trimmedAmenity)) {
      onCustomAmenitiesChange([...customAmenities, trimmedAmenity]);
    }
    setNewCustomAmenity('');
  };

  const removeCustomAmenity = (amenity: string) => {
    if (!onCustomAmenitiesChange) return;
    onCustomAmenitiesChange(customAmenities.filter((a) => a !== amenity));
    // Also remove from selected amenities if it was selected
    if (selectedAmenities.includes(amenity)) {
      onAmenitiesChange(selectedAmenities.filter((id) => id !== amenity));
    }
  };

  const AmenityCard = ({ amenity, isCustom = false }: { amenity: Amenity | string; isCustom?: boolean }) => {
    const amenityId = typeof amenity === 'string' ? amenity : amenity.id;
    const amenityName = typeof amenity === 'string' ? amenity : amenity.name;
    const AmenityIcon = typeof amenity === 'string' ? Plus : amenity.icon;
    const isSelected = selectedAmenities.includes(amenityId);
    const isDisabled = maxSelections && !isSelected && selectedAmenities.length >= maxSelections;

    return (
      <Card
        key={amenityId}
        className={cn(
          'cursor-pointer transition-all duration-200 border-2',
          isSelected
            ? 'border-primary bg-primary/10 shadow-md'
            : 'border-muted hover:border-primary/50 hover:shadow-sm',
          isDisabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => !isDisabled && !isCustom && toggleAmenity(amenityId)}
      >
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className={cn(
              'p-2 rounded-full',
              isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}>
              <AmenityIcon className="h-4 w-4" />
            </div>
            <span className="font-medium">{amenityName}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {isSelected && (
              <div className="bg-primary text-primary-foreground rounded-full p-1">
                <Check className="h-3 w-3" />
              </div>
            )}
            
            {isCustom && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  removeCustomAmenity(amenityId);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Select Amenities</h3>
        <p className="text-sm text-muted-foreground">
          Choose the amenities available in your room or property
          {maxSelections && ` (${selectedAmenities.length}/${maxSelections} selected)`}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search amenities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Popular Amenities */}
      {!searchQuery && !selectedCategory && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">POPULAR AMENITIES</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {popularAmenities.map((amenity) => (
              <AmenityCard key={amenity.id} amenity={amenity} />
            ))}
          </div>
        </div>
      )}

      {/* Category Filter */}
      {showCategories && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-muted-foreground">CATEGORIES</h4>
            {selectedCategory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="text-xs"
              >
                Show All
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(
                  selectedCategory === category ? null : category
                )}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Amenities Grid */}
      <div className="space-y-4">
        {showCategories && selectedCategory ? (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              {selectedCategory.toUpperCase()}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredAmenities.map((amenity) => (
                <AmenityCard key={amenity.id} amenity={amenity} />
              ))}
            </div>
          </div>
        ) : (
          categories.map((category) => {
            const categoryAmenities = filteredAmenities.filter(
              (a) => a.category === category
            );
            
            if (categoryAmenities.length === 0) return null;

            return (
              <div key={category} className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">
                  {category.toUpperCase()}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryAmenities.map((amenity) => (
                    <AmenityCard key={amenity.id} amenity={amenity} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Custom Amenities */}
      {showCustom && (
        <div className="space-y-4">
          <Separator />
          
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">CUSTOM AMENITIES</h4>
            
            {/* Add Custom Amenity */}
            <div className="flex space-x-2">
              <Input
                placeholder="Add custom amenity..."
                value={newCustomAmenity}
                onChange={(e) => setNewCustomAmenity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomAmenity()}
              />
              <Button
                onClick={addCustomAmenity}
                disabled={!newCustomAmenity.trim()}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Custom Amenities List */}
            {customAmenities.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {customAmenities.map((amenity) => (
                  <AmenityCard key={amenity} amenity={amenity} isCustom />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Summary */}
      {selectedAmenities.length > 0 && (
        <div className="space-y-3">
          <Separator />
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">
              SELECTED AMENITIES ({selectedAmenities.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedAmenities.map((amenityId) => {
                const predefinedAmenity = PREDEFINED_AMENITIES.find((a) => a.id === amenityId);
                const amenityName = predefinedAmenity?.name || amenityId;
                
                return (
                  <Badge key={amenityId} variant="secondary" className="flex items-center space-x-1">
                    <span>{amenityName}</span>
                    <button
                      onClick={() => toggleAmenity(amenityId)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
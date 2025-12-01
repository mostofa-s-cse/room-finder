'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

interface FilterOptions {
  location?: string;
  minRent?: number;
  maxRent?: number;
  roomType?: string;
  amenities?: string[];
  availableFrom?: string;
  sortBy?: string;
}

interface FiltersSidebarProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
  className?: string;
}

const ROOM_TYPES = [
  { value: 'SINGLE', label: 'Single Room' },
  { value: 'SHARED', label: 'Shared Room' },
  { value: 'ENTIRE_APARTMENT', label: 'Entire Apartment' },
];

const AMENITIES = [
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
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

export function FiltersSidebar({ filters, onFiltersChange, onClearFilters, className = '' }: FiltersSidebarProps) {
  const [rentRange, setRentRange] = useState<number[]>([
    filters.minRent || 0,
    filters.maxRent || 100000
  ]);

  const handleRentRangeChange = (value: number[]) => {
    setRentRange(value);
    onFiltersChange({
      ...filters,
      minRent: value[0],
      maxRent: value[1],
    });
  };

  const handleLocationChange = (value: string) => {
    onFiltersChange({ ...filters, location: value });
  };

  const handleRoomTypeChange = (value: string) => {
    onFiltersChange({ ...filters, roomType: value === 'all' ? undefined : value });
  };

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    const currentAmenities = filters.amenities || [];
    const newAmenities = checked
      ? [...currentAmenities, amenity]
      : currentAmenities.filter(a => a !== amenity);
    
    onFiltersChange({ 
      ...filters, 
      amenities: newAmenities.length > 0 ? newAmenities : undefined 
    });
  };

  const handleSortChange = (value: string) => {
    onFiltersChange({ ...filters, sortBy: value });
  };

  const removeAmenity = (amenity: string) => {
    const newAmenities = (filters.amenities || []).filter(a => a !== amenity);
    onFiltersChange({ 
      ...filters, 
      amenities: newAmenities.length > 0 ? newAmenities : undefined 
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true)
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5" />
          <h3 className="font-semibold">Filters</h3>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear All
          </Button>
        )}
      </div>

      {/* Location */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Location</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Enter location..."
            value={filters.location || ''}
            onChange={(e) => handleLocationChange(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Price Range */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Price Range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="px-2">
            <Slider
              value={rentRange}
              onValueChange={handleRentRangeChange}
              max={100000}
              min={0}
              step={1000}
              className="w-full"
            />
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>৳{rentRange[0].toLocaleString()}</span>
            <span>৳{rentRange[1].toLocaleString()}</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="minRent" className="text-xs">Min</Label>
              <Input
                id="minRent"
                type="number"
                value={rentRange[0]}
                onChange={(e) => handleRentRangeChange([parseInt(e.target.value) || 0, rentRange[1]])}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="maxRent" className="text-xs">Max</Label>
              <Input
                id="maxRent"
                type="number"
                value={rentRange[1]}
                onChange={(e) => handleRentRangeChange([rentRange[0], parseInt(e.target.value) || 100000])}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Type */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Room Type</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={filters.roomType || 'all'} onValueChange={handleRoomTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select room type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {ROOM_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Amenities */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Amenities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Selected amenities */}
          {filters.amenities && filters.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {filters.amenities.map(amenity => (
                <Badge key={amenity} variant="secondary" className="text-xs">
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
          )}
          
          {/* Amenity checkboxes */}
          <div className="grid grid-cols-2 gap-2">
            {AMENITIES.map(amenity => (
              <div key={amenity} className="flex items-center space-x-2">
                <Checkbox
                  id={amenity}
                  checked={(filters.amenities || []).includes(amenity)}
                  onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
                />
                <Label htmlFor={amenity} className="text-xs font-normal">
                  {amenity}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sort By */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Sort By</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={filters.sortBy || 'newest'} onValueChange={handleSortChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Available From */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Available From</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="date"
            value={filters.availableFrom || ''}
            onChange={(e) => onFiltersChange({ ...filters, availableFrom: e.target.value })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
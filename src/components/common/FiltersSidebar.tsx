'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  MapPin,
  DollarSign,
  Star,
  Filter,
  X,
  Search,
  Bed,
  Users,
  Wifi,
  Car,
  Shield,
  Zap,
  UtensilsCrossed,
  Bath,
  Wind,
  Fan,
  Tv,
  Armchair,
} from 'lucide-react';
import { RoomType } from '@/types';
import { formatPrice } from '@/utils/helpers';
import { SearchFilters } from '@/types';

interface FiltersSidebarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  className?: string;
}

const DHAKA_AREAS = [
  'Dhanmondi', 'Gulshan', 'Banani', 'Uttara', 'Mirpur', 'Wari',
  'Old Dhaka', 'Mohammadpur', 'Bashundhara', 'Tejgaon', 'Ramna',
  'Paltan', 'Motijheel', 'Khilgaon', 'Badda', 'Rampura'
];

const AMENITIES = [
  { id: 'WiFi', label: 'WiFi', icon: Wifi },
  { id: 'AC', label: 'Air Conditioning', icon: Fan },
  { id: 'Parking', label: 'Parking', icon: Car },
  { id: 'Kitchen', label: 'Kitchen Access', icon: UtensilsCrossed },
  { id: 'Bathroom', label: 'Attached Bathroom', icon: Bath },
  { id: 'Balcony', label: 'Balcony', icon: Wind },
  { id: 'Furnished', label: 'Furnished', icon: Armchair },
  { id: 'Security', label: '24/7 Security', icon: Shield },
  { id: 'Generator', label: 'Generator', icon: Zap },
  { id: 'TV', label: 'TV', icon: Tv },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'distance', label: 'Nearest First' },
];

export function FiltersSidebar({
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  className,
}: FiltersSidebarProps) {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    localFilters.minPrice || 0,
    localFilters.maxPrice || 50000,
  ]);

  const updateFilters = (updates: Partial<SearchFilters>) => {
    const newFilters = { ...localFilters, ...updates };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handlePriceRangeChange = (value: [number, number]) => {
    setPriceRange(value);
    updateFilters({
      minPrice: value[0] === 0 ? undefined : value[0],
      maxPrice: value[1] === 50000 ? undefined : value[1],
    });
  };

  const toggleAmenity = (amenityId: string) => {
    const currentAmenities = localFilters.amenities || [];
    const newAmenities = currentAmenities.includes(amenityId)
      ? currentAmenities.filter(id => id !== amenityId)
      : [...currentAmenities, amenityId];
    
    updateFilters({ amenities: newAmenities });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (localFilters.city) count++;
    if (localFilters.minPrice || localFilters.maxPrice) count++;
    if (localFilters.roomType) count++;
    if (localFilters.amenities?.length) count++;
    if (localFilters.minRating) count++;
    if (localFilters.maxDistance) count++;
    return count;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <Filter className="h-5 w-5 mr-2" />
            Filters
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </CardTitle>
          {getActiveFiltersCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLocalFilters({});
                setPriceRange([0, 50000]);
                onClearFilters();
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Accordion type="multiple" defaultValue={['location', 'price', 'type']} className="w-full">
          {/* Location */}
          <AccordionItem value="location">
            <AccordionTrigger className="text-sm font-medium">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Location
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="city-search" className="text-sm">Search Area</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="city-search"
                    placeholder="Enter area name..."
                    value={localFilters.city || ''}
                    onChange={(e) => updateFilters({ city: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Popular Areas</Label>
                <div className="grid grid-cols-2 gap-2">
                  {DHAKA_AREAS.slice(0, 8).map((area) => (
                    <Button
                      key={area}
                      variant={localFilters.city === area ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateFilters({ city: area })}
                      className="text-xs h-8"
                    >
                      {area}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Distance Filter */}
              <div className="space-y-2">
                <Label className="text-sm">Maximum Distance</Label>
                <Select
                  value={localFilters.maxDistance?.toString() || ''}
                  onValueChange={(value) => 
                    updateFilters({ maxDistance: value ? Number(value) : undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any distance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any distance</SelectItem>
                    <SelectItem value="1">Within 1 km</SelectItem>
                    <SelectItem value="2">Within 2 km</SelectItem>
                    <SelectItem value="5">Within 5 km</SelectItem>
                    <SelectItem value="10">Within 10 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Price Range */}
          <AccordionItem value="price">
            <AccordionTrigger className="text-sm font-medium">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Price Range
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Monthly Rent</span>
                  <span className="font-medium">
                    {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                  </span>
                </div>
                
                <Slider
                  value={priceRange}
                  onValueChange={handlePriceRangeChange}
                  min={0}
                  max={50000}
                  step={1000}
                  className="w-full"
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="min-price" className="text-xs">Min Price</Label>
                    <Input
                      id="min-price"
                      type="number"
                      placeholder="Min"
                      value={priceRange[0]}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        handlePriceRangeChange([value, priceRange[1]]);
                      }}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-price" className="text-xs">Max Price</Label>
                    <Input
                      id="max-price"
                      type="number"
                      placeholder="Max"
                      value={priceRange[1]}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        handlePriceRangeChange([priceRange[0], value]);
                      }}
                      className="h-8"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Price Filters */}
              <div className="space-y-2">
                <Label className="text-sm">Quick Filters</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Under ৳10K', min: 0, max: 10000 },
                    { label: '৳10K-20K', min: 10000, max: 20000 },
                    { label: '৳20K-30K', min: 20000, max: 30000 },
                    { label: 'Above ৳30K', min: 30000, max: 50000 },
                  ].map((range) => (
                    <Button
                      key={range.label}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePriceRangeChange([range.min, range.max])}
                      className="text-xs h-8"
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Room Type */}
          <AccordionItem value="type">
            <AccordionTrigger className="text-sm font-medium">
              <div className="flex items-center">
                <Bed className="h-4 w-4 mr-2" />
                Room Type
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <RadioGroup
                value={localFilters.roomType || ''}
                onValueChange={(value) => 
                  updateFilters({ roomType: value ? value as RoomType : undefined })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="" id="any-type" />
                  <Label htmlFor="any-type" className="text-sm">Any Type</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={RoomType.SINGLE} id="single" />
                  <Label htmlFor="single" className="text-sm flex items-center">
                    <Bed className="h-4 w-4 mr-1" />
                    Single Room
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={RoomType.SHARED} id="shared" />
                  <Label htmlFor="shared" className="text-sm flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    Shared Room
                  </Label>
                </div>
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>

          {/* Amenities */}
          <AccordionItem value="amenities">
            <AccordionTrigger className="text-sm font-medium">
              <div className="flex items-center">
                <Wifi className="h-4 w-4 mr-2" />
                Amenities {localFilters.amenities?.length ? `(${localFilters.amenities.length})` : ''}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 gap-3">
                {AMENITIES.map((amenity) => (
                  <div key={amenity.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity.id}
                      checked={localFilters.amenities?.includes(amenity.id) || false}
                      onCheckedChange={() => toggleAmenity(amenity.id)}
                    />
                    <Label htmlFor={amenity.id} className="text-sm flex items-center cursor-pointer">
                      <amenity.icon className="h-4 w-4 mr-2" />
                      {amenity.label}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Rating */}
          <AccordionItem value="rating">
            <AccordionTrigger className="text-sm font-medium">
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-2" />
                Minimum Rating
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {[4, 3, 2, 1].map((rating) => (
                  <Button
                    key={rating}
                    variant={localFilters.minRating === rating ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => 
                      updateFilters({ 
                        minRating: localFilters.minRating === rating ? undefined : rating 
                      })
                    }
                    className="w-full justify-start"
                  >
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2">{rating}+ Stars</span>
                    </div>
                  </Button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Sort */}
          <AccordionItem value="sort">
            <AccordionTrigger className="text-sm font-medium">
              Sort By
            </AccordionTrigger>
            <AccordionContent>
              <Select
                value={`${localFilters.sortBy || 'newest'}-${localFilters.sortOrder || 'desc'}`}
                onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split('-') as [string, 'asc' | 'desc'];
                  updateFilters({ 
                    sortBy: sortBy as SearchFilters['sortBy'], 
                    sortOrder 
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Separator />

        {/* Apply Filters Button */}
        <Button onClick={onApplyFilters} className="w-full">
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  );
}
'use client';

import { useSession } from 'next-auth/react';
import { useState, useRef, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Switch } from '@/components/ui/switch';
import { 
  Upload, 
  X, 
  DollarSign, 
  Home, 
  Check,
  Image as ImageIcon,
  ArrowLeft,
  Save,
  Crosshair
} from 'lucide-react';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import { ErrorDisplay, useApiError } from '@/components/common/ErrorDisplay';
import AddressMapSelector from '@/components/maps/AddressMapSelector';

interface ListingFormData {
  title: string;
  description: string;
  price: number;
  city: string;
  address: string;
  lat?: number;
  lng?: number;
  roomType: 'SINGLE' | 'SHARED' | 'ENTIRE_APARTMENT' | '';
  availableFrom: string;
  images: string[];
  amenities: string[];
  rules: string[];
  contactPhone?: string;
  contactEmail?: string;
  isAvailable: boolean;
}

const AMENITIES = [
  'WiFi', 'AC', 'Heating', 'Kitchen', 'Laundry', 'Parking',
  'Gym', 'Pool', 'Security', 'Furnished', 'Pet Friendly', 'Balcony',
  'Elevator', 'Garden', 'Terrace', 'Study Room', 'Common Area', 'Cleaning Service'
];

const COMMON_RULES = [
  'No smoking', 'No pets', 'No parties', 'No overnight guests',
  'Quiet hours after 10 PM', 'Clean common areas', 'No alcohol',
  'Separate electricity bill', 'Advance rent required', 'Security deposit required'
];

const DHAKA_AREAS = [
  'Dhanmondi', 'Gulshan', 'Banani', 'Uttara', 'Mirpur', 'Mohammadpur',
  'New Market', 'Old Dhaka', 'Wari', 'Elephant Road', 'Lalmatia', 'Azimpur',
  'Green Road', 'Panthapath', 'Tejgaon', 'Bashundhara R/A', 'Baridhara',
  'Motijheel', 'Paltan', 'Ramna'
];

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    description: '',
    price: 0,
    city: '',
    address: '',
    roomType: '',
    availableFrom: '',
    images: [],
    amenities: [],
    rules: [],
    isAvailable: true
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [cityInputValue, setCityInputValue] = useState('');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [filteredAreas, setFilteredAreas] = useState(DHAKA_AREAS);
  const { error: apiError, success: apiSuccess, handleError, handleSuccess, clearMessages } = useApiError();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing listing data
  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(`/api/listings/${id}`);
        if (response.ok) {
          const listing = await response.json();
          const data = listing.data || listing;
          setFormData({
            title: data.title || '',
            description: data.description || '',
            price: data.rent || data.price || 0,
            city: data.location || data.city || '',
            address: data.address || '',
            lat: data.lat,
            lng: data.lng,
            roomType: data.roomType || '',
            availableFrom: data.availableFrom ? new Date(data.availableFrom).toISOString().split('T')[0] : '',
            images: data.images || [],
            amenities: data.amenities || [],
            rules: data.rules || [],
            contactPhone: data.contactPhone || '',
            contactEmail: data.contactEmail || '',
            isAvailable: data.isAvailable ?? true
          });
          // Set city input value for the dynamic selector
          setCityInputValue(data.location || data.city || '');
        } else {
          handleError('Failed to load listing data');
        }
      } catch (error) {
        handleError('Error loading listing');
        console.error('Error fetching listing:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListing();
  }, [id, handleError]);

  if (status === 'loading') {
    return <LoadingSpinner size="lg" text="Loading..." />;
  }

  if (!session || session.user.role !== 'LANDLORD') {
    redirect('/auth/signin');
  }

  const handleInputChange = (field: keyof ListingFormData, value: string | number | string[] | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCityInputChange = (value: string) => {
    setCityInputValue(value);
    handleInputChange('city', value);
    
    // Filter areas based on input
    const filtered = DHAKA_AREAS.filter(area => 
      area.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredAreas(filtered);
    setShowCitySuggestions(filtered.length > 0 && value.length > 0);
  };

  const selectCity = (city: string) => {
    setCityInputValue(city);
    handleInputChange('city', city);
    setShowCitySuggestions(false);
  };

  const handleAddressSelect = (addressData: {
    address: string;
    latitude: number;
    longitude: number;
    city?: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      address: addressData.address,
      lat: addressData.latitude,
      lng: addressData.longitude,
      city: addressData.city || prev.city
    }));
    // Update city input value if city is detected from map
    if (addressData.city) {
      setCityInputValue(addressData.city);
    }
    // Clear any address-related errors
    setErrors(prev => ({ 
      ...prev, 
      address: '', 
      city: addressData.city ? '' : prev.city 
    }));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        try {
          // Reverse geocode to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&limit=1`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.display_name) {
              const detectedAddress = data.display_name;
              // Enhanced city detection from multiple address components
              const detectedCity = data.address?.city || 
                                 data.address?.town || 
                                 data.address?.village || 
                                 data.address?.suburb ||
                                 data.address?.neighbourhood ||
                                 data.address?.residential ||
                                 '';
              
              handleAddressSelect({
                address: detectedAddress,
                latitude: lat,
                longitude: lng,
                city: detectedCity
              });
              
              toast.success('Current location detected successfully!');
            } else {
              // If reverse geocoding fails, still save coordinates
              setFormData(prev => ({
                ...prev,
                lat: lat,
                lng: lng
              }));
              toast.success('Location coordinates saved! Please enter address manually.');
            }
          } else {
            // If reverse geocoding fails, still save coordinates
            setFormData(prev => ({
              ...prev,
              lat: lat,
              lng: lng
            }));
            toast.success('Location coordinates saved! Please enter address manually.');
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          // Still save coordinates even if address lookup fails
          setFormData(prev => ({
            ...prev,
            lat: lat,
            lng: lng
          }));
          toast.success('Location coordinates saved! Please enter address manually.');
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsGettingLocation(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Location access denied. Please enable location permissions.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            toast.error('Location request timed out.');
            break;
          default:
            toast.error('An unknown error occurred while getting location.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const toggleAmenity = (amenity: string) => {
    const newAmenities = formData.amenities.includes(amenity)
      ? formData.amenities.filter(a => a !== amenity)
      : [...formData.amenities, amenity];
    handleInputChange('amenities', newAmenities);
  };

  const toggleRule = (rule: string) => {
    const newRules = formData.rules.includes(rule)
      ? formData.rules.filter(r => r !== rule)
      : [...formData.rules, rule];
    handleInputChange('rules', newRules);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Valid monthly rent is required';
    }

    // For existing listings, we don't require coordinates, but if they exist, validate the populated fields
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    } else if (formData.city.trim().length < 2) {
      newErrors.city = 'City/Area must be at least 2 characters';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.trim().length < 10) {
      newErrors.address = 'Address must be at least 10 characters';
    }

    if (!formData.roomType) {
      newErrors.roomType = 'Room type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;
    
    setUploadingImages(true);
    const newImages: string[] = [];

    try {
      for (let i = 0; i < files.length && newImages.length + formData.images.length < 10; i++) {
        const file = files[i];
        
        if (!file.type.startsWith('image/')) {
          continue;
        }

        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('folder', 'listings');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });

        if (response.ok) {
          const result = await response.json();
          newImages.push(result.url);
        }
      }

      if (newImages.length > 0) {
        handleInputChange('images', [...formData.images, ...newImages]);
        toast.success(`${newImages.length} image(s) uploaded successfully`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload some images');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    handleInputChange('images', newImages);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);
    clearMessages();

    try {
      const response = await fetch(`/api/listings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          price: Number(formData.price),
          city: formData.city.trim(),
          address: formData.address.trim(),
          lat: formData.lat,
          lng: formData.lng,
          roomType: formData.roomType,
          availableFrom: formData.availableFrom?.trim() || undefined,
          images: formData.images || [],
          amenities: formData.amenities || [],
          rules: formData.rules || [],
          contactPhone: formData.contactPhone?.trim() || undefined,
          contactEmail: formData.contactEmail?.trim() || undefined
        }),
      });

      if (response.ok) {
        handleSuccess('Listing updated successfully!');
        toast.success('Listing updated successfully!');
        router.push('/dashboard/landlord?tab=listings');
      } else {
        try {
          const errorData = await response.json();
          handleError(errorData.error || 'Failed to update listing');
        } catch {
          // Handle empty response body
          handleError(`Failed to update listing (${response.status})`);
        }
      }
    } catch (error) {
      console.error('Error updating listing:', error);
      handleError('An error occurred while updating the listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading listing..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Edit Listing</h1>
          <p className="text-slate-600">Update your room listing details</p>
        </div>

        {/* Error Display */}
        <ErrorDisplay error={apiError} success={apiSuccess} />

        {/* Form Content */}
        <div className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Update basic details about your room
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Listing Title * (5-100 characters)</Label>
                <Input
                  id="title"
                  maxLength={100}
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Cozy single room in Dhanmondi"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
                <p className="text-sm text-muted-foreground">{formData.title.length}/100 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description * (20-1000 characters)</Label>
                <Textarea
                  id="description"
                  maxLength={1000}
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your room, location, nearby facilities..."
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
                <p className="text-sm text-muted-foreground">{formData.description.length}/1000 characters</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Monthly Rent (৳) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      min="1"
                      max="1000000"
                      value={formData.price || ''}
                      onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                      placeholder="15000"
                      className={`pl-10 ${errors.price ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roomType">Room Type *</Label>
                  <Select 
                    value={formData.roomType} 
                    onValueChange={(value) => handleInputChange('roomType', value)}
                  >
                    <SelectTrigger className={errors.roomType ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE">Single Room</SelectItem>
                      <SelectItem value="SHARED">Shared Room</SelectItem>
                      <SelectItem value="ENTIRE_APARTMENT">Entire Apartment</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.roomType && <p className="text-red-500 text-sm">{errors.roomType}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="availableFrom">Available From</Label>
                  <Input
                    id="availableFrom"
                    type="date"
                    value={formData.availableFrom}
                    onChange={(e) => handleInputChange('availableFrom', e.target.value)}
                    className={errors.availableFrom ? 'border-red-500' : ''}
                  />
                  {errors.availableFrom && <p className="text-red-500 text-sm">{errors.availableFrom}</p>}
                  <p className="text-xs text-muted-foreground">
                    When will this room be available for rent?
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone (Optional)</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone || ''}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    placeholder="+880 1700-000000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Alternative contact number for this listing
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email (Optional)</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail || ''}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="your.email@example.com"
                  className={errors.contactEmail ? 'border-red-500' : ''}
                />
                {errors.contactEmail && <p className="text-red-500 text-sm">{errors.contactEmail}</p>}
                <p className="text-xs text-muted-foreground">
                  Alternative email for inquiries about this listing
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) => handleInputChange('isAvailable', checked)}
                />
                <Label>Available for rent</Label>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
              <CardDescription>
                Update location information. Use the map to ensure accurate coordinates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 relative">
                <Label htmlFor="city">City/Area * {formData.lat && formData.lng && '(From Map)'}</Label>
                <div className="relative">
                  <Input
                    id="city"
                    value={cityInputValue || formData.city}
                    onChange={(e) => {
                      // Only allow changes if no coordinates are set
                      if (!formData.lat || !formData.lng) {
                        handleCityInputChange(e.target.value);
                      }
                    }}
                    onFocus={() => {
                      if (!formData.lat || !formData.lng) {
                        if (filteredAreas.length > 0 && cityInputValue.length > 0) {
                          setShowCitySuggestions(true);
                        }
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding suggestions to allow clicking
                      setTimeout(() => setShowCitySuggestions(false), 150);
                    }}
                    placeholder={formData.lat && formData.lng ? 'City detected from map selection' : 'Type or select area'}
                    className={`${errors.city ? 'border-red-500' : ''} ${formData.lat && formData.lng ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    readOnly={!!(formData.lat && formData.lng)}
                  />
                  {showCitySuggestions && filteredAreas.length > 0 && !formData.lat && !formData.lng && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {filteredAreas.map((area) => (
                        <button
                          key={area}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-sm border-b border-gray-100 last:border-b-0"
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent onBlur from firing
                            selectCity(area);
                          }}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.lat && formData.lng ? 
                    '📍 City automatically detected from map selection' : 
                    '💡 Use map below to select location or type manually'
                  }
                </p>
                {errors.city && (
                  <p className="text-sm text-red-500">{errors.city}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Full Address * {formData.lat && formData.lng && '(From Map)'}</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => {
                    // Only allow changes if no coordinates are set
                    if (!formData.lat || !formData.lng) {
                      handleInputChange('address', e.target.value);
                    }
                  }}
                  placeholder={formData.lat && formData.lng ? 'Address automatically detected from map' : 'Type address or use map below'}
                  rows={formData.address ? 3 : 2}
                  className={`${errors.address ? 'border-red-500' : formData.address.length > 0 && formData.address.length < 10 ? 'border-yellow-500' : ''} ${formData.lat && formData.lng ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  readOnly={!!(formData.lat && formData.lng)}
                />
                <p className={`text-xs ${
                  formData.lat && formData.lng ? 'text-green-600' :
                  formData.address.length >= 10 ? 'text-green-600' : 
                  formData.address.length > 0 ? 'text-yellow-600' : 
                  'text-muted-foreground'
                }`}>
                  {formData.lat && formData.lng ? 
                    `📍 Address detected from map (${formData.address.length} characters) ✓` :
                    `${formData.address.length}/10+ characters ${formData.address.length >= 10 ? '✓' : formData.address.length > 0 ? '(need more)' : ''}`
                  }
                </p>
                {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
              </div>

              {/* Map Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">📍 Update Location on Map (Optional)</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={getCurrentLocation}
                      disabled={isGettingLocation}
                      className="flex items-center gap-2"
                    >
                      {isGettingLocation ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Crosshair className="h-4 w-4" />
                      )}
                      {isGettingLocation ? 'Getting...' : 'Use My Location'}
                    </Button>
                    {formData.lat && formData.lng && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({ 
                            ...prev, 
                            latitude: undefined, 
                            longitude: undefined
                          }));
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        Clear Coordinates
                      </Button>
                    )}
                  </div>
                </div>
                <div className="border-2 border-dashed border-blue-200 rounded-lg p-1">
                  <AddressMapSelector
                    onAddressSelect={handleAddressSelect}
                    initialAddress={formData.address}
                    initialLatitude={formData.lat}
                    initialLongitude={formData.lng}
                  />
                </div>
                {formData.lat && formData.lng ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-700 mb-1">
                      ✅ Location Coordinates Available
                    </p>
                    <p className="text-xs text-green-600">
                      📍 Coordinates: {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-700 mb-1">
                      ℹ️ No Coordinates Set
                    </p>
                    <p className="text-xs text-blue-600">
                      Use the map above to set precise location coordinates for better search visibility.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>
                Upload up to 10 images of your room (max 5MB each)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  handleImageUpload(e.dataTransfer.files);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="hidden"
                />
                
                <div className="space-y-4">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div>
                    <p className="text-lg font-medium">Upload room images</p>
                    <p className="text-sm text-muted-foreground">
                      Drag and drop images here, or{' '}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        browse files
                      </button>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supports JPG, PNG, WebP. Max 5MB per file. Up to 10 images total.
                  </p>
                </div>

                {uploadingImages && (
                  <div className="mt-4">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-muted-foreground">Uploading images...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Image Preview */}
              {formData.images.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{formData.images.length} image(s) selected</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange('images', [])}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear All
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={image}
                          alt={`Room image ${index + 1}`}
                          width={200}
                          height={150}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        {index === 0 && (
                          <Badge className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs">
                            Cover
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
              <CardDescription>
                Select all amenities available in your room
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {AMENITIES.map(amenity => (
                  <Button
                    key={amenity}
                    type="button"
                    variant={formData.amenities.includes(amenity) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleAmenity(amenity)}
                    className="justify-start text-xs h-8"
                  >
                    {formData.amenities.includes(amenity) && <Check className="h-3 w-3 mr-1" />}
                    {amenity}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* House Rules */}
          <Card>
            <CardHeader>
              <CardTitle>House Rules</CardTitle>
              <CardDescription>
                Set rules for your tenants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {COMMON_RULES.map(rule => (
                  <Button
                    key={rule}
                    type="button"
                    variant={formData.rules.includes(rule) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleRule(rule)}
                    className="justify-start text-xs h-8"
                  >
                    {formData.rules.includes(rule) && <Check className="h-3 w-3 mr-1" />}
                    {rule}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Listing
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  X, 
  MapPin, 
  DollarSign, 
  Home, 
  Calendar,
  Check,
  Plus,
  Image as ImageIcon
} from 'lucide-react';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';

interface ListingFormData {
  title: string;
  description: string;
  rent: number;
  location: string;
  latitude?: number;
  longitude?: number;
  roomType: 'SINGLE' | 'SHARED' | 'ENTIRE_APARTMENT' | '';
  availableFrom: string;
  images: string[];
  amenities: string[];
  rules: string[];
  contactPhone?: string;
  contactEmail?: string;
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

export default function NewListingPage() {
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    description: '',
    rent: 0,
    location: '',
    roomType: '',
    availableFrom: '',
    images: [],
    amenities: [],
    rules: [],
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [uploadingImages, setUploadingImages] = useState(false);

  if (status === 'loading') {
    return <LoadingSpinner size="lg" text="Loading..." />;
  }

  if (!session || session.user.role !== 'LANDLORD') {
    redirect('/auth/signin');
  }

  const handleInputChange = (field: keyof ListingFormData, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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

  const handleImageUpload = async (files: FileList) => {
    if (files.length === 0) return;
    
    setUploadingImages(true);
    try {
      // Simulate image upload - in real app, upload to cloud storage
      const newImages = Array.from(files).map((file, index) => 
        URL.createObjectURL(file) // Temporary - use actual upload URLs
      );
      
      handleInputChange('images', [...formData.images, ...newImages]);
      toast.success(`${files.length} image(s) uploaded successfully`);
    } catch (error) {
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    handleInputChange('images', newImages);
  };

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (!formData.roomType) newErrors.roomType = 'Room type is required';
      if (!formData.location.trim()) newErrors.location = 'Location is required';
    }

    if (stepNumber === 2) {
      if (formData.rent <= 0) newErrors.rent = 'Rent must be greater than 0';
      if (!formData.availableFrom) newErrors.availableFrom = 'Available date is required';
    }

    if (stepNumber === 3) {
      if (formData.images.length === 0) newErrors.images = 'At least one image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    try {
      setIsSubmitting(true);
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const listing = await response.json();
        toast.success('Listing created successfully!');
        // Redirect to listing page
        window.location.href = `/rooms/${listing.id}`;
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create listing');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error('An error occurred while creating the listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create New Listing</h1>
            <p className="text-muted-foreground mt-1">
              Add your room details to attract potential tenants
            </p>
          </div>
          <Badge variant="outline">Step {step} of 4</Badge>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step >= stepNumber ? 'bg-primary text-primary-foreground' : 'bg-muted'}
              `}>
                {step > stepNumber ? <Check className="h-4 w-4" /> : stepNumber}
              </div>
              {stepNumber < 4 && (
                <div className={`
                  h-1 w-24 mx-2
                  ${step > stepNumber ? 'bg-primary' : 'bg-muted'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Provide basic details about your room
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Listing Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Cozy single room in Dhanmondi"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your room, location benefits, nearby facilities..."
                  rows={4}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {errors.roomType && (
                    <p className="text-sm text-red-500">{errors.roomType}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) => handleInputChange('location', value)}
                  >
                    <SelectTrigger className={errors.location ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      {DHAKA_AREAS.map(area => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.location && (
                    <p className="text-sm text-red-500">{errors.location}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Pricing & Availability */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing & Availability
              </CardTitle>
              <CardDescription>
                Set your rent and availability details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rent">Monthly Rent (৳) *</Label>
                  <Input
                    id="rent"
                    type="number"
                    value={formData.rent || ''}
                    onChange={(e) => handleInputChange('rent', parseFloat(e.target.value) || 0)}
                    placeholder="15000"
                    className={errors.rent ? 'border-red-500' : ''}
                  />
                  {errors.rent && (
                    <p className="text-sm text-red-500">{errors.rent}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availableFrom">Available From *</Label>
                  <Input
                    id="availableFrom"
                    type="date"
                    value={formData.availableFrom}
                    onChange={(e) => handleInputChange('availableFrom', e.target.value)}
                    className={errors.availableFrom ? 'border-red-500' : ''}
                  />
                  {errors.availableFrom && (
                    <p className="text-sm text-red-500">{errors.availableFrom}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone || ''}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    placeholder="+880 1700-000000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail || ''}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    placeholder="landlord@example.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Images */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Room Images
              </CardTitle>
              <CardDescription>
                Upload photos of your room (at least 1 image required)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image Upload */}
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop images here, or click to select
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button type="button" variant="outline" size="sm" disabled={uploadingImages}>
                      {uploadingImages ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Select Images
                    </Button>
                  </label>
                </div>
              </div>

              {errors.images && (
                <p className="text-sm text-red-500">{errors.images}</p>
              )}

              {/* Image Preview */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Room image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        className="absolute top-2 right-2"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Amenities & Rules */}
        {step === 4 && (
          <div className="space-y-6">
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
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : window.history.back()}
          >
            {step > 1 ? 'Previous' : 'Cancel'}
          </Button>
          
          {step < 4 ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                'Create Listing'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
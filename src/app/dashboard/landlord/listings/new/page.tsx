'use client';

import { useSession } from 'next-auth/react';
import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  Upload, 
  X, 
  DollarSign, 
  Home, 
  Check,
  Image as ImageIcon
} from 'lucide-react';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import { ErrorDisplay, useApiError } from '@/components/common/ErrorDisplay';

interface ListingFormData {
  title: string;
  description: string;
  price: number;
  city: string;
  address: string;
  latitude?: number;
  longitude?: number;
  roomType: 'SINGLE' | 'SHARED' | '';
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
    price: 0,
    city: '',
    address: '',
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
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const { error: apiError, success: apiSuccess, handleError, handleSuccess, clearMessages } = useApiError();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setUploadSuccess(null); // Clear previous success message
    const uploadedImages: string[] = [];
    const validFiles: File[] = [];
    
    // Validate all files first
    for (const file of Array.from(files)) {
      // Validate file size (max 5MB per image)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 5MB.`);
        continue;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} is not a valid image.`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    if (validFiles.length === 0) {
      setUploadingImages(false);
      return;
    }
    
    try {
      // Create FormData for multiple files
      const uploadFormData = new FormData();
      validFiles.forEach(file => {
        uploadFormData.append('file', file);
      });
      
      // Upload to API endpoint
      console.log('Uploading files:', validFiles.map(f => f.name));
      const uploadResponse = await fetch('/api/upload/image', {
        method: 'POST',
        body: uploadFormData
      });
      
      console.log('Upload response status:', uploadResponse.status);
      
      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        console.log('Upload result:', result);
        
        if (result.success && result.urls) {
          uploadedImages.push(...result.urls);
        } else if (result.success && result.url) {
          // Handle single URL response
          uploadedImages.push(result.url);
        }
        
        // Show any partial errors
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach((error: string) => toast.error(error));
        }
      } else {
        const errorResult = await uploadResponse.json().catch(() => ({ error: { message: 'Unknown upload error', code: 'UPLOAD_ERROR' } }));
        console.error('Upload failed:', errorResult);
        handleError(errorResult);
        toast.error(errorResult.error?.message || errorResult.message || 'Upload failed');
      }
      
      if (uploadedImages.length > 0) {
        handleInputChange('images', [...formData.images, ...uploadedImages]);
        const successMessage = `${uploadedImages.length} image(s) uploaded successfully`;
        setUploadSuccess(successMessage);
        toast.success(successMessage);
        
        // Clear success message after 5 seconds
        setTimeout(() => setUploadSuccess(null), 5000);
      } else {
        toast.error('No images were uploaded successfully');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      // Fallback: Create temporary URLs for development
      validFiles.forEach(file => {
        uploadedImages.push(URL.createObjectURL(file));
      });
      
      if (uploadedImages.length > 0) {
        handleInputChange('images', [...formData.images, ...uploadedImages]);
        toast.success(`${uploadedImages.length} image(s) added (temporary URLs)`);
      } else {
        toast.error('Failed to upload images');
      }
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
      if (!formData.title.trim()) {
        newErrors.title = 'Title is required';
      } else if (formData.title.trim().length < 5) {
        newErrors.title = 'Title must be at least 5 characters';
      } else if (formData.title.trim().length > 100) {
        newErrors.title = 'Title must be less than 100 characters';
      }
      
      if (!formData.description.trim()) {
        newErrors.description = 'Description is required';
      } else if (formData.description.trim().length < 20) {
        newErrors.description = 'Description must be at least 20 characters';
      } else if (formData.description.trim().length > 1000) {
        newErrors.description = 'Description must be less than 1000 characters';
      }
      
      if (!formData.roomType) newErrors.roomType = 'Room type is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required';
      } else if (formData.address.trim().length < 10) {
        newErrors.address = 'Address must be at least 10 characters';
      }
    }

    if (stepNumber === 2) {
      if (formData.price < 1000) newErrors.price = 'Price must be at least 1000 BDT';
      if (formData.price > 100000) newErrors.price = 'Price must be less than 100,000 BDT';
      if (!formData.availableFrom) newErrors.availableFrom = 'Available date is required';
      
      // Validate contact email format if provided
      if (formData.contactEmail && formData.contactEmail.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.contactEmail)) {
          newErrors.contactEmail = 'Please enter a valid email address';
        }
      }
    }

    if (stepNumber === 3) {
      if (formData.images.length === 0) newErrors.images = 'At least one image is required';
    }

    if (stepNumber === 4) {
      // No validation needed for amenities and rules as they're optional
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
    // Validate all steps before submission
    const allStepsValid = [1, 2, 3, 4].every(stepNum => validateStep(stepNum));
    if (!allStepsValid) {
      toast.error('Please fix all validation errors before submitting');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Prepare data for API (match the expected schema)
      const listingData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: formData.price,
        city: formData.city.trim(),
        address: formData.address.trim(),
        roomType: formData.roomType,
        amenities: formData.amenities,
        rules: formData.rules,
        images: formData.images,
        availableFrom: formData.availableFrom || undefined,
        contactPhone: formData.contactPhone?.trim() || undefined,
        contactEmail: formData.contactEmail?.trim() || undefined,
      };

      console.log('Sending listing data:', listingData);

      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listingData),
      });

      if (response.ok) {
        const data = await response.json();
        const listing = data.data || data;
        handleSuccess(data.message || 'Listing created successfully!');
        toast.success('Listing created successfully!');
        // Redirect to listing page after short delay
        setTimeout(() => {
          window.location.href = `/rooms/${listing.id}`;
        }, 1500);
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        handleError(errorData);
        toast.error(errorData.error?.message || 'Failed to create listing');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      handleError(error);
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

        {/* Error/Success Messages */}
        <ErrorDisplay 
          error={apiError} 
          success={apiSuccess} 
          className="mb-4" 
        />

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
                <Label htmlFor="title">Listing Title * (5-100 characters)</Label>
                <Input
                  id="title"
                  maxLength={100}
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Cozy single room in Dhanmondi"
                  className={errors.title ? 'border-red-500' : ''}
                />
                <p className={`text-xs ${formData.title.length >= 5 && formData.title.length <= 100 ? 'text-green-600' : formData.title.length > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                  {formData.title.length}/100 characters {formData.title.length >= 5 && formData.title.length <= 100 ? '✓' : formData.title.length > 0 && formData.title.length < 5 ? '(need more)' : formData.title.length > 100 ? '(too long)' : ''}
                </p>
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description * (20-1000 characters)</Label>
                <Textarea
                  id="description"
                  maxLength={1000}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your room, location benefits, nearby facilities..."
                  rows={4}
                  className={errors.description ? 'border-red-500' : ''}
                />
                <p className={`text-xs ${formData.description.length >= 20 && formData.description.length <= 1000 ? 'text-green-600' : formData.description.length > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                  {formData.description.length}/1000 characters {formData.description.length >= 20 && formData.description.length <= 1000 ? '✓' : formData.description.length > 0 && formData.description.length < 20 ? '(need more)' : formData.description.length > 1000 ? '(too long)' : ''}
                </p>
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
                    </SelectContent>
                  </Select>
                  {errors.roomType && (
                    <p className="text-sm text-red-500">{errors.roomType}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Select
                    value={formData.city}
                    onValueChange={(value) => handleInputChange('city', value)}
                  >
                    <SelectTrigger className={errors.city ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      {DHAKA_AREAS.map(area => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.city && (
                    <p className="text-sm text-red-500">{errors.city}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Full Address * (Min: 10 characters)</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="e.g., House 123, Road 4, Block A, Dhanmondi, Dhaka-1205"
                  rows={2}
                  className={errors.address ? 'border-red-500' : formData.address.length > 0 && formData.address.length < 10 ? 'border-yellow-500' : ''}
                />
                <p className={`text-xs ${formData.address.length >= 10 ? 'text-green-600' : formData.address.length > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                  {formData.address.length}/10+ characters {formData.address.length >= 10 ? '✓' : formData.address.length > 0 ? '(need more)' : ''}
                </p>
                {errors.address && (
                  <p className="text-sm text-red-500">{errors.address}</p>
                )}
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
                  <Label htmlFor="price">Monthly Rent (৳) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="1000"
                    max="100000"
                    value={formData.price || ''}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="15000 (Min: 1000 BDT)"
                    className={errors.price ? 'border-red-500' : formData.price > 0 && (formData.price < 1000 || formData.price > 100000) ? 'border-yellow-500' : formData.price >= 1000 && formData.price <= 100000 ? 'border-green-500' : ''}
                  />
                  {formData.price > 0 && (
                    <p className={`text-xs ${formData.price >= 1000 && formData.price <= 100000 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {formData.price >= 1000 && formData.price <= 100000 ? '✓ Valid price range' : 'Must be between 1,000 - 100,000 BDT'}
                    </p>
                  )}
                  {errors.price && (
                    <p className="text-sm text-red-500">{errors.price}</p>
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
                    className={errors.contactEmail ? 'border-red-500' : ''}
                  />
                  {errors.contactEmail && (
                    <p className="text-sm text-red-500">{errors.contactEmail}</p>
                  )}
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
              <div 
                className={`border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50/30 scale-102' 
                    : 'border-muted-foreground/25 hover:border-blue-500 hover:bg-blue-50/20'
                }`}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
                  if (files.length > 0) {
                    const fileList = new DataTransfer();
                    files.forEach(file => fileList.items.add(file));
                    handleImageUpload(fileList.files);
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                }}
              >
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${
                    dragActive ? 'bg-blue-200' : 'bg-blue-100'
                  }`}>
                    <Upload className={`h-8 w-8 transition-colors ${
                      dragActive ? 'text-blue-700' : 'text-blue-600'
                    }`} />
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 transition-colors ${
                    dragActive ? 'text-blue-700' : ''
                  }`}>
                    {dragActive ? 'Drop your images here!' : 'Upload Room Images'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {dragActive ? 'Release to upload your images' : 'Drag and drop your images here, or click to browse'}
                  </p>
                  {!dragActive && (
                    <p className="text-xs text-muted-foreground mb-4">
                      Supported formats: JPG, PNG, GIF • Maximum size: 5MB per image
                    </p>
                  )}
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="bg-white hover:bg-blue-50 border-blue-200 text-blue-700"
                    disabled={uploadingImages}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingImages ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Choose Images
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Upload Success Message */}
              {uploadSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">{uploadSuccess}</span>
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {uploadingImages && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm font-medium text-blue-700">Uploading images...</span>
                  </div>
                </div>
              )}

              {errors.images && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">{errors.images}</p>
                </div>
              )}

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
                          height={128}
                          className="w-full h-32 object-cover rounded-lg border-2 border-transparent group-hover:border-blue-200 transition-colors"
                          unoptimized={true}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
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
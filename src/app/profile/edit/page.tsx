'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  DollarSign, 
  MapPin, 
  Upload,
  Check,
  X
} from 'lucide-react';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  profilePicture?: string;
  role: 'BACHELOR' | 'LANDLORD';
  // Bachelor specific
  university?: string;
  profession?: string;
  monthlyIncome?: number;
  // Preferences
  preferences?: {
    maxBudget?: number;
    preferredAreas?: string[];
    requiredAmenities?: string[];
    roomType?: string;
  };
  // Landlord specific
  verifiedLandlord?: boolean;
}

const UNIVERSITIES = [
  'University of Dhaka',
  'Bangladesh University of Engineering and Technology (BUET)',
  'Dhaka University of Engineering and Technology (DUET)',
  'North South University',
  'BRAC University',
  'American International University-Bangladesh (AIUB)',
  'East West University',
  'Independent University, Bangladesh (IUB)',
  'Ahsanullah University of Science and Technology',
  'Other'
];

const PROFESSIONS = [
  'Student',
  'Software Engineer',
  'Doctor',
  'Teacher',
  'Banker',
  'Business Owner',
  'Government Employee',
  'Private Employee',
  'Freelancer',
  'Other'
];

const DHAKA_AREAS = [
  'Dhanmondi',
  'Gulshan',
  'Banani',
  'Uttara',
  'Mirpur',
  'Mohammadpur',
  'New Market',
  'Old Dhaka',
  'Wari',
  'Elephant Road',
  'Lalmatia',
  'Azimpur',
  'Green Road',
  'Panthapath',
  'Tejgaon',
  'Bashundhara R/A',
  'Baridhara',
  'Motijheel',
  'Paltan',
  'Ramna'
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
  'Balcony'
];

export default function ProfileEditPage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
    }
    fetchProfile();
  }, [session, status]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setSelectedAreas(data.preferences?.preferredAreas || []);
        setSelectedAmenities(data.preferences?.requiredAmenities || []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : null);
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePreferenceChange = (field: string, value: string | number | string[]) => {
    setProfile(prev => prev ? {
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value
      }
    } : null);
  };

  const toggleArea = (area: string) => {
    const newAreas = selectedAreas.includes(area)
      ? selectedAreas.filter(a => a !== area)
      : [...selectedAreas, area];
    setSelectedAreas(newAreas);
    handlePreferenceChange('preferredAreas', newAreas);
  };

  const toggleAmenity = (amenity: string) => {
    const newAmenities = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter(a => a !== amenity)
      : [...selectedAmenities, amenity];
    setSelectedAmenities(newAmenities);
    handlePreferenceChange('requiredAmenities', newAmenities);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!profile?.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!profile?.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9]{10,15}$/.test(profile.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (profile?.role === 'BACHELOR') {
      if (profile.monthlyIncome && profile.monthlyIncome < 0) {
        newErrors.monthlyIncome = 'Income must be positive';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        toast.success('Profile updated successfully!');
        // Redirect to appropriate dashboard
        const redirectPath = profile?.role === 'BACHELOR' 
          ? '/dashboard/bachelor' 
          : '/dashboard/landlord';
        window.location.href = redirectPath;
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred while updating your profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <LoadingSpinner size="lg" text="Loading your profile..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <X className="h-4 w-4" />
          <AlertDescription>
            Failed to load profile data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Edit Profile</h1>
            <p className="text-muted-foreground mt-1">
              Update your information and preferences
            </p>
          </div>
          <Badge variant={profile.role === 'BACHELOR' ? 'default' : 'secondary'}>
            {profile.role}
          </Badge>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Your basic profile information visible to others
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Picture */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.profilePicture} />
                  <AvatarFallback className="text-lg">
                    {profile.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button type="button" variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload a clear profile photo
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={profile.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+880 1700-000000"
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone}</p>
                  )}
                </div>

                {profile.role === 'BACHELOR' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="university">University</Label>
                      <Select
                        value={profile.university || ''}
                        onValueChange={(value) => handleInputChange('university', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select university" />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIVERSITIES.map(uni => (
                            <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profession">Profession</Label>
                      <Select
                        value={profile.profession || ''}
                        onValueChange={(value) => handleInputChange('profession', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select profession" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROFESSIONS.map(prof => (
                            <SelectItem key={prof} value={prof}>{prof}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="monthlyIncome">Monthly Income (৳)</Label>
                      <Input
                        id="monthlyIncome"
                        type="number"
                        value={profile.monthlyIncome || ''}
                        onChange={(e) => handleInputChange('monthlyIncome', parseFloat(e.target.value) || 0)}
                        placeholder="50000"
                        className={errors.monthlyIncome ? 'border-red-500' : ''}
                      />
                      {errors.monthlyIncome && (
                        <p className="text-sm text-red-500">{errors.monthlyIncome}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Recommended budget: ৳{profile.monthlyIncome ? (profile.monthlyIncome * 0.3).toLocaleString() : '0'}/month
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell others about yourself..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Bachelor Preferences */}
          {profile.role === 'BACHELOR' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Room Preferences
                </CardTitle>
                <CardDescription>
                  Help us recommend better rooms for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxBudget">Maximum Budget (৳)</Label>
                    <Input
                      id="maxBudget"
                      type="number"
                      value={profile.preferences?.maxBudget || ''}
                      onChange={(e) => handlePreferenceChange('maxBudget', parseFloat(e.target.value) || 0)}
                      placeholder="20000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roomType">Preferred Room Type</Label>
                    <Select
                      value={profile.preferences?.roomType || ''}
                      onValueChange={(value) => handlePreferenceChange('roomType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select room type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SINGLE">Single Room</SelectItem>
                        <SelectItem value="SHARED">Shared Room</SelectItem>
                        <SelectItem value="ENTIRE_APARTMENT">Entire Apartment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Preferred Areas</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {DHAKA_AREAS.map(area => (
                      <Button
                        key={area}
                        type="button"
                        variant={selectedAreas.includes(area) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleArea(area)}
                        className="justify-start text-xs h-8"
                      >
                        {selectedAreas.includes(area) && <Check className="h-3 w-3 mr-1" />}
                        {area}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Required Amenities</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {AMENITIES.map(amenity => (
                      <Button
                        key={amenity}
                        type="button"
                        variant={selectedAmenities.includes(amenity) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleAmenity(amenity)}
                        className="justify-start text-xs h-8"
                      >
                        {selectedAmenities.includes(amenity) && <Check className="h-3 w-3 mr-1" />}
                        {amenity}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Landlord Verification */}
          {profile.role === 'LANDLORD' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Landlord Verification
                </CardTitle>
                <CardDescription>
                  Verify your identity to gain trust from tenants
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile.verifiedLandlord ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">Verified Landlord</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert>
                      <AlertDescription>
                        Complete the verification process to build trust with potential tenants.
                        Verified landlords get 3x more bookings.
                      </AlertDescription>
                    </Alert>
                    <Button type="button" variant="outline">
                      Start Verification Process
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Form Actions */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
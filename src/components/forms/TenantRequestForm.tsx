'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tenantRequestSchema, type TenantRequestInput } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, UserIcon, Building2, Trash2, Plus } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface TenantRequestFormProps {
  listing: {
    id: string;
    title: string;
    address: string;
    price: number;
    images: string[];
    landlord: {
      name: string;
    };
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TenantRequestForm({ listing, onSuccess, onCancel }: TenantRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [references, setReferences] = useState<Array<{
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  }>>([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TenantRequestInput>({
    resolver: zodResolver(tenantRequestSchema),
    defaultValues: {
      listingId: listing.id,
      budget: listing.price,
    },
  });

  const addReference = () => {
    if (references.length < 3) {
      setReferences([...references, { name: '', relationship: '', phone: '', email: '' }]);
    }
  };

  const removeReference = (index: number) => {
    const updated = references.filter((_, i) => i !== index);
    setReferences(updated);
    setValue('references', updated);
  };

  const updateReference = (index: number, field: string, value: string) => {
    const updated = references.map((ref, i) => 
      i === index ? { ...ref, [field]: value } : ref
    );
    setReferences(updated);
    setValue('references', updated);
  };

  const onSubmit = async (data: TenantRequestInput) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/tenant-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          references: references.filter(ref => ref.name && ref.relationship && ref.phone),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit request');
      }

      toast.success('Tenant request submitted successfully!');
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/bachelor?tab=requests');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Listing Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Applying for</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            {listing.images?.[0] && (
              <Image
                src={listing.images[0]}
                alt={listing.title}
                width={80}
                height={80}
                className="w-20 h-20 rounded-lg object-cover"
              />
            )}
            <div>
              <h3 className="font-semibold text-lg">{listing.title}</h3>
              <p className="text-muted-foreground text-sm">{listing.address}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">৳{listing.price.toLocaleString()}/month</Badge>
                <Badge variant="outline">Landlord: {listing.landlord.name}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Introduction Message
            </CardTitle>
            <CardDescription>
              Tell the landlord about yourself and why you&apos;re interested in this property
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="message">Your Message *</Label>
              <Textarea
                id="message"
                placeholder="Hi, I'm interested in your property. I am a..."
                rows={4}
                {...register('message')}
                className={errors.message ? 'border-red-500' : ''}
              />
              {errors.message && (
                <p className="text-red-500 text-sm">{errors.message.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rental Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Rental Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="moveInDate">Preferred Move-in Date *</Label>
                <Input
                  id="moveInDate"
                  type="date"
                  {...register('moveInDate')}
                  className={errors.moveInDate ? 'border-red-500' : ''}
                />
                {errors.moveInDate && (
                  <p className="text-red-500 text-sm">{errors.moveInDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Rental Duration *</Label>
                <Select onValueChange={(value) => setValue('duration', value as 'FLEXIBLE' | '3_MONTHS' | '6_MONTHS' | '1_YEAR')}>
                  <SelectTrigger className={errors.duration ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3_MONTHS">3 Months</SelectItem>
                    <SelectItem value="6_MONTHS">6 Months</SelectItem>
                    <SelectItem value="1_YEAR">1 Year</SelectItem>
                    <SelectItem value="FLEXIBLE">Flexible</SelectItem>
                  </SelectContent>
                </Select>
                {errors.duration && (
                  <p className="text-red-500 text-sm">{errors.duration.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget (৳/month) *</Label>
              <Input
                id="budget"
                type="number"
                placeholder="25000"
                {...register('budget', { valueAsNumber: true })}
                className={errors.budget ? 'border-red-500' : ''}
              />
              {errors.budget && (
                <p className="text-red-500 text-sm">{errors.budget.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Professional Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Professional Information
            </CardTitle>
            <CardDescription>
              Help the landlord understand your professional background
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profession">Profession</Label>
                <Input
                  id="profession"
                  placeholder="Software Engineer"
                  {...register('profession')}
                  className={errors.profession ? 'border-red-500' : ''}
                />
                {errors.profession && (
                  <p className="text-red-500 text-sm">{errors.profession.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company/Organization</Label>
                <Input
                  id="company"
                  placeholder="Tech Solutions Ltd."
                  {...register('company')}
                  className={errors.company ? 'border-red-500' : ''}
                />
                {errors.company && (
                  <p className="text-red-500 text-sm">{errors.company.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyIncome">Monthly Income (৳)</Label>
              <Input
                id="monthlyIncome"
                type="number"
                placeholder="50000"
                {...register('monthlyIncome', { valueAsNumber: true })}
                className={errors.monthlyIncome ? 'border-red-500' : ''}
              />
              {errors.monthlyIncome && (
                <p className="text-red-500 text-sm">{errors.monthlyIncome.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* References */}
        <Card>
          <CardHeader>
            <CardTitle>References (Optional)</CardTitle>
            <CardDescription>
              Provide up to 3 references to strengthen your application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {references.map((reference, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Reference {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeReference(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Full Name"
                    value={reference.name}
                    onChange={(e) => updateReference(index, 'name', e.target.value)}
                  />
                  <Input
                    placeholder="Relationship"
                    value={reference.relationship}
                    onChange={(e) => updateReference(index, 'relationship', e.target.value)}
                  />
                  <Input
                    placeholder="Phone Number"
                    value={reference.phone}
                    onChange={(e) => updateReference(index, 'phone', e.target.value)}
                  />
                  <Input
                    placeholder="Email (Optional)"
                    type="email"
                    value={reference.email}
                    onChange={(e) => updateReference(index, 'email', e.target.value)}
                  />
                </div>
              </div>
            ))}

            {references.length < 3 && (
              <Button
                type="button"
                variant="outline"
                onClick={addReference}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Reference
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact (Optional)</CardTitle>
            <CardDescription>
              Someone the landlord can contact in case of emergency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyName">Name</Label>
                <Input
                  id="emergencyName"
                  placeholder="John Doe"
                  {...register('emergencyContact.name')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyRelationship">Relationship</Label>
                <Input
                  id="emergencyRelationship"
                  placeholder="Father"
                  {...register('emergencyContact.relationship')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Phone</Label>
                <Input
                  id="emergencyPhone"
                  placeholder="+8801XXXXXXXXX"
                  {...register('emergencyContact.phone')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
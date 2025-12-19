'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AlertCircle, Eye, EyeOff, User, Mail, Phone, Lock, Home } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SignupForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'BACHELOR' | 'LANDLORD';
  income?: string;
  affordablePrice?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'form' | 'verify'>('form');
  const [verificationInfo, setVerificationInfo] = useState<{ userId: string; email: string }>({ userId: '', email: '' });
  const [otpCode, setOtpCode] = useState('');
  
  const [formData, setFormData] = useState<SignupForm>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'BACHELOR',
    income: '',
    affordablePrice: '',
  });

  const [formErrors, setFormErrors] = useState<Partial<SignupForm>>({});

  const handleInputChange = (field: keyof SignupForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<SignupForm> = {};

    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    if (!formData.password) errors.password = 'Password is required';
    if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (formData.role === 'BACHELOR') {
      if (formData.income && isNaN(Number(formData.income))) {
        errors.income = 'Income must be a number';
      }
      if (formData.affordablePrice && isNaN(Number(formData.affordablePrice))) {
        errors.affordablePrice = 'Affordable price must be a number';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone || undefined,
        income: formData.income ? parseFloat(formData.income) : undefined,
        affordablePrice: formData.affordablePrice ? parseFloat(formData.affordablePrice) : undefined,
      };

      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || data?.message || 'Signup failed');
      }

      // Move to verification step
      setVerificationInfo({ userId: data.user.id, email: data.user.email });
      setCurrentStep('verify');
      setInfo(data.message || 'Check your email for verification code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationInfo.email, code: otpCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || data?.message || 'Verification failed');
      }

      // Sign in automatically after verification
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError('Verification successful but login failed. Please sign in manually.');
        setTimeout(() => router.push('/auth/signin'), 2000);
      } else {
        // Fetch the session to get the user's actual role
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        
        // Redirect based on actual user role from database
        if (session?.user?.role === 'LANDLORD') {
          router.push('/dashboard/landlord');
        } else {
          router.push('/dashboard/bachelor');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationInfo.email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || data?.message || 'Failed to resend code');
      }

      setInfo(data.message || 'New code sent to your email');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Create Your Account</h1>
          <p className="text-gray-600">Join Room Finder to discover your perfect room</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{currentStep === 'form' ? 'Sign Up' : 'Verify Email'}</CardTitle>
            <CardDescription>
              {currentStep === 'form'
                ? 'Fill in your details to get started'
                : 'Enter the verification code sent to your email'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {info && (
              <Alert className="mb-4" variant="default">
                <AlertDescription>{info}</AlertDescription>
              </Alert>
            )}

            {currentStep === 'form' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Role Selection */}
                <div className="space-y-2">
                  <Label htmlFor="role">I am a</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: 'BACHELOR' | 'LANDLORD') => 
                      handleInputChange('role', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BACHELOR">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Bachelor (Looking for rooms)
                        </div>
                      </SelectItem>
                      <SelectItem value="LANDLORD">
                        <div className="flex items-center">
                          <Home className="h-4 w-4 mr-2" />
                          Landlord (Renting out rooms)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={cn(
                        'pl-10',
                        formErrors.name && 'border-red-500'
                      )}
                    />
                  </div>
                  {formErrors.name && (
                    <p className="text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={cn(
                        'pl-10',
                        formErrors.email && 'border-red-500'
                      )}
                    />
                  </div>
                  {formErrors.email && (
                    <p className="text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={cn(
                        'pl-10',
                        formErrors.phone && 'border-red-500'
                      )}
                    />
                  </div>
                  {formErrors.phone && (
                    <p className="text-sm text-red-600">{formErrors.phone}</p>
                  )}
                </div>

                {/* Bachelor-specific fields */}
                {formData.role === 'BACHELOR' && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Help us recommend better rooms for you (optional)
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="income">Monthly Income (৳)</Label>
                          <Input
                            id="income"
                            type="number"
                            placeholder="50000"
                            value={formData.income || ''}
                            onChange={(e) => handleInputChange('income', e.target.value)}
                            className="pl-3"
                          />
                          {formErrors.income && (
                            <p className="text-sm text-red-600">{formErrors.income}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="affordablePrice">Affordable Rent (৳)</Label>
                          <Input
                            id="affordablePrice"
                            type="number"
                            placeholder="25000"
                            value={formData.affordablePrice || ''}
                            onChange={(e) => handleInputChange('affordablePrice', e.target.value)}
                            className="pl-3"
                          />
                          {formErrors.affordablePrice && (
                            <p className="text-sm text-red-600">{formErrors.affordablePrice}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={cn(
                        'pl-10',
                        formErrors.password && 'border-red-500'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-500"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-sm text-red-600">{formErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={cn(
                        'pl-10',
                        formErrors.confirmPassword && 'border-red-500'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-gray-500"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {formErrors.confirmPassword && (
                    <p className="text-sm text-red-600">{formErrors.confirmPassword}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      Creating account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter the 6-digit code</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  />
                  <p className="text-sm text-gray-600">We sent a code to {verificationInfo.email}. Check spam if you don&apos;t see it.</p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <LoadingSpinner size="sm" />
                        Verifying...
                      </div>
                    ) : (
                      'Verify & Continue'
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleResendCode} disabled={loading}>
                    Resend Code
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6">
              <Separator />
              <p className="text-center text-sm text-gray-600 mt-4">
                Already have an account?{' '}
                <Link 
                  href="/auth/signin" 
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

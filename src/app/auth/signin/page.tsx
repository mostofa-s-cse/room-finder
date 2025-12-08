'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Eye, EyeOff, Mail, Lock, Home, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { cn } from '@/lib/utils';

interface SigninForm {
  email: string;
  password: string;
}

function SigninContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<SigninForm>({
    email: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState<Partial<SigninForm>>({});

  // Get redirect URL from search params
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
  const errorParam = searchParams?.get('error');

  // Handle NextAuth errors
  useState(() => {
    if (errorParam) {
      switch (errorParam) {
        case 'CredentialsSignin':
          setError('Invalid email or password. Please try again.');
          break;
        case 'AccessDenied':
          setError('Access denied. Please check your credentials.');
          break;
        default:
          setError('An error occurred during sign in. Please try again.');
      }
    }
  });

  const validateForm = (): boolean => {
    const errors: Partial<SigninForm> = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Invalid email or password');
      }

      // Get the updated session to determine user role
      const session = await getSession();
      
      if (session?.user) {
        // Redirect based on user role or to callback URL
        if (callbackUrl && callbackUrl !== '/dashboard') {
          router.push(callbackUrl);
        } else {
          const userRole = (session.user as { role?: string }).role;
          if (userRole === 'LANDLORD') {
            router.push('/dashboard/landlord');
          } else if (userRole === 'ADMIN') {
            router.push('/dashboard/admin');
          } else {
            router.push('/dashboard/bachelor');
          }
        }
      } else {
        throw new Error('Failed to get user session');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SigninForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Clear general error when user starts typing
    if (error) {
      setError(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-2xl font-bold text-blue-600 mb-6">
            <Home className="h-8 w-8 mr-2" />
            Room Finder
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert className="mb-6" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {callbackUrl && callbackUrl !== '/dashboard' && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please sign in to continue to your requested page.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    autoComplete="email"
                  />
                </div>
                {formErrors.email && (
                  <p className="text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={cn(
                      'pl-10 pr-10',
                      formErrors.password && 'border-red-500'
                    )}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-sm text-red-600">{formErrors.password}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6">
              <Separator />
              <p className="text-center text-sm text-gray-600 mt-4">
                Don&apos;t have an account?{' '}
                <Link 
                  href="/auth/signup" 
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign up
                </Link>
              </p>
            </div>

            {/* Demo Accounts */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 border border-orange-200 rounded-full">
                  <span className="text-orange-600 text-sm">🔑</span>
                  <span className="text-xs font-medium text-orange-700">Development Mode</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Quick test login for different user roles</p>
              </div>
              
              <div className="space-y-3">
                {/* Bachelor Account */}
                <div className="relative group">
                  <div className="flex gap-2 p-3 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 border border-blue-100 rounded-lg transition-all duration-200 hover:shadow-sm">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-blue-600 text-sm">👨‍🎓</span>
                        <span className="font-semibold text-blue-700 text-sm">Bachelor Account</span>
                      </div>
                      <p className="text-xs text-blue-600/70 font-mono">ahmed@example.com</p>
                    </div>
                    <div className="flex gap-1">
                      
                      <Button
                        type="button"
                        size="sm"
                        disabled={loading}
                        onClick={() => {
                          setFormData({ email: 'ahmed@example.com', password: 'bachelor123' });
                          setFormErrors({});
                          setError(null);
                        }}
                        className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                      >
                        {loading ? <LoadingSpinner className="h-3 w-3" /> : '→'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Landlord Account */}
                <div className="relative group">
                  <div className="flex gap-2 p-3 bg-gradient-to-r from-green-50/50 to-emerald-50/50 border border-green-100 rounded-lg transition-all duration-200 hover:shadow-sm">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-green-600 text-sm">🏠</span>
                        <span className="font-semibold text-green-700 text-sm">Landlord Account</span>
                      </div>
                      <p className="text-xs text-green-600/70 font-mono">karim@example.com</p>
                    </div>
                    <div className="flex gap-1">
                      
                      <Button
                        type="button"
                        size="sm"
                        disabled={loading}
                        onClick={() => {
                          setFormData({ email: 'karim@example.com', password: 'landlord123' });
                          setFormErrors({});
                          setError(null);
                        }}
                        className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white shadow-sm"
                      >
                        {loading ? <LoadingSpinner className="h-3 w-3" /> : '→'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Admin Account */}
                <div className="relative group">
                  <div className="flex gap-2 p-3 bg-gradient-to-r from-purple-50/50 to-pink-50/50 border border-purple-100 rounded-lg transition-all duration-200 hover:shadow-sm">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-purple-600 text-sm">⚙️</span>
                        <span className="font-semibold text-purple-700 text-sm">Admin Account</span>
                      </div>
                      <p className="text-xs text-purple-600/70 font-mono">admin@roomfinder.com</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        disabled={loading}
                        onClick={() => {
                          setFormData({ email: 'admin@roomfinder.com', password: 'admin123' });
                          setFormErrors({});
                          setError(null);
                        }}
                        className="h-8 px-3 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                      >
                        {loading ? <LoadingSpinner className="h-3 w-3" /> : '→'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400 leading-relaxed">
                  <span className="font-medium text-gray-500">Fill</span> auto-completes the form • 
                  <span className="font-medium text-gray-500">→</span> logs in directly
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SigninPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SigninContent />
    </Suspense>
  );
}
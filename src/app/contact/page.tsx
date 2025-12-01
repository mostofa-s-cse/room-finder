'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Phone, MapPin, Clock, MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { contactSchema, type ContactInput } from '@/lib/validations';
import { toast } from 'react-hot-toast';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setValidationErrors({});
    
    try {
      // Validate form data
      const validatedData = contactSchema.parse(formData);
      
      // Submit to API
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }
      
      // Success
      setSubmitted(true);
      toast.success('Message sent successfully!');
      
      // Reset form after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          name: '',
          email: '',
          subject: '',
          category: '',
          message: '',
        });
      }, 5000);
      
    } catch (err) {
      console.error('Contact form error:', err);
      
      if (err instanceof Error) {
        // Check if it's a validation error
        if (err.message.includes('validation')) {
          try {
            const validationResult = contactSchema.safeParse(formData);
            if (!validationResult.success) {
              const errors: Record<string, string> = {};
              validationResult.error.issues.forEach((error) => {
                if (error.path[0]) {
                  errors[error.path[0].toString()] = error.message;
                }
              });
              setValidationErrors(errors);
            }
          } catch {
            setError('Please check your input and try again.');
          }
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to send message. Please try again later.');
      }
      
      toast.error('Failed to send message. Please check your input and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
            Have questions about finding your perfect room? We&apos;re here to help you every step of the way.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Email</h3>
                      <p className="text-gray-600">support@roomfinder.com</p>
                      <p className="text-sm text-gray-500">We&apos;ll respond within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <Phone className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Phone</h3>
                      <p className="text-gray-600">+880 1700-000000</p>
                      <p className="text-sm text-gray-500">Mon-Fri 9AM-6PM (BST)</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <MapPin className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Office</h3>
                      <p className="text-gray-600">Dhaka, Bangladesh</p>
                      <p className="text-sm text-gray-500">Visit by appointment</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Business Hours</h3>
                      <p className="text-gray-600">Monday - Friday: 9AM - 6PM</p>
                      <p className="text-gray-600">Saturday: 10AM - 4PM</p>
                      <p className="text-gray-600">Sunday: Closed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Help</h3>
                <div className="space-y-3">
                  <a href="/faq" className="block text-blue-600 hover:text-blue-800 transition-colors">
                    📋 Frequently Asked Questions
                  </a>
                  <a href="/help" className="block text-blue-600 hover:text-blue-800 transition-colors">
                    🆘 Help Center
                  </a>
                  <a href="/safety-tips" className="block text-blue-600 hover:text-blue-800 transition-colors">
                    🛡️ Safety Guidelines
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                  <span>Send us a Message</span>
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we&apos;ll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {submitted ? (
                  <Alert className="mb-6 border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Thank you for your message! We&apos;ll get back to you within 24 hours.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {error && (
                      <Alert className="mb-6 border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          {error}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {Object.keys(validationErrors).length > 0 && (
                      <Alert className="mb-6 border-yellow-200 bg-yellow-50">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                          Please correct the errors below and try again.
                        </AlertDescription>
                      </Alert>
                    )}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Your full name"
                          className={validationErrors.name ? 'border-red-500' : ''}
                          required
                        />
                        {validationErrors.name && (
                          <p className="text-red-500 text-sm">{validationErrors.name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="your.email@example.com"
                          className={validationErrors.email ? 'border-red-500' : ''}
                          required
                        />
                        {validationErrors.email && (
                          <p className="text-red-500 text-sm">{validationErrors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General Inquiry</SelectItem>
                            <SelectItem value="support">Technical Support</SelectItem>
                            <SelectItem value="billing">Billing Question</SelectItem>
                            <SelectItem value="partnership">Partnership</SelectItem>
                            <SelectItem value="feedback">Feedback</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                          id="subject"
                          value={formData.subject}
                          onChange={(e) => handleInputChange('subject', e.target.value)}
                          placeholder="Brief subject of your message"
                          className={validationErrors.subject ? 'border-red-500' : ''}
                          required
                        />
                        {validationErrors.subject && (
                          <p className="text-red-500 text-sm">{validationErrors.subject}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        placeholder="Tell us more about your inquiry..."
                        rows={6}
                        className={validationErrors.message ? 'border-red-500' : ''}
                        required
                      />
                      {validationErrors.message && (
                        <p className="text-red-500 text-sm">{validationErrors.message}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {formData.message.length}/2000 characters
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">How do I list my room?</h3>
                <p className="text-gray-600 text-sm">
                  Simply create a landlord account and follow our easy listing process. You can add photos, descriptions, and set your rental terms.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Is RoomFinder free to use?</h3>
                <p className="text-gray-600 text-sm">
                  Yes! Browsing and searching for rooms is completely free. We only charge a small fee when you successfully book a room.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">How do I verify listings?</h3>
                <p className="text-gray-600 text-sm">
                  We verify all listings through document checks and property visits. Look for the verified badge on listings.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">What if I have issues with a landlord?</h3>
                <p className="text-gray-600 text-sm">
                  Our support team is here to help resolve any disputes. Contact us immediately if you encounter any problems.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  BookOpen, 
  MessageCircle, 
  Phone, 
  Mail, 
  FileText,
  Shield,
  Home,
  Users,
  CreditCard,
  Settings,
  HelpCircle,
  ArrowRight,
  Clock,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const helpCategories = [
  {
    icon: Home,
    title: 'Finding Rooms',
    description: 'Learn how to search and find the perfect room',
    articles: [
      'How to use the search filters',
      'Understanding room types',
      'Reading room descriptions',
      'Viewing photos and virtual tours'
    ],
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: Users,
    title: 'Account Management',
    description: 'Manage your profile and account settings',
    articles: [
      'Creating your account',
      'Updating profile information',
      'Password and security',
      'Notification preferences'
    ],
    color: 'from-green-500 to-green-600'
  },
  {
    icon: MessageCircle,
    title: 'Communication',
    description: 'Connect with landlords and get responses',
    articles: [
      'Messaging landlords',
      'Scheduling property visits',
      'Phone call etiquette',
      'Following up on inquiries'
    ],
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: CreditCard,
    title: 'Payments & Booking',
    description: 'Understand booking process and payments',
    articles: [
      'How booking works',
      'Payment methods',
      'Security deposits',
      'Refund policies'
    ],
    color: 'from-orange-500 to-orange-600'
  },
  {
    icon: Shield,
    title: 'Safety & Security',
    description: 'Stay safe while using RoomFinder',
    articles: [
      'Safety guidelines for room visits',
      'Identifying scams',
      'Reporting suspicious activity',
      'Verification process'
    ],
    color: 'from-red-500 to-red-600'
  },
  {
    icon: Settings,
    title: 'Landlord Tools',
    description: 'Guide for landlords listing properties',
    articles: [
      'Creating your first listing',
      'Photo guidelines',
      'Managing booking requests',
      'Pricing your property'
    ],
    color: 'from-teal-500 to-teal-600'
  }
];

const popularArticles = [
  'How to create an account on RoomFinder',
  'Understanding different room types',
  'Safety tips for meeting landlords',
  'How to verify a legitimate listing',
  'Payment methods and security',
  'What to do if you encounter problems'
];

const quickActions = [
  {
    icon: MessageCircle,
    title: 'Live Chat',
    description: 'Chat with our support team',
    action: 'Start Chat',
    color: 'bg-blue-600 hover:bg-blue-700',
    available: true
  },
  {
    icon: Phone,
    title: 'Phone Support',
    description: 'Call us directly',
    action: 'Call Now',
    color: 'bg-green-600 hover:bg-green-700',
    available: true
  },
  {
    icon: Mail,
    title: 'Email Support',
    description: 'Send us an email',
    action: 'Send Email',
    color: 'bg-purple-600 hover:bg-purple-700',
    available: true
  },
  {
    icon: FileText,
    title: 'Submit Ticket',
    description: 'Create a support ticket',
    action: 'Submit',
    color: 'bg-orange-600 hover:bg-orange-700',
    available: true
  }
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Help Center
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto mb-8">
            Find answers, get support, and learn how to make the most of RoomFinder
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-3 text-base bg-white/90 backdrop-blur-sm border-0 rounded-xl text-gray-900 placeholder:text-gray-500"
            />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        {/* Quick Actions */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Get Help Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${action.color} text-white rounded-2xl mb-4 group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {action.description}
                  </p>
                  <Button size="sm" className={action.color}>
                    {action.action}
                  </Button>
                  {action.available && (
                    <div className="flex items-center justify-center mt-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-xs text-green-600">Available</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Support Hours */}
        <Card className="mb-16 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Support Hours</h3>
                <p className="text-gray-600">Monday - Friday: 9 AM - 6 PM</p>
                <p className="text-gray-600">Saturday: 10 AM - 4 PM</p>
              </div>
              <div>
                <MessageCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Response</h3>
                <p className="text-gray-600">Email: Within 2 hours</p>
                <p className="text-gray-600">Live Chat: Under 5 minutes</p>
              </div>
              <div>
                <CheckCircle className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Resolution Rate</h3>
                <p className="text-gray-600">98% of issues resolved</p>
                <p className="text-gray-600">within first contact</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Popular Articles */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Popular Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {popularArticles.map((article, index) => (
              <Card key={index} className="group hover:shadow-md transition-all duration-200 cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-900 group-hover:text-blue-600 transition-colors">
                        {article}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Help Categories */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Browse by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {helpCategories.map((category, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <CardHeader>
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${category.color} text-white rounded-2xl mb-4 group-hover:scale-110 transition-transform`}>
                    <category.icon className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl text-gray-900 group-hover:text-blue-600 transition-colors">
                    {category.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.articles.map((article, articleIndex) => (
                      <li key={articleIndex} className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                        <ArrowRight className="h-3 w-3" />
                        <span>{article}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" size="sm" className="w-full mt-4 group-hover:bg-blue-50 group-hover:border-blue-200">
                    View All Articles
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Options */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Still Need Help?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Our friendly support team is here to help you with any questions or issues you might have.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
                <Mail className="h-8 w-8 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Email Us</h3>
                <p className="text-sm opacity-90 mb-4">support@roomfinder.com</p>
                <Button variant="secondary" size="sm">
                  Send Email
                </Button>
              </div>
              <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
                <Phone className="h-8 w-8 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Call Us</h3>
                <p className="text-sm opacity-90 mb-4">+880 1700-000000</p>
                <Button variant="secondary" size="sm">
                  Call Now
                </Button>
              </div>
              <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
                <MessageCircle className="h-8 w-8 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Live Chat</h3>
                <p className="text-sm opacity-90 mb-4">Available 24/7</p>
                <Button variant="secondary" size="sm">
                  Start Chat
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, ChevronDown, MessageCircle, Phone, Mail } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

const faqData = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How do I create an account on RoomFinder?',
        a: 'You can create an account by clicking "Sign Up" in the top right corner. Choose between Bachelor, Landlord, or create a general account. Fill in your details and verify your email to get started.'
      },
      {
        q: 'Is RoomFinder free to use?',
        a: 'Yes! Browsing and searching for rooms is completely free. We only charge a small service fee when you successfully book a room through our platform.'
      },
      {
        q: 'How do I search for rooms?',
        a: 'Use our search bar on the homepage or browse page. You can filter by location, price range, room type, amenities, and more to find rooms that match your preferences.'
      }
    ]
  },
  {
    category: 'For Renters',
    questions: [
      {
        q: 'How do I contact a landlord?',
        a: 'Once you find a room you\'re interested in, click "Contact Landlord" on the listing page. You can send a message directly through our platform or see their contact information if they\'ve made it public.'
      },
      {
        q: 'How do I know if a listing is verified?',
        a: 'Look for the "Verified" badge on listings. We verify landlords through document checks and property visits. Verified listings are more trustworthy and reliable.'
      },
      {
        q: 'Can I book a room online?',
        a: 'Yes! Many landlords offer online booking. You can reserve a room by paying a booking fee, which secures your spot while you complete the rental process.'
      },
      {
        q: 'What should I do before visiting a room?',
        a: 'Always inform someone about your visit, meet in public areas first, verify the landlord\'s identity, and trust your instincts. Check our Safety Guidelines for more tips.'
      }
    ]
  },
  {
    category: 'For Landlords',
    questions: [
      {
        q: 'How do I list my room?',
        a: 'Create a landlord account, then click "Add Listing" in your dashboard. Upload photos, add descriptions, set your rental terms, and publish your listing.'
      },
      {
        q: 'How much does it cost to list a room?',
        a: 'Basic listings are free! We offer premium features like highlighted listings and priority placement for a small monthly fee.'
      },
      {
        q: 'How do I get verified as a landlord?',
        a: 'Submit your NID, property documents, and contact information through your dashboard. Our team will review and verify your account within 2-3 business days.'
      },
      {
        q: 'How do I manage booking requests?',
        a: 'All booking requests appear in your landlord dashboard. You can accept, decline, or message potential tenants directly through the platform.'
      }
    ]
  },
  {
    category: 'Safety & Security',
    questions: [
      {
        q: 'How does RoomFinder ensure safety?',
        a: 'We verify all landlords, provide safety guidelines, offer secure messaging, and have a review system. Report any suspicious activity to our support team immediately.'
      },
      {
        q: 'What if I encounter a problem with a landlord?',
        a: 'Contact our support team immediately at support@roomfinder.com or use the "Report Problem" feature. We\'ll investigate and take appropriate action.'
      },
      {
        q: 'How do I report a fake listing?',
        a: 'Click "Report Listing" on the property page or contact our support team. Provide details about why you think it\'s fake, and we\'ll investigate within 24 hours.'
      }
    ]
  },
  {
    category: 'Payments & Booking',
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept bKash, Nagad, Rocket, bank transfers, and credit/debit cards. All payments are processed securely through our trusted payment partners.'
      },
      {
        q: 'Is my payment information secure?',
        a: 'Yes! We use industry-standard encryption and never store your payment information. All transactions are processed through secure, PCI-compliant payment gateways.'
      },
      {
        q: 'Can I get a refund if I cancel?',
        a: 'Refund policies depend on the landlord and timing of cancellation. Check the specific cancellation policy on each listing before booking.'
      }
    ]
  },
  {
    category: 'Technical Support',
    questions: [
      {
        q: 'The website is not working properly. What should I do?',
        a: 'Try refreshing the page, clearing your browser cache, or using a different browser. If the problem persists, contact our technical support team.'
      },
      {
        q: 'I forgot my password. How do I reset it?',
        a: 'Click "Forgot Password" on the login page. Enter your email address, and we\'ll send you a password reset link. Check your spam folder if you don\'t see it.'
      },
      {
        q: 'Can I use RoomFinder on my mobile phone?',
        a: 'Yes! Our website is fully mobile-responsive. We\'re also working on dedicated mobile apps for iOS and Android.'
      }
    ]
  }
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<string[]>([]);

  const filteredFAQ = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(
      item =>
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const toggleItem = (id: string) => {
    setOpenItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto mb-8">
            Find answers to common questions about RoomFinder
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-3 text-base bg-white/90 backdrop-blur-sm border-0 rounded-xl text-gray-900 placeholder:text-gray-500"
            />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Average Response</h3>
                <p className="text-2xl font-bold text-blue-600">2 hours</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Support Available</h3>
                <p className="text-2xl font-bold text-green-600">24/7</p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Issues Resolved</h3>
                <p className="text-2xl font-bold text-purple-600">98%</p>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Categories */}
          {filteredFAQ.length > 0 ? (
            <div className="space-y-8">
              {filteredFAQ.map((category, categoryIndex) => (
                <div key={category.category}>
                  <div className="flex items-center space-x-3 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {category.category}
                    </h2>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {category.questions.length} questions
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    {category.questions.map((faq, index) => {
                      const itemId = `${categoryIndex}-${index}`;
                      const isOpen = openItems.includes(itemId);
                      
                      return (
                        <Card key={index} className="border-l-4 border-l-blue-500">
                          <Collapsible open={isOpen} onOpenChange={() => toggleItem(itemId)}>
                            <CollapsibleTrigger asChild>
                              <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-left text-lg font-semibold text-gray-900">
                                    {faq.q}
                                  </CardTitle>
                                  <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <CardContent className="pt-0">
                                <p className="text-gray-600 leading-relaxed">
                                  {faq.a}
                                </p>
                              </CardContent>
                            </CollapsibleContent>
                          </Collapsible>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No results found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search terms or browse all categories above.
              </p>
              <Button 
                onClick={() => setSearchQuery('')}
                variant="outline"
              >
                Clear Search
              </Button>
            </div>
          )}

          {/* Contact Support */}
          <Card className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-center text-2xl text-gray-900">
                Still need help?
              </CardTitle>
              <CardDescription className="text-center text-lg">
                Our support team is here to assist you
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/contact">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Support
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <a href="tel:+8801700000000">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Us
                  </a>
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Email: support@roomfinder.com • Phone: +880 1700-000000
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
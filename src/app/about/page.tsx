'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Users, 
  Shield, 
  Heart, 
  Star, 
  MapPin, 
  Award, 
  Target,
  Eye,
  Zap,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  const stats = [
    { icon: Users, label: 'Happy Users', value: '50,000+', color: 'from-blue-500 to-cyan-500' },
    { icon: Home, label: 'Listed Properties', value: '10,000+', color: 'from-green-500 to-emerald-500' },
    { icon: MapPin, label: 'Cities Covered', value: '64+', color: 'from-purple-500 to-pink-500' },
    { icon: Star, label: 'Average Rating', value: '4.9/5', color: 'from-yellow-500 to-orange-500' },
  ];

  const values = [
    {
      icon: Shield,
      title: 'Trust & Safety',
      description: 'We verify every listing and landlord to ensure your safety and peace of mind.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Heart,
      title: 'Community First',
      description: 'Building a supportive community where renters and landlords can connect meaningfully.',
      color: 'from-red-500 to-pink-600'
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Using cutting-edge technology to make room hunting simple and efficient.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Target,
      title: 'Transparency',
      description: 'No hidden fees, clear communication, and honest representation of all properties.',
      color: 'from-green-500 to-green-600'
    },
  ];

  const team = [
    {
      name: 'Mostofa Karim',
      role: 'Founder & CEO',
      image: '/team/ceo.jpg',
      description: 'Passionate about solving housing challenges in Bangladesh through technology.',
    },
    {
      name: 'Sarah Ahmed',
      role: 'Head of Operations',
      image: '/team/operations.jpg',
      description: 'Ensures smooth operations and exceptional customer experience.',
    },
    {
      name: 'Rafiq Hassan',
      role: 'Tech Lead',
      image: '/team/tech.jpg',
      description: 'Building scalable solutions to connect renters with their perfect homes.',
    },
    {
      name: 'Fatima Khan',
      role: 'Community Manager',
      image: '/team/community.jpg',
      description: 'Fostering trust and safety within our growing community.',
    },
  ];

  const milestones = [
    {
      year: '2023',
      title: 'RoomFinder Founded',
      description: 'Started with a vision to simplify room hunting in Bangladesh.',
    },
    {
      year: '2024',
      title: 'Rapid Growth',
      description: 'Reached 10,000 users and expanded to 20 cities across Bangladesh.',
    },
    {
      year: '2024',
      title: 'Safety First',
      description: 'Launched comprehensive verification system for landlords and properties.',
    },
    {
      year: '2024',
      title: 'Community of 50K+',
      description: 'Built a thriving community of renters and landlords nationwide.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            About RoomFinder
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto leading-relaxed">
            We&apos;re on a mission to make finding the perfect room in Bangladesh 
            as easy as a few taps on your phone.
          </p>
          <div className="mt-8">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-4 py-2 text-lg">
              🚀 Trusted by 50,000+ Users
            </Badge>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${stat.color} text-white rounded-2xl mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110`}>
                  <stat.icon className="h-8 w-8" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our Mission & Vision
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Transforming the way people find homes in Bangladesh
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Card className="border-2 border-blue-100 hover:border-blue-200 transition-colors">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="bg-blue-100 p-3 rounded-lg mr-4">
                    <Target className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Our Mission</h3>
                </div>
                <p className="text-gray-600 leading-relaxed text-lg">
                  To democratize access to quality housing by connecting renters with trusted landlords 
                  through a transparent, safe, and user-friendly platform that serves every corner of Bangladesh.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-100 hover:border-purple-200 transition-colors">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="bg-purple-100 p-3 rounded-lg mr-4">
                    <Eye className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Our Vision</h3>
                </div>
                <p className="text-gray-600 leading-relaxed text-lg">
                  To become Bangladesh&apos;s most trusted housing platform, where every person can find 
                  their perfect home with confidence, safety, and ease.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${value.color} text-white rounded-2xl mb-6 group-hover:scale-110 transition-transform`}>
                    <value.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Story/Timeline */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our Journey
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From a simple idea to Bangladesh&apos;s leading room finder platform
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-start space-x-6 group">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg group-hover:shadow-xl transition-shadow">
                      {milestone.year}
                    </div>
                  </div>
                  <div className="flex-1 pb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {milestone.title}
                    </h3>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The passionate people building the future of housing in Bangladesh
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <CardContent className="p-6 text-center">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {member.name}
                  </h3>
                  <p className="text-blue-600 font-semibold mb-4">
                    {member.role}
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {member.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose RoomFinder?
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Verified Listings</h3>
                  <p className="text-gray-600">Every property and landlord is thoroughly verified for your safety.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Matching</h3>
                  <p className="text-gray-600">Our AI-powered system finds rooms that match your preferences perfectly.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">24/7 Support</h3>
                  <p className="text-gray-600">Our dedicated support team is always here to help you.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Hidden Fees</h3>
                  <p className="text-gray-600">Transparent pricing with no surprise charges or hidden costs.</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl">
              <div className="text-center">
                <Award className="h-16 w-16 text-blue-600 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Trusted by Thousands
                </h3>
                <p className="text-gray-600 mb-6">
                  Join over 50,000 satisfied users who found their perfect homes through RoomFinder.
                </p>
                <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Link href="/for-rent">
                    Start Your Search
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Find Your Perfect Room?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of happy tenants who found their ideal home through RoomFinder.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              <Link href="/search">Browse Rooms</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
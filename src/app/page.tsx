import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Users, Shield, Heart, Search } from 'lucide-react';
import Link from 'next/link';
import { FeaturedListingsClient } from '@/components/home/FeaturedListingsClient';

function HeroSection() {
  return (
    <section className="relative min-h-[700px] flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-bounce-subtle"></div>
      <div className="absolute top-10 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-bounce-subtle" style={{animationDelay: '1s'}}></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-bounce-subtle" style={{animationDelay: '2s'}}></div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-5xl mx-auto animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-8 leading-tight">
            Find Your Perfect
            <span className="text-gradient block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Dream Room
            </span>
            <span className="text-2xl md:text-3xl font-medium text-gray-600 block mt-2">
              in Bangladesh
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
            Discover comfortable, affordable rooms with verified landlords. 
            <br className="hidden md:block" />
            Smart recommendations based on your budget and lifestyle preferences.
          </p>
          
          <div className="max-w-4xl mx-auto mb-12 animate-slide-up">
            <SearchBar placeholder="Search by city, area, university, or landmark..." />
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-base text-gray-700">
            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="font-medium">Verified Listings</span>
            </div>
            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              <Heart className="h-5 w-5 text-red-600" />
              <span className="font-medium">Budget-Friendly</span>
            </div>
            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              <Star className="h-5 w-5 text-yellow-600" />
              <span className="font-medium">Top Rated</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { icon: Users, label: 'Happy Tenants', value: '10,000+', color: 'from-blue-500 to-cyan-500' },
    { icon: MapPin, label: 'Cities Covered', value: '50+', color: 'from-green-500 to-emerald-500' },
    { icon: Star, label: 'Average Rating', value: '4.8', color: 'from-yellow-500 to-orange-500' },
    { icon: Search, label: 'Listings Available', value: '5,000+', color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50 border-b">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join our growing community of satisfied tenants and landlords across Bangladesh
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${stat.color} text-white rounded-2xl mb-6 mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110`}>
                <stat.icon className="h-8 w-8" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {stat.value}
              </div>
              <div className="text-base text-gray-600 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: '1',
      title: 'Search & Filter',
      description: 'Find rooms that match your budget, location, and preferences with our intelligent search engine.',
      icon: Search,
      color: 'from-blue-500 to-purple-600',
    },
    {
      number: '2',
      title: 'Connect with Landlords',
      description: 'Chat directly with verified landlords and schedule visits at your convenience through our platform.',
      icon: Users,
      color: 'from-green-500 to-teal-600',
    },
    {
      number: '3',
      title: 'Book Your Room',
      description: 'Secure your perfect room with our safe and transparent booking process.',
      icon: Heart,
      color: 'from-pink-500 to-red-600',
    },
  ];

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/30 to-pink-50/30"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Finding your perfect room has never been easier. Follow these simple steps to get started on your journey.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center group">
              <div className="relative mb-8">
                <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${step.color} text-white rounded-3xl text-2xl font-bold shadow-2xl group-hover:shadow-3xl transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-3`}>
                  {step.number}
                </div>
                <div className={`absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center opacity-80`}>
                  <step.icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                {step.title}
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed max-w-sm mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white/5 rounded-full blur-2xl"></div>
      </div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          Ready to Find Your
          <span className="block text-yellow-300">Dream Room?</span>
        </h2>
        <p className="text-xl md:text-2xl mb-12 opacity-90 max-w-3xl mx-auto leading-relaxed">
          Join thousands of satisfied tenants who found their perfect home through Room Finder. 
          <br className="hidden md:block" />
          Your next adventure starts here!
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Button asChild size="lg" className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8 py-4 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <Link href="/for-rent">
              <Search className="h-5 w-5 mr-2" />
              Browse Rooms
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-purple-600 font-semibold px-8 py-4 text-lg rounded-full transition-all duration-300 transform hover:scale-105">
            <Link href="/auth/signup">
              <Users className="h-5 w-5 mr-2" />
              Get Started Free
            </Link>
          </Button>
        </div>
        
        <div className="mt-12 text-sm opacity-75">
          <p>✨ No hidden fees • 🔒 Secure platform • 📱 Mobile friendly</p>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <StatsSection />
      <FeaturedListingsClient />
      <HowItWorksSection />
      <CTASection />
    </div>
  );
}
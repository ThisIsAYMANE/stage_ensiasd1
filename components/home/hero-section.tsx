'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Star, Users, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const stats = [
    { icon: Users, value: '10,000+', label: 'Qualified Tutors' },
    { icon: BookOpen, value: '50+', label: 'Subjects Covered' },
    { icon: Star, value: '4.9/5', label: 'Average Rating' },
  ];

  return (
    <section className="gradient-hero text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Find Your Perfect
            <span className="block text-accent-teal">Tutor Today</span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Connect with qualified tutors for personalized learning experiences. 
            Master any subject with expert guidance tailored to your needs.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search for subjects (e.g., Mathematics, Physics, English...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 py-3 text-lg bg-white text-gray-900 border-0 focus:ring-2 focus:ring-accent-teal"
                  style={{ borderRadius: '0.25rem' }}
                />
              </div>
              <Button 
                type="submit" 
                size="lg"
                className="bg-accent-teal hover:bg-accent-teal/90 text-white font-semibold py-3 px-8 transition-colors duration-200"
                style={{ borderRadius: '0.25rem' }}
              >
                Search Tutors
              </Button>
            </div>
          </form>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/auth/signup?type=student">
              <Button 
                size="lg"
                className="bg-white text-primary hover:bg-gray-100 font-semibold py-3 px-8 transition-colors duration-200"
                style={{ borderRadius: '0.25rem' }}
              >
                Find a Tutor
              </Button>
            </Link>
            <Link href="/auth/signup?type=tutor">
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-primary font-semibold py-3 px-8 transition-colors duration-200"
                style={{ borderRadius: '0.25rem' }}
              >
                Become a Tutor
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-lg mb-4">
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold mb-2">{stat.value}</div>
                  <div className="text-blue-100">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
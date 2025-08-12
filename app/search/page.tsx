'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/navigation/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Star, MapPin, Clock, Filter } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Tutor {
  id: string;
  name: string;
  profilePicture?: string;
  subjects: string[];
  hourlyRate: number;
  rating: number;
  totalReviews: number;
  location?: string;
  biography: string;
}

const subjects = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History',
  'Geography', 'Computer Science', 'Economics', 'Psychology', 'Philosophy',
  'French', 'Spanish', 'German', 'Art', 'Music', 'Business Studies'
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const { user, userProfile, loading: authLoading } = useAuth();

  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [minRate, setMinRate] = useState<string>('');
  const [maxRate, setMaxRate] = useState<string>('');
  const [minRating, setMinRating] = useState<string>('');

  const fetchTutors = async () => {
    setLoading(true);
    try {
      // Remove orderBy to avoid potential issues with missing rating field
      let tutorQuery = query(
        collection(db, 'users'),
        where('type', '==', 'tutor'),
        limit(50)
      );

      const snapshot = await getDocs(tutorQuery);
      
      let tutorList: Tutor[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Ensure required fields have default values
        const tutorData = {
          id: doc.id,
          name: data.name || 'Unknown',
          profilePicture: data.profilePicture || '',
          subjects: data.subjects || [],
          hourlyRate: data.hourlyRate || 0,
          rating: data.rating || 0,
          totalReviews: data.totalReviews || 0,
          location: data.location || '',
          biography: data.biography || '',
          ...data,
        };
        
        tutorList.push(tutorData as Tutor);
      });

      // Sort by rating after fetching (with fallback for missing ratings)
      tutorList.sort((a, b) => (b.rating || 0) - (a.rating || 0));

      // Apply client-side filtering
      let filteredTutors = tutorList.filter((tutor) => {
        // Search query filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesName = (tutor.name || '').toLowerCase().includes(query);
          const matchesSubjects = (tutor.subjects || []).some(subject => 
            subject.toLowerCase().includes(query)
          );
          const matchesBio = (tutor.biography || '').toLowerCase().includes(query);
          
          if (!matchesName && !matchesSubjects && !matchesBio) {
            return false;
          }
        }

        // Subject filter
        if (selectedSubject && !(tutor.subjects || []).includes(selectedSubject)) {
          return false;
        }

        // Rate filter
        if (minRate && (tutor.hourlyRate || 0) < parseInt(minRate)) {
          return false;
        }
        if (maxRate && (tutor.hourlyRate || 0) > parseInt(maxRate)) {
          return false;
        }

        // Rating filter
        if (minRating && (tutor.rating || 0) < parseInt(minRating)) {
          return false;
        }

        return true;
      });

      setTutors(filteredTutors);
    } catch (error: any) {
      console.error('Error fetching tutors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchTutors();
    }
  }, [searchQuery, selectedSubject, minRate, maxRate, minRating, authLoading]);

  // Separate useEffect for initial data loading
  useEffect(() => {
    if (!authLoading) {
      fetchTutors();
    }
  }, [authLoading]); // Wait for auth to be ready

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSubject('');
    setMinRate('');
    setMaxRate('');
    setMinRating('');
  };

  return (
    <div className="min-h-screen bg-light-bg">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Find Your Perfect Tutor
          </h1>
          <p className="text-xl text-text-secondary">
            Browse through our qualified tutors and find the perfect match for your learning needs.
          </p>
          {!user && !authLoading && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">
                💡 <strong>Tip:</strong> You can browse tutors without signing in, but you'll need to create an account to book lessons.
              </p>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <Card className="card-sharp mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {/* Search Bar */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary h-5 w-5" />
                  <Input
                    placeholder="Search by name or subject..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Subject Filter */}
              <div>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Subjects" />
                  </SelectTrigger>
                  <SelectContent>
                                        {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rate Range */}
              <div>
                <Input
                  type="number"
                  placeholder="Min Rate ($)"
                  value={minRate}
                  onChange={(e) => setMinRate(e.target.value)}
                />
              </div>

              <div>
                <Input
                  type="number"
                  placeholder="Max Rate ($)"
                  value={maxRate}
                  onChange={(e) => setMaxRate(e.target.value)}
                />
              </div>

              {/* Clear Filters */}
              <div>
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-text-primary">
            {authLoading ? 'Loading...' : loading ? 'Loading...' : `${tutors.length} Tutor${tutors.length !== 1 ? 's' : ''} Found`}
          </h2>
        </div>

        {/* Tutors Grid */}
        {authLoading || loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="card-sharp">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="w-16 h-16 bg-muted rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="h-3 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded mb-4"></div>
                    <div className="flex space-x-2">
                      <div className="h-6 bg-muted rounded w-16"></div>
                      <div className="h-6 bg-muted rounded w-16"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tutors.length === 0 ? (
          <Card className="card-sharp text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                No tutors found
              </h3>
              <p className="text-text-secondary">
                Try adjusting your search criteria or filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutors.map((tutor) => (
              <Link key={tutor.id} href={`/tutors/${tutor.id}`}>
                <Card className="card-sharp hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4 mb-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={tutor.profilePicture} alt={tutor.name} />
                        <AvatarFallback className="text-lg">
                          {tutor.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-text-primary truncate">
                          {tutor.name}
                        </h3>
                        <div className="flex items-center space-x-1 mb-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">
                            {tutor.rating.toFixed(1)}
                          </span>
                          <span className="text-sm text-text-secondary">
                            ({tutor.totalReviews} reviews)
                          </span>
                        </div>
                        {tutor.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4 text-text-secondary" />
                            <span className="text-sm text-text-secondary">
                              {tutor.location}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-text-secondary text-sm mb-4 line-clamp-3">
                      {tutor.biography}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {tutor.subjects.slice(0, 3).map((subject) => (
                        <Badge key={subject} variant="secondary" className="text-xs">
                          {subject}
                        </Badge>
                      ))}
                      {tutor.subjects.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{tutor.subjects.length - 3} more
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-primary">
                        ${tutor.hourlyRate}
                        <span className="text-sm font-normal text-text-secondary">/hr</span>
                      </div>
                      <Button className="btn-primary">
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
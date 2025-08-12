'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/navigation/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Star, 
  MapPin, 
  Clock, 
  Calendar, 
  MessageSquare, 
  Award, 
  BookOpen,
  Video,
  CheckCircle,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';

interface TutorProfile {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  biography: string;
  subjects: string[];
  qualifications: string[];
  hourlyRate: number;
  location?: string;
  availability: { [key: string]: string[] };
  rating: number;
  totalReviews: number;
  totalLessons: number;
  createdAt: string;
}

interface Review {
  id: string;
  studentName: string;
  studentAvatar?: string;
  rating: number;
  comment: string;
  subject: string;
  createdAt: string;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TutorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile } = useAuth();
  const tutorId = params.id as string;

  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    if (tutorId) {
      fetchTutorProfile();
      fetchReviews();
    }
  }, [tutorId]);

  const fetchTutorProfile = async () => {
    try {
      const tutorDoc = await getDoc(doc(db, 'users', tutorId));
      if (tutorDoc.exists()) {
        const data = tutorDoc.data();
        if (data.type === 'tutor') {
          setTutor({
            id: tutorDoc.id,
            ...data,
          } as TutorProfile);
        } else {
          router.push('/search');
        }
      } else {
        router.push('/search');
      }
    } catch (error) {
      console.error('Error fetching tutor profile:', error);
      router.push('/search');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('tutorId', '==', tutorId)
        // Removed orderBy to avoid composite index requirement
      );
      
      const snapshot = await getDocs(reviewsQuery);
      const reviewsList: Review[] = [];
      
      snapshot.forEach((doc) => {
        reviewsList.push({
          id: doc.id,
          ...doc.data(),
        } as Review);
      });
      
      // Sort reviews by creation date on client side (newest first)
      const sortedReviews = reviewsList.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      setReviews(sortedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleBookLesson = () => {
    if (!userProfile) {
      router.push('/auth/login');
      return;
    }
    
    if (userProfile.type !== 'student') {
      return;
    }
    
    router.push(`/book/${tutorId}`);
  };

  const handleSendMessage = () => {
    if (!userProfile) {
      router.push('/auth/login');
      return;
    }
    
    router.push(`/messages?tutor=${tutorId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="flex items-start space-x-6">
              <div className="w-32 h-32 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-muted rounded"></div>
                <div className="h-48 bg-muted rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-muted rounded"></div>
                <div className="h-48 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen bg-light-bg">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text-primary">Tutor not found</h1>
            <Link href="/search">
              <Button className="btn-primary mt-4">Back to Search</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="card-sharp p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
            <Avatar className="h-32 w-32">
              <AvatarImage src={tutor.profilePicture} alt={tutor.name} />
              <AvatarFallback className="text-4xl">
                {tutor.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                <div className="mb-4 lg:mb-0">
                  <h1 className="text-4xl font-bold text-text-primary mb-2">
                    {tutor.name}
                  </h1>
                  
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center space-x-1">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <span className="text-lg font-semibold">
                        {tutor.rating.toFixed(1)}
                      </span>
                      <span className="text-text-secondary">
                        ({tutor.totalReviews} reviews)
                      </span>
                    </div>
                    
                    {tutor.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-text-secondary" />
                        <span className="text-text-secondary">{tutor.location}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-text-secondary mb-4">
                    <span className="flex items-center space-x-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{tutor.totalLessons} lessons taught</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4" />
                      <span>Verified tutor</span>
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {tutor.subjects.slice(0, 5).map((subject) => (
                      <Badge key={subject} variant="secondary">
                        {subject}
                      </Badge>
                    ))}
                    {tutor.subjects.length > 5 && (
                      <Badge variant="secondary">
                        +{tutor.subjects.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-4xl font-bold text-primary mb-2">
                    ${tutor.hourlyRate}
                    <span className="text-lg font-normal text-text-secondary">/hr</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      onClick={handleBookLesson}
                      className="btn-primary w-full lg:w-auto"
                      disabled={userProfile?.type === 'tutor'}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Lesson
                    </Button>
                    
                    <Button 
                      onClick={handleSendMessage}
                      variant="outline"
                      className="w-full lg:w-auto"
                      disabled={userProfile?.type === 'tutor'}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="about" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="availability">Availability</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-6">
                {/* Biography */}
                <Card className="card-sharp">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5" />
                      <span>About Me</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                      {tutor.biography}
                    </p>
                  </CardContent>
                </Card>

                {/* Subjects */}
                <Card className="card-sharp">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5" />
                      <span>Subjects I Teach</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {tutor.subjects.map((subject) => (
                        <div
                          key={subject}
                          className="flex items-center space-x-2 p-3 bg-primary/5 rounded border border-primary/20"
                        >
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span className="font-medium text-text-primary">{subject}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Qualifications */}
                <Card className="card-sharp">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Award className="h-5 w-5" />
                      <span>Qualifications & Experience</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {tutor.qualifications.map((qualification, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-3 p-3 bg-accent/5 rounded border border-accent/20"
                        >
                          <Award className="h-5 w-5 text-accent mt-0.5" />
                          <span className="text-text-primary">{qualification}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                <Card className="card-sharp">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Star className="h-5 w-5" />
                        <span>Student Reviews</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {tutor.rating.toFixed(1)}
                        </div>
                        <div className="text-sm text-text-secondary">
                          {tutor.totalReviews} reviews
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reviewsLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="flex items-start space-x-4">
                              <div className="w-12 h-12 bg-muted rounded-full"></div>
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-1/3"></div>
                                <div className="h-3 bg-muted rounded w-full"></div>
                                <div className="h-3 bg-muted rounded w-2/3"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="text-center py-8">
                        <Star className="h-12 w-12 text-text-secondary mx-auto mb-4" />
                        <p className="text-text-secondary">No reviews yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {reviews.map((review) => (
                          <div key={review.id} className="border-b border-border pb-6 last:border-b-0">
                            <div className="flex items-start space-x-4">
                              <Avatar>
                                <AvatarImage src={review.studentAvatar} alt={review.studentName} />
                                <AvatarFallback>
                                  {review.studentName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <h4 className="font-semibold text-text-primary">
                                      {review.studentName}
                                    </h4>
                                    <p className="text-sm text-text-secondary">
                                      {review.subject} • {new Date(review.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < review.rating
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-text-secondary leading-relaxed">
                                  {review.comment}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="availability" className="space-y-6">
                <Card className="card-sharp">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>Weekly Availability</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {days.map((day) => (
                        <div key={day} className="flex items-start space-x-4">
                          <div className="w-24 font-medium text-text-primary">
                            {day}
                          </div>
                          <div className="flex-1">
                            {tutor.availability[day] && tutor.availability[day].length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {tutor.availability[day].map((slot) => (
                                  <Badge key={slot} variant="outline" className="text-xs">
                                    {slot}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-text-secondary text-sm">Not available</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="card-sharp">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Response time</span>
                  <span className="font-semibold text-text-primary">Within 1 hour</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Lessons taught</span>
                  <span className="font-semibold text-text-primary">{tutor.totalLessons}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Member since</span>
                  <span className="font-semibold text-text-primary">
                    {new Date(tutor.createdAt).getFullYear()}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Languages</span>
                  <span className="font-semibold text-text-primary">English</span>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="card-sharp">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Pricing</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    ${tutor.hourlyRate}
                  </div>
                  <div className="text-text-secondary mb-4">per hour</div>
                  <div className="space-y-2 text-sm text-text-secondary">
                    <div className="flex justify-between">
                      <span>30 min trial</span>
                      <span>${(tutor.hourlyRate * 0.5).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>60 min lesson</span>
                      <span>${tutor.hourlyRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>90 min lesson</span>
                      <span>${(tutor.hourlyRate * 1.5).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Actions */}
            <Card className="card-sharp">
              <CardContent className="p-6 space-y-3">
                <Button 
                  onClick={handleBookLesson}
                  className="btn-primary w-full"
                  disabled={userProfile?.type === 'tutor'}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book a Lesson
                </Button>
                
                <Button 
                  onClick={handleSendMessage}
                  variant="outline"
                  className="w-full"
                  disabled={userProfile?.type === 'tutor'}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full"
                  disabled={userProfile?.type === 'tutor'}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Schedule Trial
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

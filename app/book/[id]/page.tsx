'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/navigation/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, DollarSign, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, startOfWeek } from 'date-fns';

interface TutorProfile {
  id: string;
  name: string;
  profilePicture?: string;
  subjects: string[];
  hourlyRate: number;
  availability: { [key: string]: string[] };
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const durations = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

export default function BookLessonPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile } = useAuth();
  const tutorId = params.id as string;

  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (tutorId) {
      fetchTutorProfile();
    }
  }, [tutorId]);

  useEffect(() => {
    if (!userProfile) {
      router.push('/auth/login');
    } else if (userProfile.type !== 'student') {
      router.push('/search');
    }
  }, [userProfile, router]);

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

  const getNextWeekDates = () => {
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const dates = [];
    
    for (let i = 0; i < 14; i++) { // Next 2 weeks
      const date = addDays(startOfCurrentWeek, i);
      if (date >= today) {
        dates.push(date);
      }
    }
    
    return dates;
  };

  const getAvailableSlots = (dayName: string) => {
    if (!tutor || !tutor.availability[dayName]) {
      return [];
    }
    return tutor.availability[dayName];
  };

  const calculateTotal = () => {
    if (!tutor) return 0;
    return (tutor.hourlyRate * selectedDuration) / 60;
  };

  const handleBookLesson = async () => {
    if (!userProfile || !tutor || !selectedSubject || !selectedDay || !selectedTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    setBooking(true);

    try {
      const lessonData = {
        studentId: userProfile.id,
        studentName: userProfile.name,
        tutorId: tutor.id,
        tutorName: tutor.name,
        subject: selectedSubject,
        date: selectedDay,
        time: selectedTime,
        duration: selectedDuration,
        totalCost: calculateTotal(),
        message: message,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'lessons'), lessonData);
      
      toast.success('Lesson request sent successfully!');
      router.push('/dashboard/student');
    } catch (error) {
      console.error('Error booking lesson:', error);
      toast.error('Failed to book lesson. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="h-64 bg-muted rounded"></div>
                <div className="h-48 bg-muted rounded"></div>
              </div>
              <div className="h-96 bg-muted rounded"></div>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text-primary">Tutor not found</h1>
            <Button onClick={() => router.push('/search')} className="btn-primary mt-4">
              Back to Search
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const nextWeekDates = getNextWeekDates();

  return (
    <div className="min-h-screen bg-light-bg">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-2">
            Book a Lesson
          </h1>
          <p className="text-xl text-text-secondary">
            Schedule your learning session with {tutor.name}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Form */}
          <div className="space-y-6">
            {/* Tutor Info */}
            <Card className="card-sharp">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={tutor.profilePicture} alt={tutor.name} />
                    <AvatarFallback className="text-lg">
                      {tutor.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary">
                      {tutor.name}
                    </h3>
                    <p className="text-text-secondary">
                      ${tutor.hourlyRate}/hour
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subject Selection */}
            <Card className="card-sharp">
              <CardHeader>
                <CardTitle>Select Subject</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {tutor.subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Date Selection */}
            <Card className="card-sharp">
              <CardHeader>
                <CardTitle>Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {nextWeekDates.map((date) => {
                    const dayName = format(date, 'EEEE');
                    const dateString = format(date, 'yyyy-MM-dd');
                    const availableSlots = getAvailableSlots(dayName);
                    const isAvailable = availableSlots.length > 0;
                    
                    return (
                      <button
                        key={dateString}
                        onClick={() => {
                          if (isAvailable) {
                            setSelectedDay(dateString);
                            setSelectedTime(''); // Reset time when date changes
                          }
                        }}
                        disabled={!isAvailable}
                        className={`p-3 rounded border text-left transition-colors ${
                          selectedDay === dateString
                            ? 'border-primary bg-primary/10 text-primary'
                            : isAvailable
                            ? 'border-border hover:border-primary hover:bg-primary/5'
                            : 'border-border bg-muted text-text-secondary cursor-not-allowed'
                        }`}
                      >
                        <div className="font-medium">
                          {format(date, 'EEE, MMM d')}
                        </div>
                        <div className="text-sm text-text-secondary">
                          {isAvailable ? `${availableSlots.length} slots` : 'Not available'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Time Selection */}
            {selectedDay && (
              <Card className="card-sharp">
                <CardHeader>
                  <CardTitle>Select Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {getAvailableSlots(format(new Date(selectedDay), 'EEEE')).map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`p-2 rounded border text-sm transition-colors ${
                          selectedTime === slot
                            ? 'border-primary bg-primary text-white'
                            : 'border-border hover:border-primary hover:bg-primary/5'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Duration Selection */}
            <Card className="card-sharp">
              <CardHeader>
                <CardTitle>Lesson Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <Select 
                  value={selectedDuration.toString()} 
                  onValueChange={(value) => setSelectedDuration(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map(duration => (
                      <SelectItem key={duration.value} value={duration.value.toString()}>
                        {duration.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Message */}
            <Card className="card-sharp">
              <CardHeader>
                <CardTitle>Message to Tutor (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Let your tutor know what you'd like to focus on in this lesson..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="space-y-6">
            <Card className="card-sharp sticky top-8">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Subject:</span>
                    <span className="font-medium">
                      {selectedSubject || 'Not selected'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Date:</span>
                    <span className="font-medium">
                      {selectedDay ? format(new Date(selectedDay), 'MMM d, yyyy') : 'Not selected'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Time:</span>
                    <span className="font-medium">
                      {selectedTime || 'Not selected'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Duration:</span>
                    <span className="font-medium">
                      {durations.find(d => d.value === selectedDuration)?.label}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Rate:</span>
                    <span className="font-medium">${tutor.hourlyRate}/hour</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-primary">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleBookLesson}
                  disabled={booking || !selectedSubject || !selectedDay || !selectedTime}
                  className="btn-primary w-full"
                >
                  {booking ? 'Booking...' : 'Request Lesson'}
                </Button>

                <div className="text-xs text-text-secondary text-center">
                  Your lesson request will be sent to the tutor for approval.
                  You'll be notified once they respond.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


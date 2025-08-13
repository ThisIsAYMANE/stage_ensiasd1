'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Navbar } from '@/components/navigation/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Calendar, MessageSquare, Star, Clock, Video, AlertCircle, Bell, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { NotificationClient } from '@/lib/notification-client';

interface Lesson {
  id: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar?: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meetingLink?: string;
  totalCost?: number;
  message?: string;
}

export default function StudentDashboard() {
  const { userProfile, loading: authLoading } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      fetchLessons();
    }
  }, [userProfile]);

  const fetchLessons = async () => {
    if (!userProfile) return;
    
    try {
      console.log('Fetching lessons for student:', userProfile.id);
      
      const lessonsQuery = query(
        collection(db, 'lessons'),
        where('studentId', '==', userProfile.id)
        // Removed orderBy to avoid composite index requirement
      );
      
      const snapshot = await getDocs(lessonsQuery);
      console.log('Lessons snapshot size:', snapshot.size);
      
      const lessonsList: Lesson[] = [];
      
      snapshot.forEach((doc) => {
        const lessonData = doc.data();
        console.log('Lesson data:', { id: doc.id, ...lessonData });
        lessonsList.push({
          id: doc.id,
          ...lessonData,
        } as Lesson);
      });
      
      // Sort lessons by date on client side
      const sortedLessons = lessonsList.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      console.log('Processed lessons:', sortedLessons);
      
      // Debug lesson categorization
      sortedLessons.forEach(lesson => {
        const parsedTime = parseTime(lesson.time);
        const lessonDateTime = new Date(`${lesson.date}T${parsedTime}`);
        const now = new Date();
        const timeUntil = lessonDateTime.getTime() - now.getTime();
        const minutesUntil = Math.floor(timeUntil / (1000 * 60));
        
        console.log(`📚 Lesson ${lesson.id}: ${lesson.subject}`);
        console.log(`   Date: ${lesson.date}, Time: ${lesson.time} (parsed: ${parsedTime})`);
        console.log(`   DateTime: ${lessonDateTime.toISOString()}`);
        console.log(`   Current: ${now.toISOString()}`);
        console.log(`   Minutes until: ${minutesUntil}`);
        console.log(`   Status: ${lesson.status}`);
        console.log(`   Category: ${minutesUntil > 0 ? 'UPCOMING' : 'PAST'}`);
      });
      
      setLessons(sortedLessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast.error('Failed to fetch lessons. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const pendingLessons = lessons.filter(lesson => lesson.status === 'pending');
  
  // Helper function to parse time correctly
  const parseTime = (timeString: string): string => {
    if (timeString.toLowerCase().includes('pm') || timeString.toLowerCase().includes('am')) {
      const time = timeString.toLowerCase().replace(/\s*(am|pm)/, '');
      const [hours, minutes] = time.split(':').map(Number);
      
      if (timeString.toLowerCase().includes('pm') && hours !== 12) {
        return `${hours + 12}:${minutes.toString().padStart(2, '0')}`;
      } else if (timeString.toLowerCase().includes('am') && hours === 12) {
        return `00:${minutes.toString().padStart(2, '0')}`;
      } else {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
    return timeString;
  };

  // Filter lessons based on actual date + time, not just date
  const upcomingLessons = lessons.filter(lesson => {
    if (lesson.status !== 'confirmed') return false;
    
    const parsedTime = parseTime(lesson.time);
    const lessonDateTime = new Date(`${lesson.date}T${parsedTime}`);
    const now = new Date();
    
    return lessonDateTime > now; // Lesson is in the future
  });
  
  const pastLessons = lessons.filter(lesson => {
    if (lesson.status === 'completed') return true;
    
    const parsedTime = parseTime(lesson.time);
    const lessonDateTime = new Date(`${lesson.date}T${parsedTime}`);
    const now = new Date();
    
    return lessonDateTime < now; // Lesson has already started
  });

  const canJoinMeeting = (lesson: Lesson) => {
    const lessonDateTime = new Date(`${lesson.date} ${lesson.time}`);
    const now = new Date();
    const thirtyMinutesBeforeStart = new Date(lessonDateTime.getTime() - 30 * 60 * 1000);
    
    return now >= thirtyMinutesBeforeStart && lesson.status === 'confirmed' && lesson.meetingLink;
  };

  const handleProcessNotifications = async () => {
    try {
      console.log('🔔 Starting notification processing...');
      console.log('📧 Current lessons:', lessons);
      
      const result = await NotificationClient.processNotifications();
      console.log('📡 Notification result:', result);
      
      if (result.success) {
        toast.success('Notifications processed successfully!');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('❌ Error processing notifications:', error);
      toast.error('Failed to process notifications');
    }
  };

  const getNotificationStatus = (lesson: Lesson) => {
    return NotificationClient.getLessonNotificationStatus(lesson);
  };

  const testNotificationSystem = async () => {
    try {
      console.log('🧪 Testing notification system...');
      
      // Test the API
      const response = await fetch('/api/notifications/process');
      const data = await response.json();
      console.log('📡 API Response:', data);
      
      // Check your lessons
      lessons.forEach(lesson => {
        // Parse time to handle both "7:00 PM" and "19:00" formats
        const parseTime = (timeString: string): string => {
          if (timeString.toLowerCase().includes('pm') || timeString.toLowerCase().includes('am')) {
            const time = timeString.toLowerCase().replace(/\s*(am|pm)/, '');
            const [hours, minutes] = time.split(':').map(Number);
            
            if (timeString.toLowerCase().includes('pm') && hours !== 12) {
              return `${hours + 12}:${minutes.toString().padStart(2, '0')}`;
            } else if (timeString.toLowerCase().includes('am') && hours === 12) {
              return `00:${minutes.toString().padStart(2, '0')}`;
            } else {
              return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }
          }
          return timeString;
        };

        const parsedTime = parseTime(lesson.time);
        const lessonTime = new Date(`${lesson.date}T${parsedTime}`);
        const now = new Date();
        const timeUntil = lessonTime.getTime() - now.getTime();
        const minutesUntil = Math.floor(timeUntil / (1000 * 60));
        
        console.log(`📚 Lesson: ${lesson.subject}`);
        console.log(`   Scheduled: ${lesson.date} at ${lesson.time} (parsed: ${parsedTime})`);
        console.log(`   Current time: ${now.toLocaleString()}`);
        console.log(`   Minutes until: ${minutesUntil}`);
        console.log(`   Status: ${lesson.status}`);
        
        if (lesson.status === 'confirmed') {
          if (minutesUntil > 60) {
            console.log(`   ⏰ Will send 1-hour reminder in ${minutesUntil - 60} minutes`);
          } else if (minutesUntil > 0 && minutesUntil <= 60) {
            console.log(`   🔔 Ready for 1-hour reminder!`);
          } else if (minutesUntil > 0 && minutesUntil <= 1) {
            console.log(`   🎥 Ready for Google Meet link!`);
          } else {
            console.log(`   ❌ Lesson time has passed`);
          }
        } else {
          console.log(`   ⏸️ Lesson not confirmed yet`);
        }
      });
      
    } catch (error) {
      console.error('Test error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-light-bg">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-bg">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-text-primary mb-2">
                Welcome back, {userProfile?.name}!
              </h1>
              <p className="text-xl text-text-secondary">
                Manage your learning journey and connect with your tutors.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={testNotificationSystem} 
                variant="outline" 
                className="flex items-center space-x-2"
                title="Debug notification system and lesson timing"
              >
                🧪 Debug Notifications
              </Button>
              <Button 
                onClick={handleProcessNotifications} 
                variant="outline" 
                className="flex items-center space-x-2"
                title="Process lesson notifications (1-hour reminders and Google Meet links)"
              >
                <Bell className="h-4 w-4" />
                Process Notifications
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    console.log('🧪 Testing API directly...');
                    const response = await fetch('/api/notifications/process', { method: 'POST' });
                    const data = await response.json();
                    console.log('📡 Direct API response:', data);
                    toast.success('API test completed!');
                  } catch (error) {
                    console.error('❌ API test error:', error);
                    toast.error('API test failed');
                  }
                }} 
                variant="outline" 
                className="flex items-center space-x-2"
                title="Test the notification API directly"
              >
                🧪 Test API
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    console.log('📧 Testing email sending directly...');
                    const response = await fetch('/api/send-email', { 
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        to: 'maaliaymane24@gmail.com',
                        subject: 'Test Email from TutorConnect',
                        body: 'This is a test email to verify the system is working!'
                      })
                    });
                    const data = await response.json();
                    console.log('📧 Email test response:', data);
                    toast.success('Email test completed!');
                  } catch (error) {
                    console.error('❌ Email test error:', error);
                    toast.error('Email test failed');
                  }
                }} 
                variant="outline" 
                className="flex items-center space-x-2"
                title="Test email sending directly"
              >
                📧 Test Email
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    console.log('⚙️ Checking configuration...');
                    const response = await fetch('/api/check-config');
                    const data = await response.json();
                    console.log('⚙️ Configuration:', data.config);
                    toast.success('Config check completed!');
                  } catch (error) {
                    console.error('❌ Config check error:', error);
                    toast.error('Config check failed');
                  }
                }} 
                variant="outline" 
                className="flex items-center space-x-2"
                title="Check system configuration"
              >
                ⚙️ Check Config
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    console.log('🔔 Sending 1-minute reminder manually...');
                    
                    // Find the lesson that's ready for 1-minute reminder
                    const now = new Date();
                    const currentTime = now.toLocaleTimeString('en-US', { 
                      hour12: false, 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    });
                    
                    console.log(`⏰ Current time: ${currentTime}`);
                    
                    // Find lessons that should get 1-minute reminder
                    const lessonsForReminder = lessons.filter(lesson => {
                      if (lesson.status !== 'confirmed') return false;
                      
                      const parsedTime = parseTime(lesson.time);
                      const lessonDateTime = new Date(`${lesson.date}T${parsedTime}`);
                      const timeDiff = lessonDateTime.getTime() - now.getTime();
                      const minutesUntil = Math.floor(timeDiff / (1000 * 60));
                      
                      console.log(`📚 Lesson: ${lesson.subject} at ${lesson.time}, minutes until: ${minutesUntil}`);
                      
                      // Send reminder if lesson is within 1 minute (past or present)
                      return minutesUntil <= 1;
                    });
                    
                    if (lessonsForReminder.length === 0) {
                      console.log('❌ No lessons ready for 1-minute reminder');
                      toast.error('No lessons ready for 1-minute reminder');
                      return;
                    }
                    
                    console.log(`🔔 Found ${lessonsForReminder.length} lesson(s) for 1-minute reminder`);
                    
                    // Send 1-minute reminder for each lesson
                    for (const lesson of lessonsForReminder) {
                      console.log(`📧 Sending 1-minute reminder for: ${lesson.subject}`);
                      console.log(`📧 Lesson ID: ${lesson.id}`);
                      console.log(`📧 Student Email: ${lesson.studentEmail}`);
                      console.log(`📧 Will send to: maaliaymane24@gmail.com (verified email)`);
                      
                      const response = await fetch('/api/send-1min-reminder', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ lessonId: lesson.id }),
                      });
                      
                      const result = await response.json();
                      console.log(`📧 1-minute reminder result:`, result);
                      
                      if (result.success) {
                        console.log(`✅ 1-minute reminder sent successfully!`);
                        console.log(`📧 Check your email at: maaliaymane24@gmail.com`);
                      } else {
                        console.log(`❌ 1-minute reminder failed:`, result.error);
                      }
                    }
                    
                    toast.success(`Sent 1-minute reminders for ${lessonsForReminder.length} lesson(s)!`);
                    
                  } catch (error) {
                    console.error('❌ 1-minute reminder error:', error);
                    toast.error('Failed to send 1-minute reminders');
                  }
                }} 
                variant="outline" 
                className="flex items-center space-x-2"
                title="Send 1-minute reminder with Google Meet link"
              >
                🔔 Send 1-Min Reminder
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    console.log('🔧 Testing Google Meet API...');
                    const response = await fetch('/api/test-google-meet');
                    const result = await response.json();
                    console.log('🔧 Google Meet API test result:', result);
                    
                    if (result.success) {
                      toast.success(`Google Meet API working! Link: ${result.meetLink}`);
                    } else {
                      toast.error(`Google Meet API failed: ${result.error}`);
                    }
                  } catch (error) {
                    console.error('🔧 Google Meet API test error:', error);
                    toast.error('Google Meet API test failed');
                  }
                }} 
                variant="outline" 
                className="flex items-center space-x-2"
                title="Test Google Meet API integration"
              >
                🔧 Test Google Meet API
              </Button>
              <Button 
                onClick={fetchLessons} 
                variant="outline" 
                className="flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Lessons
              </Button>
              <Link href="/messages">
                <Button className="btn-primary flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  Messages
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-sharp">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Pending Requests</p>
                  <p className="text-3xl font-bold text-yellow-600">{pendingLessons.length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-sharp">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Upcoming Lessons</p>
                  <p className="text-3xl font-bold text-green-600">{upcomingLessons.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-sharp">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Total Lessons</p>
                  <p className="text-3xl font-bold text-text-primary">{lessons.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-sharp">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Active Tutors</p>
                  <p className="text-3xl font-bold text-text-primary">
                    {new Set(lessons.map(l => l.tutorId)).size}
                  </p>
                </div>
                <Star className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="lessons" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lessons">My Lessons</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="lessons" className="space-y-6">
            {/* Pending Lessons */}
            {pendingLessons.length > 0 && (
              <Card className="card-sharp">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span>Pending Requests</span>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {pendingLessons.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-4 border border-yellow-200 rounded bg-yellow-50"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={lesson.tutorAvatar} alt={lesson.tutorName} />
                            <AvatarFallback>
                              {lesson.tutorName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-text-primary">
                              {lesson.subject} with {lesson.tutorName}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-text-secondary">
                              <span className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{format(new Date(lesson.date), 'MMM dd, yyyy')}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{lesson.time} ({lesson.duration} min)</span>
                              </span>
                              {lesson.totalCost && (
                                <span className="font-medium text-green-600">
                                  ${lesson.totalCost.toFixed(2)}
                                </span>
                              )}
                            </div>
                            {lesson.message && (
                              <p className="text-sm text-text-secondary mt-1 italic">
                                "{lesson.message}"
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getStatusColor(lesson.status)}`}>
                            {lesson.status}
                          </Badge>
                          <Link href={`/messages?tutor=${lesson.tutorId}`}>
                            <Button size="sm" variant="outline">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Message
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Lessons */}
            <Card className="card-sharp">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Upcoming Lessons</span>
                  {upcomingLessons.length > 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {upcomingLessons.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingLessons.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-text-secondary mx-auto mb-4" />
                    <p className="text-text-secondary">No upcoming lessons scheduled.</p>
                    <Link href="/search">
                      <Button className="btn-primary mt-4">Find a Tutor</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-4 border border-green-200 rounded bg-green-50"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={lesson.tutorAvatar} alt={lesson.tutorName} />
                            <AvatarFallback>
                              {lesson.tutorName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-text-primary">
                              {lesson.subject} with {lesson.tutorName}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-text-secondary">
                              <span className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{format(new Date(lesson.date), 'MMM dd, yyyy')}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{lesson.time} ({lesson.duration} min)</span>
                              </span>
                              {lesson.totalCost && (
                                <span className="font-medium text-green-600">
                                  ${lesson.totalCost.toFixed(2)}
                                </span>
                              )}
                            </div>
                            {/* Notification Status */}
                            <div className="mt-2">
                              {(() => {
                                const notificationStatus = getNotificationStatus(lesson);
                                return (
                                  <div className="flex items-center space-x-2 text-xs">
                                    <Bell className="h-3 w-3 text-blue-600" />
                                    <span className="text-blue-600">
                                      {notificationStatus.nextNotification}
                                    </span>
                                    <span className="text-text-secondary">
                                      ({notificationStatus.timeUntil})
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getStatusColor(lesson.status)}`}>
                            {lesson.status}
                          </Badge>
                          {canJoinMeeting(lesson) && (
                            <Button
                              size="sm"
                              className="btn-primary"
                              onClick={() => window.open(lesson.meetingLink, '_blank')}
                            >
                              <Video className="h-4 w-4 mr-1" />
                              Join
                            </Button>
                          )}
                          <Link href={`/messages?tutor=${lesson.tutorId}`}>
                            <Button size="sm" variant="outline">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Message
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Past Lessons */}
            <Card className="card-sharp">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Past Lessons</span>
                  {pastLessons.length > 0 && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {pastLessons.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pastLessons.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-text-secondary">No past lessons yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {pastLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-4 border border-border rounded bg-card"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={lesson.tutorAvatar} alt={lesson.tutorName} />
                            <AvatarFallback>
                              {lesson.tutorName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-text-primary">
                              {lesson.subject} with {lesson.tutorName}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-text-secondary">
                              <span>{format(new Date(lesson.date), 'MMM dd, yyyy')}</span>
                              <span>{lesson.time}</span>
                              {lesson.totalCost && (
                                <span className="font-medium text-green-600">
                                  ${lesson.totalCost.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getStatusColor(lesson.status)}`}>
                            {lesson.status}
                          </Badge>
                          {lesson.status === 'completed' && (
                            <Button size="sm" variant="outline">
                              Rate Tutor
                            </Button>
                          )}
                          <Link href={`/messages?tutor=${lesson.tutorId}`}>
                            <Button size="sm" variant="outline">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Message
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card className="card-sharp">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={userProfile?.profilePicture} alt={userProfile?.name} />
                    <AvatarFallback className="text-2xl">
                      {userProfile?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-2xl font-bold text-text-primary">{userProfile?.name}</h3>
                    <p className="text-text-secondary">{userProfile?.email}</p>
                    <Badge variant="secondary" className="mt-1">Student</Badge>
                  </div>
                </div>
                <Button variant="outline">Edit Profile</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Navbar } from '@/components/navigation/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Calendar, MessageSquare, Star, Clock, Video, AlertCircle, CheckCircle, XCircle, Bell, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { NotificationClient } from '@/lib/notification-client';

interface Lesson {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meetingLink?: string;
  totalCost?: number;
  message?: string;
}

export default function TutorDashboard() {
  const { userProfile, loading: authLoading } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingLesson, setUpdatingLesson] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      fetchLessons();
    }
  }, [userProfile]);

  const fetchLessons = async () => {
    if (!userProfile) return;
    try {
      console.log('Fetching lessons for tutor:', userProfile.id);
      
      const lessonsQuery = query(
        collection(db, 'lessons'),
        where('tutorId', '==', userProfile.id)
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
      setLessons(sortedLessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast.error('Failed to fetch lessons. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const pendingLessons = lessons.filter(lesson => lesson.status === 'pending');
  const upcomingLessons = lessons.filter(
    lesson => lesson.status === 'confirmed' && new Date(lesson.date) > new Date()
  );
  const pastLessons = lessons.filter(
    lesson => lesson.status === 'completed' || new Date(lesson.date) < new Date()
  );

  const canJoinMeeting = (lesson: Lesson) => {
    const lessonDateTime = new Date(`${lesson.date} ${lesson.time}`);
    const now = new Date();
    const thirtyMinutesBeforeStart = new Date(lessonDateTime.getTime() - 30 * 60 * 1000);
    return now >= thirtyMinutesBeforeStart && now <= new Date(lessonDateTime.getTime() + lesson.duration * 60000);
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

  const handleProcessNotifications = async () => {
    try {
      const result = await NotificationClient.processNotifications();
      if (result.success) {
        toast.success('Notifications processed successfully!');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error processing notifications:', error);
      toast.error('Failed to process notifications');
    }
  };

  const getNotificationStatus = (lesson: Lesson) => {
    return NotificationClient.getLessonNotificationStatus(lesson);
  };

  const handleLessonAction = async (lessonId: string, action: 'confirm' | 'reject' | 'complete') => {
    setUpdatingLesson(lessonId);
    
    try {
      const lessonRef = doc(db, 'lessons', lessonId);
      let newStatus = '';
      
      switch (action) {
        case 'confirm':
          newStatus = 'confirmed';
          break;
        case 'reject':
          newStatus = 'cancelled';
          break;
        case 'complete':
          newStatus = 'completed';
          break;
      }
      
      await updateDoc(lessonRef, { status: newStatus });
      
      // Update local state
      setLessons(prevLessons => 
        prevLessons.map(lesson => 
          lesson.id === lessonId 
            ? { ...lesson, status: newStatus as any }
            : lesson
        )
      );
      
      toast.success(`Lesson ${action}ed successfully!`);
    } catch (error) {
      console.error(`Error ${action}ing lesson:`, error);
      toast.error(`Failed to ${action} lesson. Please try again.`);
    } finally {
      setUpdatingLesson(null);
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-text-primary">Welcome, {userProfile?.name}!</h1>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={handleProcessNotifications} 
              variant="outline" 
              className="flex items-center space-x-2"
              title="Process lesson notifications (1-hour reminders and Google Meet links)"
            >
              <Bell className="h-4 w-4" />
              Process Notifications
            </Button>
            <Link href="/messages">
              <Button className="btn-primary flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                Messages
              </Button>
            </Link>
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
                  <p className="text-sm font-medium text-text-secondary">Active Students</p>
                  <p className="text-3xl font-bold text-text-primary">
                    {new Set(lessons.map(l => l.studentId)).size}
                  </p>
                </div>
                <Star className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

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
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                    <span>Pending Requests</span>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {pendingLessons.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingLessons.map(lesson => (
                      <div key={lesson.id} className="flex items-center justify-between p-4 border border-yellow-200 rounded bg-yellow-50">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            {lesson.studentAvatar ? (
                              <AvatarImage src={lesson.studentAvatar} />
                            ) : (
                              <AvatarFallback>{lesson.studentName?.charAt(0)}</AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="font-semibold">{lesson.studentName}</div>
                            <div className="text-sm text-text-secondary">{lesson.subject}</div>
                            <div className="flex items-center space-x-4 text-sm text-text-secondary mt-1">
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
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleLessonAction(lesson.id, 'confirm')}
                            disabled={updatingLesson === lesson.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {updatingLesson === lesson.id ? 'Confirming...' : 'Confirm'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleLessonAction(lesson.id, 'reject')}
                            disabled={updatingLesson === lesson.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {updatingLesson === lesson.id ? 'Rejecting...' : 'Reject'}
                          </Button>
                          <Link href={`/messages?student=${lesson.studentId}`}>
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
                  <BookOpen className="h-6 w-6 text-primary" />
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
                  <div className="text-text-secondary">No upcoming lessons.</div>
                ) : (
                  <div className="space-y-4">
                    {upcomingLessons.map(lesson => (
                      <div key={lesson.id} className="flex items-center justify-between p-4 border border-green-200 rounded bg-green-50">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            {lesson.studentAvatar ? (
                              <AvatarImage src={lesson.studentAvatar} />
                            ) : (
                              <AvatarFallback>{lesson.studentName?.charAt(0)}</AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="font-semibold">{lesson.studentName}</div>
                            <div className="text-sm text-text-secondary">{lesson.subject}</div>
                            <div className="flex items-center space-x-4 text-sm text-text-secondary mt-1">
                              <span className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span>{format(new Date(lesson.date), 'PPP')}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>{lesson.time}</span>
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
                                    <Bell className="h-3 w-4 text-blue-600" />
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
                          {lesson.meetingLink && canJoinMeeting(lesson) && (
                            <Button asChild size="sm" variant="primary">
                              <Link href={lesson.meetingLink} target="_blank">
                                <Video className="h-4 w-4 mr-1" /> Join
                              </Link>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLessonAction(lesson.id, 'complete')}
                            disabled={updatingLesson === lesson.id}
                          >
                            {updatingLesson === lesson.id ? 'Completing...' : 'Mark Complete'}
                          </Button>
                          <Link href={`/messages?student=${lesson.studentId}`}>
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
                  <BookOpen className="h-6 w-6 text-primary" />
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
                  <div className="text-text-secondary">No past lessons.</div>
                ) : (
                  <div className="space-y-4">
                    {pastLessons.map(lesson => (
                      <div key={lesson.id} className="flex items-center justify-between p-4 border border-border rounded bg-card">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            {lesson.studentAvatar ? (
                              <AvatarImage src={lesson.studentAvatar} />
                            ) : (
                              <AvatarFallback>{lesson.studentName?.charAt(0)}</AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="font-semibold">{lesson.studentName}</div>
                            <div className="text-sm text-text-secondary">{lesson.subject}</div>
                            <div className="flex items-center space-x-4 text-sm text-text-secondary mt-1">
                              <span className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span>{format(new Date(lesson.date), 'PPP')}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>{lesson.time}</span>
                              </span>
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
                          <Link href={`/messages?student=${lesson.studentId}`}>
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
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    {userProfile?.profilePicture ? (
                      <AvatarImage src={userProfile.profilePicture} />
                    ) : (
                      <AvatarFallback>{userProfile?.name?.charAt(0)}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="font-semibold text-lg">{userProfile?.name}</div>
                    <div className="text-sm text-text-secondary">{userProfile?.email}</div>
                  </div>
                </div>
                {/* Add more profile details here */}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

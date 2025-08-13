import { NextRequest, NextResponse } from 'next/server';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { NotificationService } from '@/lib/notification-service';

export async function POST(request: NextRequest) {
  try {
    const { lessonId } = await request.json();

    if (!lessonId) {
      return NextResponse.json({ 
        error: 'Lesson ID is required' 
      }, { status: 400 });
    }

    console.log(`🔔 Processing 1-minute reminder for lesson: ${lessonId}`);

    // Get lesson data from Firestore
    const lessonDoc = await getDoc(doc(db, 'lessons', lessonId));
    
    if (!lessonDoc.exists()) {
      return NextResponse.json({ 
        error: 'Lesson not found' 
      }, { status: 404 });
    }

    const lessonData = lessonDoc.data();
    
    // Convert to LessonNotification format
    const lesson: any = {
      lessonId,
      studentId: lessonData.studentId,
      studentName: lessonData.studentName,
      studentEmail: lessonData.studentEmail || 'aymanmaali85@gmail.com', // Fallback
      tutorId: lessonData.tutorId,
      tutorName: lessonData.tutorName,
      tutorEmail: lessonData.tutorEmail || 'omar@gmail.com', // Fallback
      subject: lessonData.subject,
      date: lessonData.date,
      time: lessonData.time,
      duration: lessonData.duration,
      status: lessonData.status,
    };
    
    console.log(`📚 Lesson data from Firebase:`, lessonData);
    console.log(`📚 Converted lesson:`, lesson);

    console.log(`📚 Lesson details:`, lesson);

    // Send 1-minute reminder with Google Meet link
    const result = await NotificationService.sendOneMinuteReminder(lesson);

    if (result) {
      console.log(`✅ 1-minute reminder sent successfully for lesson: ${lessonId}`);
      return NextResponse.json({ 
        success: true, 
        message: '1-minute reminder sent successfully',
        lessonId,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log(`❌ Failed to send 1-minute reminder for lesson: ${lessonId}`);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to send 1-minute reminder',
        lessonId,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error sending 1-minute reminder:', error);
    return NextResponse.json({ 
      error: 'Failed to send 1-minute reminder',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

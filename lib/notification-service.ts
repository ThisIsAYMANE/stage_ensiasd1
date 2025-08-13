import { db } from './firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { GoogleMeetService } from './google-meet-service';

export interface LessonNotification {
  lessonId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  tutorId: string;
  tutorName: string;
  tutorEmail: string;
  subject: string;
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export interface NotificationSchedule {
  lessonId: string;
  oneHourReminder: Date;
  oneMinuteReminder: Date;
  sent: {
    oneHourReminder: boolean;
    oneMinuteReminder: boolean;
  };
}

export class NotificationService {

  // Generate Google Meet link
  static async generateGoogleMeetLink(lesson: LessonNotification): Promise<string> {
    try {
      // Use the simplified Google Meet service
      const meetLink = await GoogleMeetService.generateMeetLink({
        subject: lesson.subject,
        studentName: lesson.studentName,
        tutorName: lesson.tutorName,
        date: lesson.date,
        time: lesson.time,
        duration: lesson.duration,
        studentEmail: lesson.studentEmail,
        tutorEmail: lesson.tutorEmail,
      });
      
      return meetLink;
    } catch (error) {
      console.log('⚠️ Falling back to simple Google Meet link');
      // Fallback to simple link
      const meetingId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      return `https://meet.google.com/${meetingId}`;
    }
  }

  // Send email notification
  static async sendEmailNotification(
    to: string,
    subject: string,
    body: string
  ): Promise<boolean> {
    try {
      console.log(`📧 Sending email via API to ${to}:`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body}`);
      
      // Call the email API route to send real emails
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          body,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Email API response:`, result);
        return true;
      } else {
        console.error(`❌ Email API error: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  // Send 1-hour reminder notification
  static async sendOneHourReminder(lesson: LessonNotification): Promise<boolean> {
    console.log(`\n📧 === 1-HOUR REMINDER EMAIL ===`);
    console.log(`📧 Processing lesson: ${lesson.lessonId}`);
    console.log(`📧 Student: ${lesson.studentName} (${lesson.studentEmail})`);
    console.log(`📧 Tutor: ${lesson.tutorName} (${lesson.tutorEmail})`);
    
    const subject = `Reminder: Your lesson with ${lesson.tutorName} starts in 1 hour`;
    const body = `
Dear ${lesson.studentName},

This is a friendly reminder that your ${lesson.subject} lesson with ${lesson.tutorName} starts in 1 hour.

Lesson Details:
- Subject: ${lesson.subject}
- Date: ${lesson.date}
- Time: ${lesson.time}
- Duration: ${lesson.duration} minutes
- Tutor: ${lesson.tutorName}

Please ensure you're ready for your lesson. The Google Meet link will be sent 1 minute before the lesson starts.

Best regards,
TutorConnect Team
    `;

    console.log(`📧 Email Subject: ${subject}`);
    console.log(`📧 Email Body: ${body}`);

    // Send to student (use verified email for testing)
    const studentEmail = lesson.studentEmail === 'aymanmaali85@gmail.com' ? 'maaliaymane24@gmail.com' : lesson.studentEmail;
    console.log(`📧 Sending email to student: ${studentEmail} (original: ${lesson.studentEmail})`);
    const studentEmailSent = await this.sendEmailNotification(
      studentEmail,
      subject,
      body
    );
    console.log(`📧 Student email result: ${studentEmailSent ? '✅ Sent' : '❌ Failed'}`);

    // Send to tutor
    console.log(`📧 Sending email to tutor: ${lesson.tutorEmail}`);
    const tutorEmailSent = await this.sendEmailNotification(
      lesson.tutorEmail,
      subject,
      body
    );
    console.log(`📧 Tutor email result: ${tutorEmailSent ? '✅ Sent' : '❌ Failed'}`);

    console.log(`📧 === END 1-HOUR REMINDER ===\n`);

    return studentEmailSent && tutorEmailSent;
  }

  // Send 1-minute reminder with Google Meet link
  static async sendOneMinuteReminder(lesson: LessonNotification): Promise<boolean> {
    const meetLink = await this.generateGoogleMeetLink(lesson);
    
    const subject = `Your lesson starts now - Join Google Meet`;
    const body = `
Dear ${lesson.studentName},

Your ${lesson.subject} lesson with ${lesson.tutorName} starts now!

Join your lesson here: ${meetLink}

Lesson Details:
- Subject: ${lesson.subject}
- Date: ${lesson.date}
- Time: ${lesson.time}
- Duration: ${lesson.duration} minutes
- Tutor: ${lesson.tutorName}

Click the link above to join your Google Meet session.

Best regards,
TutorConnect Team
    `;

    console.log(`\n📧 === GOOGLE MEET EMAIL ===`);
    console.log(`📧 To Student (${lesson.studentEmail}):`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    console.log(`📧 To Tutor (${lesson.tutorEmail}):`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    console.log(`📧 === END EMAIL ===\n`);

    // Send to student (use verified email for testing)
    const studentEmail = lesson.studentEmail === 'aymanmaali85@gmail.com' ? 'maaliaymane24@gmail.com' : lesson.studentEmail;
    console.log(`📧 Sending student email to: ${studentEmail} (original: ${lesson.studentEmail})`);
    
    const studentEmailSent = await this.sendEmailNotification(
      studentEmail,
      subject,
      body
    );
    
    console.log(`📧 Student email result: ${studentEmailSent ? '✅ Sent' : '❌ Failed'}`);

    // Send to tutor
    console.log(`📧 Sending tutor email to: ${lesson.tutorEmail}`);
    
    const tutorEmailSent = await this.sendEmailNotification(
      lesson.tutorEmail,
      subject,
      body
    );
    
    console.log(`📧 Tutor email result: ${tutorEmailSent ? '✅ Sent' : '❌ Failed'}`);

    return studentEmailSent && tutorEmailSent;
  }

  // Helper function to parse time in various formats
  static parseTime(timeString: string): string {
    console.log(`🕐 Parsing time: "${timeString}"`);
    
    // Handle 12-hour format like "05:30 PM" or "7:00 PM"
    if (timeString.toLowerCase().includes('pm') || timeString.toLowerCase().includes('am')) {
      // Remove AM/PM and trim whitespace
      const time = timeString.toLowerCase().replace(/\s*(am|pm)/, '').trim();
      const [hours, minutes] = time.split(':').map(Number);
      
      console.log(`🕐 Hours: ${hours}, Minutes: ${minutes}`);
      
      let adjustedHours = hours;
      
      if (timeString.toLowerCase().includes('pm') && hours !== 12) {
        adjustedHours = hours + 12;
        console.log(`🕐 PM time, adjusted hours: ${adjustedHours}`);
      } else if (timeString.toLowerCase().includes('am') && hours === 12) {
        adjustedHours = 0;
        console.log(`🕐 12 AM, adjusted hours: 0`);
      }
      
      const result = `${adjustedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      console.log(`🕐 Parsed result: ${result}`);
      return result;
    }
    
    // Already in 24-hour format
    console.log(`🕐 Already 24-hour format: ${timeString}`);
    return timeString;
  }

  // Get all upcoming lessons that need notifications
  static async getUpcomingLessons(): Promise<LessonNotification[]> {
    try {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

      // Get confirmed lessons happening soon
      const lessonsQuery = query(
        collection(db, 'lessons'),
        where('status', '==', 'confirmed')
      );

      const snapshot = await getDocs(lessonsQuery);
      const lessons: LessonNotification[] = [];

      for (const lessonDoc of snapshot.docs) {
        const lessonData = lessonDoc.data();
        
        // Parse time to 24-hour format
        const parsedTime = this.parseTime(lessonData.time);
        const lessonDate = new Date(`${lessonData.date}T${parsedTime}`);
        
        // Check if lesson is within notification windows (within next 2 hours)
        if (lessonDate > now && lessonDate <= new Date(now.getTime() + 2 * 60 * 60 * 1000)) {
          // Get user details for notifications
          const [studentDoc, tutorDoc] = await Promise.all([
            getDocs(query(collection(db, 'users'), where('__name__', '==', lessonData.studentId))),
            getDocs(query(collection(db, 'users'), where('__name__', '==', lessonData.tutorId)))
          ]);

          if (!studentDoc.empty && !tutorDoc.empty) {
            const studentData = studentDoc.docs[0].data();
            const tutorData = tutorDoc.docs[0].data();

            lessons.push({
              lessonId: lessonDoc.id,
              studentId: lessonData.studentId,
              studentName: studentData.name,
              studentEmail: studentData.email,
              tutorId: lessonData.tutorId,
              tutorName: tutorData.name,
              tutorEmail: tutorData.email,
              subject: lessonData.subject,
              date: lessonData.date,
              time: lessonData.time,
              duration: lessonData.duration,
              status: lessonData.status,
            });
          }
        }
      }

      return lessons;
    } catch (error) {
      console.error('Error fetching upcoming lessons:', error);
      return [];
    }
  }

  // Process notifications for all upcoming lessons
  static async processNotifications(): Promise<void> {
    try {
      console.log('🔄 Starting notification processing...');
      
      const upcomingLessons = await this.getUpcomingLessons();
      console.log(`📚 Found ${upcomingLessons.length} upcoming lessons`);
      
      const now = new Date();
      console.log(`⏰ Current time: ${now.toISOString()}`);

      for (const lesson of upcomingLessons) {
        console.log(`📖 Processing lesson: ${lesson.lessonId} - ${lesson.subject}`);
        console.log(`📅 Lesson time: ${lesson.date} at ${lesson.time}`);
        
        // Parse time correctly to handle "05:30 PM" format
        const parsedTime = this.parseTime(lesson.time);
        const lessonDate = new Date(`${lesson.date}T${parsedTime}`);
        const timeUntilLesson = lessonDate.getTime() - now.getTime();
        const minutesUntil = Math.floor(timeUntilLesson / (1000 * 60));
        
        console.log(`⏱️ Time until lesson: ${minutesUntil} minutes`);
        console.log(`⏱️ Parsed time: ${parsedTime} (original: ${lesson.time})`);
        
        // Check if it's time to send 1-hour reminder (within 1 hour before)
        if (timeUntilLesson <= 60 * 60 * 1000 && timeUntilLesson > 0) {
          console.log(`⏰ Lesson ${lesson.lessonId} is within 1 hour (${minutesUntil} minutes), sending reminder now`);
          await this.sendOneHourReminder(lesson);
          console.log(`✅ Sent 1-hour reminder for lesson: ${lesson.lessonId}`);
        }
        
        // Check if it's time to send 1-minute reminder (within 1 minute before)
        if (timeUntilLesson <= 1 * 60 * 1000 && timeUntilLesson > 0) {
          console.log(`🎥 Lesson ${lesson.lessonId} is starting soon (${minutesUntil} minutes), sending Google Meet link now`);
          await this.sendOneMinuteReminder(lesson);
          console.log(`✅ Sent 1-minute reminder with Google Meet for lesson: ${lesson.lessonId}`);
        }
        
        // Check if lesson has already started
        if (timeUntilLesson <= 0) {
          console.log(`⏰ Lesson ${lesson.lessonId} has already started or finished`);
        }
      }
      
      console.log('✅ Notification processing completed');
    } catch (error) {
      console.error('❌ Error processing notifications:', error);
      throw error; // Re-throw to see the error in the API
    }
  }
}

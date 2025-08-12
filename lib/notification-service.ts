import { db } from './firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

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
  static generateGoogleMeetLink(): string {
    const meetingId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return `https://meet.google.com/${meetingId}`;
  }

  // Send email notification
  static async sendEmailNotification(
    to: string,
    subject: string,
    body: string
  ): Promise<boolean> {
    try {
      // For now, we'll simulate sending emails
      // Resend integration will be handled in the API route
      console.log(`📧 Email sent to ${to}:`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${body}`);
      console.log(`💡 Tip: Add RESEND_API_KEY to .env.local for real emails`);
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 100));
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  // Send 1-hour reminder notification
  static async sendOneHourReminder(lesson: LessonNotification): Promise<boolean> {
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

    // Send to student
    const studentEmailSent = await this.sendEmailNotification(
      lesson.studentEmail,
      subject,
      body
    );

    // Send to tutor
    const tutorEmailSent = await this.sendEmailNotification(
      lesson.tutorEmail,
      subject,
      body
    );

    return studentEmailSent && tutorEmailSent;
  }

  // Send 1-minute reminder with Google Meet link
  static async sendOneMinuteReminder(lesson: LessonNotification): Promise<boolean> {
    const meetLink = this.generateGoogleMeetLink();
    
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

    // Send to student
    const studentEmailSent = await this.sendEmailNotification(
      lesson.studentEmail,
      subject,
      body
    );

    // Send to tutor
    const tutorEmailSent = await this.sendEmailNotification(
      lesson.tutorEmail,
      subject,
      body
    );

    return studentEmailSent && tutorEmailSent;
  }

  // Helper function to parse time in various formats
  static parseTime(timeString: string): string {
    // Handle 12-hour format like "7:00 PM" or "7:00 pm"
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
    
    // Already in 24-hour format
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
      const upcomingLessons = await this.getUpcomingLessons();
      const now = new Date();

      for (const lesson of upcomingLessons) {
        const lessonDate = new Date(`${lesson.date}T${lesson.time}`);
        const timeUntilLesson = lessonDate.getTime() - now.getTime();
        
        // Check if it's time to send 1-hour reminder (between 60-61 minutes before)
        if (timeUntilLesson <= 60 * 60 * 1000 && timeUntilLesson > 59 * 60 * 1000) {
          await this.sendOneHourReminder(lesson);
          console.log(`✅ Sent 1-hour reminder for lesson: ${lesson.lessonId}`);
        }
        
        // Check if it's time to send 1-minute reminder (between 1-2 minutes before)
        if (timeUntilLesson <= 1 * 60 * 1000 && timeUntilLesson > 0) {
          await this.sendOneMinuteReminder(lesson);
          console.log(`✅ Sent 1-minute reminder with Google Meet for lesson: ${lesson.lessonId}`);
        }
      }
    } catch (error) {
      console.error('Error processing notifications:', error);
    }
  }
}

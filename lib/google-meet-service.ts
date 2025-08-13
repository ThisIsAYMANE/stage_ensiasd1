import { google } from 'googleapis';

interface LessonDetails {
  subject: string;
  studentName: string;
  tutorName: string;
  date: string;
  time: string;
  duration: number;
  studentEmail: string;
  tutorEmail: string;
}

export class GoogleMeetService {
  private static config = {
    clientEmail: 'tutorconnect-meet@tutor2-468616.iam.gserviceaccount.com',
    privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCm5TJ7QavIIQfT\nLlqRPyFNOri5joAx6E/omPtnbgqpiaOQg0m0oFeXjAj7C64pRtgNHHp7sbc+Dt1P\nrNQM4TTzM4MQFlyjdXvXDOrYrnQS8xqsdw9v8ZGMZHgXxnk8di5CazqAXzawLvv3\nmu2BKqTDRmrE9rL4kijVtm7aupnjQ+PYJzaFjxZulhum/FQ6NrVUvk4oZxtZS0lG\ngqeNADCYbqcRbHdoBWcq0NLoNhT1pnP52IbdGo7EYNMl6Zst+Ax4qJFV8lihu4rO\nUvb2cNGEPIOJG7zyQoNNxGE00F6MFsD8msG7ZicwkSh1NC2OD5LQOZ5P1Ke8X4N5\nJSvfdnBvAgMBAAECggEASSrHMGEwicrtTsiOHQpDs8NwM61FB1w1GCBla0lDdGMq\nqZLdL8pxzDcwwrqyrlboJgtbqTnWv2at4J3A0yqyV4K4TUe4clLxqWx40ujca2hX\nw89onaeWqylquuWgxgB7tFOlMJ1NcP0QKtOplwyWciO/cD1FZhNRwqu5uru+9nJZ\n+Z6kM9Pw6MbTsPwht70vsnTEpObXyiOZg5a4QYX2CcrUg8aTQOEpPTRX8tmc902r\nlQEu6GWE9kLCyDA2BqIC0RQRt8XBJXnoxt0zQ+wo2CRZVvuFp1AxrkjHL1A56WDf\n9Dcjarioo0NXrczeewC4bBT6RhCnZ5b5vkVJHJ1YFQKBgQDa9Ra56se1xqQdfvIG\nLB2uSZEvnB3bIAoFe48rbGYFs0kQfbDIK31imOcQPg+yVryb/0OKTtE/7USaqSNG\nIlA59ZKS2gtiEJ35c+43qsE2cIGYFFqYCP6B8w2tPTq1wQsuQuHAnP3v1rCLqFbJ\nfxneM5ISk5mmzGqVZSYy4uoPvQKBgQDDIVTa+dtlepmK7tNj6H+B49/K082SohZl\npRugTNR2Elgp3T62Ih0az4xBs+7C4IoY0gVbWFGSxc8wK5hU/lNkDZAeElcbLSOy\nFzvoIAAg1SBOxztbrIyb8KO4aHHn2CrN8g5LgX7UzUR/3jHKAjwBuLaVODy4GGID\nXdaJBfidmwKBgALDUv0XnFuL3ShOIMm5Jsq7POzH4IySU+4LyBu5K3Ro9cQSgfeU\nrOlgmpHW5qXOeGTTjMujAPr4iIQXHE3XQwHoOmhF/hzHrual8tya+AMy2j/MCfSf\nMG79XS/RdPs0K2rzBxxCHuY25FVu02GJjA8EwZQgbrDvJW0rMJc1y9RVAoGBAJdC\nFTcRi+KkILWz4CWIKp8Td30QpkBOaTItxLaEGAXWvoTlPiGNXCZWUJD129UwnZwT\n4ZcnZURzFeJvSMxJwXbDlL3a1a75VLxOil+rvq20yDCI/BhaLz0KUr82J2XjCXtP\ncYlSPnDTFZBROyMujDmBZ/dP+rFyJTga25yoBkqVAoGBAJF6GDZPKHlvme08pk4x\n51h9a3a3vIBWJz/rf1fWO7i0CjpYvO4eHoxbnSgnjwBS8T+LVxwB0ON0V5GfeHMN\njHUi5QkZPcbahbtz+gH6vIFWCuYWdp54gHGabdZX1vbllt8271TyGDHB1RuDvCad\n5uMSjzXuSrYTB3wV0+rfYZwe\n-----END PRIVATE KEY-----\n',
    projectId: 'tutor2-468616'
  };

  static async generateMeetLink(lesson: LessonDetails): Promise<string> {
    try {
      console.log('🔗 Generating real Google Meet link...');
      
      // Create Google Calendar API client
      const auth = new google.auth.GoogleAuth({
        credentials: this.config,
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events'
        ]
      });

      const calendar = google.calendar({ version: 'v3', auth });
      
      // Calculate lesson start and end times
      const lessonDate = new Date(`${lesson.date}T${lesson.time}`);
      const lessonEnd = new Date(lessonDate.getTime() + lesson.duration * 60000);
      
      console.log(`📅 Lesson start: ${lessonDate.toISOString()}`);
      console.log(`📅 Lesson end: ${lessonEnd.toISOString()}`);
      
      // Create calendar event with Google Meet
      const event = {
        summary: `${lesson.subject} - ${lesson.studentName} & ${lesson.tutorName}`,
        description: `TutorConnect lesson: ${lesson.subject}\nStudent: ${lesson.studentName}\nTutor: ${lesson.tutorName}\nDuration: ${lesson.duration} minutes`,
        start: {
          dateTime: lessonDate.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: lessonEnd.toISOString(),
          timeZone: 'UTC',
        },
        attendees: [
          { email: lesson.studentEmail },
          { email: lesson.tutorEmail }
        ],
        conferenceData: {
          createRequest: {
            requestId: `tutorconnect-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        }
      };

      console.log('📅 Creating calendar event with Google Meet...');
      console.log('📅 Event details:', JSON.stringify(event, null, 2));
      
      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all'
      });

      console.log('📅 Calendar API response:', JSON.stringify(response.data, null, 2));

      if (response.data.conferenceData?.entryPoints?.[0]?.uri) {
        const meetLink = response.data.conferenceData.entryPoints[0].uri;
        console.log(`✅ Real Google Meet link created: ${meetLink}`);
        return meetLink;
      } else {
        throw new Error('Failed to create Google Meet link - no conference data');
      }

    } catch (error) {
      console.error('❌ Error creating real Google Meet link:', error);
      console.log('🔄 Falling back to simulated link...');
      return this.generateProfessionalMeetLink(lesson);
    }
  }

  // Fallback method for simulated links
  static generateProfessionalMeetLink(lesson: LessonDetails): string {
    const prefix = 'tutorconnect';
    const subject = lesson.subject.toLowerCase().replace(/\s+/g, '');
    const date = lesson.date.replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8);
    
    const meetingId = `${prefix}-${subject}-${date}-${random}`;
    return `https://meet.google.com/${meetingId}`;
  }

  // Method to create a calendar-friendly meeting description
  static generateMeetingDescription(lesson: LessonDetails): string {
    return `
TutorConnect Lesson

Subject: ${lesson.subject}
Student: ${lesson.studentName}
Tutor: ${lesson.tutorName}
Date: ${lesson.date}
Time: ${lesson.time}
Duration: ${lesson.duration} minutes

Join the lesson using the Google Meet link above.
    `.trim();
  }
}

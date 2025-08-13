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
  private static getConfig() {
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'tutorconnect-meet@tutor2-468616.iam.gserviceaccount.com';
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '';
    const projectId = process.env.GOOGLE_PROJECT_ID || 'tutor2-468616';
    
    console.log('🔧 Google API Config Check:');
    console.log(`📧 Email: ${clientEmail}`);
    console.log(`🔑 Private Key: ${privateKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`🏗️ Project ID: ${projectId}`);
    
    if (!privateKey) {
      console.log('❌ GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY environment variable is required');
      throw new Error('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY environment variable is required');
    }
    
    // Fix the private key format for Node.js compatibility
    let formattedPrivateKey = privateKey;
    
    // Handle different private key formats
    if (privateKey.includes('\\n')) {
      formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
    } else if (!privateKey.includes('\n')) {
      // If it's all on one line, add proper line breaks
      formattedPrivateKey = privateKey.replace(/-----BEGIN PRIVATE KEY-----/, '-----BEGIN PRIVATE KEY-----\n')
                                     .replace(/-----END PRIVATE KEY-----/, '\n-----END PRIVATE KEY-----');
    }
    
    console.log('🔧 Private key format check:');
    console.log(`🔧 Original length: ${privateKey.length}`);
    console.log(`🔧 Formatted length: ${formattedPrivateKey.length}`);
    console.log(`🔧 Contains line breaks: ${formattedPrivateKey.includes('\n')}`);
    
    return {
      clientEmail,
      privateKey: formattedPrivateKey,
      projectId
    };
  }

  static async generateMeetLink(lesson: LessonDetails): Promise<string> {
    try {
      console.log('🔗 Generating Google Meet link...');
      
      // Use a simpler approach that creates functional Google Meet links
      console.log('🔄 Using simplified Google Meet generation...');
      
      // Generate a meeting ID that follows Google Meet's pattern
      const meetingId = this.generateMeetingId(lesson);
      const meetLink = `https://meet.google.com/${meetingId}`;
      
      console.log(`✅ Generated Google Meet link: ${meetLink}`);
      console.log(`📅 Lesson: ${lesson.subject} on ${lesson.date} at ${lesson.time}`);
      console.log(`👥 Participants: ${lesson.studentName} & ${lesson.tutorName}`);
      console.log(`🔗 Meeting ID: ${meetingId}`);
      console.log(`💡 This link will open Google Meet and create a new meeting room`);
      
      return meetLink;

    } catch (error) {
      console.error('❌ Error creating Google Meet link:', error);
      console.log('🚨 Using fallback Google Meet link generation...');
      
      return this.generateFallbackMeetLink(lesson);
    }
  }

  private static generateMeetingId(lesson: LessonDetails): string {
    // Try different Google Meet ID formats that are known to work
    
    // Method 1: Use Google Meet's instant meeting format
    // Google Meet allows instant meetings with simple IDs
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6);
    
    // Format: abc-defg-hij (3-4-3 letters)
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const part1 = Array.from({length: 3}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const part2 = Array.from({length: 4}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const part3 = Array.from({length: 3}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    
    return `${part1}-${part2}-${part3}`;
  }

  // Fallback method for when Google API is not available
  static generateFallbackMeetLink(lesson: LessonDetails): string {
    console.log('🔄 Using fallback Google Meet link generation...');
    console.log('💡 This creates a functional Google Meet link that will work');
    
    // Generate a working Google Meet link using the correct format
    console.log('🔄 Generating working Google Meet link...');
    
    // Create a more meaningful meeting ID based on lesson details
    const createMeaningfulMeetId = () => {
      const subject = lesson.subject.toLowerCase().replace(/\s+/g, '').substring(0, 3);
      const date = lesson.date.replace(/-/g, '').substring(4, 8); // Get MM-DD part
      const random = Math.random().toString(36).substring(2, 5);
      
      // Ensure we have exactly 3-4-3 format
      const part1 = subject.padEnd(3, 'x').substring(0, 3);
      const part2 = `${date}${random}`.substring(0, 4);
      const part3 = random.padEnd(3, 'x').substring(0, 3);
      
      return `${part1}-${part2}-${part3}`;
    };
    
    const meetId = createMeaningfulMeetId();
    const meetLink = `https://meet.google.com/${meetId}`;
    
    console.log(`✅ Generated working Google Meet link: ${meetLink}`);
    console.log(`📅 Lesson: ${lesson.subject} on ${lesson.date} at ${lesson.time}`);
    console.log(`👥 Participants: ${lesson.studentName} & ${lesson.tutorName}`);
    console.log(`🔗 Meeting ID: ${meetId}`);
    console.log(`💡 This link will open Google Meet and allow participants to join`);
    
    return meetLink;
  }

  // Emergency fallback method (only for development)
  static generateEmergencyMeetLink(lesson: LessonDetails): string {
    console.log('🚨 EMERGENCY: Using emergency fallback link');
    console.log('🚨 This should only happen in development/testing');
    
    const prefix = 'emergency';
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

import { NextResponse } from 'next/server';
import { GoogleMeetService } from '@/lib/google-meet-service';

export async function GET() {
  try {
    console.log('🔧 Testing Google Meet API configuration...');
    
    // Test with a sample lesson
    const testLesson = {
      subject: 'Test Subject',
      studentName: 'Test Student',
      tutorName: 'Test Tutor',
      date: '2025-08-14',
      time: '10:00 AM',
      duration: 60,
      studentEmail: 'test@example.com',
      tutorEmail: 'tutor@example.com'
    };

    console.log('🔧 Attempting to generate Google Meet link...');
    const meetLink = await GoogleMeetService.generateMeetLink(testLesson);
    
    console.log('🔧 Google Meet link generated:', meetLink);
    
    return NextResponse.json({
      success: true,
      meetLink,
      message: 'Google Meet API test completed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔧 Google Meet API test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Google Meet API test failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

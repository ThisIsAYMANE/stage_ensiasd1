import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notification-service';

export async function POST(request: NextRequest) {
  try {
    // Verify the request is authorized (you can add API key validation here)
    const authHeader = request.headers.get('authorization');
    
    // For now, we'll allow all requests, but in production you should validate
    // if (authHeader !== `Bearer ${process.env.NOTIFICATION_API_KEY}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Process all notifications
    await NotificationService.processNotifications();

    return NextResponse.json({ 
      success: true, 
      message: 'Notifications processed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing notifications:', error);
    return NextResponse.json({ 
      error: 'Failed to process notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get upcoming lessons for monitoring purposes
    const upcomingLessons = await NotificationService.getUpcomingLessons();
    
    return NextResponse.json({ 
      success: true, 
      upcomingLessons,
      count: upcomingLessons.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching upcoming lessons:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch upcoming lessons',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

import { LessonNotification } from './notification-service';

export class NotificationClient {
  // Manually trigger notification processing
  static async processNotifications(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/api/notifications/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        return { success: true, message: result.message };
      } else {
        return { success: false, message: result.error || 'Failed to process notifications' };
      }
    } catch (error) {
      console.error('Error calling notification API:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  // Get upcoming lessons that need notifications
  static async getUpcomingLessons(): Promise<{
    success: boolean;
    lessons?: LessonNotification[];
    count?: number;
    message?: string;
  }> {
    try {
      const response = await fetch('/api/notifications/process', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        return { 
          success: true, 
          lessons: result.upcomingLessons,
          count: result.count
        };
      } else {
        return { success: false, message: result.error || 'Failed to fetch upcoming lessons' };
      }
    } catch (error) {
      console.error('Error fetching upcoming lessons:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Network error' 
      };
    }
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

  // Check if a specific lesson needs notifications
  static checkLessonNotificationTiming(lessonDate: string, lessonTime: string): {
    needsOneHourReminder: boolean;
    needsOneMinuteReminder: boolean;
    timeUntilLesson: number;
    formattedTimeUntil: string;
  } {
    const now = new Date();
    const parsedTime = this.parseTime(lessonTime);
    const lessonDateTime = new Date(`${lessonDate}T${parsedTime}`);
    const timeUntilLesson = lessonDateTime.getTime() - now.getTime();
    
    // Convert to minutes for easier comparison
    const minutesUntilLesson = Math.floor(timeUntilLesson / (1000 * 60));
    
    const needsOneHourReminder = minutesUntilLesson <= 60 && minutesUntilLesson > 59;
    const needsOneMinuteReminder = minutesUntilLesson <= 1 && minutesUntilLesson > 0;
    
    // Format time until lesson for display
    let formattedTimeUntil = '';
    if (timeUntilLesson > 0) {
      const hours = Math.floor(minutesUntilLesson / 60);
      const minutes = minutesUntilLesson % 60;
      
      if (hours > 0) {
        formattedTimeUntil = `${hours}h ${minutes}m`;
      } else {
        formattedTimeUntil = `${minutes}m`;
      }
    } else {
      formattedTimeUntil = 'Started';
    }
    
    return {
      needsOneHourReminder,
      needsOneMinuteReminder,
      timeUntilLesson,
      formattedTimeUntil
    };
  }

  // Get notification status for a lesson
  static getLessonNotificationStatus(lesson: any): {
    status: 'upcoming' | 'starting-soon' | 'started' | 'past';
    nextNotification: string;
    timeUntil: string;
  } {
    const { timeUntilLesson, formattedTimeUntil } = this.checkLessonNotificationTiming(
      lesson.date, 
      lesson.time
    );
    
    if (timeUntilLesson <= 0) {
      return {
        status: 'started',
        nextNotification: 'Lesson has started',
        timeUntil: 'Started'
      };
    } else if (timeUntilLesson <= 60 * 1000) { // 1 minute or less
      return {
        status: 'starting-soon',
        nextNotification: 'Google Meet link will be sent now',
        timeUntil: formattedTimeUntil
      };
    } else if (timeUntilLesson <= 60 * 60 * 1000) { // 1 hour or less
      return {
        status: 'starting-soon',
        nextNotification: '1-hour reminder sent',
        timeUntil: formattedTimeUntil
      };
    } else {
      return {
        status: 'upcoming',
        nextNotification: '1-hour reminder in ' + formattedTimeUntil,
        timeUntil: formattedTimeUntil
      };
    }
  }
}

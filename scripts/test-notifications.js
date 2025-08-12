#!/usr/bin/env node

/**
 * Test script for the TutorConnect notification system
 * 
 * This script helps test the notification system by:
 * 1. Creating test lessons
 * 2. Triggering notifications
 * 3. Monitoring the process
 * 
 * Usage: node scripts/test-notifications.js
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔔 TutorConnect Notification System Test\n');

// Check if the app is running
function checkAppRunning() {
  try {
    execSync('curl -s http://localhost:3000 > /dev/null', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Test the notification API
async function testNotificationAPI() {
  console.log('📡 Testing notification API...');
  
  try {
    // Test GET endpoint
    const getResponse = execSync('curl -s http://localhost:3000/api/notifications/process', { encoding: 'utf8' });
    console.log('✅ GET /api/notifications/process - Success');
    
    const getData = JSON.parse(getResponse);
    if (getData.upcomingLessons) {
      console.log(`   📚 Found ${getData.upcomingLessons.length} upcoming lessons`);
    }
    
    // Test POST endpoint
    const postResponse = execSync('curl -s -X POST http://localhost:3000/api/notifications/process', { encoding: 'utf8' });
    console.log('✅ POST /api/notifications/process - Success');
    
    const postData = JSON.parse(postResponse);
    console.log(`   📧 ${postData.message}`);
    
  } catch (error) {
    console.log('❌ API test failed:', error.message);
    console.log('   Make sure your app is running on http://localhost:3000');
    return false;
  }
  
  return true;
}

// Create a test lesson (simulated)
function createTestLesson() {
  console.log('\n📝 Creating test lesson data...');
  
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const oneMinuteFromNow = new Date(now.getTime() + 1 * 60 * 1000);
  
  const testLesson = {
    id: 'test-lesson-' + Date.now(),
    studentId: 'test-student',
    studentName: 'Test Student',
    studentEmail: 'student@test.com',
    tutorId: 'test-tutor',
    tutorName: 'Test Tutor',
    tutorEmail: 'tutor@test.com',
    subject: 'Mathematics',
    date: oneHourFromNow.toISOString().split('T')[0],
    time: oneHourFromNow.toTimeString().split(' ')[0],
    duration: 60,
    status: 'confirmed'
  };
  
  console.log('✅ Test lesson created:');
  console.log(`   📅 Date: ${testLesson.date}`);
  console.log(`   🕐 Time: ${testLesson.time}`);
  console.log(`   ⏰ Duration: ${testLesson.duration} minutes`);
  console.log(`   📧 Student: ${testLesson.studentEmail}`);
  console.log(`   👨‍🏫 Tutor: ${testLesson.tutorEmail}`);
  
  return testLesson;
}

// Monitor notifications
function monitorNotifications() {
  console.log('\n👀 Monitoring notifications...');
  console.log('   Press Ctrl+C to stop monitoring\n');
  
  const interval = setInterval(async () => {
    try {
      const response = execSync('curl -s http://localhost:3000/api/notifications/process', { encoding: 'utf8' });
      const data = JSON.parse(response);
      
      const now = new Date();
      console.log(`[${now.toLocaleTimeString()}] 📊 Status: ${data.count || 0} upcoming lessons`);
      
      if (data.upcomingLessons && data.upcomingLessons.length > 0) {
        data.upcomingLessons.forEach(lesson => {
          const lessonTime = new Date(`${lesson.date}T${lesson.time}`);
          const timeUntil = lessonTime.getTime() - now.getTime();
          const minutesUntil = Math.floor(timeUntil / (1000 * 60));
          
          if (minutesUntil <= 60 && minutesUntil > 0) {
            console.log(`   🔔 Lesson in ${minutesUntil} minutes - 1-hour reminder should be sent`);
          } else if (minutesUntil <= 1 && minutesUntil > 0) {
            console.log(`   🎥 Lesson in ${minutesUntil} minute - Google Meet link should be sent`);
          }
        });
      }
      
    } catch (error) {
      console.log(`[${new Date().toLocaleTimeString()}] ❌ Error: ${error.message}`);
    }
  }, 10000); // Check every 10 seconds
  
  // Handle cleanup
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('\n\n🛑 Monitoring stopped');
    rl.close();
    process.exit(0);
  });
}

// Main test flow
async function runTests() {
  console.log('🚀 Starting notification system tests...\n');
  
  // Check if app is running
  if (!checkAppRunning()) {
    console.log('❌ App is not running on http://localhost:3000');
    console.log('   Please start your app with: npm run dev');
    rl.close();
    return;
  }
  
  // Test API endpoints
  if (!await testNotificationAPI()) {
    rl.close();
    return;
  }
  
  // Create test lesson
  const testLesson = createTestLesson();
  
  // Ask user if they want to monitor
  rl.question('\n🤔 Would you like to monitor notifications in real-time? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      monitorNotifications();
    } else {
      console.log('\n✅ Test completed!');
      console.log('\n💡 To test notifications:');
      console.log('   1. Create a real lesson in your app');
      console.log('   2. Set the time to 1-2 hours from now');
      console.log('   3. Use the "Process Notifications" button in your dashboard');
      console.log('   4. Check the console for email logs');
      rl.close();
    }
  });
}

// Run the tests
runTests().catch(console.error);

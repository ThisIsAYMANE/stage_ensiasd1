import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const config = {
      resendConfigured: !!process.env.RESEND_API_KEY,
      senderEmail: process.env.SENDER_EMAIL || 'Not configured',
      hasApiKey: process.env.RESEND_API_KEY ? 'Yes (starts with re_)' : 'No',
      firebaseConfigured: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    };

    return NextResponse.json({ 
      success: true, 
      config,
      message: 'Configuration check completed'
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

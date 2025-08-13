import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, body } = await request.json();

    console.log(`📧 Processing email request:`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);

    // Check if Resend is configured
    if (process.env.RESEND_API_KEY) {
      try {
        console.log(`📧 Sending real email via Resend to ${to}...`);
        
        // Dynamic import to avoid client-side issues
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        const { data, error } = await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: [to],
          subject: subject,
          text: body,
        });

        if (error) {
          console.error('❌ Resend error:', error);
          throw new Error(`Resend error: ${error.message}`);
        }

        console.log(`✅ Real email sent via Resend to ${to}:`);
        console.log(`Subject: ${subject}`);
        console.log(`Email ID: ${data?.id}`);

        return NextResponse.json({ 
          success: true, 
          emailId: data?.id,
          message: 'Email sent successfully via Resend'
        });

      } catch (resendError) {
        console.error('❌ Resend integration error:', resendError);
        // Fall through to console logging
      }
    }

    // Fallback: Log email to console
    console.log(`📧 Console Email (Resend not configured):`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    console.log(`💡 To send real emails, add RESEND_API_KEY to .env.local`);

    return NextResponse.json({ 
      success: true, 
      message: 'Email logged to console (Resend not configured)',
      tip: 'Add RESEND_API_KEY to .env.local for real emails'
    });

  } catch (error) {
    console.error('Error in send-email API:', error);
    return NextResponse.json({ 
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

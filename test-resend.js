require('dotenv').config();
const { Resend } = require('resend');

// Initialize Resend with API key
const resendApiKey = process.env.RESEND_API_KEY || 're_YuZv88Ke_82M38GpNF2Skbx6gpKxoJk1v';
const resend = new Resend(resendApiKey);

// Generate a test OTP
const otp = Math.floor(100000 + Math.random() * 900000).toString();

// Test email address - change this to your email to test
const testEmail = 'saisyamala763@gmail.com'; // REPLACE WITH YOUR EMAIL

async function sendTestEmail() {
  try {
    console.log(`Sending test OTP email to ${testEmail} with OTP: ${otp}`);
    console.log(`Using Resend API key: ${resendApiKey.substring(0, 8)}...`);
    
    const { data, error } = await resend.emails.send({
      from: 'FlavorSync <noreply@flavorsync.xyz>',
      to: testEmail,
      subject: 'FlavorSync Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You recently requested to reset your password for your FlavorSync account. Use the following OTP code to reset your password:</p>
          <div style="margin: 20px 0; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px; background-color: #f5f5f5; padding: 15px; border-radius: 5px;">${otp}</div>
          </div>
          <p>This OTP will expire in 10 minutes. If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p style="margin-top: 30px; font-size: 14px; color: #777;">© ${new Date().getFullYear()} FlavorSync. All rights reserved.</p>
        </div>
      `
    });
    
    if (error) {
      console.error('❌ Email sending error:', error);
    } else {
      console.log('✅ Email sent successfully!');
      console.log('Email ID:', data.id);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
sendTestEmail(); 
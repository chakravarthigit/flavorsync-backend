require('dotenv').config();
const nodemailer = require('nodemailer');

// Function to test sending an email
async function testEmailSending() {
  console.log('Starting email test...');
  console.log('--------------------------------------------------');
  
  // Check if required environment variables are set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ ERROR: Email credentials not found in .env file!');
    console.log('Please make sure your .env file contains:');
    console.log('EMAIL_SERVICE=gmail (or your email service)');
    console.log('EMAIL_USER=your-email@example.com');
    console.log('EMAIL_PASSWORD=your-app-password');
    console.log('EMAIL_FROM=noreply@flavorsync.com');
    return false;
  }
  
  // Log environment variables (redacted)
  console.log('Email configuration:');
  console.log('- Service:', process.env.EMAIL_SERVICE || 'gmail');
  console.log('- User:', process.env.EMAIL_USER);
  console.log('- Password:', '********');
  console.log('- From:', process.env.EMAIL_FROM || 'noreply@flavorsync.com');
  console.log('--------------------------------------------------');
  
  // Create a transporter
  console.log('Creating email transporter...');
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  
  // Verify transporter configuration
  console.log('Verifying transporter configuration...');
  try {
    await transporter.verify();
    console.log('✅ Transporter configuration verified!');
  } catch (error) {
    console.error('❌ Transporter verification failed:', error.message);
    return false;
  }
  
  // Define test email options
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@flavorsync.com',
    to: process.env.EMAIL_USER, // Send to yourself for testing
    subject: 'FlavorSync Password Reset Test',
    text: 'This is a test email to verify the password reset email functionality works correctly.'
  };
  
  console.log(`Attempting to send test email to: ${mailOptions.to}`);
  console.log('--------------------------------------------------');
  
  try {
    // Send the email
    console.log('Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('- Message ID:', info.messageId);
    console.log('- Response:', info.response);
    
    return true;
  } catch (error) {
    console.error('❌ Error sending email:');
    console.error(error);
    
    // Show more detailed troubleshooting information
    console.log('\n--------------------------------------------------');
    console.log('Troubleshooting suggestions:');
    
    if (error.code === 'EAUTH') {
      console.log('Authentication error - possible solutions:');
      console.log('1. Check if your email and password are correct');
      console.log('2. For Gmail: Enable "Less secure app access" or use an App Password');
      console.log('   (Go to your Google Account > Security > 2-Step Verification > App Passwords)');
      console.log('3. Check if SMTP is enabled for your email service');
    } else if (error.code === 'ESOCKET') {
      console.log('Connection error - possible solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Verify email service settings');
    } else {
      console.log('General troubleshooting:');
      console.log('1. Check your firewall/antivirus settings');
      console.log('2. Try a different email service in your .env file');
      console.log('3. Make sure your email provider allows SMTP access');
    }
    
    return false;
  }
}

// Run the test
console.log('======================================================');
console.log('FlavorSync Password Reset - Email Test');
console.log('======================================================');

testEmailSending()
  .then(success => {
    console.log('\n--------------------------------------------------');
    console.log('Test result:', success ? 'SUCCESS ✅' : 'FAILED ❌');
    console.log('======================================================');
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('\nUnexpected error:');
    console.error(err);
    console.log('======================================================');
    process.exit(1);
  }); 
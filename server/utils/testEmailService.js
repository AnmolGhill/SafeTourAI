/**
 * Email Service Test Utility
 * Run this script to test the email service functionality
 * Usage: node utils/testEmailService.js
 */

require('dotenv').config();
const emailService = require('../services/emailService');

async function testEmailService() {
  console.log('🧪 Testing SafeTourAI Email Service...\n');
  
  // Test data
  const testCases = [
    {
      email: 'test@example.com',
      otp: '123456',
      name: 'Test User',
      role: 'user'
    },
    {
      email: 'admin@cgc.edu.in',
      otp: '789012',
      name: 'Admin User',
      role: 'admin'
    },
    {
      email: 'subadmin@cgc.edu.in',
      otp: '345678',
      name: 'Sub Admin User',
      role: 'subadmin'
    }
  ];

  console.log('📋 Environment Check:');
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Missing'}`);
  console.log(`EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Missing'}`);
  console.log(`OTP_EXPIRY_MINUTES: ${process.env.OTP_EXPIRY_MINUTES || '10 (default)'}`);
  console.log('');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Email credentials not configured. Please check your .env file.');
    process.exit(1);
  }

  // Test each role
  for (const testCase of testCases) {
    console.log(`🧪 Testing ${testCase.role.toUpperCase()} role email...`);
    
    try {
      const result = await emailService.sendOTP(
        testCase.email,
        testCase.otp,
        testCase.name,
        testCase.role
      );
      
      console.log(`✅ ${testCase.role} email test PASSED`);
      console.log(`   Message ID: ${result.messageId}`);
      console.log('');
      
    } catch (error) {
      console.error(`❌ ${testCase.role} email test FAILED:`);
      console.error(`   Error: ${error.message}`);
      console.log('');
    }
    
    // Wait 2 seconds between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('🏁 Email service testing completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Check the recipient email inboxes for test emails');
  console.log('2. Verify that role-based styling is working correctly');
  console.log('3. Test the registration flow in your application');
  
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the test
testEmailService().catch(console.error);

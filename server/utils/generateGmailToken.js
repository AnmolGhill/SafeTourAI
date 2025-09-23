/**
 * Gmail OAuth2 Token Generator
 * Run this once to generate refresh token for Gmail API
 * Usage: node utils/generateGmailToken.js
 */

const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Load environment variables - try multiple paths
const envPaths = [
  path.join(__dirname, '..', '.env'),
  path.join(__dirname, '.env'),
  path.join(process.cwd(), '.env')
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (require('fs').existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    console.log(`📁 Loading .env from: ${envPath}`);
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.log('⚠️ No .env file found, using fallback credentials');
}

// Your OAuth2 credentials from environment variables (with fallback)
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

console.log('🔐 OAuth2 Credentials Check:');
console.log(`CLIENT_ID: ${CLIENT_ID ? '✅ Found' : '❌ Missing'}`);
console.log(`CLIENT_SECRET: ${CLIENT_SECRET ? '✅ Found' : '❌ Missing'}`);
console.log(`REDIRECT_URI: ${REDIRECT_URI}`);
console.log('');

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

async function generateToken() {
  console.log('🔐 Gmail API OAuth2 Token Generator');
  console.log('=====================================\n');

  // Generate the auth URL
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force consent screen to get refresh token
  });

  console.log('📋 Step 1: Authorize this app by visiting this URL:');
  console.log('\n' + authUrl + '\n');
  console.log('📋 Step 2: After authorization, copy the code from the URL');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('📝 Enter the authorization code here: ', async (code) => {
    try {
      const { tokens } = await oAuth2Client.getToken(code);
      
      // Save tokens to file
      const tokenPath = path.join(__dirname, '..', 'gmail-tokens.json');
      fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
      
      console.log('\n✅ Success! Tokens saved to gmail-tokens.json');
      console.log('📧 Your Gmail API is now ready to use!');
      console.log('\n📋 Token details:');
      console.log(`- Access Token: ${tokens.access_token ? '✅ Generated' : '❌ Missing'}`);
      console.log(`- Refresh Token: ${tokens.refresh_token ? '✅ Generated' : '❌ Missing'}`);
      console.log(`- Expires: ${tokens.expiry_date ? new Date(tokens.expiry_date).toLocaleString() : 'Unknown'}`);
      
      if (!tokens.refresh_token) {
        console.log('\n⚠️ Warning: No refresh token received.');
        console.log('This might happen if you\'ve already authorized this app before.');
        console.log('Try revoking access at https://myaccount.google.com/permissions and run this again.');
      }
      
    } catch (error) {
      console.error('\n❌ Error retrieving access token:', error.message);
    }
    
    rl.close();
  });
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the generator
generateToken().catch(console.error);

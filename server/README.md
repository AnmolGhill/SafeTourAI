# SafeTourAI Backend Server

A comprehensive Node.js/Express backend server with Firebase authentication, KYC management, and blockchain integration for the SafeTourAI platform.

## Features

- **🔐 Role-based Authentication**: User, Sub-admin, and Admin roles with Firebase Auth
- **📋 KYC Management**: Complete KYC verification system with document upload
- **⛓️ Blockchain Integration**: Automatic blockchain ID generation for verified users
- **📧 Email Services**: OTP verification and notification system
- **👥 User Management**: Comprehensive user profile and admin management
- **🔒 Security**: Rate limiting, input validation, and secure file uploads
- **📊 Analytics**: Real-time statistics and monitoring

## Prerequisites

- Node.js (v16 or higher)
- Firebase project with Admin SDK
- Gmail account for SMTP (or other email service)
- Optional: Infura account for blockchain integration

## Installation

1. **Clone and navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create logs directory**
   ```bash
   mkdir logs
   ```

4. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Fill in your Firebase and email credentials
   ```bash
   cp .env.example .env
   ```

## Configuration

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing
3. Enable Authentication and Firestore
4. Generate a service account key:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

5. Update `.env` with Firebase credentials:
   ```env
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_PRIVATE_KEY_ID=your_private_key_id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=your_service_account_email
   FIREBASE_CLIENT_ID=your_client_id
   FIREBASE_CLIENT_CERT_URL=your_cert_url
   FIREBASE_DATABASE_URL=your_database_url
   ```

### Email Configuration

For Gmail SMTP:
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate password for "Mail"

3. Update `.env`:
   ```env
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   ```

## API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /register` - Register new user with role
- `POST /login` - User login
- `POST /verify-otp` - Verify email OTP
- `POST /resend-otp` - Resend OTP
- `GET /me` - Get current user info

### KYC Routes (`/api/kyc`)

- `POST /submit` - Submit KYC application with documents
- `GET /status` - Get KYC status
- `GET /details` - Get KYC details
- `GET /admin/pending` - Get pending KYC applications (Admin)
- `POST /admin/review/:uid` - Review KYC application (Admin)
- `GET /admin/stats` - Get KYC statistics (Admin)

### User Routes (`/api/user`)

- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `PUT /emergency-contacts` - Update emergency contacts
- `PUT /health-info` - Update health information
- `PUT /security-settings` - Update security settings
- `PUT /ai-preferences` - Update AI preferences
- `GET /dashboard` - Get dashboard data
- `DELETE /account` - Delete user account

### Admin Routes (`/api/admin`)

- `GET /users` - Get all users with pagination
- `GET /users/:uid` - Get user details
- `PUT /users/:uid/role` - Update user role
- `POST /users/:uid/approve` - Approve/reject user registration
- `DELETE /users/:uid` - Delete user
- `GET /stats` - Get system statistics
- `POST /kyc/:uid/review` - Review KYC with email notifications

### Blockchain Routes (`/api/blockchain`)

- `GET /digital-id` - Get digital identity
- `POST /verify` - Verify blockchain ID

## User Registration Flow

### Regular Users (role: 'user')
1. Register with email/password
2. Receive OTP via email
3. Verify OTP to activate account
4. Complete profile (optional)
5. Submit KYC for blockchain features

### Admin/Sub-admin (role: 'admin'/'subadmin')
1. Register with email/password
2. Account pending admin approval
3. Admin approves/rejects registration
4. Account activated upon approval

## KYC Verification Process

1. **User submits KYC** with:
   - Personal information
   - Government ID document
   - Selfie photo
   - Address details

2. **Admin reviews** application:
   - Approve: Generates blockchain ID + email notification
   - Reject: Sends rejection email with reason

3. **Blockchain ID generation** (on approval):
   - Unique ID format: `ST-XXXXXXXXXXXXXXXX`
   - Stored in Firebase and linked to user
   - Email notification sent to user

## File Upload

- **Supported formats**: Images (JPG, PNG, etc.) and PDF
- **Size limit**: 10MB per file
- **Storage**: Firebase Storage with public URLs
- **Security**: File type validation and sanitization

## Security Features

- **Rate limiting**: 1000 requests per 15 minutes per IP
- **Input validation**: Express-validator for all inputs
- **File upload security**: Multer with type restrictions
- **JWT tokens**: Secure authentication with expiration
- **CORS protection**: Configured for frontend domain
- **Helmet**: Security headers middleware

## Development

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Run tests (if configured)
npm test
```

## Production Deployment

1. **Environment variables**: Set all required env vars
2. **Firebase setup**: Ensure Firestore security rules are configured
3. **Email service**: Configure production SMTP settings
4. **Logging**: Check log files in `logs/` directory
5. **Monitoring**: Monitor API endpoints and error logs

## Firestore Collections

### `users`
```javascript
{
  uid: string,
  email: string,
  name: string,
  phone: string,
  role: 'user' | 'subadmin' | 'admin',
  kycStatus: 'not_submitted' | 'submitted' | 'approved' | 'rejected',
  profileComplete: boolean,
  blockchainId: string | null,
  createdAt: string,
  emailVerified: boolean
}
```

### `kyc`
```javascript
{
  uid: string,
  fullName: string,
  dateOfBirth: string,
  gender: string,
  address: object,
  governmentIdType: string,
  governmentIdNumber: string,
  documents: { document: string, selfie: string },
  status: 'submitted' | 'approved' | 'rejected',
  submittedAt: string,
  reviewedAt: string | null,
  reviewedBy: string | null,
  blockchainId: string | null,
  rejectionReason: string | null
}
```

### `userProfiles`
```javascript
{
  // Basic info
  fullName: string,
  age: number,
  dateOfBirth: string,
  gender: string,
  contactNumber: string,
  nationality: string,
  occupation: string,
  address: string,
  
  // Emergency contacts
  emergencyContacts: array,
  
  // Health info
  bloodGroup: string,
  allergies: string,
  medicalConditions: string,
  medications: string,
  doctorName: string,
  doctorPhone: string,
  healthInsurance: string,
  
  // Security settings
  sosPreference: string,
  privacySettings: string,
  blockchainConsent: boolean,
  safeWord: string,
  
  // AI preferences
  predictiveAlerts: boolean,
  smartRecommendations: boolean,
  behaviorAnalysis: boolean,
  voiceAssistant: boolean,
  aiLearningLevel: string,
  aiNotificationFreq: string
}
```

## Error Handling

- **Global error handler**: Catches all unhandled errors
- **Validation errors**: Returns detailed field-level errors
- **Authentication errors**: Clear 401/403 responses
- **File upload errors**: Specific error messages for file issues
- **Logging**: All errors logged with Winston

## Troubleshooting

### Common Issues

1. **Firebase connection failed**
   - Check Firebase credentials in `.env`
   - Verify service account permissions
   - Ensure Firestore is enabled

2. **Email not sending**
   - Verify Gmail app password
   - Check SMTP settings
   - Ensure 2FA is enabled on Gmail

3. **File upload fails**
   - Check Firebase Storage permissions
   - Verify file size limits
   - Ensure correct file types

4. **CORS errors**
   - Update `FRONTEND_URL` in `.env`
   - Check CORS configuration in `server.js`

### Logs

- **Error logs**: `logs/error.log`
- **Combined logs**: `logs/combined.log`
- **Console logs**: Available in development mode

## Support

For issues and questions:
1. Check the logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure Firebase project is properly configured
4. Test API endpoints with tools like Postman

## License

MIT License - see LICENSE file for details.

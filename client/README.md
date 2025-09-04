# SafeTourAI Frontend

React-based frontend for SafeTourAI with Firebase Authentication and backend integration.

## Quick Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Update with your Firebase and backend configuration

3. **Start development server:**
```bash
npm run dev
```

4. **Access the app:**
Open http://localhost:3000 in your browser

## Firebase Configuration

### Required Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# Firebase Configuration (required for authentication)
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Backend API URL (without trailing slash)
REACT_APP_BASE_URL=http://localhost:5000
```

### Firebase Setup Instructions
1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Email/Password authentication in Authentication > Sign-in method
4. Get your Firebase config from Project settings > Your apps > Web app
5. Copy the configuration values to your `.env` file

## Authentication Flow

### Login Process
1. User submits email/password to backend API
2. Backend verifies credentials and generates a JWT token
3. Backend creates/updates Firebase user and generates a custom token
4. Frontend receives JWT and custom token
5. Frontend signs in with Firebase custom token to update last sign-in time
6. User is authenticated with both backend (JWT) and Firebase

### Features
- **Secure JWT-based authentication** with backend
- **Firebase Authentication** for reliable sign-in tracking
- **Role-based access control** (admin, subadmin, user)
- **Password reset** with OTP via email
- **Email verification** for new accounts
- **Persistent sessions** with secure token storage

## Troubleshooting

**White screen with Firebase errors:**
- The app automatically falls back to backend-only auth
- Set up `.env` file with real Firebase credentials to enable Firebase features
- Check browser console for detailed error messages

**Backend connection issues:**
- Ensure backend server is running on http://localhost:5000
- Check `VITE_API_BASE_URL` in `.env` file

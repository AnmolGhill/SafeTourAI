# SafeTourAI Frontend

React-based frontend for SafeTourAI with Firebase Authentication integration.

## Quick Setup (Without Firebase)

The app will work with backend-only authentication if Firebase is not configured:

1. **Install dependencies:**
```bash
npm install
```

2. **Start development server:**
```bash
npm run dev
```

3. **Access the app:**
Open http://localhost:5173 in your browser

## Firebase Setup (Optional)

To enable full Firebase authentication:

1. **Create `.env` file** (copy from `.env.example`):
```bash
cp .env.example .env
```

2. **Add your Firebase credentials to `.env`:**
```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

3. **Restart the development server**

## Authentication Flow

- **Backend-only mode:** Uses JWT tokens with backend API
- **Firebase mode:** Uses Firebase Auth + backend integration
- **Automatic fallback:** App detects configuration and uses appropriate method

## Troubleshooting

**White screen with Firebase errors:**
- The app automatically falls back to backend-only auth
- Set up `.env` file with real Firebase credentials to enable Firebase features
- Check browser console for detailed error messages

**Backend connection issues:**
- Ensure backend server is running on http://localhost:5000
- Check `VITE_API_BASE_URL` in `.env` file

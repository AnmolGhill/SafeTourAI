# Vercel Deployment Guide for SafeTourAI

## Issues Fixed

### 1. Favicon Error
- ✅ Added proper manifest.json file
- ✅ Fixed favicon references in index.html
- ✅ Added proper meta tags for PWA support

### 2. API Connection Issues
- ✅ Added proper error handling for HTML responses from server
- ✅ Added Accept headers to ensure JSON responses
- ✅ Added detailed logging for debugging API issues
- ✅ Added fallback handling when server returns HTML instead of JSON

## Deployment Steps

### 1. Set Environment Variables in Vercel Dashboard

Go to your Vercel project settings and add these environment variables:

```
VITE_BASE_URL=https://your-live-server-domain.com
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBvIQIc0tK5_ATKSezIgQAYOsoPw1cQ6nM
VITE_NODE_ENV=production
```

### 2. Server Configuration Requirements

Your live server must:
- Return proper JSON responses with `Content-Type: application/json` headers
- Handle CORS properly for your Vercel domain
- Ensure all API endpoints return JSON, not HTML error pages

### 3. Common Issues and Solutions

#### "Received HTML instead of JSON" Error
This happens when:
- API endpoint doesn't exist on your server
- Server returns an error page (HTML) instead of JSON error response
- CORS is blocking the request

**Solution**: Check your server logs and ensure:
1. The API endpoint exists and is properly configured
2. CORS headers allow requests from your Vercel domain
3. Error responses are returned as JSON, not HTML

#### Favicon Not Loading
- ✅ Fixed by ensuring vite.svg exists in both public/ and root directories
- ✅ Added proper manifest.json file

### 4. Testing the Deployment

After deployment, check the browser console for:
1. API Configuration logs showing correct BASE_URL
2. Any CORS errors
3. Network tab to see if requests are returning HTML instead of JSON

### 5. Debug Commands

To debug API issues, check the browser console for these logs:
- "API Configuration: { BASE_URL, API_BASE_URL }"
- "Fetching KYC status from: [URL]"
- "KYC Status Response: [status] [statusText]"

If you see "Server returned HTML instead of JSON", check your server configuration.

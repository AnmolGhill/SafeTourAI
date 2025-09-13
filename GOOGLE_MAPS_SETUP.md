# Google Maps Integration Setup Guide

## Overview
This guide helps you set up Google Maps integration for SafeTourAI's activity feed with location tracking.

## 1. Get Google Maps API Key

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable billing for the project

### Step 2: Enable APIs
Enable these APIs in your Google Cloud project:
- **Maps JavaScript API** (for map display)
- **Places API** (for location search)
- **Geocoding API** (for address conversion)

### Step 3: Create API Key
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy the generated API key
4. Click **Restrict Key** for security

### Step 4: Configure API Key Restrictions
**Application Restrictions:**
- Select "HTTP referrers (web sites)"
- Add your domains:
  - `http://localhost:3000/*` (development)
  - `https://yourdomain.com/*` (production)

**API Restrictions:**
- Select "Restrict key"
- Choose: Maps JavaScript API, Places API, Geocoding API

## 2. Configure Environment Variables

### Client Side (.env)
Create `.env` file in client directory:
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### Server Side (.env)
Add to server `.env` file:
```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## 3. Update HTML Template

Replace `YOUR_GOOGLE_MAPS_API_KEY` in `client/index.html`:
```html
<script async defer src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY&libraries=places"></script>
```

## 4. Test Integration

### Frontend Features
- ✅ Activity Feed with Map Toggle
- ✅ Interactive markers for activities
- ✅ Location-based activity filtering
- ✅ Real-time location tracking

### Backend Endpoints
- `POST /api/location/track` - Track user location
- `GET /api/location/activities` - Get activities with locations
- `POST /api/location/emergency` - Emergency location tracking
- `GET /api/location/nearby` - Find nearby activities

## 5. Usage Examples

### Track User Location
```javascript
const response = await fetch('/api/location/track', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    lat: 28.6139,
    lng: 77.2090,
    activityType: 'checkin',
    description: 'Safety check-in at location'
  })
});
```

### Emergency Location
```javascript
const response = await fetch('/api/location/emergency', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    lat: 28.6139,
    lng: 77.2090,
    emergencyType: 'medical',
    description: 'Medical emergency reported'
  })
});
```

## 6. Security Best Practices

### API Key Security
- ✅ Use environment variables
- ✅ Restrict API key to specific domains
- ✅ Enable only required APIs
- ✅ Monitor API usage

### Location Privacy
- ✅ Get user consent before tracking
- ✅ Allow users to disable location
- ✅ Encrypt location data in transit
- ✅ Implement data retention policies

## 7. Troubleshooting

### Common Issues

**Maps not loading:**
- Check API key is correct
- Verify domain restrictions
- Ensure Maps JavaScript API is enabled

**Location not tracking:**
- Check browser location permissions
- Verify HTTPS for production
- Test with different browsers

**API errors:**
- Check quota limits in Google Cloud Console
- Verify billing is enabled
- Review API restrictions

### Debug Mode
Enable debug logging:
```javascript
// Add to ActivityFeed.jsx
console.log('Google Maps loaded:', !!window.google);
console.log('Location permissions:', navigator.permissions);
```

## 8. Production Deployment

### Environment Setup
1. Update API key restrictions for production domain
2. Set production environment variables
3. Enable HTTPS for location services
4. Configure CDN for map tiles (optional)

### Monitoring
- Set up Google Cloud monitoring
- Track API usage and costs
- Monitor location tracking accuracy
- Set up alerts for API errors

## 9. Cost Optimization

### Free Tier Limits
- Maps JavaScript API: $200 credit/month
- Places API: Limited requests
- Geocoding API: Limited requests

### Optimization Tips
- Cache map tiles when possible
- Batch geocoding requests
- Use appropriate zoom levels
- Implement request throttling

## Support
For issues with Google Maps integration, check:
1. Google Cloud Console logs
2. Browser developer console
3. Network requests in DevTools
4. SafeTourAI server logs

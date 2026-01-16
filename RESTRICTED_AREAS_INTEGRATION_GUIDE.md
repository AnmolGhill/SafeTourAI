# Restricted Areas Geofencing System - Integration Guide

## Overview
Complete restricted areas management system with real-time geofencing for SafeTourAI. Admins can create polygon and circle restricted areas, and users receive real-time alerts when entering/exiting these zones.

---

## 📁 Files Created

### 1. **Firestore Service** (`client/src/services/restrictedAreasService.js`)
Core service for Firestore operations on restricted areas.

**Key Functions:**
- `saveRestrictedArea(areaData)` - Save new restricted area
- `getAllRestrictedAreas()` - Fetch all areas
- `getActiveRestrictedAreas()` - Fetch only active areas
- `listenToRestrictedAreas(callback)` - Real-time listener for all areas
- `listenToActiveRestrictedAreas(callback)` - Real-time listener for active areas
- `deleteRestrictedArea(areaId)` - Delete an area
- `updateRestrictedArea(areaId, updateData)` - Update area properties
- `toggleRestrictedAreaStatus(areaId, active)` - Toggle active status

**Firestore Collection Structure:**
```javascript
restrictedAreas: {
  name: string,
  type: "polygon" | "circle",
  polygon: [{lat, lng}, ...],  // For polygons
  center: {lat, lng},           // For circles
  radius: number,               // In meters
  active: boolean,
  description: string,
  riskLevel: "low" | "medium" | "high",
  createdAt: serverTimestamp()
}
```

---

### 2. **Geofencing Service** (`client/src/services/geofencingService.js`)
Utility service for geofencing calculations and location tracking.

**Key Functions:**
- `isPointInPolygon(point, polygon)` - Ray casting algorithm for polygon detection
- `calculateDistance(point1, point2)` - Haversine formula for distance
- `isPointInCircle(point, center, radius)` - Circle containment check
- `checkRestrictedAreas(userLocation, restrictedAreas)` - Check all areas
- `startGeofencingWatch(onLocationUpdate, options)` - Continuous location tracking
- `stopGeofencingWatch(watchId)` - Stop tracking
- `getCurrentLocation(options)` - Get single location

---

### 3. **Geofencing Integration** (`client/src/utils/geofencingIntegration.js`)
Google Maps integration module for real-time geofencing visualization.

**Key Functions:**
- `initGeofencing(map, restrictedAreas, options)` - Initialize geofencing on map
- `updateRestrictedAreas(restrictedAreas)` - Update areas in real-time
- `cleanupGeofencing()` - Cleanup and stop tracking
- `getGeofencingState()` - Debug state information

**Features:**
- Renders polygons and circles on Google Maps
- Real-time location tracking
- Enter/exit notifications
- Visual feedback with toast notifications
- Click-to-view area information

---

### 4. **Admin Component** (`client/src/dashboard/dashboard-main-admin/RestrictedAreasManager.jsx`)
Complete admin interface for creating and managing restricted areas.

**Features:**
- Google Maps with Drawing Manager
- Draw Polygon tool
- Draw Circle tool
- Modal form for area details:
  - Area Name (required)
  - Description (optional)
  - Risk Level (low/medium/high)
- Real-time area list with visibility toggle
- Delete functionality
- Visual area indicators on map

**UI Controls:**
- Draw Polygon button
- Draw Circle button
- Refresh button
- Area list with visibility toggles
- Delete buttons

---

### 5. **Firebase Config Update** (`client/src/config/firebase.js`)
Updated to include Firestore initialization.

```javascript
import { getFirestore } from 'firebase/firestore';
export const db = getFirestore(app);
```

---

### 6. **Admin Dashboard Integration** (`client/src/dashboard/dashboard-main-admin/AdminDashboard.jsx`)
- Added `RestrictedAreasManager` import
- Added case for 'restricted-areas' tab in `renderContent()`

---

### 7. **Admin Sidebar Update** (`client/src/dashboard/dashboard-main-admin/AdminSidebar.jsx`)
- Added `FiMapPin` icon import
- Added menu item: `{ id: 'restricted-areas', label: 'Restricted Areas', icon: FiMapPin, useTab: true }`

---

### 8. **User Map Integration** (`client/src/dashboard/dashboard-user/EnhancedSafetyMap.jsx`)
Enhanced with geofencing capabilities.

**New Imports:**
```javascript
import { restrictedAreasService } from '../../services/restrictedAreasService';
import { initGeofencing, cleanupGeofencing, updateRestrictedAreas } from '../../utils/geofencingIntegration';
```

**New State:**
- `restrictedAreas` - Array of restricted areas
- `showRestrictedAreas` - Toggle visibility
- `geofencingCleanupRef` - Cleanup function reference
- `unsubscribeRestrictedAreasRef` - Unsubscribe function reference

**New Effects:**
1. Load and listen to restricted areas from Firestore
2. Initialize geofencing when areas change
3. Handle real-time updates

**New UI:**
- "Restricted" toggle button in controls (orange when active)
- Restricted areas rendered on map with red overlay
- Click areas to view details

---

## 🚀 Usage Guide

### For Admins - Creating Restricted Areas

1. **Navigate to Admin Dashboard**
   - Click "Restricted Areas" in sidebar
   - Or go to Admin Dashboard → Restricted Areas tab

2. **Create a Polygon Area**
   - Click "Draw Polygon" button
   - Click on map to add vertices
   - Double-click to complete polygon
   - Modal appears asking for:
     - Area Name (required)
     - Description (optional)
     - Risk Level
   - Click "Save Area"

3. **Create a Circle Area**
   - Click "Draw Circle" button
   - Click center point on map
   - Drag to set radius
   - Modal appears with same fields
   - Click "Save Area"

4. **Manage Areas**
   - View all created areas in list below map
   - Toggle visibility with eye icon
   - Delete with trash icon
   - Areas automatically sync across all users

---

### For Users - Real-time Geofencing

1. **View Restricted Areas**
   - Open user dashboard map
   - Click "Restricted" button to toggle visibility
   - Red areas appear on map

2. **Receive Alerts**
   - When entering a restricted area:
     - Red notification appears (top-right)
     - Shows area name and description
     - Auto-dismisses after 5 seconds
   - When exiting:
     - Green notification appears
     - Auto-dismisses after 3 seconds

3. **View Area Details**
   - Click on any restricted area on map
   - Info window shows:
     - Area name
     - Description
     - Type (Polygon/Circle)
     - Risk level
     - Radius (for circles)

---

## 🔧 Configuration

### Firebase Setup Required
Ensure your Firebase project has:
1. Firestore Database enabled
2. Collection: `restrictedAreas`
3. Environment variables configured:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

### Geolocation Permissions
Users must grant location permission for geofencing to work:
- Browser will prompt on first use
- Required for real-time tracking
- Uses high accuracy mode

---

## 📊 Data Flow

### Admin Creates Area
```
Admin draws shape → Modal for details → Save to Firestore
                                            ↓
                                    Real-time listener
                                            ↓
                                    All users' maps update
```

### User Location Tracking
```
User enables map → Geofencing initializes → watchPosition starts
                                                    ↓
                                            Check against areas
                                                    ↓
                                    Enter/Exit callbacks trigger
                                                    ↓
                                            Notifications shown
```

---

## 🎨 Styling

### Colors Used
- **Restricted Areas**: Red (#FF0000)
- **Polygon Fill**: Red with 15% opacity
- **Circle Fill**: Red with 15% opacity
- **Risk Levels**:
  - High: #ef4444 (red)
  - Medium: #f97316 (orange)
  - Low: #22c55e (green)

### Notifications
- **Enter Area**: Red background, white text
- **Exit Area**: Green background, white text
- Position: Top-right corner
- Auto-dismiss: 5s (enter), 3s (exit)

---

## 🔐 Security Considerations

### Firestore Rules (Recommended)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admins can read/write restricted areas
    match /restrictedAreas/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
    }
  }
}
```

### Client-Side Validation
- Area name required
- Valid coordinates checked
- Radius validated (positive number)

---

## 🐛 Debugging

### Check Geofencing State
```javascript
import { getGeofencingState } from '../../utils/geofencingIntegration';

console.log(getGeofencingState());
// Output: {
//   isActive: boolean,
//   userLocation: {lat, lng},
//   userInAreas: [areaId, ...],
//   restrictedAreasCount: number
// }
```

### Console Logs
- Firestore operations: ✅ or ❌ prefix
- Geofencing events: ⚠️ (enter), ✓ (exit)
- Location updates: Logged to console
- Errors: ❌ prefix with details

---

## 📱 Browser Compatibility

**Required APIs:**
- Geolocation API (all modern browsers)
- Google Maps API v3
- Firebase SDK v10+
- ES6+ JavaScript

**Tested On:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 🚨 Known Limitations

1. **Geolocation Accuracy**: Depends on device GPS/network
2. **Battery Usage**: Continuous location tracking uses battery
3. **Polygon Complexity**: Very large polygons may impact performance
4. **Real-time Sync**: Slight delay in Firestore updates (typically <1s)

---

## 📝 Future Enhancements

- [ ] Geofence history/audit logs
- [ ] Custom notification sounds
- [ ] Area-specific rules/restrictions
- [ ] Bulk import/export areas
- [ ] Heat map visualization
- [ ] Mobile app integration
- [ ] SMS/Email alerts
- [ ] Area analytics dashboard

---

## 🆘 Troubleshooting

### Restricted areas not showing
- Check Firestore collection exists
- Verify Firebase config is correct
- Check browser console for errors
- Ensure user has location permission

### Geofencing not working
- Grant location permission
- Check browser supports Geolocation API
- Verify GPS/network connectivity
- Check console for watchPosition errors

### Drawing not working
- Ensure Google Maps API loaded
- Check Drawing Manager initialized
- Verify map container has height
- Check browser console for errors

### Real-time updates not syncing
- Check Firestore connection
- Verify listener is active
- Check network connectivity
- Review Firestore rules

---

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Review Firestore logs
3. Verify Firebase configuration
4. Check geolocation permissions
5. Test with sample data

---

**Last Updated:** December 9, 2025
**Version:** 1.0.0
**Status:** Production Ready

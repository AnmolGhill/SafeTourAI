# SOS Button Integration with Police Dashboard

## Overview
Integrated the red "Trigger Emergency SOS" button from the User Dashboard with the Police Dashboard. When users click the SOS button, the police receives an alert with full user profile information, similar to voice alerts.

## Features Implemented

### 1. Frontend Changes

#### QuickActions.jsx (User Dashboard)
**Location**: `client/src/dashboard/dashboard-user/QuickActions.jsx`

**Changes**:
- Added `getCurrentUserDetails()` function to fetch user profile from `/api/user/profile`
- Updated `handleEmergencySOS()` to:
  - Get current location using Geolocation API
  - Fetch user profile details
  - Send SOS alert to backend with location and user details
  - Show success/error toast notifications
  - Handle location errors gracefully

**API Call**:
```javascript
POST /api/emergency/sos-alert
Headers: Authorization: Bearer {token}
Body: {
  location: { latitude, longitude, accuracy },
  userDetails: {...},
  timestamp: ISO8601
}
```

#### VoiceEmergencyAlerts.jsx (Police Dashboard)
**Location**: `client/src/dashboard/dashboard-sub-admin/VoiceEmergencyAlerts.jsx`

**Changes**:
- Added `alertType` state to filter between voice and SOS alerts
- Updated `fetchVoiceAlerts()` to fetch both voice and SOS alerts:
  - Calls `/api/emergency/voice-alerts` for voice alerts
  - Calls `/api/emergency/sos-alerts` for SOS alerts
  - Combines and sorts by timestamp
  - Marks each alert with `alertType: 'voice'` or `alertType: 'sos'`

- Updated `handleResolveAlert()` to support both alert types:
  - Determines endpoint based on alert type
  - Calls `/api/emergency/voice-alerts/:id/resolve` or `/api/emergency/sos-alerts/:id/resolve`

- Updated `handleTerminateAlert()` to support both alert types:
  - Determines endpoint based on alert type
  - Calls `/api/emergency/voice-alerts/:id/terminate` or `/api/emergency/sos-alerts/:id/terminate`

- Added helper functions:
  - `getAlertTypeLabel(type)`: Returns "Voice Alert" or "SOS Button"
  - `getAlertTypeIcon(type)`: Returns appropriate icon
  - `getAlertTypeColor(type)`: Returns color styling

- Updated `getFilteredAlerts()` to filter by both alert type and status

- **UI Enhancements**:
  - Added "Alert Type" filter tabs (All Types, Voice Alerts, SOS Button)
  - Added alert type badge to each alert (orange for SOS, purple for voice)
  - Updated header to mention both voice and SOS alerts
  - Conditional rendering of trigger word (only for voice alerts)
  - Status filter tabs now count based on alert type filter

### 2. Backend Changes

#### emergency.js (API Routes)
**Location**: `server/routes/emergency.js`

**New Data Structure**:
- Added `sosAlerts` Map to store SOS alerts

**New Endpoints**:

##### POST /api/emergency/sos-alert
Creates a new SOS alert from the quick actions button.

**Request**:
```json
{
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "accuracy": 10
  },
  "userDetails": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-0123",
    "age": 28,
    "gender": "Male",
    "nationality": "American",
    "address": "123 Main St",
    "bloodGroup": "O+",
    "allergies": "Penicillin",
    "medicalConditions": "Asthma",
    "emergencyContacts": [...]
  },
  "timestamp": "2025-12-07T21:53:00.000Z"
}
```

**Response**:
```json
{
  "success": true,
  "message": "SOS alert created and police notified",
  "alert": {
    "id": "SOS_1733603580000_user123",
    "type": "sos_trigger",
    "status": "active",
    "timestamp": "2025-12-07T21:53:00.000Z",
    "location": {...},
    "userDetails": {...}
  }
}
```

##### GET /api/emergency/sos-alerts
Retrieves all SOS alerts for the police dashboard.

**Response**:
```json
{
  "success": true,
  "alerts": [
    {
      "id": "SOS_...",
      "userId": "user123",
      "type": "sos_trigger",
      "status": "active",
      "timestamp": "2025-12-07T21:53:00.000Z",
      "location": {...},
      "userDetails": {...}
    }
  ]
}
```

##### GET /api/emergency/sos-alerts/:id/details
Retrieves full details of an SOS alert with complete user profile from Firebase.

**Response**:
```json
{
  "success": true,
  "alert": {
    "id": "SOS_...",
    "userId": "user123",
    "type": "sos_trigger",
    "status": "active",
    "timestamp": "2025-12-07T21:53:00.000Z",
    "location": {...},
    "userDetails": {...},
    "userProfile": {
      "uid": "user123",
      "email": "john@example.com",
      "name": "John Doe",
      "phone": "+1-555-0123",
      "age": 28,
      "gender": "Male",
      "nationality": "American",
      "address": "123 Main St",
      "bloodGroup": "O+",
      "allergies": "Penicillin",
      "medicalConditions": "Asthma",
      "emergencyContacts": [...]
    }
  }
}
```

##### PUT /api/emergency/sos-alerts/:id/resolve
Marks an SOS alert as resolved.

**Request**:
```json
{
  "status": "resolved"
}
```

**Response**:
```json
{
  "success": true,
  "message": "SOS alert status updated",
  "alertId": "SOS_...",
  "newStatus": "resolved"
}
```

##### PUT /api/emergency/sos-alerts/:id/terminate
Terminates an SOS alert with optional police notes.

**Request**:
```json
{
  "policeNotes": "False alarm - user testing system"
}
```

**Response**:
```json
{
  "success": true,
  "message": "SOS alert terminated successfully",
  "alertId": "SOS_...",
  "status": "terminated"
}
```

## Data Flow

### User Triggers SOS Button
```
1. User clicks red "Trigger Emergency SOS" button
2. System gets current location via Geolocation API
3. System fetches user profile from /api/user/profile
4. System sends POST to /api/emergency/sos-alert with:
   - Location (latitude, longitude, accuracy)
   - User details (name, email, phone, medical info, etc.)
   - Timestamp
5. Backend stores alert in sosAlerts Map
6. User sees success toast: "🚨 Emergency SOS triggered!"
```

### Police Receives Alert
```
1. Police dashboard fetches alerts from:
   - /api/emergency/voice-alerts (voice alerts)
   - /api/emergency/sos-alerts (SOS alerts)
2. Alerts displayed in unified list with:
   - Status badge (Active/Resolved/Terminated)
   - Alert type badge (Voice Alert/SOS Button)
   - User name, phone, email
   - Location with Google Maps link
   - Timestamp
3. Police can filter by:
   - Alert type (All, Voice, SOS)
   - Status (All, Active, Resolved, Terminated)
```

### Police Reviews Alert
```
1. Police clicks "Details" button
2. System fetches full user profile from Firebase
3. Modal displays:
   - Personal information
   - Medical information
   - Emergency contacts
   - Location on map
4. Police can add optional notes
5. Police clicks "Confirm & Terminate"
6. Alert status changes to "terminated"
7. Alert removed from active list
```

## Alert Status Lifecycle

```
User Clicks SOS Button
        ↓
Alert Created (Status: active)
        ↓
Alert Appears in Police Dashboard
        ↓
Police Reviews User Profile
        ↓
Police Takes Action:
  ├─ Mark as Resolved (Status: resolved)
  └─ Confirm & Terminate (Status: terminated)
        ↓
Alert Cleared from System
```

## UI Components

### User Dashboard (QuickActions)
- Red "Trigger Emergency SOS" button with pulse animation
- Sends location + user profile to police
- Shows success/error notifications

### Police Dashboard (VoiceEmergencyAlerts)
- **Header**: "Emergency Alerts" (covers both voice and SOS)
- **Alert Type Filter Tabs**:
  - All Types (shows all alerts)
  - Voice Alerts (shows only voice alerts)
  - SOS Button (shows only SOS alerts)
- **Status Filter Tabs**:
  - All Status
  - Active (red badge)
  - Resolved (green badge)
  - Terminated (blue badge)
- **Alert List Items**:
  - Status badge (red/green/blue)
  - Alert type badge (orange for SOS, purple for voice)
  - Trigger word (only for voice alerts)
  - User name, phone, email
  - Location with Google Maps button
  - Timestamp
  - Action buttons (Details, Resolve, Confirm & Terminate)
- **Detail Modal**:
  - Full user profile display
  - Medical information
  - Emergency contacts
  - Location map
  - Police notes textarea
  - Action buttons

## Key Differences: Voice vs SOS Alerts

| Feature | Voice Alert | SOS Button |
|---------|------------|-----------|
| Trigger | Voice keyword (help, emergency, sos) | Red button click |
| Alert Type | voice | sos |
| Trigger Word | Yes | No |
| Location | Captured automatically | Captured automatically |
| User Profile | Sent with alert | Sent with alert |
| Badge Color | Purple | Orange |
| Icon | Microphone | Alert Circle |

## API Endpoints Summary

### Voice Alerts (Existing)
- `POST /api/emergency/voice-alert` - Create voice alert
- `GET /api/emergency/voice-alerts` - Get all voice alerts
- `GET /api/emergency/voice-alerts/:id/details` - Get voice alert details
- `PUT /api/emergency/voice-alerts/:id/resolve` - Resolve voice alert
- `PUT /api/emergency/voice-alerts/:id/terminate` - Terminate voice alert

### SOS Alerts (New)
- `POST /api/emergency/sos-alert` - Create SOS alert
- `GET /api/emergency/sos-alerts` - Get all SOS alerts
- `GET /api/emergency/sos-alerts/:id/details` - Get SOS alert details
- `PUT /api/emergency/sos-alerts/:id/resolve` - Resolve SOS alert
- `PUT /api/emergency/sos-alerts/:id/terminate` - Terminate SOS alert

## Testing Checklist

### User Side
- [ ] Click red "Trigger Emergency SOS" button
- [ ] Allow location permission
- [ ] See success toast notification
- [ ] Verify location is captured
- [ ] Verify user profile is sent

### Police Side
- [ ] SOS alert appears in dashboard
- [ ] Alert type shows "SOS Button" badge
- [ ] Status shows "Active" badge
- [ ] User information displays correctly
- [ ] Click "Details" to view full profile
- [ ] Medical information displays
- [ ] Emergency contacts display
- [ ] Can add police notes
- [ ] Click "Confirm & Terminate"
- [ ] Alert status changes to "Terminated"
- [ ] Alert moves to "Terminated" filter tab
- [ ] Can filter by "SOS Button" alert type
- [ ] Can filter by status

### Combined Testing
- [ ] Create both voice and SOS alerts
- [ ] Both appear in "All Types" filter
- [ ] Voice alerts only in "Voice Alerts" filter
- [ ] SOS alerts only in "SOS Button" filter
- [ ] Status filters work for both types
- [ ] Termination works for both types

## Security Considerations

✓ All endpoints require Firebase authentication
✓ Police dashboard access restricted to authorized personnel
✓ User profile data only accessible through authenticated API calls
✓ Termination records include police officer ID for audit trail
✓ Police notes stored for incident documentation
✓ Location data properly protected

## Future Enhancements

1. **Real-time Updates**: WebSocket for live alert updates
2. **Audit Trail**: Store all police actions with timestamps
3. **Bulk Operations**: Manage multiple alerts at once
4. **Alert Escalation**: Automatic escalation if not resolved within time limit
5. **User Notifications**: Send SMS/Email when alert terminated
6. **Analytics**: Track SOS vs voice alert patterns
7. **Integration**: Direct dispatch to nearby responders
8. **Customization**: Allow users to set custom SOS trigger phrases

## Files Modified

1. **client/src/dashboard/dashboard-user/QuickActions.jsx**
   - Added user profile fetching
   - Updated SOS handler to send to backend
   - Added toast notifications

2. **client/src/dashboard/dashboard-sub-admin/VoiceEmergencyAlerts.jsx**
   - Added SOS alert fetching
   - Added alert type filtering
   - Added alert type badges
   - Updated handlers for both alert types
   - Enhanced UI with type filters

3. **server/routes/emergency.js**
   - Added sosAlerts Map
   - Added 5 new SOS endpoints
   - Implemented full SOS alert lifecycle

## Deployment Notes

1. Ensure Firebase collections are properly configured
2. Update police dashboard access permissions
3. Test with sample SOS alerts before production
4. Monitor API response times
5. Set up logging for SOS events
6. Configure email notifications (optional)

---

**Implementation Date**: December 7, 2025
**Status**: Complete and Ready for Testing

# Voice Alert System - Testing Checklist

## Pre-Testing Setup

- [ ] Ensure backend server is running
- [ ] Ensure frontend development server is running
- [ ] Verify Firebase is connected and accessible
- [ ] Check that user has valid authentication token
- [ ] Verify police user has appropriate permissions

---

## Backend API Testing

### 1. GET /api/emergency/voice-alerts (List All Alerts)

**Test Steps:**
1. Call endpoint with valid auth token
2. Verify response contains array of alerts
3. Check each alert has: id, userId, triggerWord, status, timestamp, location, userDetails

**Expected Result:**
```json
{
  "success": true,
  "alerts": [
    {
      "id": "VOICE_...",
      "userId": "user123",
      "triggerWord": "help",
      "status": "active",
      "timestamp": "2025-12-05T...",
      "location": {...},
      "userDetails": {...}
    }
  ]
}
```

- [ ] Returns 200 status code
- [ ] Response contains alerts array
- [ ] Each alert has required fields
- [ ] Alerts sorted by timestamp (newest first)

### 2. GET /api/emergency/voice-alerts/:id/details (Get Alert with Profile)

**Test Steps:**
1. Get a valid alert ID from list
2. Call endpoint with that ID
3. Verify full user profile is returned

**Expected Result:**
```json
{
  "success": true,
  "alert": {
    "id": "VOICE_...",
    "userId": "user123",
    "triggerWord": "help",
    "status": "active",
    "timestamp": "2025-12-05T...",
    "location": {...},
    "userDetails": {...},
    "userProfile": {
      "uid": "user123",
      "email": "user@example.com",
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

- [ ] Returns 200 status code
- [ ] userProfile contains all fields
- [ ] Medical information is present
- [ ] Emergency contacts are included
- [ ] Falls back to userDetails if profile not found

### 3. PUT /api/emergency/voice-alerts/:id/resolve (Mark as Resolved)

**Test Steps:**
1. Get a valid active alert ID
2. Call endpoint with status: 'resolved'
3. Verify alert status updated

**Expected Result:**
```json
{
  "success": true,
  "message": "Voice alert status updated",
  "alertId": "VOICE_...",
  "newStatus": "resolved"
}
```

- [ ] Returns 200 status code
- [ ] Alert status changes to 'resolved'
- [ ] Both emergencyAlerts and voiceEmergencyHistory updated
- [ ] Timestamp recorded

### 4. PUT /api/emergency/voice-alerts/:id/terminate (Terminate Alert)

**Test Steps:**
1. Get a valid active alert ID
2. Call endpoint with optional policeNotes
3. Verify alert status changed to 'terminated'

**Test Data:**
```json
{
  "policeNotes": "False alarm - user testing system"
}
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Voice alert terminated successfully",
  "alertId": "VOICE_...",
  "status": "terminated"
}
```

- [ ] Returns 200 status code
- [ ] Alert status changes to 'terminated'
- [ ] terminatedAt timestamp recorded
- [ ] policeNotes saved
- [ ] terminatedBy (police officer ID) recorded
- [ ] Both data structures updated

---

## Frontend UI Testing

### 1. Dashboard Load

- [ ] Page loads without errors
- [ ] All alerts display in list
- [ ] Filter tabs visible (All, Active, Resolved, Terminated)
- [ ] Refresh button works
- [ ] Loading state displays while fetching

### 2. Filter Tabs

**Test Each Tab:**

**All Alerts Tab:**
- [ ] Shows all alerts regardless of status
- [ ] Count matches total alerts
- [ ] Tab is highlighted when selected

**Active Tab:**
- [ ] Shows only active alerts
- [ ] Count matches number of active alerts
- [ ] Red badge displays for each alert

**Resolved Tab:**
- [ ] Shows only resolved alerts
- [ ] Count matches number of resolved alerts
- [ ] Green badge displays for each alert

**Terminated Tab:**
- [ ] Shows only terminated alerts
- [ ] Count matches number of terminated alerts
- [ ] Blue badge displays for each alert

### 3. Alert List Item Display

For each alert, verify:
- [ ] Status badge displays correctly (red/green/blue)
- [ ] Trigger word shown
- [ ] Timestamp displays
- [ ] User name shown
- [ ] Phone number shown
- [ ] Email shown
- [ ] Location button present
- [ ] Medical alert box shows (if applicable)
- [ ] Action buttons visible

### 4. Action Buttons

**Details Button:**
- [ ] Present on all alerts
- [ ] Opens detail modal when clicked
- [ ] Modal displays full user profile

**Resolve Button (Active Alerts Only):**
- [ ] Only shows for active alerts
- [ ] Green color
- [ ] Updates alert status to 'resolved'
- [ ] Removes from active list

**Confirm & Terminate Button (Active Alerts Only):**
- [ ] Only shows for active alerts
- [ ] Purple color
- [ ] Opens detail modal
- [ ] Enables termination flow

### 5. Detail Modal

**Modal Header:**
- [ ] Shows "Emergency Alert Details"
- [ ] Shows alert ID
- [ ] Close button present

**Alert Status Section:**
- [ ] Status badge displays
- [ ] Trigger word shown
- [ ] Timestamp shown
- [ ] Location accuracy shown

**User Information Section:**
- [ ] Full name displayed
- [ ] Age displayed
- [ ] Gender displayed
- [ ] Nationality displayed
- [ ] Contact info (phone, email) displayed
- [ ] Address displayed

**Medical Information Section:**
- [ ] Blood group displayed with red background
- [ ] Allergies displayed with yellow background
- [ ] Medical conditions displayed with orange background

**Emergency Contacts Section:**
- [ ] Shows all emergency contacts
- [ ] Contact name displayed
- [ ] Relationship displayed
- [ ] Phone number displayed

**Location Section:**
- [ ] Coordinates displayed
- [ ] "Open in Google Maps" button present
- [ ] Button opens map in new tab

### 6. Police Termination Section (Active Alerts Only)

- [ ] Section visible only for active alerts
- [ ] Purple background
- [ ] Title: "Police Confirmation & Termination"
- [ ] Police Notes textarea present
- [ ] Placeholder text visible
- [ ] Can type in textarea
- [ ] Information message displays
- [ ] Message explains termination effect

### 7. Modal Action Buttons

**For Active Alerts:**
- [ ] "Mark as Resolved" button present (green)
- [ ] "Confirm & Terminate" button present (purple)
- [ ] "Close" button present (gray)

**For Resolved/Terminated Alerts:**
- [ ] Only "Close" button visible
- [ ] No action buttons shown

**Mark as Resolved Button:**
- [ ] Updates alert status to 'resolved'
- [ ] Closes modal
- [ ] Shows success toast
- [ ] Alert moves to "Resolved" filter

**Confirm & Terminate Button:**
- [ ] Sends termination request with notes
- [ ] Shows loading state (spinner + "Terminating...")
- [ ] Disables button during request
- [ ] Shows success toast on completion
- [ ] Closes modal
- [ ] Alert moves to "Terminated" filter
- [ ] Police notes cleared

**Close Button:**
- [ ] Closes modal without changes
- [ ] Returns to alert list

---

## End-to-End Testing

### Scenario 1: Create and Terminate Alert

**Steps:**
1. User triggers voice keyword in User Dashboard
2. Alert appears in police dashboard
3. Police clicks "Details"
4. Police reviews full user profile
5. Police adds notes: "Resolved on scene"
6. Police clicks "Confirm & Terminate"
7. Alert moves to "Terminated" filter

**Verification:**
- [ ] Alert appears in Active filter
- [ ] Full profile displays in modal
- [ ] Notes textarea accepts input
- [ ] Terminate button works
- [ ] Alert moves to Terminated filter
- [ ] Success message shows
- [ ] Modal closes

### Scenario 2: Multiple Alerts Management

**Steps:**
1. Create 3 voice alerts
2. Resolve 1 alert
3. Terminate 1 alert
4. Leave 1 active

**Verification:**
- [ ] All tab shows 3 alerts
- [ ] Active tab shows 1 alert
- [ ] Resolved tab shows 1 alert
- [ ] Terminated tab shows 1 alert
- [ ] Counts update correctly

### Scenario 3: Profile Data Accuracy

**Steps:**
1. Create alert with complete user profile
2. Open detail modal
3. Verify all fields match user data

**Verification:**
- [ ] Name matches
- [ ] Email matches
- [ ] Phone matches
- [ ] Medical info matches
- [ ] Emergency contacts match
- [ ] Location matches

### Scenario 4: Error Handling

**Test Cases:**

**Invalid Alert ID:**
- [ ] Shows error message
- [ ] Doesn't crash app

**Network Error:**
- [ ] Shows error toast
- [ ] Allows retry

**Missing Profile Data:**
- [ ] Falls back to userDetails
- [ ] Shows available data
- [ ] Doesn't crash

**Unauthorized Access:**
- [ ] Shows permission error
- [ ] Redirects to login (if needed)

---

## Performance Testing

- [ ] Dashboard loads in < 2 seconds
- [ ] Detail modal opens in < 1 second
- [ ] Terminate request completes in < 3 seconds
- [ ] Filter tabs respond instantly
- [ ] No memory leaks on repeated opens/closes
- [ ] Handles 100+ alerts without lag

---

## Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Tab order is logical
- [ ] Buttons have proper focus states
- [ ] Color contrast meets WCAG standards
- [ ] Screen reader compatible
- [ ] Labels associated with inputs

---

## Security Testing

- [ ] Authentication required for all endpoints
- [ ] Invalid tokens rejected
- [ ] Expired tokens handled
- [ ] Police notes don't expose sensitive data
- [ ] User profile data properly protected
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities

---

## Data Validation Testing

**Police Notes:**
- [ ] Accepts empty string
- [ ] Accepts special characters
- [ ] Accepts long text (1000+ chars)
- [ ] Properly escaped in database

**Alert Status:**
- [ ] Only valid statuses accepted
- [ ] Invalid status rejected
- [ ] Status transitions valid

**Timestamps:**
- [ ] Recorded correctly
- [ ] Timezone handled properly
- [ ] Formatted correctly in UI

---

## Regression Testing

- [ ] Existing alert features still work
- [ ] User dashboard not affected
- [ ] Other police dashboard features work
- [ ] No breaking changes to API
- [ ] Database migrations successful

---

## Documentation Verification

- [ ] README updated
- [ ] API documentation complete
- [ ] Code comments clear
- [ ] Error messages helpful
- [ ] User guide accurate

---

## Sign-Off

| Item | Status | Notes |
|------|--------|-------|
| Backend Testing | ☐ Pass ☐ Fail | |
| Frontend UI Testing | ☐ Pass ☐ Fail | |
| End-to-End Testing | ☐ Pass ☐ Fail | |
| Performance Testing | ☐ Pass ☐ Fail | |
| Security Testing | ☐ Pass ☐ Fail | |
| Regression Testing | ☐ Pass ☐ Fail | |

**Overall Status:** ☐ Ready for Production ☐ Needs Fixes

**Tested By:** _________________ **Date:** _________________

**Approved By:** _________________ **Date:** _________________

---

## Known Issues (If Any)

1. Issue: [Description]
   - Workaround: [Solution]
   - Priority: [High/Medium/Low]
   - Status: [Open/In Progress/Resolved]

---

## Notes

[Space for additional testing notes and observations]

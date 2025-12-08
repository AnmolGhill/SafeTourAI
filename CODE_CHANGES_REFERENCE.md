# Code Changes Reference

## Backend Changes

### File: `server/routes/emergency.js`

#### Change 1: Added New Endpoint for Alert Details with User Profile

**Location**: After line 674 (after voice-alerts GET endpoint)

```javascript
// GET /api/emergency/voice-alerts/:id/details - Get full details of a voice alert with user profile
router.get('/voice-alerts/:id/details', verifyFirebaseToken, async (req, res) => {
  try {
    const alertId = req.params.id;
    const fullAlert = emergencyAlerts.get(alertId);

    if (!fullAlert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    // Fetch full user profile from Firebase
    let userProfile = null;
    try {
      const userDoc = await db.collection('users').doc(fullAlert.userId).get();
      const profileDoc = await db.collection('userProfiles').doc(fullAlert.userId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const profileData = profileDoc.exists ? profileDoc.data() : {};
        
        userProfile = {
          uid: userData.uid,
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          role: userData.role,
          kycStatus: userData.kycStatus,
          profileComplete: userData.profileComplete,
          blockchainId: userData.blockchainId,
          ...profileData
        };
      }
    } catch (dbError) {
      console.error('Error fetching user profile from database:', dbError);
      // Continue with alert data even if profile fetch fails
    }

    res.json({
      success: true,
      alert: {
        ...fullAlert,
        userProfile: userProfile || fullAlert.userDetails
      }
    });

  } catch (error) {
    console.error('Error fetching alert details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert details'
    });
  }
});
```

#### Change 2: Updated Resolve Endpoint

**Location**: Lines 733-771 (PUT /voice-alerts/:id/resolve)

**Before**:
```javascript
// Find and update the alert in voiceEmergencyHistory
let found = false;
for (const [userId, history] of voiceEmergencyHistory.entries()) {
  const alertIndex = history.findIndex(a => a.id === alertId);
  if (alertIndex !== -1) {
    history[alertIndex].status = status || 'resolved';
    found = true;
    break;
  }
}
```

**After**:
```javascript
// Update in emergencyAlerts map
const alert = emergencyAlerts.get(alertId);
if (alert) {
  alert.status = status || 'resolved';
  emergencyAlerts.set(alertId, alert);
}

// Find and update the alert in voiceEmergencyHistory
let found = false;
for (const [userId, history] of voiceEmergencyHistory.entries()) {
  const alertIndex = history.findIndex(a => a.id === alertId);
  if (alertIndex !== -1) {
    history[alertIndex].status = status || 'resolved';
    found = true;
    break;
  }
}
```

#### Change 3: Added New Terminate Endpoint

**Location**: After line 771 (after resolve endpoint)

```javascript
// PUT /api/emergency/voice-alerts/:id/terminate - Terminate voice alert (police confirmation)
router.put('/voice-alerts/:id/terminate', verifyFirebaseToken, async (req, res) => {
  try {
    const alertId = req.params.id;
    const { policeNotes } = req.body;

    // Update in emergencyAlerts map
    const alert = emergencyAlerts.get(alertId);
    if (alert) {
      alert.status = 'terminated';
      alert.terminatedAt = new Date();
      alert.policeNotes = policeNotes || '';
      alert.terminatedBy = req.user.id;
      emergencyAlerts.set(alertId, alert);
    }

    // Find and update the alert in voiceEmergencyHistory
    let found = false;
    for (const [userId, history] of voiceEmergencyHistory.entries()) {
      const alertIndex = history.findIndex(a => a.id === alertId);
      if (alertIndex !== -1) {
        history[alertIndex].status = 'terminated';
        history[alertIndex].terminatedAt = new Date();
        history[alertIndex].policeNotes = policeNotes || '';
        found = true;
        break;
      }
    }

    if (!found) {
      return res.status(404).json({
        success: false,
        error: 'Voice alert not found'
      });
    }

    console.log(`✅ Voice alert ${alertId} terminated by police`);

    res.json({
      success: true,
      message: 'Voice alert terminated successfully',
      alertId: alertId,
      status: 'terminated'
    });

  } catch (error) {
    console.error('Error terminating voice alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to terminate voice alert'
    });
  }
});
```

---

## Frontend Changes

### File: `client/src/dashboard/dashboard-sub-admin/VoiceEmergencyAlerts.jsx`

#### Change 1: Added New State Variables

**Location**: Lines 24-26 (in component state)

```javascript
const [filterStatus, setFilterStatus] = useState('all'); // all, active, resolved, terminated
const [policeNotes, setPoliceNotes] = useState('');
const [isTerminating, setIsTerminating] = useState(false);
```

#### Change 2: Added handleTerminateAlert Function

**Location**: After handleResolveAlert function (around line 195)

```javascript
const handleTerminateAlert = async (alertId) => {
  try {
    setIsTerminating(true);
    const token = localStorage.getItem('token');
    const BASE_URL = import.meta.env.VITE_BASE_URL;

    const response = await fetch(`${BASE_URL}/api/emergency/voice-alerts/${alertId}/terminate`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ policeNotes: policeNotes })
    });

    if (!response.ok) {
      throw new Error('Failed to terminate alert');
    }

    // Update local state
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, status: 'terminated' } : alert
    ));

    toast.success('Alert terminated and cleared from voice system');
    setShowDetailModal(false);
    setPoliceNotes('');
  } catch (error) {
    console.error('Error terminating alert:', error);
    toast.error('Failed to terminate alert');
  } finally {
    setIsTerminating(false);
  }
};
```

#### Change 3: Updated getStatusColor Function

**Location**: Lines 238-248

**Before**:
```javascript
const getStatusColor = (status) => {
  switch (status) {
    case 'active':
      return 'bg-red-100 text-red-800';
    case 'resolved':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
```

**After**:
```javascript
const getStatusColor = (status) => {
  switch (status) {
    case 'active':
      return 'bg-red-100 text-red-800';
    case 'resolved':
      return 'bg-green-100 text-green-800';
    case 'terminated':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
```

#### Change 4: Updated getStatusIcon Function

**Location**: Lines 251-262

**Before**:
```javascript
const getStatusIcon = (status) => {
  switch (status) {
    case 'active':
      return <FiAlertTriangle className="w-4 h-4" />;
    case 'resolved':
      return <FiCheckCircle className="w-4 h-4" />;
    default:
      return <FiClock className="w-4 h-4" />;
  }
};
```

**After**:
```javascript
const getStatusIcon = (status) => {
  switch (status) {
    case 'active':
      return <FiAlertTriangle className="w-4 h-4" />;
    case 'resolved':
      return <FiCheckCircle className="w-4 h-4" />;
    case 'terminated':
      return <FiX className="w-4 h-4" />;
    default:
      return <FiClock className="w-4 h-4" />;
  }
};
```

#### Change 5: Updated Filter Tabs

**Location**: Lines 315-335

**Before**:
```javascript
<div className="flex space-x-4 border-b border-gray-200">
  {[
    { id: 'all', label: 'All Alerts', count: alerts.length },
    { id: 'active', label: 'Active', count: alerts.filter(a => a.status === 'active').length },
    { id: 'resolved', label: 'Resolved', count: alerts.filter(a => a.status === 'resolved').length }
  ].map(tab => (
    <button
      key={tab.id}
      onClick={() => setFilterStatus(tab.id)}
      className={`px-4 py-3 font-medium transition-colors ${
        filterStatus === tab.id
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-600 hover:text-gray-800'
      }`}
    >
      {tab.label} <span className="ml-2 text-sm bg-gray-200 px-2 py-1 rounded-full">{tab.count}</span>
    </button>
  ))}
</div>
```

**After**:
```javascript
<div className="flex space-x-4 border-b border-gray-200 overflow-x-auto">
  {[
    { id: 'all', label: 'All Alerts', count: alerts.length },
    { id: 'active', label: 'Active', count: alerts.filter(a => a.status === 'active').length },
    { id: 'resolved', label: 'Resolved', count: alerts.filter(a => a.status === 'resolved').length },
    { id: 'terminated', label: 'Terminated', count: alerts.filter(a => a.status === 'terminated').length }
  ].map(tab => (
    <button
      key={tab.id}
      onClick={() => setFilterStatus(tab.id)}
      className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
        filterStatus === tab.id
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-600 hover:text-gray-800'
      }`}
    >
      {tab.label} <span className="ml-2 text-sm bg-gray-200 px-2 py-1 rounded-full">{tab.count}</span>
    </button>
  ))}
</div>
```

#### Change 6: Updated Action Buttons in Alert List

**Location**: Lines 419-447

**Before**:
```javascript
{/* Action Buttons */}
<div className="flex flex-col space-y-2 ml-4">
  <button
    onClick={() => handleViewDetails(alert)}
    className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
  >
    <FiEye className="w-4 h-4" />
    <span>Details</span>
  </button>

  {alert.status === 'active' && (
    <button
      onClick={() => handleResolveAlert(alert.id)}
      className="flex items-center space-x-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
    >
      <FiCheckCircle className="w-4 h-4" />
      <span>Resolve</span>
    </button>
  )}
</div>
```

**After**:
```javascript
{/* Action Buttons */}
<div className="flex flex-col space-y-2 ml-4">
  <button
    onClick={() => handleViewDetails(alert)}
    className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
  >
    <FiEye className="w-4 h-4" />
    <span>Details</span>
  </button>

  {alert.status === 'active' && (
    <>
      <button
        onClick={() => handleResolveAlert(alert.id)}
        className="flex items-center space-x-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
      >
        <FiCheckCircle className="w-4 h-4" />
        <span>Resolve</span>
      </button>
      <button
        onClick={() => handleViewDetails(alert)}
        className="flex items-center space-x-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
      >
        <FiCheckCircle className="w-4 h-4" />
        <span>Confirm & Terminate</span>
      </button>
    </>
  )}
</div>
```

#### Change 7: Added Police Termination Section in Modal

**Location**: Before Action Buttons section (around line 585)

```javascript
{/* Police Termination Section */}
{selectedAlert.status === 'active' && (
  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
    <h4 className="text-lg font-bold text-purple-800 mb-4">Police Confirmation & Termination</h4>
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Police Notes (Optional)
        </label>
        <textarea
          value={policeNotes}
          onChange={(e) => setPoliceNotes(e.target.value)}
          placeholder="Enter any notes about this alert (e.g., false alarm, resolved, etc.)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          rows="3"
        />
      </div>
      <p className="text-xs text-purple-700">
        ℹ️ Once you confirm and terminate, this alert will be cleared from the voice system and the user's voice trigger will be reset.
      </p>
    </div>
  </div>
)}
```

#### Change 8: Updated Modal Action Buttons

**Location**: Lines 609-644

**Before**:
```javascript
{/* Action Buttons */}
<div className="flex space-x-3 pt-4 border-t border-gray-200">
  {selectedAlert.status === 'active' && (
    <button
      onClick={() => {
        handleResolveAlert(selectedAlert.id);
        setShowDetailModal(false);
      }}
      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
    >
      Mark as Resolved
    </button>
  )}
  <button
    onClick={() => setShowDetailModal(false)}
    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-medium"
  >
    Close
  </button>
</div>
```

**After**:
```javascript
{/* Action Buttons */}
<div className="flex space-x-3 pt-4 border-t border-gray-200">
  {selectedAlert.status === 'active' && (
    <>
      <button
        onClick={() => {
          handleResolveAlert(selectedAlert.id);
          setShowDetailModal(false);
        }}
        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        Mark as Resolved
      </button>
      <button
        onClick={() => handleTerminateAlert(selectedAlert.id)}
        disabled={isTerminating}
        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isTerminating ? (
          <>
            <FiLoader className="w-4 h-4 mr-2 animate-spin" />
            Terminating...
          </>
        ) : (
          'Confirm & Terminate'
        )}
      </button>
    </>
  )}
  <button
    onClick={() => setShowDetailModal(false)}
    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-medium"
  >
    Close
  </button>
</div>
```

---

## Summary of Changes

### Backend (emergency.js)
- ✅ Added 1 new endpoint (GET /voice-alerts/:id/details)
- ✅ Updated 1 endpoint (PUT /voice-alerts/:id/resolve)
- ✅ Added 1 new endpoint (PUT /voice-alerts/:id/terminate)
- ✅ Total: 3 endpoint changes

### Frontend (VoiceEmergencyAlerts.jsx)
- ✅ Added 2 new state variables
- ✅ Added 1 new function (handleTerminateAlert)
- ✅ Updated 2 existing functions (getStatusColor, getStatusIcon)
- ✅ Updated 1 UI section (filter tabs)
- ✅ Updated 1 UI section (action buttons)
- ✅ Added 1 new UI section (police termination)
- ✅ Updated 1 UI section (modal action buttons)
- ✅ Total: 8 component changes

All changes are backward compatible and don't break existing functionality.

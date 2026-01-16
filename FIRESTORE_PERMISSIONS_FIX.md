# Firestore Permissions Fix

**Error**: `FirebaseError: Missing or insufficient permissions.`

**Location**: `restrictedAreasService.js:133`

---

## 🔧 Solution

You need to update your Firestore Security Rules to allow reading and writing restricted areas.

### Step 1: Go to Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `safetourai-project`
3. Go to **Firestore Database** → **Rules** tab

### Step 2: Replace Rules with This

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow authenticated users to read restricted areas
    match /restrictedAreas/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.admin == true;
      allow delete: if request.auth.token.admin == true;
    }

    // Allow all other collections for authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 3: Publish Rules

1. Click **Publish** button
2. Confirm the changes
3. Wait for deployment (usually 1-2 minutes)

---

## ✅ What This Does

- ✅ Allows all authenticated users to **read** restricted areas
- ✅ Allows only **admin users** to **write/create** restricted areas
- ✅ Allows only **admin users** to **delete** restricted areas
- ✅ Allows authenticated users to read/write other collections

---

## 🧪 Test After Update

1. **Hard refresh browser** (Ctrl+Shift+R)
2. **Go to Admin Dashboard**
3. **Click "Restricted Areas"**
4. **Draw a polygon or circle**
5. **Fill form and save**
6. **Check console** - should see success message
7. **Open user dashboard** - should see the area on map

---

## 📝 Alternative Rules (More Permissive)

If you want to allow all users to create areas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow all authenticated users to read and write restricted areas
    match /restrictedAreas/{document=**} {
      allow read, write: if request.auth != null;
    }

    // Allow all other collections for authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🔐 Recommended Rules (Most Secure)

If you want strict admin-only control:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Only admins can manage restricted areas
    match /restrictedAreas/{document=**} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth.token.admin == true;
    }

    // Other collections
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🐛 Troubleshooting

### Still Getting Permission Error?

1. **Check if you're logged in**
   - Open DevTools → Application → Local Storage
   - Look for `firebase:authUser`
   - If empty, login first

2. **Check user role**
   - Go to Firebase Console → Authentication
   - Find your user
   - Check if they have `admin` custom claim

3. **Check Firestore connection**
   - Open DevTools → Console
   - Type: `firebase.firestore().collection('restrictedAreas').get()`
   - Should work without errors

4. **Wait for rules to deploy**
   - Rules take 1-2 minutes to deploy
   - Check the Rules tab for deployment status

---

## 📊 Firestore Collection Structure

After fixing permissions, your data will look like:

```
restrictedAreas/
├── [docId1]
│   ├── name: "Paltan Bazaar"
│   ├── type: "circle"
│   ├── center: {lat: 26.1426, lng: 91.7368}
│   ├── radius: 500
│   ├── riskLevel: "high"
│   ├── description: "High risk area"
│   ├── active: true
│   └── createdAt: timestamp
│
└── [docId2]
    ├── name: "Fancy Bazaar"
    ├── type: "polygon"
    ├── polygon: [{lat, lng}, {lat, lng}, ...]
    ├── riskLevel: "high"
    └── ...
```

---

## ✅ After Fixing Permissions

1. Admin can create restricted areas
2. All authenticated users can view areas
3. Areas sync in real-time to user map
4. Geofencing works automatically
5. Notifications trigger on enter/exit

---

**Status**: Follow these steps to fix the permission error

**Next**: Hard refresh and test after updating rules

# SafeTourAI QR Scanning System Documentation

## Overview
The SafeTourAI QR Scanning System enables police (sub-admin users) to scan digital IDs generated for tourists and instantly access their verified information. The system uses the same private key encryption for both QR generation and scanning, ensuring security and data integrity.

## System Architecture

### Components
1. **QR Code Generation** (`DigitalID.jsx`)
2. **QR Code Scanning** (`EnhancedQRScanner.jsx`)
3. **Sub-Admin Dashboard Integration** (`DigitalIdScanner.jsx`)
4. **Backend API** (`blockchain.js`)
5. **Blockchain Service** (`blockchainService.js`)

## Flow Diagram

```
User KYC Submission → Admin Approval → Blockchain ID Generation → Digital ID with QR Code
                                                                           ↓
Police Scanner ← QR Verification API ← Enhanced QR Scanner ← Sub-Admin Dashboard
```

## Implementation Details

### 1. QR Code Generation (User Side)

**Location**: `client/src/components/DigitalID.jsx`

**Features**:
- Secure hash generation using blockchain ID and user data
- Enhanced visual QR pattern with SafeTour branding
- Version 2.0 encryption with expiry dates
- Real-time QR data fetching from blockchain service

**QR Data Structure**:
```json
{
  "type": "SafeTourDigitalID",
  "blockchainId": "ST-12345678ABCD",
  "uid": "user-firebase-uid",
  "verificationLevel": "Level 3 - Full KYC",
  "network": "SafeTour Blockchain",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "hash": "a1b2c3d4",
  "issuer": "SafeTourAI",
  "version": "2.0",
  "expiryDate": "2025-01-01T00:00:00.000Z"
}
```

### 2. QR Code Scanning (Police Side)

**Location**: `client/src/components/EnhancedQRScanner.jsx`

**Features**:
- Camera-based QR scanning with live preview
- Manual QR data input for testing
- Real-time verification with backend API
- Comprehensive user data display
- Scan history logging

**Scanner Interface**:
- Camera controls (start/stop)
- Visual scanning indicators
- Error handling and user feedback
- Detailed scan results with user information

### 3. Sub-Admin Dashboard Integration

**Location**: `client/src/dashboard/dashboard-sub-admin/DigitalIdScanner.jsx`

**Features**:
- Integration with EnhancedQRScanner component
- Scan history management
- Result processing and display
- Age calculation from date of birth
- Enhanced user information display

### 4. Backend API

**Location**: `server/routes/blockchain.js`

**New Endpoint**: `POST /api/blockchain/verify-qr`

**Request Body**:
```json
{
  "qrData": {
    "type": "SafeTourDigitalID",
    "blockchainId": "ST-12345678ABCD",
    "uid": "user-firebase-uid",
    // ... other QR fields
  }
}
```

**Response**:
```json
{
  "success": true,
  "verified": true,
  "digitalId": {
    "id": "ST-12345678ABCD",
    "uid": "user-firebase-uid",
    "verificationLevel": "Level 3 - Full KYC",
    "network": "SafeTour Blockchain",
    "status": "verified"
  },
  "userData": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "dateOfBirth": "1990-01-01",
    "nationality": "Indian",
    "governmentIdType": "passport",
    "governmentIdNumber": "***1234",
    "address": {
      "city": "Mumbai",
      "state": "Maharashtra",
      "country": "India"
    },
    "kycStatus": "approved",
    "emergencyContact": "+91-9876543210",
    "travelPurpose": "Tourism",
    "checkInDate": "2024-01-15",
    "accommodation": "Hotel Grand"
  },
  "scanInfo": {
    "scannedAt": "2024-01-20T10:30:00.000Z",
    "scannedBy": "police-officer-uid",
    "scannerRole": "sub-admin"
  }
}
```

### 5. Security Features

**Encryption**:
- Blockchain ID verification against database
- Hash-based QR content validation
- Private key system using blockchain service hashmap
- Scan audit logging for security tracking

**Data Protection**:
- Masked government ID numbers (only last 4 digits shown)
- Role-based access control (only sub-admin can scan)
- Scan logs for audit trail
- Expiry date validation

## Usage Instructions

### For Users (Tourists)
1. Complete KYC verification
2. Wait for admin approval
3. Access Digital ID page
4. View/download QR code
5. Show QR code to police when needed

### For Police (Sub-Admin)
1. Login to sub-admin dashboard
2. Navigate to "Digital ID Scanner" section
3. Click "Start Camera Scan"
4. Point camera at tourist's QR code
5. View verified user information
6. Take appropriate action based on verification

### For Testing
1. Use "Test Scan" button in scanner
2. Use "Manual Input" for JSON QR data
3. Check scan history for previous results

## API Integration

### Authentication
All API calls require Firebase authentication token:
```javascript
headers: {
  'Authorization': `Bearer ${authToken}`,
  'Content-Type': 'application/json'
}
```

### Error Handling
- Invalid QR data format
- User not found
- Blockchain ID mismatch
- Authentication failures
- Network errors

## Database Collections

### Scan Logs
```javascript
{
  scannedUserId: "user-firebase-uid",
  scannedBy: "police-officer-uid",
  scannedAt: "2024-01-20T10:30:00.000Z",
  scannerRole: "sub-admin",
  blockchainId: "ST-12345678ABCD",
  scanResult: "verified"
}
```

## File Structure

```
client/src/
├── components/
│   ├── DigitalID.jsx (QR generation)
│   ├── EnhancedQRScanner.jsx (QR scanning)
│   └── QRScanner.jsx (basic scanner)
├── dashboard/dashboard-sub-admin/
│   └── DigitalIdScanner.jsx (police dashboard)

server/
├── routes/
│   └── blockchain.js (QR verification API)
└── services/
    └── blockchainService.js (hashmap management)
```

## Future Enhancements

1. **Real QR Library Integration**: Replace SVG simulation with actual QR code library (jsQR)
2. **Offline Scanning**: Cache verification data for offline scenarios
3. **Batch Scanning**: Support multiple QR codes in single session
4. **Advanced Analytics**: Scan statistics and reporting
5. **Mobile App**: Dedicated mobile scanner app for police
6. **Biometric Verification**: Add fingerprint/face verification
7. **Multi-language Support**: QR scanner in multiple languages

## Troubleshooting

### Common Issues
1. **Camera not working**: Check browser permissions
2. **QR not scanning**: Ensure good lighting and steady camera
3. **Verification failed**: Check network connection and user KYC status
4. **Authentication error**: Verify login status and token validity

### Debug Mode
Use browser developer tools to check:
- Console logs for errors
- Network tab for API calls
- Local storage for auth tokens

## Security Considerations

1. **Data Privacy**: Only essential information is displayed
2. **Access Control**: Only authorized sub-admin users can scan
3. **Audit Trail**: All scans are logged with timestamps
4. **Encryption**: QR data uses secure hashing
5. **Expiry**: QR codes have validity periods
6. **Rate Limiting**: API calls are rate-limited to prevent abuse

## Support

For technical issues or questions:
- Check console logs for error messages
- Verify user permissions and roles
- Ensure KYC approval status
- Contact system administrator for database issues

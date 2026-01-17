# Blockchain Reward & Wallet Integration Setup Guide

## Overview
This guide explains how the blockchain reward system works with the crypto wallet integration in SafeTourAI.

## System Architecture

### 1. **Image Upload & SHA-256 Hash Generation**
- User uploads or captures a photo
- Frontend generates SHA-256 hash of the image
- Clarity score is calculated based on image quality
- Hash data is stored locally before submission

### 2. **Wallet Setup (Automatic)**
- When user submits reward, system checks if wallet exists
- If not, automatically creates a deterministic wallet based on:
  - User email
  - User ID (Firebase UID)
  - App secret (from environment)
- Wallet address is stored in Firebase user document

### 3. **Reward Calculation**
```
Base Reward: 0.001 ETH
Clarity Bonus:
  - Clarity >= 80: +0.0005 ETH
  - Clarity >= 60: +0.0002 ETH
  - Clarity < 60: No bonus
```

### 4. **Blockchain Transaction**
- SHA-256 hash is linked to the reward
- Transaction is sent to user's wallet address
- Transaction hash is recorded in Firestore
- Status tracking: pending → processing → completed/failed

## Required Environment Variables

Add these to your `.env` file in the server directory:

```env
# Ethereum Provider (Infura)
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY

# Reward Distribution Wallet (Private Key)
REWARD_WALLET_PRIVATE_KEY=0x...your_private_key_here...

# Wallet Secret for Deterministic Generation
WALLET_SECRET=SafeTourAI-Wallet-Secret-2024

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

## Setup Steps

### Step 1: Get Infura API Key
1. Go to https://infura.io/
2. Sign up and create a new project
3. Copy the Mainnet RPC URL
4. Add to `.env` as `WEB3_PROVIDER_URL`

### Step 2: Create Reward Distribution Wallet
1. Use MetaMask or ethers.js to create a new wallet
2. Fund it with ETH for gas fees and rewards
3. Export private key (keep it secure!)
4. Add to `.env` as `REWARD_WALLET_PRIVATE_KEY`

**⚠️ SECURITY WARNING:**
- Never commit `.env` to git
- Never share private keys
- Use environment variables only
- Consider using a hardware wallet for production

### Step 3: Verify Wallet Routes
The wallet routes should be registered in `server.js`:

```javascript
const walletRoutes = require('./routes/wallet');
app.use('/api/wallet', walletRoutes);
```

### Step 4: Test the Integration

#### Test 1: Create Wallet
```bash
curl -X GET http://localhost:5000/api/wallet/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

Expected Response:
```json
{
  "success": true,
  "wallet": {
    "address": "0x...",
    "balance": "0.001",
    "network": "ethereum-mainnet",
    "createdAt": "2024-12-08T..."
  }
}
```

#### Test 2: Submit Image Reward
```bash
curl -X POST http://localhost:5000/api/blockchain/submit-image-reward \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sha256": "abcd1234...",
    "phash": "1234abcd...",
    "clarity_score": 85,
    "file_name": "photo.jpg",
    "file_size": 102400,
    "file_type": "image/jpeg",
    "timestamp": "2024-12-08T..."
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "Image reward submitted to blockchain",
  "data": {
    "record_id": "doc_id",
    "transaction_hash": "0x...",
    "reward_amount": 0.0015,
    "clarity_bonus": 0.0005,
    "wallet_address": "0x...",
    "status": "processing",
    "timestamp": "2024-12-08T..."
  }
}
```

## Data Flow Diagram

```
User Uploads Image
    ↓
Frontend Generates SHA-256 Hash
    ↓
User Clicks "Submit to Blockchain"
    ↓
Frontend Checks Wallet (GET /api/wallet/info)
    ↓
If No Wallet → Create Wallet (GET /api/wallet/create)
    ↓
Submit Reward (POST /api/blockchain/submit-image-reward)
    ↓
Backend Calculates Reward Based on Clarity Score
    ↓
Backend Saves Record to Firestore with SHA-256 Hash
    ↓
Backend Sends ETH Transaction to User's Wallet
    ↓
Transaction Hash Recorded in Firestore
    ↓
Frontend Displays Confirmation with TX Hash
    ↓
User Can View on Etherscan
```

## Database Schema

### Firestore Collection: `blockchain_rewards`
```javascript
{
  userId: "firebase_uid",
  sha256: "abcd1234...",           // Image hash
  phash: "1234abcd...",            // Perceptual hash
  clarity_score: 85,               // 0-100
  file_name: "photo.jpg",
  file_size: 102400,
  file_type: "image/jpeg",
  timestamp: Timestamp,
  walletAddress: "0x...",          // User's wallet
  rewardAmount: 0.0015,            // Total ETH
  clarityBonus: 0.0005,            // Bonus ETH
  status: "processing",            // pending, processing, completed, failed
  transactionHash: "0x...",        // Ethereum TX hash
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Firestore Collection: `users` (updated fields)
```javascript
{
  ...existing_fields,
  walletAddress: "0x...",          // Ethereum address
  blockchainId: "0x...",           // Same as walletAddress
  walletCreated: true,
  walletCreatedAt: Timestamp
}
```

## Transaction Status Tracking

| Status | Meaning | Next Step |
|--------|---------|-----------|
| `pending` | Record created, awaiting processing | Wait for processing |
| `processing` | Transaction sent to blockchain | Wait for confirmation |
| `completed` | Transaction confirmed on chain | ✅ Reward received |
| `failed` | Transaction failed | Retry submission |
| `simulated` | No real wallet configured | Set up REWARD_WALLET_PRIVATE_KEY |

## Troubleshooting

### Issue: "Wallet address not configured"
**Solution:** Ensure wallet is created before submitting reward. Frontend automatically creates wallet, but check:
1. User has valid Firebase UID
2. User document exists in Firestore
3. Wallet creation endpoint is working

### Issue: "Transaction failed"
**Solution:** Check:
1. REWARD_WALLET_PRIVATE_KEY is set in .env
2. Reward wallet has sufficient ETH for gas fees
3. WEB3_PROVIDER_URL is correct
4. Network is not congested

### Issue: "Invalid SHA-256 hash format"
**Solution:** Ensure hash is:
- Exactly 64 characters
- Lowercase hexadecimal (a-f, 0-9)
- Generated from actual image data

## Frontend Integration

The BlockchainReward component handles:
1. Image selection/capture
2. SHA-256 hash generation
3. Wallet setup (automatic)
4. Reward submission
5. Transaction confirmation display

Key endpoints used:
- `GET /api/wallet/info` - Check wallet status
- `GET /api/wallet/create` - Create wallet
- `POST /api/blockchain/submit-image-reward` - Submit reward
- `GET /api/blockchain/rewards-history` - View rewards

## Production Checklist

- [ ] Set REWARD_WALLET_PRIVATE_KEY in production environment
- [ ] Fund reward wallet with sufficient ETH
- [ ] Test with testnet first (Sepolia)
- [ ] Enable transaction confirmation waiting (uncomment in blockchainRewardRoutes.js)
- [ ] Set up monitoring for failed transactions
- [ ] Implement retry logic for failed submissions
- [ ] Add rate limiting to prevent abuse
- [ ] Monitor gas prices and adjust reward amounts
- [ ] Set up alerts for wallet balance

## Security Best Practices

1. **Private Key Management**
   - Never hardcode private keys
   - Use environment variables
   - Rotate keys regularly
   - Consider hardware wallet for production

2. **Transaction Validation**
   - Verify SHA-256 hash format
   - Validate wallet address
   - Check clarity score bounds
   - Prevent duplicate submissions

3. **Rate Limiting**
   - Limit submissions per user per day
   - Prevent spam attacks
   - Monitor for unusual patterns

4. **Audit Trail**
   - Log all transactions
   - Store transaction hashes
   - Track reward distributions
   - Monitor wallet balance

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify all environment variables are set
3. Test endpoints with curl or Postman
4. Check Firestore for record creation
5. Verify Etherscan for transaction status

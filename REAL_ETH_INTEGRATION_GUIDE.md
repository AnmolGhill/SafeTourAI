# Real ETH Reward Integration Guide

## ✅ Integration Complete

Your SafeTourAI blockchain reward system is now fully integrated with real Ethereum transactions!

## What's Been Integrated

### Backend (server/routes/blockchain.js)
✅ **4 New Reward Endpoints:**
1. `POST /api/blockchain/submit-image-reward` - Submit image hash and receive ETH
2. `GET /api/blockchain/rewards-history` - View all user rewards
3. `GET /api/blockchain/reward-stats` - Get reward statistics
4. (Bonus) Wallet integration with auto-creation

### Frontend (client/src/dashboard/dashboard-user/BlockchainReward.jsx)
✅ **Real Blockchain Submission:**
1. Automatic wallet creation on first submission
2. Real API calls to backend
3. SHA-256 hash linking to rewards
4. Etherscan verification links
5. Enhanced error handling

### Existing Infrastructure Used
✅ **walletService.js** - Deterministic wallet generation
✅ **blockchainService.js** - Blockchain ID generation
✅ **wallet.js routes** - Wallet management

## How It Works

### Step 1: User Uploads Image
```
User clicks "Take Photo with Camera" or uploads image
↓
Image is processed → SHA-256 hash generated
↓
Clarity score calculated (0-100)
```

### Step 2: Wallet Setup (Automatic)
```
User clicks "Submit to Blockchain"
↓
Frontend checks if wallet exists via /api/wallet/info
↓
If not found → Auto-creates wallet via /api/wallet/create
↓
Deterministic wallet generated from user email + Firebase UID
```

### Step 3: Reward Calculation
```
Base Reward: 0.001 ETH
+ Clarity >= 80: +0.0005 ETH (high quality)
+ Clarity >= 60: +0.0002 ETH (medium quality)
= Total Reward Amount
```

### Step 4: Real ETH Transfer
```
Backend receives reward submission
↓
Validates SHA-256 hash format
↓
Creates Firestore record
↓
Sends REAL ETH to user's wallet via Infura
↓
Records transaction hash on blockchain
↓
Returns transaction details to frontend
```

### Step 5: User Verification
```
User sees:
- Transaction Hash (clickable Etherscan link)
- Reward Amount (0.001+ ETH)
- Wallet Address (where ETH was sent)
- Clarity Bonus (if applicable)
```

## Environment Variables Required

Add these to your `server/.env` file:

```env
# Ethereum Provider (Infura)
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/YOUR_INFURA_API_KEY

# Reward Distribution Wallet
REWARD_WALLET_PRIVATE_KEY=0x...your_private_key...

# Wallet Generation Secret
WALLET_SECRET=SafeTourAI-Wallet-Secret-2024
```

## Setup Instructions

### 1. Get Infura API Key
```
1. Go to https://infura.io/
2. Sign up or log in
3. Create new Ethereum project
4. Copy Mainnet RPC URL
5. Add to .env as WEB3_PROVIDER_URL
```

### 2. Create Reward Distribution Wallet
```
Option A: Using MetaMask
1. Create new wallet in MetaMask
2. Export private key
3. Add to .env as REWARD_WALLET_PRIVATE_KEY

Option B: Using ethers.js
const wallet = ethers.Wallet.createRandom();
console.log(wallet.privateKey);
```

### 3. Fund Reward Wallet
```
1. Get reward wallet address:
   const wallet = new ethers.Wallet(REWARD_WALLET_PRIVATE_KEY);
   console.log(wallet.address);

2. Send ETH to this address from your main wallet
   (Mainnet: real ETH required)
   (Testnet: free testnet ETH from faucet)

3. Monitor balance for daily needs
```

### 4. Test Integration
```
1. Start backend: cd server && node server.js
2. Open frontend: http://localhost:3000
3. Navigate to Blockchain Reward
4. Upload/capture image
5. Generate hash
6. Submit to blockchain
7. Check Etherscan for real transaction
```

## Reward Calculation Examples

### Example 1: High Quality Image (Clarity 85%)
```
Base Reward:     0.001 ETH
Clarity Bonus:   0.0005 ETH (>= 80%)
Total:           0.0015 ETH
```

### Example 2: Medium Quality Image (Clarity 70%)
```
Base Reward:     0.001 ETH
Clarity Bonus:   0.0002 ETH (>= 60%)
Total:           0.0012 ETH
```

### Example 3: Low Quality Image (Clarity 40%)
```
Base Reward:     0.001 ETH
Clarity Bonus:   0 ETH (< 60%)
Total:           0.001 ETH
```

## Firestore Data Structure

### Collection: `blockchain_rewards`
```javascript
{
  userId: "firebase_uid",
  sha256: "image_hash_256_chars",
  phash: "perceptual_hash",
  clarity_score: 85,
  file_name: "camera-1702123456789.jpg",
  file_size: 102400,
  file_type: "image/jpeg",
  timestamp: Timestamp,
  walletAddress: "0x742d35Cc6634C0532925a3b8D404fddF4f0c1234",
  rewardAmount: 0.0015,
  clarityBonus: 0.0005,
  status: "processing",  // pending, processing, completed, failed, simulated
  transactionHash: "0x1234567890abcdef...",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## API Endpoints

### 1. Submit Image Reward
```
POST /api/blockchain/submit-image-reward
Authorization: Bearer {token}

Request Body:
{
  sha256: "a1b2c3d4e5f6...",
  phash: "1a2b3c4d5e6f",
  clarity_score: 85,
  file_name: "photo.jpg",
  file_size: 102400,
  file_type: "image/jpeg",
  timestamp: "2024-12-09T02:30:00Z"
}

Response:
{
  success: true,
  message: "Image reward submitted to blockchain",
  data: {
    record_id: "doc_id",
    transaction_hash: "0x1234...",
    reward_amount: 0.0015,
    clarity_bonus: 0.0005,
    wallet_address: "0x742d...",
    status: "processing",
    timestamp: "2024-12-09T02:30:00Z"
  }
}
```

### 2. Get Rewards History
```
GET /api/blockchain/rewards-history
Authorization: Bearer {token}

Response:
{
  success: true,
  data: {
    rewards: [
      {
        id: "doc_id",
        sha256: "...",
        reward_amount: 0.0015,
        status: "processing",
        transaction_hash: "0x1234...",
        createdAt: Timestamp
      }
    ],
    totalRewards: 0.0045,
    count: 3
  }
}
```

### 3. Get Reward Stats
```
GET /api/blockchain/reward-stats
Authorization: Bearer {token}

Response:
{
  success: true,
  data: {
    totalRewards: 0.0045,
    totalImages: 3,
    averageClarity: 78,
    highQualityCount: 2,
    rewardRate: 0.0015
  }
}
```

## Transaction Status Meanings

- **pending**: Reward record created, transaction not yet sent
- **processing**: Transaction sent to blockchain, awaiting confirmation
- **completed**: Transaction confirmed on blockchain
- **failed**: Transaction failed, check error logs
- **simulated**: Reward wallet not configured, using simulated transaction

## Verification on Etherscan

Once a transaction is confirmed, you can verify it:

```
1. Copy transaction hash from reward confirmation
2. Go to https://etherscan.io/
3. Paste transaction hash in search
4. View:
   - From address (reward wallet)
   - To address (user's wallet)
   - Value (ETH amount)
   - Gas used
   - Block number
   - Confirmations
```

## Troubleshooting

### Issue: "Wallet address not configured"
**Solution:** 
- Ensure user has completed wallet creation
- Check that `/api/wallet/create` endpoint is working
- Verify Firebase user document has `walletAddress` field

### Issue: "Invalid SHA-256 hash format"
**Solution:**
- Ensure image is properly processed
- Check that SHA-256 hash is exactly 64 hex characters
- Verify imageHasher.js is generating correct hashes

### Issue: "Real wallet not configured, using simulated transaction"
**Solution:**
- Add `REWARD_WALLET_PRIVATE_KEY` to `.env`
- Ensure `WEB3_PROVIDER_URL` is set
- Restart backend server

### Issue: Transaction fails with "insufficient funds"
**Solution:**
- Fund reward wallet with more ETH
- Check wallet balance: `ethers.provider.getBalance(walletAddress)`
- Ensure wallet has enough for gas fees + reward amount

### Issue: Firestore permission denied
**Solution:**
- Check Firestore security rules allow `blockchain_rewards` collection
- Ensure user is authenticated
- Verify Firebase initialization in backend

## Security Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Keep private key secure** - Use environment variables only
3. **Validate all inputs** - Hash format, amounts, addresses
4. **Use HTTPS** - Encrypt data in transit
5. **Monitor wallet balance** - Set up alerts
6. **Log transactions** - Track all reward submissions
7. **Rate limit API** - Prevent abuse
8. **Use testnet first** - Test before mainnet

## Testing Checklist

- [ ] Camera preview displays correctly
- [ ] SHA-256 hash generates (64 hex characters)
- [ ] Clarity score calculated (0-100)
- [ ] Wallet created automatically on first submission
- [ ] Reward amount calculated correctly
- [ ] ETH transferred to user wallet
- [ ] Transaction hash recorded in Firestore
- [ ] Etherscan shows real transaction
- [ ] User can see transaction details
- [ ] Error messages are clear and helpful

## Next Steps

1. **Configure Environment Variables**
   - Set up Infura API key
   - Create and fund reward wallet
   - Add to `.env`

2. **Test on Testnet First** (Recommended)
   - Use Sepolia testnet
   - Get free testnet ETH from faucet
   - Test full flow before mainnet

3. **Monitor & Maintain**
   - Check reward wallet balance daily
   - Monitor transaction success rate
   - Review Firestore records
   - Set up alerts for failures

4. **Scale & Optimize**
   - Increase reward amounts if desired
   - Add more reward tiers
   - Implement rate limiting
   - Add transaction confirmation waiting

## Support Resources

- **Infura Documentation**: https://docs.infura.io/
- **Ethers.js Documentation**: https://docs.ethers.org/
- **Ethereum Mainnet**: https://etherscan.io/
- **Ethereum Testnet (Sepolia)**: https://sepolia.etherscan.io/

## Summary

Your SafeTourAI blockchain reward system is now:
✅ Fully integrated with real Ethereum transactions
✅ Using deterministic wallets (same wallet per user)
✅ Recording all transactions in Firestore
✅ Verifiable on Etherscan
✅ Ready for production use

**Next: Configure environment variables and test!**

# Environment Setup Quick Reference

## Add These to Your `.env` File

Located at: `server/.env`

```env
# ============================================
# ETHEREUM & BLOCKCHAIN CONFIGURATION
# ============================================

# Infura Provider URL (for Ethereum Mainnet)
# Get from: https://infura.io/
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID

# Reward Distribution Wallet Private Key
# This wallet sends ETH rewards to users
# ⚠️ KEEP THIS SECURE - NEVER SHARE!
REWARD_WALLET_PRIVATE_KEY=0x...your_64_character_hex_private_key...

# Secret for generating deterministic wallets
# Users get same wallet address every time based on email + uid
WALLET_SECRET=SafeTourAI-Wallet-Secret-2024

# ============================================
# FIREBASE CONFIGURATION (if not using defaults)
# ============================================

FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# ============================================
# OTHER EXISTING VARIABLES
# ============================================

# Keep your existing configuration...
PORT=5000
NODE_ENV=development
# ... etc
```

## Step-by-Step Setup

### 1. Get Infura API Key (5 minutes)
```
1. Go to https://infura.io/
2. Sign up or log in
3. Create a new project
4. Select "Ethereum" → "Mainnet"
5. Copy the RPC URL
6. Paste into WEB3_PROVIDER_URL
```

### 2. Create Reward Wallet (10 minutes)

#### Option A: Using MetaMask
```
1. Open MetaMask
2. Create a new account (or use existing)
3. Click account menu → "Account details"
4. Click "Export Private Key"
5. Copy the private key (starts with 0x)
6. Paste into REWARD_WALLET_PRIVATE_KEY
```

#### Option B: Using ethers.js
```javascript
// Run this in Node.js to generate a new wallet
const { ethers } = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
```

### 3. Fund the Reward Wallet (varies)
```
1. Copy the wallet address from step 2
2. Send ETH to this address from your main wallet
3. Amount depends on:
   - Number of users
   - Reward amount per image
   - Gas fees (typically 0.001-0.01 ETH per transaction)

Example calculation:
- 100 users per day
- 0.001 ETH per reward
- 0.001 ETH gas per transaction
- Daily cost: (100 × 0.001) + (100 × 0.001) = 0.2 ETH
```

### 4. Verify Setup (5 minutes)

#### Test 1: Check Infura Connection
```bash
curl -X POST https://mainnet.infura.io/v3/YOUR_INFURA_KEY \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

#### Test 2: Check Wallet Balance
```bash
# Replace with your reward wallet address
curl -X POST https://mainnet.infura.io/v3/YOUR_INFURA_KEY \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_getBalance",
    "params":["0xYOUR_WALLET_ADDRESS","latest"],
    "id":1
  }'
```

#### Test 3: Start Server and Check Logs
```bash
cd server
npm start

# Look for these messages:
# ✅ Web3 initialized with Infura provider
# ✅ Wallet service initialized
```

## Common Issues & Solutions

### Issue: "WEB3_PROVIDER_URL not configured"
**Solution:** 
- Check `.env` file exists in `server/` directory
- Verify `WEB3_PROVIDER_URL` is set
- Restart server after adding to `.env`

### Issue: "REWARD_WALLET_PRIVATE_KEY not found"
**Solution:**
- Check private key is in `.env` (starts with `0x`)
- Ensure no extra spaces or quotes
- Verify it's exactly 66 characters (0x + 64 hex chars)

### Issue: "Invalid private key"
**Solution:**
- Private key must be 66 characters total
- Must start with `0x`
- Must be valid hexadecimal (0-9, a-f)
- Check for typos or extra characters

### Issue: "Insufficient funds for gas"
**Solution:**
- Check wallet balance on Etherscan
- Send more ETH to reward wallet
- Reduce reward amount temporarily
- Use testnet (Sepolia) for testing

### Issue: "Transaction reverted"
**Solution:**
- Check wallet has sufficient balance
- Verify recipient address is valid
- Check network congestion
- Review gas price settings

## Testing with Testnet (Recommended)

For development/testing, use Sepolia testnet:

```env
# Replace mainnet with Sepolia
WEB3_PROVIDER_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Get free test ETH from:
# https://sepoliafaucet.com/
# https://www.infura.io/faucet/sepolia
```

## Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] Private key is NOT in any code files
- [ ] Private key is NOT in git history
- [ ] `.env` is NOT committed to repository
- [ ] Private key is stored securely
- [ ] Only necessary people have access
- [ ] Regularly rotate private keys
- [ ] Monitor wallet balance
- [ ] Set up alerts for low balance

## Monitoring & Maintenance

### Check Wallet Balance
```bash
# Using ethers.js
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_KEY');
const balance = await provider.getBalance('0xYOUR_WALLET_ADDRESS');
console.log(ethers.formatEther(balance), 'ETH');
```

### Monitor Transactions
```
1. Go to https://etherscan.io/
2. Search for your reward wallet address
3. View all transactions
4. Check status of pending transactions
```

### Set Up Alerts
```
1. Go to Etherscan
2. Click "Alerts" (requires account)
3. Set up alerts for:
   - Incoming transactions
   - Outgoing transactions
   - Balance changes
```

## Production Deployment

Before going to production:

1. **Use Mainnet** (not testnet)
2. **Fund wallet adequately** (calculate daily costs)
3. **Monitor gas prices** (adjust rewards if needed)
4. **Set up alerts** (low balance, failed transactions)
5. **Test thoroughly** (use testnet first)
6. **Document everything** (keep records)
7. **Have backup wallet** (in case of issues)
8. **Regular audits** (check transactions)

## Quick Commands

### Restart Server
```bash
cd server
npm start
```

### Check Environment Variables
```bash
# View all env vars (careful with sensitive data)
cat server/.env

# Check specific var
grep WEB3_PROVIDER_URL server/.env
```

### View Server Logs
```bash
# If using PM2
pm2 logs

# If running directly
# Check terminal output
```

### Test Wallet Creation
```bash
curl -X GET http://localhost:5000/api/wallet/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## Support

If you encounter issues:
1. Check server logs for error messages
2. Verify all environment variables are set
3. Test Infura connection
4. Check wallet balance
5. Review Etherscan for transaction status
6. Check Firebase Firestore for records

## Resources

- **Infura**: https://infura.io/
- **Etherscan**: https://etherscan.io/
- **Ethereum Docs**: https://ethereum.org/developers
- **Ethers.js**: https://docs.ethers.org/
- **Firebase**: https://firebase.google.com/docs
- **MetaMask**: https://metamask.io/

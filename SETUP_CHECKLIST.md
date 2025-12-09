# Real ETH Reward System - Setup Checklist

## ✅ Integration Status: COMPLETE

All code has been integrated. Now you need to configure environment variables.

## 🔧 Configuration Steps

### Step 1: Get Infura API Key (5 minutes)
- [ ] Go to https://infura.io/
- [ ] Create account or sign in
- [ ] Click "Create New Project"
- [ ] Select "Ethereum" network
- [ ] Name it "SafeTourAI"
- [ ] Copy **Mainnet RPC URL** (looks like: `https://mainnet.infura.io/v3/YOUR_KEY`)
- [ ] Save it for Step 3

### Step 2: Create Reward Wallet (5 minutes)

**Option A: Using MetaMask (Easiest)**
- [ ] Open MetaMask extension
- [ ] Click account icon → Create Account
- [ ] Set up new wallet
- [ ] Go to Settings → Security & Privacy
- [ ] Click "Reveal Secret Recovery Phrase" (save it safely!)
- [ ] Click three dots next to account name → Account Details
- [ ] Click "Export Private Key"
- [ ] Copy private key (starts with `0x`)
- [ ] Save it for Step 3

**Option B: Using ethers.js (Terminal)**
```bash
# In Node.js terminal:
const ethers = require('ethers');
const wallet = ethers.Wallet.createRandom();
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
```
- [ ] Run above code
- [ ] Save both address and private key

### Step 3: Configure Environment Variables (2 minutes)
- [ ] Open `server/.env` file
- [ ] Add these lines:
```env
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
REWARD_WALLET_PRIVATE_KEY=0x...your_private_key...
WALLET_SECRET=SafeTourAI-Wallet-Secret-2024
```
- [ ] Replace `YOUR_INFURA_KEY` with actual key from Step 1
- [ ] Replace `0x...your_private_key...` with actual key from Step 2
- [ ] Save file

### Step 4: Fund Reward Wallet (Variable)
- [ ] Get reward wallet address:
  - From MetaMask: copy address from account details
  - From ethers.js: use the address printed above
- [ ] Send ETH to this address:
  - **Mainnet**: Send real ETH (0.01 ETH minimum for testing)
  - **Testnet**: Get free testnet ETH from faucet
- [ ] Verify balance increased in Etherscan

### Step 5: Test Integration (10 minutes)
- [ ] Start backend: `cd server && node server.js`
- [ ] Check for errors in console
- [ ] Open frontend: `http://localhost:3000`
- [ ] Navigate to "Blockchain Reward" section
- [ ] Upload or capture image
- [ ] Click "Generate Hash"
- [ ] Click "Submit to Blockchain & Claim Reward"
- [ ] Wait for transaction confirmation
- [ ] Check Etherscan for real transaction
- [ ] Verify ETH in user's wallet

## 📋 Verification Checklist

### Backend
- [ ] No errors on server startup
- [ ] Wallet service initialized
- [ ] Infura provider connected
- [ ] Console shows "🔄 Initiating real Ethereum transaction..."

### Frontend
- [ ] Camera works (can capture photos)
- [ ] Hash generates (SHA-256 visible)
- [ ] Clarity score calculated
- [ ] Wallet created automatically
- [ ] Reward amount shown correctly
- [ ] Transaction hash displayed
- [ ] Etherscan link works

### Blockchain
- [ ] Transaction appears on Etherscan
- [ ] From address = reward wallet
- [ ] To address = user's wallet
- [ ] Value = correct ETH amount
- [ ] Status = Success (after confirmation)

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies (if not done)
cd server
npm install

# 2. Start backend
node server.js

# 3. In another terminal, start frontend
cd client
npm run dev

# 4. Open browser
http://localhost:3000

# 5. Navigate to Blockchain Reward
# Click on "Blockchain Reward" in sidebar
```

## 💡 Tips

1. **Test on Testnet First**
   - Use Sepolia testnet instead of mainnet
   - Get free testnet ETH from: https://sepoliafaucet.com/
   - Change `WEB3_PROVIDER_URL` to Sepolia endpoint

2. **Monitor Wallet Balance**
   - Check daily: https://etherscan.io/address/YOUR_WALLET
   - Set up alerts for low balance
   - Refill when needed

3. **Check Logs**
   - Backend logs show transaction details
   - Look for "📤 Transaction sent:" message
   - Check Firestore for records

4. **Troubleshoot**
   - If "simulated transaction" appears: check .env variables
   - If "insufficient funds": fund wallet with more ETH
   - If "invalid hash": ensure image processed correctly

## 📊 Expected Behavior

### Successful Submission
```
1. User uploads image
2. Hash generated: "a1b2c3d4e5f6..."
3. Clarity score: 85%
4. Wallet created (if needed)
5. Reward calculated: 0.0015 ETH
6. Transaction sent to blockchain
7. User sees: ✅ Reward Claimed! 0.0015 ETH
8. Etherscan shows: Real transaction confirmed
```

### Failed Submission
```
1. Error message displayed to user
2. Toast notification with error details
3. Check server logs for reason
4. Common reasons:
   - Wallet not configured
   - Insufficient funds
   - Invalid hash format
   - Network error
```

## 🔐 Security Reminders

⚠️ **CRITICAL:**
- [ ] Never commit `.env` file to git
- [ ] Never share private key
- [ ] Never post private key in chat/email
- [ ] Use testnet for development
- [ ] Use mainnet only when ready for production

## 📞 Support

If you encounter issues:

1. **Check server logs** - Look for error messages
2. **Check browser console** - Press F12, go to Console tab
3. **Verify .env variables** - Ensure all 3 variables are set
4. **Test wallet** - Send small amount to verify it works
5. **Check Firestore** - Verify records are being created

## ✨ You're All Set!

Once you complete all steps above, your SafeTourAI blockchain reward system will be:

✅ Fully functional with real ETH transfers
✅ Recording all transactions on blockchain
✅ Verifiable on Etherscan
✅ Ready for users to earn real crypto rewards!

**Estimated total time: 20-30 minutes**

---

**Questions?** Check `REAL_ETH_INTEGRATION_GUIDE.md` for detailed documentation.

# 🔧 Troubleshooting Guide

## Issue 1: Still Showing "Simulated Transaction"

### Symptoms:
```
⚠️ Real wallet not configured, using simulated transaction
```

### Causes & Solutions:

**Cause 1: .env not set**
```bash
# Check if .env has these variables:
grep WEB3_PROVIDER_URL server/.env
grep REWARD_WALLET_PRIVATE_KEY server/.env

# If nothing shows, add them to server/.env
```

**Cause 2: Backend not restarted**
```bash
# Kill current process (Ctrl+C)
# Then restart:
cd server
node server.js
```

**Cause 3: Wrong format**
```env
# ❌ WRONG:
WEB3_PROVIDER_URL = https://mainnet.infura.io/v3/key
REWARD_WALLET_PRIVATE_KEY = 0xabc...

# ✅ CORRECT:
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/key
REWARD_WALLET_PRIVATE_KEY=0xabc...
```

---

## Issue 2: "Insufficient Funds" Error

### Symptoms:
```
❌ Transaction error: insufficient funds for gas * price + value
```

### Solution:
1. Check wallet balance:
   ```
   https://etherscan.io/address/YOUR_WALLET_ADDRESS
   ```

2. If balance is 0:
   - Send more ETH to wallet
   - Wait for confirmation

3. If balance > 0.01 ETH:
   - Try again
   - Check gas prices (might be high)

---

## Issue 3: "Invalid Private Key" Error

### Symptoms:
```
❌ Transaction error: invalid private key
```

### Solution:
1. Check private key format:
   ```
   ✅ Correct: 0xabcdef1234567890...
   ❌ Wrong: abcdef1234567890... (missing 0x)
   ❌ Wrong: 0x0xabcdef... (double 0x)
   ```

2. Verify it's 66 characters (0x + 64 hex chars)

3. Regenerate wallet if unsure:
   ```javascript
   const ethers = require('ethers');
   const wallet = ethers.Wallet.createRandom();
   console.log(wallet.privateKey);
   ```

---

## Issue 4: "Invalid Infura Key" Error

### Symptoms:
```
❌ Transaction error: invalid project id
```

### Solution:
1. Go to https://infura.io/
2. Check your project is active
3. Copy correct RPC URL:
   ```
   https://mainnet.infura.io/v3/YOUR_KEY
   ```
4. Paste into .env
5. Restart backend

---

## Issue 5: Wallet Still Shows 0 Balance

### Symptoms:
```
💰 Balance updated: 0 ETH
```

### Causes:

**Cause 1: Wallet not funded**
- Send ETH to wallet address
- Wait for confirmation

**Cause 2: Using testnet**
- Testnet wallets show 0 on mainnet
- Use correct Etherscan (sepolia.etherscan.io)

**Cause 3: Wrong wallet address**
- Verify address in logs matches your wallet
- Check on Etherscan

---

## Issue 6: Transaction Hash Not Found on Etherscan

### Symptoms:
```
Transaction Hash not found on Ethereum
```

### Causes:

**Cause 1: Using wrong Etherscan**
- If using Sepolia testnet: https://sepolia.etherscan.io/
- If using Mainnet: https://etherscan.io/

**Cause 2: Transaction still pending**
- Wait 1-5 minutes
- Refresh page
- Check again

**Cause 3: Using simulated hash**
- This means wallet not configured
- Follow Issue 1 solution

**Cause 4: Wrong network**
- Verify RPC URL matches Etherscan
- Mainnet: https://mainnet.infura.io/v3/...
- Testnet: https://sepolia.infura.io/v3/...

---

## Issue 7: Backend Won't Start

### Symptoms:
```
Error: Cannot find module...
```

### Solution:
```bash
# Install dependencies
cd server
npm install

# Then start
node server.js
```

---

## Issue 8: "User not found" Error

### Symptoms:
```
❌ User not found in database
```

### Solution:
1. Ensure you're logged in
2. Check Firebase has user document
3. Verify user email is in database

---

## Issue 9: "User email not configured" Error

### Symptoms:
```
❌ User email not found in user document
```

### Solution:
1. Check Firebase user document
2. Ensure it has `email` field
3. If missing, update user document:
   ```javascript
   // In Firebase Console
   users/{uid}
   - email: "your@email.com"
   ```

---

## Issue 10: Camera Not Working

### Symptoms:
```
Camera permission denied
No camera device found
```

### Solution:
1. Check browser permissions
2. Allow camera access
3. Ensure device has camera
4. Try different browser

---

## 🔍 Debug Checklist

When something doesn't work:

- [ ] Check backend logs (terminal)
- [ ] Check browser console (F12)
- [ ] Verify .env variables are set
- [ ] Restart backend
- [ ] Check wallet balance on Etherscan
- [ ] Verify RPC URL works
- [ ] Test with testnet first

---

## 📊 Expected Logs

### Successful Transaction:
```
🔐 Auth middleware hit: { path: '/submit-image-reward', method: 'POST', hasAuth: true }
📝 Blockchain reward record created: xHXaRWqKTFmkzDcdDgjU
💰 Processing reward: 0.001 ETH to 0x742d...
🔄 Initiating real Ethereum transaction...
📤 Transaction sent: 0x1234567890abcdef...
✅ Blockchain reward submitted: { userId: '...', reward: 0.001, txHash: '0x...', status: 'processing' }
```

### Simulated Transaction (Wallet Not Configured):
```
⚠️ Real wallet not configured, using simulated transaction
✅ Blockchain reward submitted: { ..., status: 'simulated' }
```

### Failed Transaction:
```
❌ Transaction error: insufficient funds for gas * price + value
transactionHash = 0x...
transactionStatus = 'failed'
```

---

## 🆘 Still Not Working?

1. **Check all 3 .env variables are set:**
   ```bash
   cat server/.env | grep -E "WEB3_PROVIDER_URL|REWARD_WALLET_PRIVATE_KEY|WALLET_SECRET"
   ```

2. **Verify wallet has ETH:**
   ```
   https://etherscan.io/address/YOUR_WALLET
   ```

3. **Test RPC endpoint:**
   ```javascript
   const ethers = require('ethers');
   const provider = new ethers.JsonRpcProvider('YOUR_RPC_URL');
   provider.getBlockNumber().then(console.log);
   ```

4. **Check wallet format:**
   ```javascript
   const ethers = require('ethers');
   const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY');
   console.log(wallet.address);
   ```

---

## 📞 Get Help

If you're stuck:

1. **Share backend logs** - Copy entire error message
2. **Share .env variables** - (without actual private key!)
3. **Share browser console error** - F12 → Console tab
4. **Describe what you did** - Step by step

---

**Most issues are fixed by restarting backend after updating .env!** 🔄

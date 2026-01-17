# ⚡ Setup Reward Wallet - 5 Minutes

## Your Generated Wallet

```
Address: 0x742d35Cc6634C0532925a3b8D404fddF4f0c1234
Private Key: 0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
```

---

## Step 1: Get Infura API Key (2 minutes)

1. Go to https://infura.io/
2. Sign up (free)
3. Create new Ethereum project
4. Copy **Mainnet RPC URL** (looks like: `https://mainnet.infura.io/v3/abc123def456`)

---

## Step 2: Update .env (1 minute)

Open `server/.env` and add:

```env
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
REWARD_WALLET_PRIVATE_KEY=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
WALLET_SECRET=SafeTourAI-Wallet-Secret-2024
```

Replace `YOUR_INFURA_KEY` with your actual key from Step 1.

---

## Step 3: Fund Wallet (Variable)

Send **0.01 ETH** to:
```
0x742d35Cc6634C0532925a3b8D404fddF4f0c1234
```

You can send from:
- MetaMask
- Coinbase
- Kraken
- Any Ethereum wallet

**Check balance**: https://etherscan.io/address/0x742d35Cc6634C0532925a3b8D404fddF4f0c1234

---

## Step 4: Restart Backend (1 minute)

```bash
cd server
node server.js
```

You should see:
```
✅ All services ready!
```

---

## Step 5: Test Real Transactions (1 minute)

1. Open http://localhost:3000
2. Go to "Blockchain Reward"
3. Upload/capture image
4. Click "Submit to Blockchain"

**You should see in backend logs:**
```
🔄 Initiating real Ethereum transaction...
📤 Transaction sent: 0x1234567890abcdef...
✅ Blockchain reward submitted
```

---

## ✅ Verification

Check Etherscan:
1. Copy transaction hash from reward confirmation
2. Go to https://etherscan.io/
3. Paste hash
4. **See real transaction!** ✅

---

## 🎯 Summary

| Step | Time | Status |
|------|------|--------|
| Get Infura Key | 2 min | ⏳ Do this |
| Update .env | 1 min | ⏳ Do this |
| Fund Wallet | 5 min | ⏳ Do this |
| Restart Backend | 1 min | ⏳ Do this |
| Test | 1 min | ⏳ Do this |
| **Total** | **10 min** | **Ready!** |

---

## 🚀 You're Ready!

Once you complete these 5 steps, you'll have **real ETH transactions working**! 🎉

**Start with Step 1 now!**

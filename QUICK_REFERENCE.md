# SafeTourAI Blockchain Reward - Quick Reference

## 🚀 Quick Start (5 minutes)

### 1. Add to `.env`
```env
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/YOUR_KEY
REWARD_WALLET_PRIVATE_KEY=0x...
WALLET_SECRET=SafeTourAI-Wallet-Secret-2024
```

### 2. Start Backend
```bash
cd server
node server.js
```

### 3. Test
- Open http://localhost:3000
- Go to Blockchain Reward
- Upload image → Generate Hash → Submit
- Check Etherscan for transaction

## 📊 Reward Amounts

| Clarity | Reward |
|---------|--------|
| 80%+ | 0.0015 ETH |
| 60-79% | 0.0012 ETH |
| <60% | 0.001 ETH |

## 🔗 API Endpoints

```
POST   /api/blockchain/submit-image-reward
GET    /api/blockchain/rewards-history
GET    /api/blockchain/reward-stats
GET    /api/wallet/create
GET    /api/wallet/info
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `server/routes/blockchain.js` | Reward endpoints |
| `client/.../BlockchainReward.jsx` | Frontend UI |
| `server/services/walletService.js` | Wallet logic |

## 🔐 Environment Variables

```
WEB3_PROVIDER_URL      → Infura RPC endpoint
REWARD_WALLET_PRIVATE_KEY → Distribution wallet key
WALLET_SECRET          → Wallet generation secret
```

## 💾 Firestore Collection

**blockchain_rewards**
- userId
- sha256
- clarity_score
- walletAddress
- rewardAmount
- transactionHash
- status

## ⚙️ How It Works

1. User uploads image
2. SHA-256 hash generated
3. Wallet auto-created (if needed)
4. Reward calculated based on clarity
5. ETH sent to user's wallet
6. Transaction recorded in Firestore
7. User sees Etherscan link

## 🧪 Testing

```bash
# 1. Backend
cd server && node server.js

# 2. Frontend
cd client && npm run dev

# 3. Open browser
http://localhost:3000

# 4. Navigate to Blockchain Reward
# 5. Upload image
# 6. Generate hash
# 7. Submit to blockchain
# 8. Check Etherscan
```

## 🐛 Troubleshooting

| Error | Fix |
|-------|-----|
| "Simulated transaction" | Set WEB3_PROVIDER_URL |
| "Insufficient funds" | Fund reward wallet |
| "Invalid hash" | Check image processing |
| "Wallet not found" | Ensure wallet creation works |

## 📈 Monitoring

```bash
# Check wallet balance
etherscan.io/address/YOUR_WALLET

# View transactions
etherscan.io/tx/TRANSACTION_HASH

# Check Firestore
Firebase Console → blockchain_rewards
```

## 🔄 Transaction Status

- **pending** - Created, not sent
- **processing** - Sent, awaiting confirmation
- **completed** - Confirmed on blockchain
- **failed** - Transaction failed
- **simulated** - Wallet not configured

## 💡 Tips

1. **Test on Testnet First**
   - Use Sepolia testnet
   - Get free ETH from faucet
   - Change RPC URL to testnet

2. **Monitor Wallet**
   - Check balance daily
   - Refill when low
   - Set up alerts

3. **Check Logs**
   - Backend console for details
   - Look for "📤 Transaction sent:"
   - Check Firestore records

## 📚 Documentation

- **Setup**: `SETUP_CHECKLIST.md`
- **Details**: `REAL_ETH_INTEGRATION_GUIDE.md`
- **Summary**: `INTEGRATION_SUMMARY.md`
- **Flows**: `BLOCKCHAIN_FLOW_DIAGRAM.md`

## ✅ Verification Checklist

- [ ] .env variables set
- [ ] Backend starts without errors
- [ ] Camera works
- [ ] Hash generates
- [ ] Wallet created
- [ ] ETH transferred
- [ ] Etherscan shows transaction
- [ ] Firestore record created

## 🎯 Next Steps

1. Get Infura API key
2. Create reward wallet
3. Configure .env
4. Fund wallet
5. Test integration
6. Monitor & maintain

## 📞 Support

- Check server logs
- Check browser console (F12)
- Verify .env variables
- Test wallet on Etherscan
- Check Firestore records

---

**Status**: ✅ Integration Complete
**Ready**: ⏳ Awaiting Environment Configuration
**Time to Setup**: 20-30 minutes

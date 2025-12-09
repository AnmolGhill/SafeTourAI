# SafeTourAI Blockchain Reward Flow Diagrams

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN REWARD SYSTEM FLOW                        │
└─────────────────────────────────────────────────────────────────────────┘

                              FRONTEND (React)
                         ┌──────────────────────┐
                         │  BlockchainReward    │
                         │      Component       │
                         └──────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
              ┌─────▼──────┐  ┌────▼─────┐  ┌────▼──────┐
              │   Camera   │  │  Upload  │  │  Generate │
              │   Modal    │  │  Image   │  │   Hash    │
              └────────────┘  └──────────┘  └───────────┘
                    │              │              │
                    └──────────────┼──────────────┘
                                   │
                         ┌─────────▼────────────┐
                         │ Check Wallet Status  │
                         │ /api/wallet/info     │
                         └─────────┬────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
              Wallet Exists?                 Wallet Missing?
                    │                             │
                    │                    ┌────────▼────────┐
                    │                    │ Create Wallet   │
                    │                    │ /api/wallet/    │
                    │                    │ create          │
                    │                    └────────┬────────┘
                    │                             │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  Submit Image Reward       │
                    │  /api/blockchain/submit-   │
                    │  image-reward              │
                    └──────────────┬──────────────┘
                                   │
                         ┌─────────▼────────────┐
                         │  BACKEND (Node.js)   │
                         └─────────┬────────────┘
                                   │
```

## Backend Reward Processing

```
┌────────────────────────────────────────────────────────────────┐
│         BACKEND REWARD SUBMISSION FLOW                         │
└────────────────────────────────────────────────────────────────┘

POST /api/blockchain/submit-image-reward
         │
         ├─ Validate Request
         │  ├─ Check SHA-256 format (64 hex chars)
         │  ├─ Check phash exists
         │  └─ Check clarity_score (0-100)
         │
         ├─ Get User Data
         │  ├─ Fetch from Firebase
         │  └─ Get walletAddress
         │
         ├─ Calculate Reward
         │  ├─ Base: 0.001 ETH
         │  ├─ If clarity >= 80: +0.0005 ETH
         │  ├─ If clarity >= 60: +0.0002 ETH
         │  └─ Total = base + bonus
         │
         ├─ Create Firestore Record
         │  ├─ Collection: blockchain_rewards
         │  ├─ Store: sha256, phash, clarity_score
         │  ├─ Store: walletAddress, rewardAmount
         │  └─ Status: pending
         │
         ├─ Send ETH Transaction
         │  ├─ Check REWARD_WALLET_PRIVATE_KEY
         │  ├─ Create ethers.Wallet
         │  ├─ Convert reward to Wei
         │  ├─ Send transaction to user's wallet
         │  └─ Get transaction hash
         │
         ├─ Update Firestore Record
         │  ├─ Set transactionHash
         │  ├─ Set status: processing
         │  └─ Update timestamp
         │
         └─ Return Response
            ├─ record_id
            ├─ transaction_hash
            ├─ reward_amount
            ├─ clarity_bonus
            ├─ wallet_address
            └─ status

```

## Wallet Creation Flow

```
┌────────────────────────────────────────────────────────────────┐
│         DETERMINISTIC WALLET CREATION                          │
└────────────────────────────────────────────────────────────────┘

GET /api/wallet/create
         │
         ├─ Get User Email from Firebase
         │
         ├─ Generate Deterministic Seed
         │  ├─ Input: email + userId + WALLET_SECRET
         │  ├─ Hash: SHA-256
         │  └─ Output: 256-bit entropy
         │
         ├─ Generate BIP39 Mnemonic
         │  ├─ From entropy
         │  └─ 12-word seed phrase
         │
         ├─ Generate HD Wallet
         │  ├─ Path: m/44'/60'/0'/0/0
         │  ├─ Derive private key
         │  └─ Derive public address
         │
         ├─ Create ethers.Wallet
         │  ├─ Private key + Infura provider
         │  └─ Get Ethereum address
         │
         ├─ Store in Firebase
         │  ├─ walletAddress
         │  ├─ blockchainId
         │  ├─ walletCreated: true
         │  └─ walletCreatedAt
         │
         └─ Return to Frontend
            ├─ address
            ├─ balance
            ├─ network
            └─ createdAt

Key Feature: Same user always gets same wallet address!
(Deterministic from email + userId)
```

## Transaction Flow on Blockchain

```
┌────────────────────────────────────────────────────────────────┐
│         ETHEREUM TRANSACTION FLOW                              │
└────────────────────────────────────────────────────────────────┘

1. Transaction Created
   ├─ From: Reward Wallet (0x742d...)
   ├─ To: User's Wallet (0xabcd...)
   ├─ Value: 0.001-0.0015 ETH
   ├─ Gas Limit: 21,000
   └─ Gas Price: Current network rate

2. Transaction Signed
   ├─ Sign with REWARD_WALLET_PRIVATE_KEY
   └─ Create transaction hash

3. Transaction Submitted to Network
   ├─ Send to Infura RPC endpoint
   ├─ Broadcast to Ethereum nodes
   └─ Status: Pending

4. Transaction in Mempool
   ├─ Waiting for miner/validator
   ├─ Can take 15-30 seconds
   └─ Status: Pending

5. Transaction Included in Block
   ├─ Miner/validator includes in block
   ├─ Block created (~12 seconds)
   └─ Status: 1 Confirmation

6. More Confirmations
   ├─ Each new block = 1 confirmation
   ├─ After 12 confirmations = finalized
   ├─ Takes ~3 minutes
   └─ Status: Confirmed

7. Transaction Complete
   ├─ ETH received in user's wallet
   ├─ Visible on Etherscan
   ├─ Firestore updated
   └─ Status: Completed

```

## Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│              DATA FLOW ARCHITECTURE                            │
└────────────────────────────────────────────────────────────────┘

                         FRONTEND
                    ┌──────────────┐
                    │   Browser    │
                    │   (React)    │
                    └──────┬───────┘
                           │
                    Image Upload/Capture
                           │
                    ┌──────▼───────┐
                    │ Image Hasher │
                    │ (SHA-256)    │
                    └──────┬───────┘
                           │
                    Hash Data (JSON)
                           │
                    ┌──────▼───────────────────────────┐
                    │         BACKEND                  │
                    │      (Node.js/Express)           │
                    └──────┬───────────────────────────┘
                           │
                ┌──────────┼──────────┐
                │          │          │
         ┌──────▼──┐  ┌────▼────┐  ┌─▼──────────┐
         │Firebase │  │ Infura  │  │ Ethers.js  │
         │(Users)  │  │(RPC)    │  │(Wallet)    │
         └──────┬──┘  └────┬────┘  └─┬──────────┘
                │          │         │
         ┌──────▼──────────▼─────────▼──┐
         │   Ethereum Blockchain        │
         │   (Mainnet/Testnet)          │
         └──────┬───────────────────────┘
                │
         ┌──────▼──────────────┐
         │ Etherscan Explorer  │
         │ (Verification)      │
         └─────────────────────┘

         ┌──────────────────────────────────┐
         │   Firestore Database             │
         │   (blockchain_rewards collection)│
         └──────────────────────────────────┘

```

## State Transitions

```
┌────────────────────────────────────────────────────────────────┐
│         REWARD RECORD STATE MACHINE                            │
└────────────────────────────────────────────────────────────────┘

                    ┌─────────────┐
                    │   PENDING   │
                    │ (Created)   │
                    └──────┬──────┘
                           │
                    Send Transaction
                           │
                    ┌──────▼──────────┐
                    │  PROCESSING     │
                    │ (Tx Submitted)  │
                    └──────┬──────────┘
                           │
                    Wait for Confirmation
                           │
                    ┌──────▼──────────┐
                    │  COMPLETED      │
                    │ (Confirmed)     │
                    └─────────────────┘

Alternative Paths:

PENDING ──(No Wallet)──> FAILED
PENDING ──(Insufficient Funds)──> FAILED
PENDING ──(No Config)──> SIMULATED
PROCESSING ──(Network Error)──> FAILED

```

## Reward Calculation Logic

```
┌────────────────────────────────────────────────────────────────┐
│         REWARD CALCULATION ALGORITHM                           │
└────────────────────────────────────────────────────────────────┘

Input: clarity_score (0-100)

Step 1: Base Reward
        baseReward = 0.001 ETH

Step 2: Calculate Clarity Bonus
        if (clarity_score >= 80) {
            clarityBonus = 0.0005 ETH  // High quality
        } else if (clarity_score >= 60) {
            clarityBonus = 0.0002 ETH  // Medium quality
        } else {
            clarityBonus = 0 ETH       // Low quality
        }

Step 3: Total Reward
        totalReward = baseReward + clarityBonus

Step 4: Convert to Wei
        rewardWei = ethers.parseEther(totalReward.toString())

Step 5: Send Transaction
        tx = await wallet.sendTransaction({
            to: userWalletAddress,
            value: rewardWei
        })

Output: transactionHash

Examples:
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Clarity %    │ Base Reward  │ Bonus        │ Total        │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ 95%          │ 0.001 ETH    │ 0.0005 ETH   │ 0.0015 ETH   │
│ 85%          │ 0.001 ETH    │ 0.0005 ETH   │ 0.0015 ETH   │
│ 80%          │ 0.001 ETH    │ 0.0005 ETH   │ 0.0015 ETH   │
│ 75%          │ 0.001 ETH    │ 0.0002 ETH   │ 0.0012 ETH   │
│ 60%          │ 0.001 ETH    │ 0.0002 ETH   │ 0.0012 ETH   │
│ 50%          │ 0.001 ETH    │ 0 ETH        │ 0.001 ETH    │
│ 30%          │ 0.001 ETH    │ 0 ETH        │ 0.001 ETH    │
└──────────────┴──────────────┴──────────────┴──────────────┘

```

## API Request/Response Cycle

```
┌────────────────────────────────────────────────────────────────┐
│         API COMMUNICATION FLOW                                 │
└────────────────────────────────────────────────────────────────┘

FRONTEND                          BACKEND
   │                                │
   │  POST /api/blockchain/         │
   │  submit-image-reward           │
   │  (with auth token)             │
   ├───────────────────────────────>│
   │                                │
   │                         Validate Request
   │                                │
   │                         Get User Data
   │                                │
   │                         Calculate Reward
   │                                │
   │                         Create DB Record
   │                                │
   │                         Send ETH Transaction
   │                                │
   │                         Update DB Record
   │                                │
   │  200 OK                        │
   │  {                             │
   │    success: true,              │
   │    message: "...",             │
   │    data: {                     │
   │      record_id: "...",         │
   │      transaction_hash: "0x...",│
   │      reward_amount: 0.0015,    │
   │      clarity_bonus: 0.0005,    │
   │      wallet_address: "0x...",  │
   │      status: "processing",     │
   │      timestamp: "2024-..."     │
   │    }                           │
   │  }                             │
   │<───────────────────────────────┤
   │                                │
   Display Reward Confirmation
   Show Transaction Hash
   Provide Etherscan Link
   │                                │

```

## Error Handling Flow

```
┌────────────────────────────────────────────────────────────────┐
│         ERROR HANDLING FLOW                                    │
└────────────────────────────────────────────────────────────────┘

Request Received
       │
       ├─ Validate Hash Format
       │  └─ If Invalid ──> 400 Bad Request
       │
       ├─ Check User Exists
       │  └─ If Not ──> 404 Not Found
       │
       ├─ Check Wallet Configured
       │  └─ If Not ──> 400 Bad Request
       │
       ├─ Create Firestore Record
       │  └─ If Fails ──> 500 Server Error
       │
       ├─ Send ETH Transaction
       │  ├─ If No Config ──> Use Simulated Mode
       │  ├─ If Insufficient Funds ──> 500 Server Error
       │  ├─ If Network Error ──> 500 Server Error
       │  └─ If Success ──> Continue
       │
       ├─ Update Firestore
       │  └─ If Fails ──> 500 Server Error
       │
       └─ Return Success Response

All errors logged to:
- Server console
- Backend logs
- Error tracking service (optional)

```

## Summary

This blockchain reward system provides:

✅ **Complete Integration** - Frontend to blockchain
✅ **Real Transactions** - Actual ETH transfers
✅ **Deterministic Wallets** - Same wallet per user
✅ **Transparent Tracking** - Firestore + Etherscan
✅ **Error Handling** - Graceful fallbacks
✅ **Security** - Private keys in environment only

---

**For detailed setup instructions, see: `SETUP_CHECKLIST.md`**
**For complete documentation, see: `REAL_ETH_INTEGRATION_GUIDE.md`**

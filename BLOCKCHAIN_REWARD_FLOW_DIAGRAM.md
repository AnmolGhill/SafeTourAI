# Blockchain Reward System - Flow Diagrams

## 1. Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER STARTS HERE                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Open App        │
                    │  Navigate to     │
                    │  Blockchain      │
                    │  Reward Page     │
                    └──────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
        ┌──────────────┐          ┌──────────────┐
        │ Upload Image │          │ Take Photo   │
        │ from Device  │          │ with Camera  │
        └──────────────┘          └──────────────┘
                │                           │
                └─────────────┬─────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Frontend:        │
                    │ Generate SHA-256 │
                    │ Calculate        │
                    │ Clarity Score    │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Display Hash     │
                    │ Data to User     │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ User Clicks      │
                    │ "Submit to       │
                    │ Blockchain"      │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Frontend:        │
                    │ Check Wallet     │
                    │ Status           │
                    └──────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
        ┌──────────────┐          ┌──────────────┐
        │ Wallet       │          │ Wallet       │
        │ Exists?      │          │ Doesn't      │
        │ YES          │          │ Exist        │
        └──────────────┘          └──────────────┘
                │                           │
                │                           ▼
                │                  ┌──────────────┐
                │                  │ Create       │
                │                  │ Deterministic│
                │                  │ Wallet       │
                │                  └──────────────┘
                │                           │
                └─────────────┬─────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Submit Reward    │
                    │ Request with:    │
                    │ - SHA-256 hash   │
                    │ - Clarity score  │
                    │ - File info      │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Backend:         │
                    │ Validate Hash    │
                    │ Calculate Reward │
                    │ Save to Firestore│
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Send ETH to      │
                    │ User's Wallet    │
                    │ (Real or         │
                    │ Simulated)       │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Update Firestore │
                    │ with TX Hash     │
                    │ and Status       │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Frontend:        │
                    │ Display Success  │
                    │ with TX Hash &   │
                    │ Etherscan Link   │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ User Views       │
                    │ Transaction on   │
                    │ Etherscan        │
                    └──────────────────┘
```

## 2. Wallet Creation Flow

```
┌──────────────────────────────────────────────────┐
│  User Submits Reward (First Time)                │
└──────────────────────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────┐
        │ Frontend Checks Wallet  │
        │ GET /api/wallet/info    │
        └─────────────────────────┘
                      │
                      ▼
              ┌───────────────┐
              │ Wallet Found? │
              └───────────────┘
                      │
        ┌─────────────┴─────────────┐
        │ NO                        │ YES
        ▼                           ▼
┌──────────────────┐       ┌──────────────────┐
│ Create Wallet    │       │ Use Existing     │
│ GET /api/wallet/ │       │ Wallet           │
│ create           │       │                  │
└──────────────────┘       └──────────────────┘
        │                           │
        ▼                           │
┌──────────────────────────────┐   │
│ Backend:                     │   │
│ 1. Get user email from DB    │   │
│ 2. Get user Firebase UID     │   │
│ 3. Create seed from:         │   │
│    - Email                   │   │
│    - UID                     │   │
│    - App Secret              │   │
│ 4. Generate HD wallet        │   │
│ 5. Derive Ethereum address   │   │
│ 6. Store in user document    │   │
└──────────────────────────────┘   │
        │                           │
        └─────────────┬─────────────┘
                      │
                      ▼
        ┌─────────────────────────┐
        │ Return Wallet Address   │
        │ to Frontend             │
        └─────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────┐
        │ Frontend Stores Wallet  │
        │ Address Locally         │
        └─────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────┐
        │ Proceed with Reward     │
        │ Submission              │
        └─────────────────────────┘
```

## 3. Reward Calculation & Transaction

```
┌────────────────────────────────────────────┐
│  Backend Receives Reward Request           │
│  - SHA-256 hash                            │
│  - Clarity score (0-100)                   │
│  - File info                               │
└────────────────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────┐
        │ Validate SHA-256 Hash   │
        │ - Must be 64 chars      │
        │ - Must be hex (a-f,0-9) │
        └─────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────┐
        │ Calculate Reward Amount │
        └─────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
    ┌────────┐              ┌──────────────┐
    │ Base   │              │ Clarity      │
    │ 0.001  │              │ Bonus        │
    │ ETH    │              └──────────────┘
    └────────┘                      │
        │                ┌──────────┴──────────┐
        │                │                     │
        │                ▼                     ▼
        │        ┌──────────────┐      ┌──────────────┐
        │        │ Score >= 80  │      │ Score >= 60  │
        │        │ +0.0005 ETH  │      │ +0.0002 ETH  │
        │        └──────────────┘      └──────────────┘
        │                │                     │
        └────────┬───────┴─────────────────────┘
                 │
                 ▼
        ┌─────────────────────────┐
        │ Total Reward Amount     │
        │ = Base + Bonus          │
        └─────────────────────────┘
                 │
                 ▼
        ┌─────────────────────────┐
        │ Create Firestore Record │
        │ - SHA-256 hash          │
        │ - Clarity score         │
        │ - Reward amount         │
        │ - Wallet address        │
        │ - Status: pending       │
        └─────────────────────────┘
                 │
                 ▼
        ┌─────────────────────────┐
        │ Check Configuration     │
        │ REWARD_WALLET_PRIVATE   │
        │ _KEY exists?            │
        └─────────────────────────┘
                 │
        ┌────────┴────────┐
        │ YES             │ NO
        ▼                 ▼
    ┌────────┐      ┌──────────────┐
    │ Real   │      │ Simulated    │
    │ TX     │      │ TX (use      │
    │        │      │ SHA-256 as   │
    │        │      │ hash)        │
    └────────┘      └──────────────┘
        │                 │
        ▼                 │
    ┌────────────────┐    │
    │ Create Wallet  │    │
    │ Instance from  │    │
    │ Private Key    │    │
    └────────────────┘    │
        │                 │
        ▼                 │
    ┌────────────────┐    │
    │ Convert ETH    │    │
    │ to Wei         │    │
    └────────────────┘    │
        │                 │
        ▼                 │
    ┌────────────────┐    │
    │ Send TX to     │    │
    │ User's Wallet  │    │
    └────────────────┘    │
        │                 │
        ▼                 │
    ┌────────────────┐    │
    │ Get TX Hash    │    │
    │ from Blockchain│    │
    └────────────────┘    │
        │                 │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────────────┐
        │ Update Firestore Record │
        │ - TX Hash               │
        │ - Status: processing    │
        │ - Timestamp             │
        └─────────────────────────┘
                 │
                 ▼
        ┌─────────────────────────┐
        │ Return Response to      │
        │ Frontend with:          │
        │ - TX Hash               │
        │ - Reward Amount         │
        │ - Wallet Address        │
        │ - Status                │
        └─────────────────────────┘
```

## 4. Data Storage in Firestore

```
┌─────────────────────────────────────────────────────┐
│  Firestore Collections                              │
└─────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Collection: users                                   │
├──────────────────────────────────────────────────────┤
│  Document: {userId}                                  │
│  ├─ uid: "firebase_uid"                             │
│  ├─ email: "user@example.com"                       │
│  ├─ walletAddress: "0x..." ◄─────────────┐          │
│  ├─ blockchainId: "0x..." ◄──────────┐   │          │
│  ├─ walletCreated: true              │   │          │
│  └─ walletCreatedAt: Timestamp       │   │          │
└──────────────────────────────────────┼───┼──────────┘
                                       │   │
                                       │   │
┌──────────────────────────────────────┼───┼──────────┐
│  Collection: blockchain_rewards      │   │          │
├──────────────────────────────────────┼───┼──────────┤
│  Document: {recordId}                │   │          │
│  ├─ userId: "firebase_uid"           │   │          │
│  ├─ sha256: "a1b2c3d4..." ◄──────────┼───┼──┐       │
│  ├─ phash: "1234abcd..."             │   │  │       │
│  ├─ clarity_score: 85                │   │  │       │
│  ├─ file_name: "photo.jpg"           │   │  │       │
│  ├─ file_size: 102400                │   │  │       │
│  ├─ file_type: "image/jpeg"          │   │  │       │
│  ├─ timestamp: Timestamp             │   │  │       │
│  ├─ walletAddress: "0x..." ◄─────────┘   │  │       │
│  ├─ rewardAmount: 0.0015             │      │       │
│  ├─ clarityBonus: 0.0005             │      │       │
│  ├─ status: "processing"             │      │       │
│  ├─ transactionHash: "0x..." ◄───────┼──────┼──┐    │
│  ├─ createdAt: Timestamp             │      │  │    │
│  └─ updatedAt: Timestamp             │      │  │    │
└──────────────────────────────────────────────┼──┼────┘
                                               │  │
                                               │  │
                                    ┌──────────┘  │
                                    │             │
                                    ▼             ▼
                        ┌──────────────────────────────┐
                        │  Ethereum Blockchain         │
                        ├──────────────────────────────┤
                        │  Transaction Hash: 0x...     │
                        │  From: 0x... (reward wallet) │
                        │  To: 0x... (user wallet)     │
                        │  Value: 0.0015 ETH           │
                        │  Gas Used: 21000             │
                        │  Block: 18500000             │
                        │  Status: Confirmed           │
                        └──────────────────────────────┘
                                    │
                                    ▼
                        ┌──────────────────────────────┐
                        │  Etherscan                   │
                        │  (Public Verification)       │
                        │  https://etherscan.io/tx/... │
                        └──────────────────────────────┘
```

## 5. API Request/Response Flow

```
┌─────────────────────────────────────────────────────┐
│  Frontend                                           │
└─────────────────────────────────────────────────────┘
                      │
                      │ 1. POST /api/blockchain/submit-image-reward
                      │    {
                      │      sha256: "a1b2c3d4...",
                      │      phash: "1234abcd...",
                      │      clarity_score: 85,
                      │      file_name: "photo.jpg",
                      │      file_size: 102400,
                      │      file_type: "image/jpeg",
                      │      timestamp: "2024-12-08T..."
                      │    }
                      ▼
┌─────────────────────────────────────────────────────┐
│  Backend (blockchainRewardRoutes.js)                │
├─────────────────────────────────────────────────────┤
│  1. Extract userId from auth token                  │
│  2. Validate SHA-256 hash format                    │
│  3. Get user wallet from Firestore                  │
│  4. Calculate reward amount                         │
│  5. Create Firestore record                         │
│  6. Send ETH transaction (if wallet configured)     │
│  7. Update record with TX hash                      │
│  8. Return response                                 │
└─────────────────────────────────────────────────────┘
                      │
                      │ 2. Response
                      │    {
                      │      success: true,
                      │      data: {
                      │        record_id: "doc_id",
                      │        transaction_hash: "0x...",
                      │        reward_amount: 0.0015,
                      │        clarity_bonus: 0.0005,
                      │        wallet_address: "0x...",
                      │        status: "processing"
                      │      }
                      │    }
                      ▼
┌─────────────────────────────────────────────────────┐
│  Frontend                                           │
├─────────────────────────────────────────────────────┤
│  1. Display success message                         │
│  2. Show transaction hash                           │
│  3. Show reward amount                              │
│  4. Provide Etherscan link                          │
│  5. Allow user to view on blockchain                │
└─────────────────────────────────────────────────────┘
```

## 6. Error Handling Flow

```
┌──────────────────────────────────────────┐
│  Request Received                        │
└──────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ Validate Hash      │
        │ Format             │
        └────────────────────┘
                 │
        ┌────────┴────────┐
        │ VALID           │ INVALID
        ▼                 ▼
    ┌────────┐      ┌──────────────┐
    │Continue│      │ Return 400   │
    │        │      │ "Invalid     │
    │        │      │ SHA-256      │
    │        │      │ format"      │
    └────────┘      └──────────────┘
        │
        ▼
    ┌────────────────────┐
    │ Get User Wallet    │
    └────────────────────┘
        │
    ┌───┴───┐
    │       │
    ▼       ▼
┌────┐  ┌──────────────┐
│OK  │  │ NOT FOUND    │
└────┘  └──────────────┘
    │       │
    │       ▼
    │   ┌──────────────┐
    │   │ Try Create   │
    │   │ Wallet       │
    │   └──────────────┘
    │       │
    │   ┌───┴───┐
    │   │       │
    │   ▼       ▼
    │ ┌──┐  ┌──────────┐
    │ │OK│  │ FAILED   │
    │ └──┘  └──────────┘
    │   │       │
    │   │       ▼
    │   │   ┌──────────────┐
    │   │   │ Return 400   │
    │   │   │ "Wallet      │
    │   │   │ setup        │
    │   │   │ failed"      │
    │   │   └──────────────┘
    │   │
    └───┴───┐
            │
            ▼
    ┌────────────────────┐
    │ Calculate Reward   │
    │ & Save to DB       │
    └────────────────────┘
            │
            ▼
    ┌────────────────────┐
    │ Send ETH           │
    │ Transaction        │
    └────────────────────┘
            │
        ┌───┴───┐
        │       │
        ▼       ▼
    ┌────┐  ┌──────────────┐
    │OK  │  │ FAILED       │
    └────┘  └──────────────┘
        │       │
        │       ▼
        │   ┌──────────────┐
        │   │ Log Error    │
        │   │ Update DB    │
        │   │ Status:      │
        │   │ "failed"     │
        │   └──────────────┘
        │       │
        └───┬───┘
            │
            ▼
    ┌────────────────────┐
    │ Return Response    │
    │ (Success or Error) │
    └────────────────────┘
```

## 7. Status Lifecycle

```
┌──────────────────────────────────────────────────────┐
│  Reward Status Lifecycle                             │
└──────────────────────────────────────────────────────┘

    ┌─────────────┐
    │  PENDING    │  ◄─── Record created, awaiting processing
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │ PROCESSING  │  ◄─── Transaction sent to blockchain
    └──────┬──────┘
           │
      ┌────┴────┐
      │          │
      ▼          ▼
┌──────────┐  ┌──────────┐
│COMPLETED │  │  FAILED  │  ◄─── Transaction confirmed/failed
└──────────┘  └──────────┘

Alternative Path (No Real Wallet):
    ┌─────────────┐
    │  PENDING    │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │ SIMULATED   │  ◄─── Using SHA-256 as TX hash
    └─────────────┘
```

## 8. Key Data Relationships

```
User (Firebase)
  │
  ├─ uid: "user123"
  ├─ email: "user@example.com"
  └─ walletAddress: "0x..." ◄─────────────┐
                                           │
                                           │
Image Upload                               │
  │                                        │
  ├─ file: image.jpg                      │
  ├─ sha256: "a1b2c3d4..." ◄──┐           │
  └─ clarity_score: 85         │          │
                                │          │
                                │          │
Blockchain Reward Record        │          │
  │                             │          │
  ├─ sha256: "a1b2c3d4..." ◄────┘          │
  ├─ clarity_score: 85                    │
  ├─ rewardAmount: 0.0015                 │
  ├─ walletAddress: "0x..." ◄─────────────┘
  ├─ transactionHash: "0xTX..."           │
  └─ status: "processing"                 │
                                           │
                                           │
Ethereum Blockchain                        │
  │                                        │
  ├─ Transaction Hash: "0xTX..."          │
  ├─ From: "0x..." (reward wallet)        │
  ├─ To: "0x..." ◄─────────────────────────┘
  ├─ Value: 0.0015 ETH
  └─ Status: Confirmed

User's Wallet
  │
  ├─ Address: "0x..."
  ├─ Balance: +0.0015 ETH
  └─ Transaction: Confirmed on Etherscan
```

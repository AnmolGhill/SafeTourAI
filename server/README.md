# SafeTourAI Backend Server

A comprehensive Node.js backend server for SafeTourAI - an emergency response and safety management system with blockchain integration, Firebase notifications, and real-time location tracking.

## 🚀 Features

- **Authentication & Authorization**: JWT + Firebase Auth with role-based access control
- **Emergency Management**: Real-time SOS alerts with location tracking
- **Blockchain Integration**: Transaction recording with local blockchain + Web3 support
- **Notification System**: Firebase push notifications + email alerts
- **Location Services**: Geospatial queries for nearby users and responders
- **User Management**: Comprehensive profile and emergency contact management
- **Security**: Rate limiting, input validation, and secure password hashing

## 📁 Project Structure

```
server/
├── config/
│   ├── db.js                 # MongoDB connection
│   ├── firebase.js           # Firebase Admin SDK setup
│   └── blockchain.js         # Blockchain configuration
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── userController.js     # User management
│   ├── emergencyController.js # Emergency operations
│   ├── blockchainController.js # Blockchain transactions
│   └── notificationController.js # Notification services
├── models/
│   ├── User.js              # User schema with unique IDs
│   ├── Emergency.js         # Emergency schema
│   ├── Transaction.js       # Blockchain transaction schema
│   └── Otp.js              # OTP verification schema
├── routes/
│   ├── authRoutes.js        # Authentication endpoints
│   ├── userRoutes.js        # User management endpoints
│   ├── emergencyRoutes.js   # Emergency endpoints
│   ├── blockchainRoutes.js  # Blockchain endpoints
│   └── notificationRoutes.js # Notification endpoints
├── middleware/
│   ├── authMiddleware.js    # JWT/Firebase authentication
│   └── roleMiddleware.js    # Role-based access control
├── utils/
│   ├── generateId.js        # Unique ID generation (USR, EMG, TXN)
│   ├── generateOtp.js       # OTP generation utilities
│   └── sendEmail.js         # Email service configuration
├── server.js               # Main server entry point
├── package.json            # Dependencies and scripts
├── .env.example           # Environment variables template
└── README.md              # This file
```

## 🛠️ Installation & Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your actual configuration values:

```env
# Required configurations
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/safetour_ai
JWT_SECRET=your_super_secret_jwt_key_here

# Firebase configuration (get from Firebase Console)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com

# Email configuration (Gmail example)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
```

### 3. Database Setup

Ensure MongoDB is running on your system:

```bash
# Start MongoDB (if using local installation)
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication and Cloud Messaging
3. Generate a service account key (JSON)
4. Extract the required fields for your `.env` file

### 5. Start the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/verify-otp` | Verify email OTP |
| POST | `/auth/login` | User login |
| POST | `/auth/firebase-login` | Firebase authentication |
| POST | `/auth/resend-otp` | Resend OTP |
| POST | `/auth/logout` | User logout |
| GET | `/auth/me` | Get current user |

### User Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/:userId` | Get user profile |
| PUT | `/users/:userId` | Update user profile |
| PUT | `/users/:userId/location` | Update user location |
| GET | `/users/:userId/dashboard` | Get user dashboard |
| POST | `/users/:userId/emergency-contacts` | Add emergency contact |
| DELETE | `/users/:userId/emergency-contacts/:contactId` | Remove emergency contact |
| GET | `/users/nearby/users` | Get nearby users |
| GET | `/users/nearby/responders` | Get nearby responders |

### Emergency Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/emergencies/create` | Create emergency (SOS) |
| GET | `/emergencies/user/:userId` | Get user emergencies |
| GET | `/emergencies/nearby` | Get nearby emergencies |
| GET | `/emergencies/:emergencyId` | Get emergency details |
| PUT | `/emergencies/:emergencyId/status` | Update emergency status |
| POST | `/emergencies/:emergencyId/assign-responder` | Assign responder |

### Blockchain Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/blockchain/transaction` | Create blockchain transaction |
| GET | `/blockchain/user/:userId` | Get user transactions |
| GET | `/blockchain/emergency/:emergencyId` | Get emergency transactions |
| GET | `/blockchain/hash/:hash` | Get transaction by hash |

### Notification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/notifications/firebase` | Send Firebase notification |
| POST | `/notifications/email` | Send email notification |
| POST | `/notifications/emergency-contacts` | Notify emergency contacts |
| POST | `/notifications/nearby-responders` | Notify nearby responders |

## 🔐 Authentication

The API supports two authentication methods:

### 1. JWT Authentication
```bash
Authorization: Bearer <jwt_token>
```

### 2. Firebase Authentication
```bash
Authorization: Bearer <firebase_id_token>
```

## 👥 User Roles

- **admin**: Full system access
- **responder**: Emergency response capabilities
- **user**: Standard user access

## 🆔 Unique ID System

The system generates unique IDs with prefixes:
- **USR_**: User IDs
- **EMG_**: Emergency IDs
- **TXN_**: Transaction IDs
- **NOT_**: Notification IDs

## 🔗 Blockchain Integration

- **Local Blockchain**: Simple proof-of-work blockchain for transaction recording
- **Web3 Support**: Optional integration with external blockchains
- **Transaction Types**: emergency_created, emergency_updated, responder_assigned, emergency_resolved

## 📧 Email Templates

Pre-built email templates for:
- OTP verification
- Welcome messages
- Emergency alerts
- Password reset

## 🚨 Emergency Workflow

1. User creates emergency via `/emergencies/create`
2. System records transaction on blockchain
3. Emergency contacts are notified via email
4. Nearby responders receive push notifications
5. Responders can be assigned via `/emergencies/:id/assign-responder`
6. Status updates are tracked with blockchain transactions

## 🛡️ Security Features

- **Rate Limiting**: 1000 requests per 15 minutes per IP/user
- **Input Validation**: Mongoose schema validation
- **Password Hashing**: bcrypt with salt rounds
- **JWT Security**: Configurable expiration and secret
- **Role-based Access**: Middleware for endpoint protection

## 📱 Firebase Integration

- **Push Notifications**: Real-time emergency alerts
- **Authentication**: Firebase ID token verification
- **Cloud Messaging**: Multicast notifications to responders

## 🗄️ Database Schema

### User Model
```javascript
{
  userId: "USR_123456_ABC123",
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  role: "user|responder|admin",
  location: {
    type: "Point",
    coordinates: [longitude, latitude],
    address: "123 Main St"
  },
  emergencyContacts: [...],
  preferences: {...}
}
```

### Emergency Model
```javascript
{
  emergencyId: "EMG_123456_ABC123",
  userId: "USR_123456_ABC123",
  type: "medical|accident|crime|fire|natural_disaster|other",
  severity: "low|medium|high|critical",
  status: "active|responded|resolved|cancelled",
  location: {...},
  responders: [...],
  timeline: [...]
}
```

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/safetour_ai
JWT_SECRET=your_production_jwt_secret
# ... other production configs
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Health check
curl http://localhost:5000/health
```

## 📊 Monitoring

- Health check endpoint: `/health`
- API documentation: `/api/docs`
- Error logging with stack traces in development
- Request/response logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/api/docs`
- Review the health check at `/health`

---

**SafeTourAI Backend** - Empowering safe travels through technology 🌟

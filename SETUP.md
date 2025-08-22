# 🚀 ServeAThon Backend Setup Guide

A comprehensive NestJS backend with Firebase integration, JWT authentication, and Gemini AI chat support.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Firebase Setup](#firebase-setup)
- [Gemini AI Setup](#gemini-ai-setup)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Features](#features)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Firebase Project** (for database and authentication)
- **Google Gemini API Key** (for AI chat functionality)
- **Git** (for version control)

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd ServeAThon
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install additional dependencies:**
   ```bash
   npm install dotenv
   ```

## ⚙️ Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
HOST=0.0.0.0
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Firebase Private Key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-firebase-client-email@your-project.iam.gserviceaccount.com

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# CORS Configuration
CORS_ORIGIN=*
CORS_CREDENTIALS=true
```

## 🔥 Firebase Setup

1. **Create a Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select existing one

2. **Enable Firestore Database:**
   - Go to Firestore Database in Firebase Console
   - Create database in production mode
   - Choose a location (recommend: us-central1)

3. **Generate Service Account Key:**
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file
   - Copy the values to your `.env` file

4. **Firestore Rules:**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can read/write their own data
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Posts can be read by anyone, written by authenticated users
       match /posts/{postId} {
         allow read: if true;
         allow write: if request.auth != null;
       }
       
       // Groups can be read/written by authenticated users
       match /groups/{groupId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## 🤖 Gemini AI Setup

1. **Get Gemini API Key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key to your `.env` file

2. **Test Gemini Integration:**
   ```bash
   node test-gemini.js
   ```
   Expected output: `✅ Gemini API is working correctly!`

## 🗄️ Database Setup

The application uses Firebase Firestore with the following collections:

### Collections Structure:

1. **users** - User profiles and authentication data
2. **posts** - Community posts and messages
3. **groups** - Chat groups and group messages
4. **comments** - Post comments
5. **support_messages** - AI chat history

### Indexes (Optional):
The application includes `firestore.indexes.json` for optimized queries.

## 🏃‍♂️ Running the Application

### Development Mode:
```bash
npm run start:dev
```

### Production Build:
```bash
npm run build
npm run start:prod
```

### Testing:
```bash
npm run test
npm run test:e2e
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Posts
- `GET /api/posts` - Get all posts (with community filtering)
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get specific post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Chat/AI Support
- `POST /api/chat/support` - Get AI chat response
- `POST /api/chat/support/stream` - Get streaming AI response

### Groups
- `GET /api/groups` - Get user's groups
- `POST /api/groups` - Create new group
- `POST /api/groups/:id/join` - Join group
- `POST /api/groups/:id/message` - Send group message

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Session management
- User registration and login
- Password hashing with bcrypt

### 💬 AI Chat Integration
- Gemini AI-powered chat support
- Friendly, human-like responses
- Streaming responses for real-time experience
- Conversation history management
- Fallback responses when AI is unavailable

### 📝 Community Features
- Post creation and management
- Community-based filtering
- Comment system
- User profiles

### 👥 Group Chat
- Group creation and management
- Real-time messaging
- Member management

### 🔍 Data Management
- Firebase Firestore integration
- Automatic date normalization
- Community field management
- Data migration tools

## 🛠️ Troubleshooting

### Common Issues:

1. **"GEMINI_API_KEY missing"**
   - Ensure your `.env` file has the correct API key
   - Test with `node test-gemini.js`

2. **Firebase connection errors**
   - Verify your Firebase credentials in `.env`
   - Check if Firestore is enabled in your Firebase project

3. **JWT authentication issues**
   - Ensure `JWT_SECRET` is set in `.env`
   - Check token expiration settings

4. **CORS errors**
   - Update `CORS_ORIGIN` in `.env` for your frontend URL
   - Use `*` for development

5. **Port already in use**
   - Change `PORT` in `.env` file
   - Kill existing processes on the port

### Debug Commands:

```bash
# Check environment variables
node -e "console.log(require('dotenv').config())"

# Test Firebase connection
node -e "const admin = require('./src/config/firebase.config'); console.log('Firebase connected')"

# Test Gemini API
node test-gemini.js

# Check build
npm run build
```

## 📁 Project Structure

```
ServeAThon/
├── src/
│   ├── modules/
│   │   ├── auth/          # Authentication module
│   │   ├── chat/          # AI chat module
│   │   ├── group/         # Group chat module
│   │   ├── post/          # Posts module
│   │   └── user/          # User management
│   ├── common/
│   │   ├── entities/      # Database entities
│   │   ├── guards/        # Authentication guards
│   │   ├── interceptors/  # Response interceptors
│   │   └── middleware/    # Custom middleware
│   ├── config/            # Configuration files
│   └── utils/             # Utility functions
├── test/                  # Test files
├── .env                   # Environment variables
├── package.json           # Dependencies
└── README.md             # Project documentation
```

## 🔄 Migration Tools

### Community Field Migration:
```bash
node migrate-community.js
```

This script backfills missing community fields in existing posts and users.

## 📚 Additional Documentation

- [Backend API Documentation](./BACKEND_DOCS.md)
- [Community Fix Documentation](./COMMUNITY_FIX.md)
- [Gemini Integration Guide](./GEMINI_SETUP.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Happy Coding! 🚀💙**

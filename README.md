# 🚀 ServeAThon Backend

A powerful NestJS backend with Firebase integration, JWT authentication, and Gemini AI chat support.

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
npm install dotenv
```

### 2. Environment Setup
Create `.env` file:
```env
# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-email@project.iam.gserviceaccount.com

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# CORS
CORS_ORIGIN=*
CORS_CREDENTIALS=true
```

### 3. Run Development Server
```bash
npm run start:dev
```

## 🌟 Features

- 🔐 **JWT Authentication** - Secure user registration and login
- 🤖 **Gemini AI Chat** - Friendly AI companion with streaming responses
- 📝 **Community Posts** - Create and manage community posts
- 👥 **Group Chat** - Real-time group messaging
- 🔥 **Firebase Integration** - Scalable NoSQL database
- 📊 **User Analytics** - Login streaks and user statistics

## 🛠️ Key Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/chat/support` - AI chat response
- `POST /api/chat/support/stream` - Streaming AI chat
- `GET /api/posts` - Get community posts
- `POST /api/posts` - Create new post

## 📚 Documentation

- [Complete Setup Guide](./SETUP.md)
- [API Documentation](./BACKEND_DOCS.md)
- [Gemini Integration](./GEMINI_SETUP.md)

## 🧪 Testing

```bash
# Test Gemini API
node test-gemini.js

# Run tests
npm run test
npm run test:e2e
```

## 🚀 Production

```bash
npm run build
npm run start:prod
```

---

**Built with ❤️ using NestJS, Firebase, and Gemini AI**

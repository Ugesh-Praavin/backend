# Authentication Setup Guide

## Overview
This NestJS backend implements a complete authentication system with:
- Username/password registration and login
- JWT-based session tokens
- Session management with token revocation
- Firebase Firestore as the database
- Proper validation and error handling

## Features
✅ **User Registration**: Username/password with validation
✅ **User Login**: Secure authentication with bcrypt
✅ **Session Tokens**: JWT-based with configurable expiration
✅ **Token Refresh**: Automatic token renewal
✅ **Logout**: Token revocation and session cleanup
✅ **Session Middleware**: Automatic session validation
✅ **Error Handling**: Comprehensive error management
✅ **Validation**: Input validation with class-validator

## Environment Variables
Create a `.env` file in the backend directory:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
HOST=0.0.0.0

# Environment
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=*
CORS_CREDENTIALS=false
```

## Firebase Setup
1. Place your `firebase-adminsdk.json` file in the backend directory
2. Ensure the service account has Firestore read/write permissions

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh session token
- `GET /api/auth/profile` - Get user profile (protected)
- `GET /api/auth/streak` - Get user streak (protected)
- `POST /api/auth/validate-token` - Validate token (protected)

### Users
- `GET /api/users/:uid` - Get user by UID
- `GET /api/users/username/:userName` - Get user by username

## Request Examples

### Registration
```json
POST /api/auth/register
{
  "userName": "john_doe",
  "password": "securepassword123"
}
```

### Login
```json
POST /api/auth/login
{
  "userName": "john_doe",
  "password": "securepassword123"
}
```

### Protected Routes
```bash
Authorization: Bearer <your-session-token>
```

## Security Features
- Password hashing with bcrypt
- JWT token validation
- Token revocation on logout
- Input validation and sanitization
- CORS configuration
- Session middleware for all routes

## Running the Application
```bash
# Install dependencies
npm install

# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

## Testing
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

# MoodMingle Backend – Complete Documentation

## Overview

MoodMingle is a NestJS backend using Firebase Firestore, providing a secure, scalable API for mood-based social interaction, group chat, support, and analytics. It features JWT authentication, user management, posts, comments, support, analytics, and group chat.

---

## Features

- User registration, login, and JWT-based authentication
- Posts with mood and category tagging
- Comments and support on posts
- Group chat with anonymous names and mood-based groups
- Analytics endpoints for user activity
- Firestore as the database
- Input validation and error handling
- Soft delete for data integrity

---

## Environment Setup

1. **Clone the repository**
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Environment variables**  
   Create a `.env` file in the backend directory:
   ```
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d
   PORT=5000
   HOST=0.0.0.0
   NODE_ENV=development
   CORS_ORIGIN=*
   CORS_CREDENTIALS=false
   ```
4. **Firebase Setup**
   - Place your `firebase-adminsdk.json` in the backend directory.
   - Ensure the service account has Firestore read/write permissions.

---

## Running the Application

```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

---

## Authentication

- JWT-based, with session tokens and token revocation on logout.
- All endpoints (except auth) require `Authorization: Bearer <token>` header.

---

## API Endpoints

### Authentication

- `POST /auth/register` – Register a new user
- `POST /auth/login` – User login
- `POST /auth/logout` – User logout
- `POST /auth/validate-token` – Validate JWT
- `GET /auth/login-stats` – Get login statistics
- `GET /auth/login-history` – Get complete login history
- `GET /auth/calendar` – Get calendar data

### Users

- `GET /users/:uid` – Get user profile

### Posts

- `POST /posts` – Create a post
- `GET /posts` – Get all posts (with pagination, category, mood filters)
- `GET /posts/search` – Search posts
- `GET /posts/my-posts` – Get my posts
- `GET /posts/:id` – Get post by ID
- `PUT /posts/:id` – Update post
- `DELETE /posts/:id` – Delete post

### Comments

- `POST /posts/:id/comments` – Create comment
- `GET /posts/:id/comments` – Get comments for a post
- `PUT /posts/comments/:commentId` – Update comment
- `DELETE /posts/comments/:commentId` – Delete comment
- `POST /posts/comments/:commentId/like` – Like/unlike comment

### Support

- `POST /posts/:id/support` – Support a post
- `DELETE /posts/:id/support/:supportType` – Remove support
- `GET /posts/:id/support` – Get post support stats
- `GET /posts/support/my-support` – Get my support history
- `GET /posts/support/supported-posts` – Get posts I supported
- `GET /posts/support/trending` – Get trending support types

### Analytics

- `GET /posts/analytics/overview` – Get posts analytics overview

### Group Chat

- `POST /groups` – Create group
- `GET /groups` – Get all groups
- `POST /groups/join` – Join group
- `POST /groups/leave` – Leave group
- `GET /groups/:id/chat` – Get group chat
- `POST /groups/:id/message` – Send message
- `POST /groups/mood` – Get or create mood group
- `POST /groups/:id/change-name` – Change anonymous name
- `GET /groups/:id/anonymous-names` – Get available anonymous names
- `GET /groups/:id/my-anonymous-name` – Get my anonymous name

### Group Cleanup

- `POST /groups/cleanup/expired` – Manual cleanup expired groups
- `GET /groups/cleanup/stats` – Get cleanup statistics
- `GET /groups/expiring-soon` – Get groups expiring soon
- `GET /groups/:id/expired` – Check if group is expired

---

## Request/Response Examples

**Register**
```json
POST /auth/register
{
  "userName": "john_doe",
  "password": "securepassword123"
}
```

**Create Post**
```json
POST /posts
{
  "content": "Feeling overwhelmed with exams this week...",
  "mood": "anxious",
  "tags": ["exams", "stress", "college"],
  "category": "support"
}
```

**Get All Posts**
```
GET /posts?page=1&limit=20&category=support&mood=anxious
```

---

## Security Features

- Password hashing with bcrypt
- JWT token validation and revocation
- Input validation and sanitization
- CORS configuration
- Session middleware for all routes
- Soft delete for posts/comments

---

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

---

## Firestore Structure

- `posts` – All posts
- `post_comments` – Comments for posts
- `post_support` – Support records for posts
- `groups` – Group chat rooms
- `group_messages` – Messages in groups
- `group_members` – Group membership

---

## Firestore Security Rules (example)

```plaintext
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.author_id;
    }
    // ...similar for comments, support, groups
  }
}
```

---

## Headers

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## Additional Notes

- All list endpoints support pagination.
- All inputs are validated.
- Real-time updates via WebSocket for group chat.
- Anonymous names for privacy in groups.
- Mood-based content filtering and analytics.

---

For more, see the files:  
- `API_ENDPOINTS.md` (full endpoint details and examples)  
- `SETUP.md` (setup, environment, and security)  
- `firestore.rules` (security rules)  
- `firestore.indexes.json` (indexes for Firestore)

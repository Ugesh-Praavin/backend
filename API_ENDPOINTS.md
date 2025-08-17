# MoodMingle Backend API Endpoints

## 🚀 **Complete API Reference**

**Base URL:** `http://localhost:5000/api`  
**Authentication:** All endpoints (except auth endpoints) require `Authorization: Bearer <token>` header

---

## 🔐 **Authentication Endpoints**

### **User Registration**
```
POST /auth/register
```
**Request Body:**
```json
{
  "userName": "john_doe",
  "password": "securepassword123"
}
```
**Response:**
```json
{
  "uid": "user123",
  "userName": "john_doe",
  "sessionToken": "jwt_token_here",
  "currentStreak": 1,
  "longestStreak": 1,
  "first_login_date": "2024-01-20T10:30:00Z",
  "last_login_date": "2024-01-20T10:30:00Z",
  "login_dates": ["2024-01-20T10:30:00Z"]
}
```

### **User Login**
```
POST /auth/login
```
**Request Body:**
```json
{
  "userName": "john_doe",
  "password": "securepassword123"
}
```
**Response:**
```json
{
  "uid": "user123",
  "userName": "john_doe",
  "sessionToken": "jwt_token_here",
  "currentStreak": 5,
  "longestStreak": 7,
  "first_login_date": "2024-01-15T10:30:00Z",
  "last_login_date": "2024-01-20T10:30:00Z",
  "login_dates": ["2024-01-20T10:30:00Z", "2024-01-19T09:15:00Z"]
}
```

### **User Logout**
```
POST /auth/logout
```
**Request Body:**
```json
{
  "token": "jwt_token_here"
}
```
**Response:**
```json
{
  "message": "Successfully logged out"
}
```

### **Get Login Statistics**
```
GET /auth/login-stats
```
**Response:**
```json
{
  "uid": "user123",
  "userName": "john_doe",
  "first_login_date": "2024-01-15T10:30:00Z",
  "last_login_date": "2024-01-20T10:30:00Z",
  "days_since_first_login": 5,
  "days_since_last_login": 0,
  "current_streak": 5,
  "longest_streak": 7,
  "total_login_days": 5,
  "total_logins": 8,
  "total_unique_days": 5,
  "average_logins_per_day": "1.60",
  "average_logins_per_unique_day": "1.60",
  "created_at": "2024-01-15T10:30:00Z",
  "login_dates": ["2024-01-20T10:30:00Z", "2024-01-19T09:15:00Z"],
  "unique_dates": ["2024-01-20", "2024-01-19"]
}
```

### **Get Complete Login History**
```
GET /auth/login-history
```
**Response:**
```json
{
  "uid": "user123",
  "userName": "john_doe",
  "total_logins": 8,
  "login_dates": ["2024-01-20T10:30:00Z", "2024-01-19T09:15:00Z"],
  "dates_by_month": {
    "2024-01": ["2024-01-20T10:30:00Z", "2024-01-19T09:15:00Z"]
  },
  "first_login": "2024-01-15T10:30:00Z",
  "last_login": "2024-01-20T10:30:00Z",
  "login_frequency": {
    "average_days_between_logins": "1.25",
    "most_active_day": "Monday",
    "most_active_hour": "10:00",
    "login_pattern": "daily"
  }
}
```

### **Get Calendar Data**
```
GET /auth/calendar
```
**Response:**
```json
{
  "uid": "user123",
  "userName": "john_doe",
  "total_unique_days": 5,
  "total_logins": 8,
  "unique_dates": ["2024-01-20", "2024-01-19"],
  "sorted_dates": ["2024-01-19", "2024-01-20"],
  "calendar_data": {
    "2024": {
      "01": ["19", "20"]
    }
  },
  "current_year_data": {
    "01": ["19", "20"]
  },
  "current_month_data": ["19", "20"],
  "current_month_count": 2,
  "current_year_count": 2,
  "first_login_date": "2024-01-15T10:30:00Z",
  "last_login_date": "2024-01-20T10:30:00Z",
  "login_frequency": {
    "average_days_between_logins": "1.25",
    "most_active_day": "Monday",
    "most_active_hour": "10:00",
    "login_pattern": "daily"
  }
}
```

### **Validate Token**
```
POST /auth/validate-token
```
**Response:**
```json
{
  "valid": true,
  "user": {
    "uid": "user123",
    "userName": "john_doe"
  }
}
```

---

## 📝 **Post Endpoints**

### **Create Post**
```
POST /posts
```
**Request Body:**
```json
{
  "content": "Feeling overwhelmed with exams this week...",
  "mood": "anxious",
  "tags": ["exams", "stress", "college"],
  "category": "support"
}
```
**Response:**
```json
{
  "id": "post123",
  "content": "Feeling overwhelmed with exams this week...",
  "mood": "anxious",
  "tags": ["exams", "stress", "college"],
  "category": "support",
  "author_id": "user123",
  "created_at": "2024-01-20T14:30:00Z",
  "updated_at": "2024-01-20T14:30:00Z",
  "likes_count": 0,
  "comments_count": 0,
  "support_count": 0,
  "is_anonymous": true,
  "status": "active",
  "views_count": 0
}
```

### **Get All Posts**
```
GET /posts?page=1&limit=20&category=support&mood=anxious
```
**Response:**
```json
{
  "posts": [
    {
      "id": "post123",
      "content": "Feeling overwhelmed with exams this week...",
      "mood": "anxious",
      "category": "support",
      "author_id": "user123",
      "created_at": "2024-01-20T14:30:00Z",
      "updated_at": "2024-01-20T14:30:00Z",
      "likes_count": 0,
      "comments_count": 0,
      "support_count": 0,
      "is_anonymous": true,
      "status": "active",
      "views_count": 0
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1,
  "hasMore": false
}
```

### **Search Posts**
```
GET /posts/search?q=anxiety&page=1&limit=20
```
**Response:** Same as Get All Posts

### **Get My Posts**
```
GET /posts/my-posts?page=1&limit=20
```
**Response:** Same as Get All Posts

### **Get Post by ID**
```
GET /posts/:id
```
**Response:**
```json
{
  "id": "post123",
  "content": "Feeling overwhelmed with exams this week...",
  "mood": "anxious",
  "category": "support",
  "author_id": "user123",
  "created_at": "2024-01-20T14:30:00Z",
  "updated_at": "2024-01-20T14:30:00Z",
  "likes_count": 0,
  "comments_count": 0,
  "support_count": 0,
  "is_anonymous": true,
  "status": "active",
  "views_count": 1,
  "comments": [
    {
      "id": "comment123",
      "content": "You're not alone! Take deep breaths",
      "support_type": "encouragement",
      "post_id": "post123",
      "author_id": "user456",
      "created_at": "2024-01-20T14:35:00Z",
      "updated_at": "2024-01-20T14:35:00Z",
      "likes_count": 0,
      "is_anonymous": true,
      "status": "active"
    }
  ],
  "support_stats": {
    "total": 2,
    "by_type": {
      "hug": 1,
      "prayer": 1
    },
    "recent_support": [
      {
        "type": "hug",
        "message": "Virtual hug for you!",
        "created_at": "2024-01-20T14:40:00Z"
      }
    ]
  }
}
```

### **Update Post**
```
PUT /posts/:id
```
**Request Body:**
```json
{
  "content": "Feeling better now, thanks everyone!",
  "mood": "grateful"
}
```
**Response:** Updated post object

### **Delete Post**
```
DELETE /posts/:id
```
**Response:**
```json
{
  "message": "Post deleted successfully"
}
```

---

## 💬 **Comment Endpoints**

### **Create Comment**
```
POST /posts/:id/comments
```
**Request Body:**
```json
{
  "content": "You're not alone! Take deep breaths",
  "support_type": "encouragement"
}
```
**Response:**
```json
{
  "id": "comment123",
  "content": "You're not alone! Take deep breaths",
  "support_type": "encouragement",
  "post_id": "post123",
  "author_id": "user456",
  "created_at": "2024-01-20T14:35:00Z",
  "updated_at": "2024-01-20T14:35:00Z",
  "likes_count": 0,
  "is_anonymous": true,
  "status": "active"
}
```

### **Get Post Comments**
```
GET /posts/:id/comments?page=1&limit=50
```
**Response:**
```json
{
  "comments": [
    {
      "id": "comment123",
      "content": "You're not alone! Take deep breaths",
      "support_type": "encouragement",
      "post_id": "post123",
      "author_id": "user456",
      "created_at": "2024-01-20T14:35:00Z",
      "updated_at": "2024-01-20T14:35:00Z",
      "likes_count": 0,
      "is_anonymous": true,
      "status": "active"
    }
  ],
  "page": 1,
  "limit": 50,
  "total": 1,
  "hasMore": false
}
```

### **Update Comment**
```
PUT /posts/comments/:commentId
```
**Request Body:**
```json
{
  "content": "You're not alone! Take deep breaths and stay strong"
}
```
**Response:** Updated comment object

### **Delete Comment**
```
DELETE /posts/comments/:commentId
```
**Response:**
```json
{
  "message": "Comment deleted successfully"
}
```

### **Like/Unlike Comment**
```
POST /posts/comments/:commentId/like
```
**Response:**
```json
{
  "liked": true,
  "message": "Comment liked"
}
```

---

## 🤗 **Support Endpoints**

### **Support Post**
```
POST /posts/:id/support
```
**Request Body:**
```json
{
  "support_type": "hug",
  "message": "Virtual hug for you!"
}
```
**Response:**
```json
{
  "id": "support123",
  "support_type": "hug",
  "message": "Virtual hug for you!",
  "post_id": "post123",
  "user_id": "user456",
  "created_at": "2024-01-20T14:40:00Z",
  "is_anonymous": true
}
```

### **Remove Support**
```
DELETE /posts/:id/support/:supportType
```
**Response:**
```json
{
  "message": "Support removed successfully"
}
```

### **Get Post Support Stats**
```
GET /posts/:id/support
```
**Response:**
```json
{
  "total": 2,
  "by_type": {
    "hug": 1,
    "prayer": 1
  },
  "recent_support": [
    {
      "type": "hug",
      "message": "Virtual hug for you!",
      "created_at": "2024-01-20T14:40:00Z"
    }
  ]
}
```

### **Get My Support History**
```
GET /posts/support/my-support?page=1&limit=20
```
**Response:**
```json
{
  "supports": [
    {
      "id": "support123",
      "support_type": "hug",
      "message": "Virtual hug for you!",
      "post_id": "post123",
      "user_id": "user456",
      "created_at": "2024-01-20T14:40:00Z",
      "is_anonymous": true
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1,
  "hasMore": false
}
```

### **Get Posts I Supported**
```
GET /posts/support/supported-posts?page=1&limit=20
```
**Response:**
```json
{
  "supported_posts": [
    {
      "support_id": "support123",
      "support_type": "hug",
      "support_message": "Virtual hug for you!",
      "support_date": "2024-01-20T14:40:00Z",
      "post": {
        "id": "post123",
        "content": "Feeling overwhelmed with exams this week...",
        "mood": "anxious",
        "category": "support",
        "created_at": "2024-01-20T14:30:00Z",
        "support_count": 2,
        "comments_count": 1
      }
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1,
  "hasMore": false
}
```

### **Get Trending Support Types**
```
GET /posts/support/trending?days=7
```
**Response:**
```json
{
  "trending_types": [
    {
      "type": "hug",
      "count": 25
    },
    {
      "type": "prayer",
      "count": 18
    }
  ],
  "period_days": 7,
  "total_supports": 43
}
```

---

## 📊 **Analytics Endpoints**

### **Get Posts Analytics Overview**
```
GET /posts/analytics/overview
```
**Response:**
```json
{
  "user_id": "user123",
  "total_posts": 5,
  "total_support_given": 12,
  "total_comments_received": 8,
  "average_support_per_post": "2.40",
  "average_comments_per_post": "1.60"
}
```

---

## 💬 **Group Chat Endpoints**

### **Create Group**
```
POST /groups
```
**Request Body:**
```json
{
  "name": "Anxiety Support Group",
  "description": "A safe space for those dealing with anxiety",
  "mood_type": "anxious",
  "max_members": 20
}
```
**Response:**
```json
{
  "id": "group123",
  "name": "Anxiety Support Group",
  "description": "A safe space for those dealing with anxiety",
  "mood_type": "anxious",
  "max_members": 20,
  "created_by": "user123",
  "created_at": "2024-01-20T14:00:00Z",
  "expires_at": "2024-01-21T14:00:00Z",
  "member_count": 1,
  "status": "active"
}
```

### **Get All Groups**
```
GET /groups?page=1&limit=20&mood_type=anxious
```
**Response:**
```json
{
  "groups": [
    {
      "id": "group123",
      "name": "Anxiety Support Group",
      "description": "A safe space for those dealing with anxiety",
      "mood_type": "anxious",
      "max_members": 20,
      "created_by": "user123",
      "created_at": "2024-01-20T14:00:00Z",
      "expires_at": "2024-01-21T14:00:00Z",
      "member_count": 1,
      "status": "active"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1,
  "hasMore": false
}
```

### **Join Group**
```
POST /groups/join
```
**Request Body:**
```json
{
  "group_id": "group123"
}
```
**Response:**
```json
{
  "message": "Successfully joined group",
  "anonymous_name": "Gentle Heart",
  "group": {
    "id": "group123",
    "name": "Anxiety Support Group"
  }
}
```

### **Leave Group**
```
POST /groups/leave
```
**Request Body:**
```json
{
  "group_id": "group123"
}
```
**Response:**
```json
{
  "message": "Successfully left group"
}
```

### **Get Group Chat**
```
GET /groups/:id/chat
```
**Response:**
```json
{
  "group": {
    "id": "group123",
    "name": "Anxiety Support Group",
    "mood_type": "anxious",
    "expires_at": "2024-01-21T14:00:00Z"
  },
  "messages": [
    {
      "id": "msg123",
      "content": "Hi everyone, feeling anxious today",
      "author_anonymous_name": "Gentle Heart",
      "created_at": "2024-01-20T14:05:00Z",
      "message_type": "support",
      "support_level": 4
    }
  ],
  "my_anonymous_name": "Gentle Heart",
  "expires_at": "2024-01-21T14:00:00Z",
  "is_expired": false
}
```

### **Send Message**
```
POST /groups/:id/message
```
**Request Body:**
```json
{
  "group_id": "group123",
  "message": "Hi everyone, feeling anxious today"
}
```
**Response:**
```json
{
  "id": "msg123",
  "content": "Hi everyone, feeling anxious today",
  "author_anonymous_name": "Gentle Heart",
  "created_at": "2024-01-20T14:05:00Z",
  "message_type": "support",
  "support_level": 4
}
```

### **Get or Create Mood Group**
```
POST /groups/mood
```
**Request Body:**
```json
{
  "mood_type": "anxious"
}
```
**Response:** Group object (existing or newly created)

### **Change Anonymous Name**
```
POST /groups/:id/change-name
```
**Response:**
```json
{
  "message": "Anonymous name changed successfully",
  "new_name": "Brave Soul"
}
```

### **Get Available Anonymous Names**
```
GET /groups/:id/anonymous-names
```
**Response:**
```json
{
  "anonymous_names": [
    "Gentle Heart",
    "Brave Soul",
    "Wise Owl"
  ]
}
```

### **Get My Anonymous Name**
```
GET /groups/:id/my-anonymous-name
```
**Response:**
```json
{
  "anonymous_name": "Gentle Heart"
}
```

---

## 🧹 **Group Cleanup Endpoints**

### **Manual Cleanup Expired Groups**
```
POST /groups/cleanup/expired
```
**Response:**
```json
{
  "deletedGroups": 3,
  "deletedMessages": 45,
  "deletedMembers": 12
}
```

### **Get Cleanup Statistics**
```
GET /groups/cleanup/stats
```
**Response:**
```json
{
  "totalGroups": 15,
  "expiredGroups": 3,
  "activeGroups": 12
}
```

### **Get Groups Expiring Soon**
```
GET /groups/expiring-soon?hours=1
```
**Response:**
```json
{
  "expiring_groups": [
    {
      "id": "group123",
      "name": "Anxiety Support Group",
      "expires_at": "2024-01-21T14:00:00Z",
      "hours_until_expiry": 0.5
    }
  ]
}
```

### **Check if Group is Expired**
```
GET /groups/:id/expired
```
**Response:**
```json
{
  "group_id": "group123",
  "is_expired": false,
  "expires_at": "2024-01-21T14:00:00Z",
  "time_until_expiry": "23 hours 30 minutes"
}
```

---

## 👤 **User Endpoints**

### **Get User Profile**
```
GET /users/:uid
```
**Response:**
```json
{
  "uid": "user123",
  "userName": "john_doe",
  "createdAt": "2024-01-15T10:30:00Z",
  "first_login_date": "2024-01-15T10:30:00Z",
  "last_login_date": "2024-01-20T10:30:00Z",
  "currentStreak": 5,
  "longestStreak": 7,
  "totalLoginDays": 5,
  "total_logins": 8
}
```

---

## 🔧 **Error Responses**

All endpoints return consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Validation failed",
  "timestamp": "2024-01-20T14:30:00Z"
}
```

---

## 📋 **Request Headers**

**Required for all protected endpoints:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## 🚀 **Rate Limiting & Security**

- **Authentication Required**: All endpoints (except auth) require valid JWT
- **Input Validation**: All inputs validated with class-validator
- **Soft Delete**: Data integrity maintained with soft deletes
- **Anonymous System**: Complete privacy for users
- **Pagination**: All list endpoints support pagination

---

## 📱 **Frontend Integration Notes**

- **Real-time Updates**: Use WebSocket for live chat and notifications
- **Anonymous Names**: Generate creative names for group interactions
- **Mood Tracking**: Implement mood-based content filtering
- **Support System**: Multiple support types for engagement
- **Calendar Integration**: Use unique dates for login visualization

---

**Total Endpoints: 50+**  
**Authentication: JWT-based**  
**Database: Firebase Firestore**  
**Framework: NestJS**  

Your MoodMingle backend is **production-ready** with a complete API! 🎉✨

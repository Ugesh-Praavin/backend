# Community Mismatch Issue Fix

## Problem Description
Posts were not appearing in community-specific queries because they weren't being saved with the `community` field. This caused a mismatch between the community filter in `getAllPosts` and the actual data stored in posts.

## Root Causes Identified

1. **Missing Community Field in Post Creation**: The `createPost` method wasn't including the `community` field when saving posts to Firestore.

2. **No Community Field in User Registration**: New users weren't getting a `community` field set during registration.

3. **Case Sensitivity Issues**: Community names weren't normalized, causing mismatches between "Rit_Chennai" and "rit_chennai".

4. **No Default Community**: When users didn't have a community field, there was no fallback value.

## Solutions Implemented

### 1. Fixed Post Creation (`createPost` method)
- Now retrieves user's community from their profile
- Falls back to "rit_chennai" if no community is found
- Normalizes community name to lowercase
- Adds debug logging to confirm which community is being saved

### 2. Enhanced Post Retrieval (`getAllPosts` method)
- Normalizes incoming community parameter to lowercase
- Resolves community from user profile if not provided in query
- Uses "rit_chennai" as default fallback
- Adds detailed logging for community matching

### 3. Updated User Registration
- All new users now get a default `community: "rit_chennai"` field

### 4. Migration Script
- Created `migrate-community.js` to backfill existing data
- Added API endpoint `/api/posts/migrate/community-field`
- Updates existing users and posts with community field

### 5. Enhanced Debug Logging
- Added logs in backend to track community resolution
- Added logs in frontend to debug community parameter passing
- Added post-by-post community matching verification

## Files Modified

### Backend Changes
- `ServeAThon/src/modules/post/post.service.ts`: Fixed post creation and retrieval
- `ServeAThon/src/modules/auth/auth.service.ts`: Added community to user registration
- `ServeAThon/src/modules/post/post.controller.ts`: Added migration endpoint
- `ServeAThon/src/common/types/post.types.ts`: Added community field to PostData interface
- `ServeAThon/migrate-community.js`: Created migration script

### Frontend Changes
- `soulshare-sync/src/pages/CommunityFeed.tsx`: Added debug logging

## Testing Steps

1. **Run Migration** (if you have existing data):
   ```bash
   # Via API endpoint
   POST /api/posts/migrate/community-field
   
   # Or via standalone script
   node migrate-community.js
   ```

2. **Test Post Creation**:
   - Create a new post
   - Check server logs to confirm community field is saved
   - Verify the post appears in community-specific queries

3. **Test Post Retrieval**:
   - Fetch posts for a specific community
   - Check logs to confirm community matching
   - Verify only posts from that community are returned

4. **Test User Registration**:
   - Register a new user
   - Verify they get the default "rit_chennai" community

## Default Community
All new users and posts default to "rit_chennai" community if no community is specified.

## Debug Logs to Monitor

### Post Creation
```
createPost: resolved community from user profile: rit_chennai
createPost: saved post with community { id: "xxx", community: "rit_chennai", ... }
```

### Post Retrieval
```
getAllPosts called with: { communityFromReq: "rit_chennai", ... }
getAllPosts: resolved community from user profile: rit_chennai
getAllPosts: post community check { postId: "xxx", postCommunity: "rit_chennai", requestedCommunity: "rit_chennai" }
```

### Frontend
```
POST /posts payload: { content: "...", mood: "...", ... }
POST /posts community context: { community: "rit_chennai", userCommunity: "rit_chennai" }
```

## API Endpoints

### Migration Endpoint
```
POST /api/posts/migrate/community-field
```
Returns:
```json
{
  "usersUpdated": 5,
  "postsUpdated": 12,
  "message": "Community field migration completed successfully"
}
```

## Notes
- All community names are normalized to lowercase for consistent matching
- The migration script should be run once to fix existing data
- New posts and users will automatically have the community field set
- Debug logs help verify that community matching is working correctly

# Gemini API Integration Setup

## Overview
The CompanionChat feature now uses Google's Gemini API to generate intelligent, empathetic responses for user support conversations.

## Setup Instructions

### 1. Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Environment Configuration
Add the API key to your `.env` file:

```env
# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Install Dependencies
The required package is already added to `package.json`. Install it:

```bash
npm install
```

## API Endpoint

### POST /api/chat/support

**Request Body:**
```json
{
  "message": "I'm feeling really stressed about my exams"
}
```

**Response:**
```json
{
  "reply": "I hear you, and I want you to know that your feelings are completely valid. Exam stress is something many students experience, and it's okay to feel overwhelmed. Remember that you're not alone in this journey, and your hard work will pay off. Take it one step at a time, and don't forget to be kind to yourself during this challenging period.",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "userId": "user123"
}
```

## Features

### Intelligent Response Generation
- Uses Gemini 1.5 Pro model for natural, contextual responses
- System prompt designed for emotional support and empathy
- Responses are warm, caring, and non-judgmental

### Fallback System
- If Gemini API is unavailable, falls back to predefined supportive responses
- Graceful error handling with user-friendly messages
- No service interruption if API key is missing

### Comprehensive Logging
- Request and response logging for debugging
- Error tracking and fallback usage monitoring
- User activity tracking (without storing sensitive content)

## System Prompt
The AI is configured with a system prompt that makes it behave as:
- A kind, encouraging companion
- Non-judgmental and empathetic
- Focused on emotional support and validation
- Never giving medical advice
- Keeping responses under 200 words

## Error Handling
- 500 Internal Server Error for API failures
- Graceful fallback to simple responses
- Detailed error logging for debugging
- User-friendly error messages

## Security
- API key stored in environment variables
- No sensitive user data logged
- JWT authentication required for all requests
- Input validation and sanitization

## Monitoring
Monitor these logs for debugging:
```
ChatController: support request from user: user123
ChatController: message content: I'm feeling stressed
ChatService: sending request to Gemini API
ChatService: received Gemini response: [response text]
ChatController: sending response: { reply: "...", timestamp: "...", userId: "..." }
```

## Troubleshooting

### Common Issues

1. **"GEMINI_API_KEY not found"**
   - Check that the API key is set in your `.env` file
   - Verify the key is valid and has proper permissions

2. **"Failed to initialize Gemini API"**
   - Check internet connectivity
   - Verify API key format and validity
   - Check Google AI Studio for any service issues

3. **Fallback responses being used**
   - Check logs for Gemini API errors
   - Verify API key and permissions
   - Check rate limits if applicable

### Testing
Test the endpoint with:
```bash
curl -X POST http://localhost:5000/api/chat/support \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"message": "I need some support today"}'
```

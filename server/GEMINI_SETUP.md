# SafeTourAI Gemini API Setup Guide

## Overview
SafeTourAI uses Google's Gemini AI to provide intelligent travel safety assistance. This guide will help you set up the Gemini API integration.

## Prerequisites
- Google Cloud Platform account
- Google AI Studio access (recommended for development)

## Setup Instructions

### 1. Get Your Gemini API Key

#### Option A: Google AI Studio (Recommended for Development)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

#### Option B: Google Cloud Console (For Production)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Generative Language API"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy the generated API key

### 2. Configure Environment Variables

1. In the `server` directory, create a `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Open the `.env` file and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

3. Replace `your_actual_gemini_api_key_here` with the API key you obtained in step 1.

### 3. Security Best Practices

- **Never commit your `.env` file** to version control
- The `.env` file is already included in `.gitignore`
- Use different API keys for development and production
- Regularly rotate your API keys
- Monitor your API usage in Google Cloud Console

### 4. API Usage and Limits

- **Free Tier**: Google AI Studio provides free access with rate limits
- **Paid Tier**: Google Cloud offers higher limits and production features
- Monitor your usage to avoid unexpected charges
- Implement rate limiting in your application (already included)

### 5. Testing the Integration

1. Start the server:
   ```bash
   npm start
   ```

2. Test the health endpoint:
   ```bash
   curl http://localhost:5000/api/gemini/health
   ```

3. Test the chat endpoint:
   ```bash
   curl -X POST http://localhost:5000/api/gemini/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "What are safety tips for traveling to Japan?"}'
   ```

### 6. Troubleshooting

#### Common Issues:

**Error: "Gemini API key not configured"**
- Ensure your `.env` file exists in the `server` directory
- Verify the `GEMINI_API_KEY` is set correctly
- Restart the server after adding the API key

**Error: "API key invalid"**
- Check that you copied the API key correctly
- Ensure the API key hasn't expired
- Verify the Generative Language API is enabled in your Google Cloud project

**Error: "Rate limit exceeded"**
- You've exceeded the free tier limits
- Wait for the rate limit to reset
- Consider upgrading to a paid plan

**Error: "Network timeout"**
- Check your internet connection
- Verify Google AI services are accessible from your network
- Consider implementing retry logic for production

### 7. Environment Variables Reference

```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional (with defaults)
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 8. Production Deployment

For production deployment:
1. Use Google Cloud Console API keys instead of AI Studio
2. Set up proper monitoring and alerting
3. Implement request logging and analytics
4. Configure appropriate rate limits
5. Use environment-specific API keys
6. Set up API key rotation procedures

## Support

If you encounter issues:
1. Check the server logs for detailed error messages
2. Verify your API key permissions and quotas
3. Consult the [Google AI documentation](https://ai.google.dev/docs)
4. Check the SafeTourAI project documentation

## API Endpoints

- `GET /api/gemini/health` - Health check
- `GET /api/gemini/categories` - Available prompt categories
- `POST /api/gemini/chat` - Chat with SafeTourAI assistant

The chat endpoint expects:
```json
{
  "message": "Your travel safety question",
  "conversationHistory": [], // Optional
  "location": "destination" // Optional
}
```

# Finesse Chat Backend

A Node.js Express server that provides OpenAI GPT-4 powered chat functionality and authentication for the Finesse financial assistant app.

## Features

- **Chat API**: OpenAI GPT-4 powered conversations
- **Authentication**: Phone number OTP authentication via Supabase
- **Health Check**: Server status monitoring
- **CORS**: Enabled for cross-origin requests

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

3. Add your API keys to `.env`:
```
OPENAI_API_KEY=your_actual_openai_api_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
PORT=3000
```

## Running the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check
- **GET** `/health`
- Returns server status

### Chat
- **POST** `/chat`
- Body: `{ "message": [{ "role": "user", "content": "your message here" }] }`
- Returns: `{ "reply": "AI response" }`

### Authentication

#### Send OTP
- **POST** `/auth/send-otp`
- Body: `{ "phone": "+1234567890" }`
- Returns: `{ "success": true, "message": "OTP sent successfully" }`

#### Verify OTP
- **POST** `/auth/verify-otp`
- Body: `{ "phone": "+1234567890", "token": "123456" }`
- Returns: `{ "success": true, "session": {...}, "user": {...} }`

#### Get Session
- **GET** `/auth/session`
- Headers: `Authorization: Bearer <token>`
- Returns: `{ "success": true, "user": {...} }`

#### Sign Out
- **POST** `/auth/signout`
- Headers: `Authorization: Bearer <token>`
- Returns: `{ "success": true, "message": "Signed out successfully" }`

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `SUPABASE_URL`: Your Supabase project URL (required for auth)
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (required for auth)
- `PORT`: Server port (default: 3000)

## Getting API Keys

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env` file

### Supabase Keys
1. Go to [Supabase](https://supabase.com/)
2. Create a new project or use existing
3. Go to Settings > API
4. Copy the URL and service_role key to your `.env` file

## Error Handling

The server handles various error scenarios:
- Invalid API key (401)
- Rate limiting (429)
- Network errors (500)
- Missing parameters (400)
- Authentication errors (401)

## CORS

CORS is enabled for all origins to allow the React Native app to communicate with the backend.

## Dependencies

- **express**: Web framework
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management
- **openai**: OpenAI API client
- **@supabase/supabase-js**: Supabase client for authentication
- **axios**: HTTP client (for external API calls)
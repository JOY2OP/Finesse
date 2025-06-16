# Finesse Chat Backend

A Node.js Express server that provides OpenAI GPT-4 powered chat functionality for the Finesse financial assistant app.

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

3. Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=your_actual_openai_api_key_here
PORT=3001
```

## Running the Server

```bash
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Health Check
- **GET** `/health`
- Returns server status

### Chat
- **POST** `/chat`
- Body: `{ "message": "your message here" }`
- Returns: `{ "reply": "AI response" }`

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `PORT`: Server port (default: 3001)

## Getting an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env` file

## Error Handling

The server handles various error scenarios:
- Invalid API key (401)
- Rate limiting (429)
- Network errors (500)
- Missing message (400)

## CORS

CORS is enabled for all origins to allow the React Native app to communicate with the backend.
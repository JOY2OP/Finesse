# 🚀 Production Deployment Guide

## Overview
This guide covers all the changes needed to deploy your Finesse app to production.

---

## 📋 Files That Need Changes

### 1. **constants/config.ts** (Frontend Config)
**Current:**
```typescript
export const BACKEND_URL = 'http://10.151.0.229:3000';
```

**Change to:**
```typescript
export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://your-backend-domain.com';
```

---

### 2. **Root .env file** (Frontend Environment)
**Location:** `.env` (root directory)

**Add this line:**
```env
EXPO_PUBLIC_BACKEND_URL=https://your-backend-domain.com
```

**Current content (keep these):**
```env
EXPO_PUBLIC_SUPABASE_URL=https://rxkyxpdlvugibiyrrjik.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=152836804927-khv2omh55f7r1ftj1b8d87ei6ttp632q.apps.googleusercontent.com
```

---

### 3. **backend/.env** (Backend Environment)
**Location:** `backend/.env`

**Current content is fine, but ensure these are set:**
```env
# OpenAI API Key (for chat)
OPENAI_API_KEY=your_openai_key

# Gemini API Key (for AI coach)
GEMINI_API_KEY=your_gemini_key

# Supabase (already configured)
SUPABASE_URL=https://rxkyxpdlvugibiyrrjik.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Server Port
PORT=3000

# Setu AA (already configured)
SETU_TEST_CLIENT_ID=your_client_id
SETU_TEST_CLIENT_SECRET=your_client_secret
SETU_PRODUCT_INSTANCE_ID=your_product_instance_id
```

---

### 4. **app/(tabs)/chat.jsx** (Hardcoded URLs)
**Current:**
```javascript
const BACKEND_URLS = {
  android: 'http://10.84.85.229:3000',
  ios: 'http://152.58.122.26:3000',
  web: 'http://localhost:3000',
};
const BACKEND_URL = BACKEND_URLS[Platform.OS] || 'http://localhost:3000';
```

**Change to:**
```javascript
import { BACKEND_URL } from '@/constants/config';
// Remove the BACKEND_URLS object and hardcoded URL
```

---

### 5. **app/(auth)/verify.jsx** (Hardcoded URL)
**Current:**
```javascript
const BACKEND_URL = 'http://192.168.31.76:3000';
```

**Change to:**
```javascript
import { BACKEND_URL } from '@/constants/config';
// Remove the hardcoded URL
```

---

## 🌐 Backend Deployment Options

### Option A: Deploy to Render.com (Recommended - Free Tier Available)

1. **Create account** at https://render.com
2. **Create new Web Service**
3. **Connect your GitHub repo**
4. **Configure:**
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node index.js`
   - Environment Variables: Copy all from `backend/.env`

5. **Get your URL:** `https://your-app-name.onrender.com`

### Option B: Deploy to Railway.app

1. **Create account** at https://railway.app
2. **New Project → Deploy from GitHub**
3. **Configure:**
   - Root Directory: `backend`
   - Start Command: `node index.js`
   - Environment Variables: Copy all from `backend/.env`

4. **Get your URL:** `https://your-app-name.up.railway.app`

### Option C: Deploy to Heroku

1. **Create account** at https://heroku.com
2. **Create new app**
3. **Deploy via Git or GitHub**
4. **Add Procfile** in backend folder:
   ```
   web: node index.js
   ```
5. **Set environment variables** in Heroku dashboard
6. **Get your URL:** `https://your-app-name.herokuapp.com`

### Option D: Deploy to AWS/DigitalOcean/Your VPS

1. **Set up Node.js server**
2. **Install PM2** for process management:
   ```bash
   npm install -g pm2
   pm2 start backend/index.js --name finesse-backend
   pm2 startup
   pm2 save
   ```
3. **Set up Nginx** as reverse proxy
4. **Get SSL certificate** with Let's Encrypt
5. **Point domain** to your server IP

---

## 📱 Frontend Deployment Options

### Option A: Expo EAS Build (Recommended for Mobile)

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure EAS:**
   ```bash
   eas build:configure
   ```

4. **Update eas.json** with production environment:
   ```json
   {
     "build": {
       "production": {
         "env": {
           "EXPO_PUBLIC_BACKEND_URL": "https://your-backend-domain.com"
         }
       }
     }
   }
   ```

5. **Build for Android:**
   ```bash
   eas build --platform android --profile production
   ```

6. **Build for iOS:**
   ```bash
   eas build --platform ios --profile production
   ```

### Option B: Web Deployment (Netlify/Vercel)

1. **Build web version:**
   ```bash
   npx expo export:web
   ```

2. **Deploy to Netlify:**
   - Connect GitHub repo
   - Build command: `npx expo export:web`
   - Publish directory: `web-build`
   - Environment variables: Add `EXPO_PUBLIC_BACKEND_URL`

---

## ✅ Pre-Deployment Checklist

### Backend:
- [ ] All environment variables set in production
- [ ] CORS configured for your frontend domain
- [ ] Database (Supabase) accessible from production server
- [ ] API keys (OpenAI, Gemini) are valid and have sufficient quota
- [ ] Health check endpoint working: `/health`
- [ ] Server listening on `0.0.0.0` (not just `localhost`)

### Frontend:
- [ ] `EXPO_PUBLIC_BACKEND_URL` set to production backend URL
- [ ] All hardcoded localhost URLs removed
- [ ] Supabase URL and keys are production values
- [ ] Google OAuth client ID configured for production
- [ ] Test on physical device before publishing

---

## 🔧 Environment Variables Summary

### Root .env (Frontend)
```env
EXPO_PUBLIC_BACKEND_URL=https://your-backend-domain.com
EXPO_PUBLIC_SUPABASE_URL=https://rxkyxpdlvugibiyrrjik.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_client_id
```

### backend/.env (Backend)
```env
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
SUPABASE_URL=https://rxkyxpdlvugibiyrrjik.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3000
SETU_TEST_CLIENT_ID=your_setu_client_id
SETU_TEST_CLIENT_SECRET=your_setu_client_secret
SETU_PRODUCT_INSTANCE_ID=your_setu_product_instance_id
```

---

## 🚨 Important Notes

1. **Never commit .env files** - They're already in .gitignore
2. **Use different Supabase projects** for dev/prod if needed
3. **Monitor API usage** - OpenAI and Gemini have rate limits
4. **Set up error tracking** - Consider Sentry or similar
5. **Enable HTTPS** - Required for production
6. **Test thoroughly** - Test all features after deployment

---

## 🔍 Files Using Backend URL

These files currently use backend URLs and will automatically use the config:

1. ✅ `app/(tabs)/coach.tsx` - Already uses `BACKEND_URL` from config
2. ✅ `app/(onboarding)/preferences.tsx` - Already uses `BACKEND_URL` from config
3. ✅ `app/(auth)/login.jsx` - Already uses `BACKEND_URL` from config
4. ✅ `components/transactions/useTransactions.ts` - Already uses `BACKEND_URL` from config
5. ❌ `app/(tabs)/chat.jsx` - **NEEDS UPDATE** (has hardcoded URLs)
6. ❌ `app/(auth)/verify.jsx` - **NEEDS UPDATE** (has hardcoded URL)

---

## 📝 Quick Start Commands

### Development:
```bash
# Backend
cd backend && npm start

# Frontend
npx expo start
```

### Production Build:
```bash
# Backend (on your server)
npm install
node index.js

# Frontend (mobile apps)
eas build --platform all --profile production

# Frontend (web)
npx expo export:web
```

---

## 🆘 Troubleshooting

### Backend not accessible:
- Check firewall rules
- Ensure server is listening on `0.0.0.0`, not `127.0.0.1`
- Verify environment variables are set
- Check server logs

### Frontend can't connect:
- Verify `EXPO_PUBLIC_BACKEND_URL` is set correctly
- Check CORS settings on backend
- Test backend health endpoint directly
- Clear app cache and rebuild

### Database connection issues:
- Verify Supabase URL and keys
- Check RLS policies
- Ensure service role key has proper permissions

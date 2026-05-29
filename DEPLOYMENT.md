# Deployment Guide for The Compass

This guide will walk you through deploying The Compass to production using **Vercel** for the frontend and **Railway** for the backend.

## Why This Setup?

- **Frontend (Vercel)**: Perfect for React apps, free tier, automatic deployments
- **Backend (Railway)**: Supports SQLite and long-running Node.js servers, free tier with 500 hours/month

---

## Part 1: Deploy Backend to Railway (15 minutes)

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with your GitHub account (free)

### Step 2: Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Connect your GitHub account if not already connected
4. Select your repository (you'll need to push this to GitHub first if you haven't)

### Step 3: Configure Backend Service
1. Railway will auto-detect the Node.js app
2. Click on the service and go to **Settings**
3. Set **Root Directory** to: `server`
4. Set **Build Command** to: `npm install && npm run build`
5. Set **Start Command** to: `npm run db:migrate && npm start`

### Step 4: Add Environment Variables
Go to the **Variables** tab and add:

```
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-to-something-random
PORT=3001
DB_PATH=./database.sqlite
GEMINI_API_KEY=AQ.Ab8RN6I6jU1dNCtrntL3JGw-tisF1f2LEgLPfCrGP6XcIWtkAA
```

**Important**: Generate a new random JWT_SECRET for production! Use a password generator or run:
```bash
openssl rand -base64 32
```

### Step 5: Add Persistent Volume
1. Go to **Settings** > **Volumes**
2. Click **"Add Volume"**
3. Mount path: `/app/server` (this ensures your SQLite database persists)

### Step 6: Deploy
1. Railway will automatically deploy
2. Once deployed, go to **Settings** > **Networking**
3. Click **"Generate Domain"**
4. Copy your backend URL (e.g., `https://your-app.up.railway.app`)

### Step 7: Update CORS in Backend
The backend needs to allow requests from your Vercel domain. You'll add this after deploying the frontend.

---

## Part 2: Deploy Frontend to Vercel (10 minutes)

### Step 1: Push to GitHub (if not already done)
```bash
cd /Users/ansaa/the-compass
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/the-compass.git
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click **"Add New Project"**
4. Import your GitHub repository
5. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Add Environment Variable
In the **Environment Variables** section, add:
```
VITE_API_URL=https://your-railway-backend.up.railway.app/api
```
(Replace with your actual Railway backend URL from Part 1, Step 6)

### Step 4: Deploy
1. Click **"Deploy"**
2. Wait for deployment to complete
3. Copy your Vercel domain (e.g., `https://your-app.vercel.app`)

---

## Part 3: Final Configuration

### Step 1: Update Backend CORS
1. Go back to Railway dashboard
2. Open your backend service
3. Go to **Variables**
4. Add or update:
```
CLIENT_URL=https://your-vercel-app.vercel.app
```
(Replace with your actual Vercel URL)

5. The backend will automatically redeploy

### Step 2: Test Your Deployment
1. Visit your Vercel URL
2. Try to sign up for a new account
3. Test creating partners and ratings
4. Verify everything works!

---

## Common Issues & Fixes

### Issue: CORS errors
**Fix**: Make sure `CLIENT_URL` in Railway matches your Vercel domain exactly (no trailing slash)

### Issue: API calls failing
**Fix**: Make sure `VITE_API_URL` in Vercel has `/api` at the end

### Issue: Database resets on deploy
**Fix**: Make sure you added the persistent volume in Railway (Part 1, Step 5)

### Issue: Backend crashes on startup
**Fix**: Check Railway logs. Usually missing environment variables or database migration issues

---

## Environment Variables Summary

### Railway (Backend)
```
NODE_ENV=production
JWT_SECRET=<your-random-secret>
PORT=3001
DB_PATH=./database.sqlite
CLIENT_URL=https://your-vercel-app.vercel.app
GEMINI_API_KEY=<your-gemini-key>
```

### Vercel (Frontend)
```
VITE_API_URL=https://your-railway-backend.up.railway.app/api
```

---

## Updating Your App

### Update Backend
1. Push changes to GitHub
2. Railway auto-deploys on push

### Update Frontend
1. Push changes to GitHub
2. Vercel auto-deploys on push

---

## Costs

- **Railway Free Tier**: 500 execution hours/month, $5 credit
- **Vercel Free Tier**: Unlimited deployments, 100GB bandwidth/month

Both are free for personal projects! 🎉

---

## Alternative: Deploy Both on Railway

If you prefer to deploy everything on Railway:

1. Deploy the backend as described above
2. Instead of Vercel, create a second Railway service:
   - Root Directory: `client`
   - Build Command: `npm install && npm run build`
   - Start Command: `npx serve -s dist -l $PORT`
3. Add environment variable in the frontend service:
   - `VITE_API_URL=https://your-backend.railway.app/api`
4. Generate domain for the frontend service

---

## Need Help?

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Check logs in Railway/Vercel dashboard for errors

#  Deployment Guide - FortiWeb Log Analyzer

## Architecture

```
┌─────────────┐         ┌─────────────┐
│   Vercel    │ ──────► │   Railway   │
│  (Frontend) │  HTTP   │  (Backend)  │
│  Next.js    │         │   FastAPI   │
└─────────────┘         └─────────────┘
```

---

## 1. Deploy Backend to Railway

### Step 1: Push code to GitHub
```bash
cd fortianalis/backend
git init
git add .
git commit -m "Initial backend commit"
# Create repo on GitHub, then:
git remote add origin <your-repo-url>
git push -u origin main
```

### Step 2: Deploy on Railway
1. Go to https://railway.app
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your backend repository
4. Railway will auto-detect Python and install dependencies

### Step 3: Configure Environment Variables (Railway)
Go to **Variables** tab and add:
```
GEMINI_API_KEY=your-gemini-api-key-here
ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app
```

### Step 4: Get Railway Domain
After deployment, Railway will give you a domain like:
```
https://fortianalis-backend-production.up.railway.app
```
**Copy this URL** - you'll need it for the frontend.

---

## 2. Deploy Frontend to Vercel

### Step 1: Push frontend to GitHub
```bash
cd fortianalis/frontend
git init
git add .
git commit -m "Initial frontend commit"
# Create repo on GitHub, then:
git remote add origin <your-repo-url>
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to https://vercel.com
2. Click **"Add New Project"**
3. Import your frontend repository
4. Vercel will auto-detect Next.js

### Step 3: Configure Environment Variables (Vercel)
In Vercel project settings → **Environment Variables**, add:
```
NEXT_PUBLIC_API_URL=https://your-railway-domain.up.railway.app
```

### Step 4: Deploy
Click **Deploy** and Vercel will build and deploy your frontend.

---

## 3. Update CORS after Frontend Deploy

After Vercel deployment, copy your Vercel domain (e.g., `https://fortianalis.vercel.app`) and update Railway's `ALLOWED_ORIGINS` variable to include it.

---

## 4. Environment Variables Summary

### Backend (Railway)
| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini AI API key | `AIzaSy...` |
| `ALLOWED_ORIGINS` | Comma-separated allowed origins | `https://fortianalis.vercel.app` |

### Frontend (Vercel)
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://fortianalis-backend-production.up.railway.app` |

---

## 5. Quick Deploy Commands

### Using Vercel CLI
```bash
cd fortianalis/frontend
npm i -g vercel
vercel login
vercel --prod
```

### Using Railway CLI
```bash
npm i -g @railway/cli
railway login
cd fortianalis/backend
railway init
railway up
```

---

## 6. Post-Deployment Checklist

- [ ] Backend deployed on Railway
- [ ] Frontend deployed on Vercel
- [ ] `NEXT_PUBLIC_API_URL` set on Vercel
- [ ] `ALLOWED_ORIGINS` set on Railway (with Vercel domain)
- [ ] `GEMINI_API_KEY` set on Railway (optional but recommended)
- [ ] Test file upload functionality
- [ ] Verify dashboard displays correctly
- [ ] Check API health endpoint: `https://your-railway-domain/health`

---

## 7. Troubleshooting

### CORS Error
Make sure `ALLOWED_ORIGINS` on Railway includes your Vercel domain (no trailing slash).

### API Not Responding
Check Railway logs for errors. Ensure `GEMINI_API_KEY` is set (or accept fallback mode).

### Build Failed on Vercel
Check that `NEXT_PUBLIC_API_URL` is set in Vercel environment variables.

### 504 Timeout
Railway free tier may sleep. Check Railway dashboard for uptime settings.

---

*Last updated: 2026-04-30*

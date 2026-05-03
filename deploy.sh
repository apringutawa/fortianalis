#!/bin/bash
# FortiAnalis Quick Deploy Script
# Usage: ./deploy.sh

echo " FortiAnalis Deployment Script"
echo "================================"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo ""
echo "1️⃣ Deploying Backend to Railway..."
echo "-----------------------------------"
cd backend
railway login 2>/dev/null || true
railway init -n fortianalis-backend 2>/dev/null || true
railway up -d
BACKEND_URL=$(railway domain 2>/dev/null || echo "Check Railway dashboard for URL")
echo "✅ Backend deployed at: $BACKEND_URL"
cd ..

echo ""
echo "2️⃣ Deploying Frontend to Vercel..."
echo "-----------------------------------"
cd frontend
vercel login 2>/dev/null || true
vercel --prod --yes --build-env NEXT_PUBLIC_API_URL=$BACKEND_URL --prebuilt
cd ..

echo ""
echo "================================"
echo " Deployment Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Add GEMINI_API_KEY to Railway environment variables"
echo "2. Add your Vercel domain to ALLOWED_ORIGINS in Railway"
echo "3. Test your deployed application!"

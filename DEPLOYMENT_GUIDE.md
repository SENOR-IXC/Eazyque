# 🚀 EazyQue Supabase Deployment Guide

## Prerequisites
- ✅ Supabase CLI installed
- ✅ Supabase account with available project slots
- ✅ GitHub account for code deployment

## Step 1: Database Setup

### Option A: Use Existing Supabase Project
1. Go to https://supabase.com/dashboard
2. Select your existing project: **Hybrid APP** (`tdgufrhnxlakdmtciyuq`)
3. Navigate to **SQL Editor**
4. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
5. Run the SQL to create all tables and initial data

### Option B: Create New Project (if you have free slots)
1. Go to https://supabase.com/dashboard
2. Click **New Project**
3. Choose organization and region (Asia South - Mumbai)
4. Set project name: **EazyQue Retail**
5. Set database password and save it securely
6. Run the migration SQL from `supabase/migrations/001_initial_schema.sql`

## Step 2: Get Database Connection Details

From your Supabase project dashboard:
1. Go to **Settings** → **Database**
2. Copy the **Connection String** (URI format)
3. Copy the **Direct Connection** string
4. Go to **Settings** → **API**
5. Copy the **Project URL** and **anon public** key

## Step 3: Deploy API to Railway

### 3.1 Create Railway Account
1. Visit https://railway.app
2. Sign up with GitHub
3. Connect your GitHub repository

### 3.2 Deploy API
1. Create new project in Railway
2. Connect GitHub repository: **your-username/Eazyque**
3. Set Root Directory: `apps/api`
4. Configure Environment Variables:

```env
NODE_ENV=production
PORT=5001
DATABASE_URL=postgresql://postgres.your-project:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
JWT_SECRET=your-super-secure-jwt-secret-here-minimum-32-chars
ALLOWED_ORIGINS=https://your-app.vercel.app
```

### 3.3 Set Build Command
In Railway project settings:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Healthcheck Path**: `/health`

## Step 4: Deploy Frontend to Vercel

### 4.1 Create Vercel Account
1. Visit https://vercel.com
2. Sign up with GitHub
3. Import your repository

### 4.2 Configure Build Settings
- **Framework Preset**: Next.js
- **Root Directory**: `apps/web`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### 4.3 Environment Variables
```env
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

## Step 5: Update Configuration Files

### 5.1 Update API Base URL
In `apps/web/src/app/api/auth/login/route.ts` and other API proxy files:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-railway-app.railway.app';
```

### 5.2 Update CORS Settings
In `apps/api/src/index.ts`:
```typescript
const corsOptions = {
  origin: [
    'https://your-app.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
};
```

## Step 6: Test Deployment

1. **API Health Check**: `https://your-railway-app.railway.app/health`
2. **Frontend**: `https://your-app.vercel.app`
3. **Database Connection**: Check logs in Railway dashboard
4. **Authentication**: Test login functionality

## Step 7: Production Checklist

- [ ] Database migrated successfully
- [ ] API deployed and health check passing
- [ ] Frontend deployed and accessible
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] SSL certificates active
- [ ] Custom domain configured (optional)
- [ ] Backup strategy implemented
- [ ] Monitoring and logging setup

## Troubleshooting

### Common Issues:
1. **Database Connection Failed**: Check DATABASE_URL format and password
2. **CORS Errors**: Verify ALLOWED_ORIGINS in API environment variables
3. **Build Failures**: Check Node.js version compatibility (v18+)
4. **API Routes 404**: Ensure correct root directory in Railway

### Support:
- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs

## Success! 🎉

Your EazyQue platform should now be live:
- **Frontend**: https://your-app.vercel.app
- **API**: https://your-railway-app.railway.app
- **Database**: Supabase PostgreSQL

You can now access the admin dashboard, POS system, and all features in production!

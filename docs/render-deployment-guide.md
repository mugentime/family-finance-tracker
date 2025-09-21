# Render Deployment Guide - Family Finance Tracker

## Prerequisites
- GitHub repository: `mugentime/family-finance-tracker`
- Render account (free tier available)
- All environment variables ready

## Step 1: Create Render Account & Connect GitHub

1. Go to [https://render.com](https://render.com)
2. Sign up using your GitHub account
3. Authorize Render to access your repositories
4. Select the `mugentime/family-finance-tracker` repository

## Step 2: Deploy PostgreSQL Database

1. In Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure database:
   - **Name**: `family-finance-db`
   - **Database**: `family_finance_tracker`
   - **User**: `finance_user`
   - **Region**: `Oregon (US West)`
   - **Plan**: `Starter ($7/month)` or `Free ($0/month - limited)`

3. Click **"Create Database"**
4. Wait for database to be ready (2-3 minutes)
5. **IMPORTANT**: Copy the **Internal Database URL** from the database page

## Step 3: Deploy Web Service

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `mugentime/family-finance-tracker`
3. Configure the service:

### Basic Settings:
- **Name**: `family-finance-tracker`
- **Region**: `Oregon (US West)`
- **Branch**: `master`
- **Runtime**: `Node`
- **Build Command**: `npm ci && npm run compile && npm run build`
- **Start Command**: `npm start`

### Advanced Settings:
- **Plan**: `Starter ($7/month)` or `Free ($0/month - limited)`
- **Node Version**: `20`
- **Health Check Path**: `/health`
- **Auto-Deploy**: `Yes`

## Step 4: Configure Environment Variables

In the **Environment** section, add these variables:

```
NODE_ENV=production
API_KEY=AIzaSyCDQmAxiCI_mzi8jtjOspqO3zq1QDi0a0g
GEMINI_API_KEY=AIzaSyCDQmAxiCI_mzi8jtjOspqO3zq1QDi0a0g
TELEGRAM_BOT_TOKEN=7467500074:AAEdbtquadLIqPhI3ExU429AlUA9xboc7Lw
HOST=0.0.0.0
PORT=10000
```

### For DATABASE_URL:
1. Go to your PostgreSQL database in Render Dashboard
2. Copy the **Internal Database URL**
3. Add environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: [Paste the Internal Database URL]

## Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Install dependencies (`npm ci`)
   - Run TypeScript compilation (`npm run compile`)
   - Build React frontend (`npm run build`)
   - Start the server (`npm start`)

## Step 6: Verify Deployment

Once deployment completes (5-10 minutes):

1. **Health Check**: Visit `https://your-app-name.onrender.com/health`
   - Should return JSON with status "OK"

2. **Frontend**: Visit `https://your-app-name.onrender.com`
   - Should load the React application

3. **API Test**: Visit `https://your-app-name.onrender.com/api/members`
   - Should return JSON array (empty or with data)

## Deployment URL

Your app will be available at:
`https://family-finance-tracker-[random-id].onrender.com`

## Troubleshooting

### Build Issues:
- Check build logs in Render Dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Database Connection Issues:
- Verify `DATABASE_URL` environment variable
- Check database status in Render Dashboard
- Review server logs for connection errors

### Environment Variable Issues:
- Double-check all API keys are correct
- Ensure no extra spaces in variable values
- Restart the service after changing variables

## Monitoring

- **Logs**: Available in Render Dashboard under "Logs" tab
- **Metrics**: CPU, Memory, and Request metrics available
- **Health**: Automatic health checks every 30 seconds

## Cost

**Free Tier Limitations**:
- Apps sleep after 15 minutes of inactivity
- 750 hours/month of runtime
- Shared CPU and 512MB RAM

**Starter Plan ($7/month)**:
- No sleeping
- Dedicated resources
- Custom domains
- Priority support

## Automatic Deployments

With `render.yaml` configured, any push to the `master` branch will automatically trigger a new deployment.

## Support

- Render Documentation: https://render.com/docs
- Support: https://render.com/support
# Railway PostgreSQL Setup Instructions

## 🚀 Deployment Steps for Railway

### 1. **Create Railway Project**
```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy project
railway up
```

### 2. **Add PostgreSQL Database**
1. Go to your Railway dashboard
2. Click "Add Service" → "Database" → "PostgreSQL"
3. Railway will automatically create a PostgreSQL instance
4. The `DATABASE_URL` environment variable will be set automatically

### 3. **Set Environment Variables**
In Railway dashboard, go to your project → Variables tab:

```env
# Required Environment Variables
GEMINI_API_KEY=AIzaSyCDQmAxiCI_mzi8jtjOspqO3zq1QDi0a0g
API_KEY=AIzaSyCDQmAxiCI_mzi8jtjOspqO3zq1QDi0a0g
TELEGRAM_BOT_TOKEN=7467500074:AAEdbtquadLIqPhI3ExU429AlUA9xboc7Lw
NODE_ENV=production

# DATABASE_URL is automatically set by Railway PostgreSQL service
```

### 4. **Verify Deployment**
- Railway will automatically run `npm run postinstall` which includes:
  - `npm run db:migrate` - Creates database tables
  - `npm run build` - Builds the React app
- Server will start with `npm run start`

### 5. **Database Migration**
The database will be automatically initialized with:
- All table schemas (members, transactions, categories, etc.)
- Initial seed data (admin user, default categories)
- This happens automatically on first deployment

### 6. **Health Check**
Visit `https://your-app.railway.app/health` to verify:
```json
{
  "status": "OK",
  "timestamp": "2024-01-20T...",
  "database": "connected"
}
```

## 🔧 Local Development with PostgreSQL

### Option 1: Use Railway Database Locally
```bash
# Connect to Railway PostgreSQL locally
railway run npm run dev
```

### Option 2: Local PostgreSQL
```bash
# Install PostgreSQL locally
# macOS: brew install postgresql
# Windows: Download from postgresql.org
# Ubuntu: sudo apt install postgresql

# Create local database
createdb family_finance

# Update .env.local
DATABASE_URL=postgresql://localhost:5432/family_finance

# Run migrations and start
npm run db:migrate
npm run dev
```

## 📊 Database Management

### Drizzle Studio (Database GUI)
```bash
npm run db:studio
# Opens database GUI at http://localhost:4983
```

### Manual Migration
```bash
# Generate new migration
npm run db:generate

# Apply migrations
npm run db:migrate
```

## 🔍 Troubleshooting

### Common Issues:
1. **Database Connection Failed**
   - Check `DATABASE_URL` in Railway variables
   - Ensure PostgreSQL service is running

2. **Migration Errors**
   - Check database permissions
   - Verify table schemas in Drizzle Studio

3. **Build Errors**
   - Check Node.js version compatibility
   - Verify all dependencies installed

### Debug Commands:
```bash
# Check database connection
railway run node -e "console.log(process.env.DATABASE_URL)"

# View Railway logs
railway logs

# Connect to database directly
railway connect postgres
```

## ✅ Success Checklist

- [ ] Railway project created
- [ ] PostgreSQL service added
- [ ] Environment variables set
- [ ] Deployment successful
- [ ] Database connected (`/health` shows `"database": "connected"`)
- [ ] Frontend loading correctly
- [ ] Telegram bot responding
- [ ] Data persisting between sessions

Your Family Finance Tracker is now production-ready with PostgreSQL! 🎉
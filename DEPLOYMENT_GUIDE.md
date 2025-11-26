# Deployment Guide - Reserva Pro

## 🚀 Railway Deployment

### Prerequisites
- Railway account
- PostgreSQL database provisioned in Railway
- GitHub repository connected

### Step 1: Database Setup

1. Create a new PostgreSQL database in Railway
2. Copy the `DATABASE_URL` from Railway dashboard
3. Add environment variables in Railway:

```env
DATABASE_URL=<your-railway-postgres-url>
JWT_ACCESS_SECRET=<generate-strong-secret>
JWT_REFRESH_SECRET=<generate-strong-secret>
WHATSAPP_TOKEN=<your-whatsapp-token>
WHATSAPP_API_URL=https://graph.facebook.com/v17.0
BASE_URL_BACKEND=https://your-backend.up.railway.app
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production
PORT=3000
```

### Step 2: Backend Deployment

1. Push your code to GitHub
2. In Railway, create a new service from your GitHub repo
3. Select the `backend` directory as root (if monorepo)
4. Railway will automatically detect the Dockerfile
5. The build will:
   - Install dependencies
   - Generate Prisma Client
   - Build NestJS app
   - Run migrations on startup
   - Start the server

### Step 3: Verify Deployment

1. Check logs in Railway dashboard
2. Visit `https://your-backend.up.railway.app/docs` for Swagger
3. Test health endpoint: `GET /`

### Step 4: Cron Jobs

Railway will automatically set up the cron job defined in `railway.json`:
- Schedule: Every minute (`* * * * *`)
- Command: `curl -X POST http://localhost:$PORT/cron/send-reminders`

You can adjust the schedule in `railway.json`.

---

## 🔧 Environment Variables Reference

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET` - Secret for access tokens (min 32 chars)
- `JWT_REFRESH_SECRET` - Secret for refresh tokens (min 32 chars)

### Optional
- `WHATSAPP_TOKEN` - WhatsApp Business API token
- `WHATSAPP_API_URL` - WhatsApp API base URL
- `BASE_URL_BACKEND` - Backend URL for callbacks
- `FRONTEND_URL` - Frontend URL for CORS (comma-separated)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

---

## 📊 Database Migrations

### Development
```bash
npx prisma migrate dev --name migration_name
```

### Production
Migrations run automatically on Railway deployment via:
```bash
npx prisma migrate deploy
```

### Seed Database
```bash
npm run seed
```

This will create default plans (Basic, Pro, Enterprise).

---

## 🐳 Docker Deployment (Alternative)

If deploying to other platforms:

```bash
# Build
docker build -t reserva-pro-backend .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_ACCESS_SECRET="..." \
  -e JWT_REFRESH_SECRET="..." \
  reserva-pro-backend
```

---

## 🔍 Health Checks

Railway will automatically check:
- HTTP endpoint: `GET /` (returns 200 OK)
- Port: 3000

---

## 📝 Post-Deployment Checklist

- [ ] Database migrations applied successfully
- [ ] Seed data created (plans)
- [ ] Swagger docs accessible at `/docs`
- [ ] CORS configured for frontend domain
- [ ] Cron job running (check logs)
- [ ] WhatsApp integration tested
- [ ] Rate limiting working
- [ ] Security logging active

---

## 🛠️ Troubleshooting

### Migrations Fail
- Check DATABASE_URL is correct
- Ensure PostgreSQL version is 12+
- Check Railway logs for specific errors

### Cron Not Running
- Verify railway.json configuration
- Check Railway cron jobs dashboard
- Ensure PORT environment variable is set

### CORS Errors
- Add frontend domain to FRONTEND_URL
- Use comma-separated list for multiple domains
- Check CORS configuration in main.ts

---

## 📈 Monitoring

Railway provides:
- Real-time logs
- Metrics dashboard
- Deployment history
- Resource usage

Access via Railway dashboard.

---

## 🔐 Security Best Practices

1. **Never commit secrets** - Use Railway environment variables
2. **Rotate JWT secrets** - Periodically update in production
3. **Use strong passwords** - For database and admin accounts
4. **Enable SSL** - Railway provides automatic HTTPS
5. **Monitor logs** - Check for suspicious activity
6. **Rate limiting** - Already configured (100 req/15min)

---

## 🚦 Scaling

Railway auto-scales based on:
- CPU usage
- Memory usage
- Request volume

Configure in Railway dashboard under "Settings > Resources".

---

## 📞 Support

For issues:
1. Check Railway logs
2. Review IMPLEMENTATION_SUMMARY.md
3. Check API_REFERENCE.md
4. Review Prisma schema

---

**Deployment Status:** ✅ Ready for Production

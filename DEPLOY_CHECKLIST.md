# Vercel Deployment Checklist

## Pre-Deploy

### Backend Prerequisites
- [ ] PostgreSQL database created (Render/Neon/Supabase)
- [ ] Database schema installed (run SQL from `DEPLOY_VERCEL.md`)
- [ ] `DATABASE_URL` connection string copied
- [ ] JWT secret generated (`openssl rand -base64 32`)

### Frontend Prerequisites
- [ ] Backend deployed first (needed for `VITE_API_BASE_URL`)

---

## Backend Deploy

### 1. Import Project
- [ ] Go to https://vercel.com/new
- [ ] Import: `cbharathi2/Task_Management`
- [ ] Root Directory: `backend`
- [ ] Branch: `aj-main`

### 2. Environment Variables
```
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
DB_SSL=true
JWT_SECRET=<your-generated-secret>
NODE_ENV=production
```

### 3. Deploy & Test
- [ ] Click "Deploy"
- [ ] Wait for build to complete
- [ ] Copy backend URL: `___________________________`
- [ ] Test health: `https://<backend-url>/api/health`
- [ ] Should return: `{"status":"Server is running","timestamp":"..."}`

---

## Frontend Deploy

### 1. Import Project
- [ ] Go to https://vercel.com/new
- [ ] Import: `cbharathi2/Task_Management` (same repo)
- [ ] Root Directory: `frontend`
- [ ] Branch: `aj-main`

### 2. Environment Variables
```
VITE_API_BASE_URL=https://<your-backend-url>/api
```
Replace `<your-backend-url>` with URL from backend deploy.

### 3. Deploy & Test
- [ ] Click "Deploy"
- [ ] Wait for build to complete
- [ ] Copy frontend URL: `___________________________`
- [ ] Open frontend in browser
- [ ] Open browser console (F12)
- [ ] Check for errors

---

## Post-Deploy Configuration

### Update Backend CORS
- [ ] Go to backend project → Settings → Environment Variables
- [ ] Add:
  ```
  CORS_ORIGINS=https://<your-frontend-url>
  ```
- [ ] Go to Deployments tab
- [ ] Click ⋯ on latest deployment → Redeploy

### Final Testing
- [ ] Frontend loads without errors
- [ ] Register new user works
- [ ] Login works
- [ ] Can create tasks/goals/projects
- [ ] No CORS errors in console

---

## Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` format is correct
- Ensure `DB_SSL=true` is set
- Verify database allows external connections
- Check database is running

### "CORS error" in browser
- Verify `CORS_ORIGINS` matches frontend URL exactly
- Include `https://` prefix
- No trailing slash
- Redeploy backend after changing

### "Cannot find module 'pg'"
- Check `package.json` includes `"pg": "^8.13.1"`
- Vercel should auto-install dependencies
- Check build logs for errors

### "Network Error" when calling API
- Verify `VITE_API_BASE_URL` is correct
- Should end with `/api`
- Check backend is actually deployed and running
- Test backend health endpoint directly

---

## Environment Variable Reference

| Variable | Backend | Frontend | Example |
|----------|---------|----------|---------|
| `DATABASE_URL` | ✅ | ❌ | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `DB_SSL` | ✅ | ❌ | `true` |
| `JWT_SECRET` | ✅ | ❌ | `random-32-char-string` |
| `NODE_ENV` | ✅ | ❌ | `production` |
| `CORS_ORIGINS` | ✅ | ❌ | `https://app.vercel.app` |
| `VITE_API_BASE_URL` | ❌ | ✅ | `https://api.vercel.app/api` |

---

## Quick Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Backend Logs](https://vercel.com/cbharathi2/task-backend/logs) (update project name)
- [Frontend Logs](https://vercel.com/cbharathi2/task-frontend/logs) (update project name)
- [PostgreSQL Providers](../DEPLOY_VERCEL.md#database-connection)

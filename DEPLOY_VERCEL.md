# Deploy Task Management on Vercel (Frontend + Backend)

## Quick Deploy from GitHub Branch

**Backend:** https://github.com/cbharathi2/Task_Management/tree/aj-main/backend  
**Frontend:** https://github.com/cbharathi2/Task_Management/tree/aj-main/frontend

---

## 1) Deploy Backend (`backend/`)

### Import from GitHub

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click **Add New... → Project**
3. Import repository: `cbharathi2/Task_Management`
4. Configure project:
   - **Framework Preset:** Other
   - **Root Directory:** `backend`
   - **Branch:** `aj-main` (or `main` if merged)

### Environment Variables

Add these in Vercel project settings:

**Required:**
- `DATABASE_URL` — Your PostgreSQL connection string from Render/Neon/Supabase  
  Format: `postgresql://user:password@host.provider.com:5432/dbname?sslmode=require`
- `JWT_SECRET` — Random secret for JWT tokens (e.g., `openssl rand -base64 32`)
- `NODE_ENV=production`
- `DB_SSL=true` (if using external Postgres)

**Optional (only needed if NOT using `DATABASE_URL`):**
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

**After frontend deploys:**
- `CORS_ORIGINS=https://<your-frontend-vercel-domain>`

### Deploy

1. Click **Deploy**
2. Wait for build to complete
3. Copy your backend URL (e.g., `https://task-backend.vercel.app`)

**Notes:**
- `backend/vercel.json` routes all requests to `server.js` as serverless function
- All API paths work unchanged (`/api/*`)
- Health check: `https://<your-backend-url>/api/health`

---

## 2) Deploy Frontend (`frontend/`)

### Import from GitHub

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click **Add New... → Project**
3. Import same repository: `cbharathi2/Task_Management`
4. Configure project:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Branch:** `aj-main` (or `main` if merged)

### Environment Variables

Add in Vercel project settings:
- `VITE_API_BASE_URL=https://<your-backend-vercel-domain>/api`

**Example:**
```
VITE_API_BASE_URL=https://task-backend.vercel.app/api
```

### Deploy

1. Click **Deploy**
2. Wait for build to complete
3. Copy your frontend URL (e.g., `https://task-frontend.vercel.app`)

**Notes:**
- `frontend/vercel.json` handles SPA routing
- Build output goes to `dist/`

---

## 3) Update Backend CORS

After frontend deploys successfully:

1. Go to backend Vercel project → **Settings** → **Environment Variables**
2. Add/update:
   ```
   CORS_ORIGINS=https://<your-frontend-vercel-domain>
   ```
3. Redeploy backend (Deployments → ⋯ → Redeploy)

---

## 4) Verification Checklist

✅ Backend health check: `https://<backend-url>/api/health`  
✅ Frontend loads without errors  
✅ Can register/login from frontend  
✅ Tasks/goals/projects API calls work  
✅ No CORS errors in browser console

---

## Database Schema Setup

✅ **No manual SQL required!**  

The backend automatically creates all tables on first startup via `initDatabase.js`.

Just ensure your PostgreSQL database exists and is accessible via `DATABASE_URL`. The app will:
1. Create all base tables (users, tasks, goals, projects, attachments)
2. Create teams and team_members tables
3. Add extension columns (team_id, project_id, order_number)
4. Set up all foreign key constraints

**First deployment will show:**
```
✅ Users table created/verified
✅ Projects table created/verified
✅ Goals table created/verified
✅ Tasks table created/verified
✅ Attachments table created/verified
✅ Teams table created/verified
✅ Team members table created/verified
✅ Database schema initialized successfully
```

**Subsequent deployments** skip existing tables (idempotent - safe to run multiple times).

---

## Important Notes

### File Uploads
- Current implementation stores files in `backend/uploads/` (local disk)
- **Vercel serverless functions have ephemeral filesystem**
- Uploaded files will be lost between deployments
- For production: migrate to S3/Cloudinary/Vercel Blob

### Database Connection
- Use **external** database URL (includes full hostname)
- Enable SSL with `?sslmode=require` in connection string
- Set `DB_SSL=true` in Vercel env vars

### Branch Deployment
- Vercel auto-deploys from your selected branch (`aj-main` or `main`)
- Each git push triggers automatic redeployment
- Preview deployments created for pull requests

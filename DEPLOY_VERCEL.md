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

Your Postgres database needs base tables before first deploy. Run this SQL in your database:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'employee',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(50) DEFAULT 'Medium',
  status VARCHAR(50) DEFAULT 'To-Do',
  due_date DATE,
  assigned_to INT,
  assigned_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  owner_id INT NOT NULL,
  target_date DATE,
  progress INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  goal_type VARCHAR(50) DEFAULT 'personal',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT,
  file_type VARCHAR(100),
  uploaded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Teams and team_members tables are created automatically by initDatabase
```

Run this in your Render/Neon/Supabase SQL editor **before** deploying backend.

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

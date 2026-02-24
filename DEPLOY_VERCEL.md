# Deploy Task Management on Vercel (Frontend + Backend)

## 1) Deploy Backend (`backend/`)

1. In Vercel, create a **New Project** and import this repo.
2. Set **Root Directory** to `backend`.
3. Keep framework as **Other**.
4. Add these environment variables:
    - `DATABASE_URL` (recommended)
       - Example: `postgresql://user:password@host:5432/task_management?sslmode=require`
    - OR set these individually:
       - `PGHOST`
       - `PGPORT`
       - `PGUSER`
       - `PGPASSWORD`
       - `PGDATABASE`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `CORS_ORIGINS=https://<your-frontend-vercel-domain>`
5. Deploy.
6. Copy backend URL (example: `https://task-backend.vercel.app`).

Notes:
- `backend/vercel.json` routes all requests to `server.js` as a serverless function.
- Existing API paths remain unchanged (`/api/*`).

## 2) Deploy Frontend (`frontend/`)

1. Create another **New Project** in Vercel using the same repo.
2. Set **Root Directory** to `frontend`.
3. Add environment variable:
   - `VITE_API_BASE_URL=https://<your-backend-vercel-domain>/api`
4. Deploy.

Notes:
- `frontend/vercel.json` rewrites SPA routes to `index.html`.

## 3) Final CORS Update

After frontend deploy, update backend env var:
- `CORS_ORIGINS=https://<your-frontend-vercel-domain>`

Then redeploy backend.

## 4) Verify

- Frontend loads from Vercel URL.
- Login and API calls succeed.
- Health check works at: `https://<your-backend-vercel-domain>/api/health`

## Important Limitation

Current file uploads are stored on local disk (`backend/uploads`). Vercel serverless filesystem is ephemeral, so uploaded files are not durable. For production, move uploads to external storage (for example S3/Cloudinary) when you are ready.

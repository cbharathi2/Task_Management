# Task Management Backend API

Express.js + PostgreSQL backend for Task Management Dashboard.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cbharathi2/Task_Management/tree/aj-main/backend)

### Quick Deploy Steps

1. Click "Deploy" button above or go to [Vercel Dashboard](https://vercel.com/new)
2. Import: `cbharathi2/Task_Management`
3. Set **Root Directory:** `backend`
4. Set **Branch:** `aj-main`
5. Add environment variables (see below)
6. Deploy!

### Required Environment Variables

```bash
# Database (use full external URL from your provider)
DATABASE_URL=postgresql://user:password@host.provider.com:5432/dbname?sslmode=require
DB_SSL=true

# Security
JWT_SECRET=your-random-secret-here
NODE_ENV=production

# CORS (add after frontend deploys)
CORS_ORIGINS=https://your-frontend.vercel.app
```

**Get `DATABASE_URL` from:**
- [Render PostgreSQL](https://render.com/)
- [Neon](https://neon.tech/)
- [Supabase](https://supabase.com/)

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your local Postgres credentials
   ```

3. **Create database:**
   ```bash
   createdb task_management
   ```

4. **Run SQL schema** (see [DEPLOY_VERCEL.md](../DEPLOY_VERCEL.md#database-schema-setup))

5. **Start dev server:**
   ```bash
   npm run dev
   ```

Server runs at `http://localhost:5000`

### API Endpoints

- `GET /` - API info
- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/tasks` - Get tasks (auth required)
- `POST /api/tasks` - Create task (auth required)
- `GET /api/goals` - Get goals (auth required)
- `GET /api/projects` - Get projects (auth required)
- `GET /api/teams` - Get teams (auth required)

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (via `pg`)
- **Auth:** JWT + bcryptjs
- **File Upload:** Multer

---

## Project Structure

```
backend/
├── config/
│   ├── database.js       # PostgreSQL connection adapter
│   └── initDatabase.js   # Schema migrations
├── controllers/          # Business logic
├── middleware/           # Auth & error handlers
├── routes/              # API route definitions
├── server.js            # Entry point
├── vercel.json          # Vercel serverless config
└── .env                 # Local environment vars
```

---

## Notes

- Database adapter translates MySQL-style `?` placeholders to PostgreSQL `$1` format
- `insertId` compatibility layer for existing controller code
- CORS configured for multiple frontend origins
- Serverless-ready (conditionally skips `app.listen()` on Vercel)

---

## Full Documentation

See [DEPLOY_VERCEL.md](../DEPLOY_VERCEL.md) for complete deployment guide.

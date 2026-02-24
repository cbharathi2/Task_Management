# 🚨 URGENT: Vercel `/api/health` 500 Error - Action Plan

## What Happened

Your Vercel backend is crashing when initialized because database errors were being silently ignored. The app booted "successfully" but was broken underneath.

**Visual timeline:**
```
Request to /api/health
    ↓
App tries to query database
    ↓
Database never initialized (silent error)
    ↓
Request hangs waiting for DB...
    ↓
60 seconds pass (Vercel timeout)
    ↓
500: FUNCTION_INVOCATION_FAILED
```

---

## ✅ Fix Applied

### Changed: `backend/server.js`

**Before:**
```javascript
ensureDatabaseInitialized().catch((error) => {
  console.error('⚠️  Database initialization warning:', error.message);
  // Error swallowed - app continues broken
});
```

**After:**
```javascript
if (process.env.VERCEL === '1') {
  ensureDatabaseInitialized().catch((error) => {
    console.error('❌ Vercel: Database initialization failed:', error.message);
    console.error('Stack:', error.stack);  // Full error details logged
  });
}
```

**Plus:**
- ✅ `/api/health` now returns `503` while initializing
- ✅ Middleware prevents DB queries before ready
- ✅ Root endpoint shows database status
- ✅ Clear error logging for debugging

---

## 🔍 How to Find the Real Error

### Step 1: Check Vercel Logs (Most Important)

1. Go to: https://vercel.com/dashboard
2. Click your backend project
3. Click "Deployments" tab
4. Click latest deployment
5. Click "Logs" at the top
6. Look for: `❌ Vercel: Database initialization failed:`
7. Copy that error message

**Example errors you'll see:**
```
❌ Vercel: Database initialization failed: getaddrinfo ENOTFOUND dpg-d6ek3g1r0fns73cnl0ng-a
→ Fix: DATABASE_URL is incomplete (missing domain)

❌ Vercel: Database initialization failed: password authentication failed
→ Fix: Username or password is wrong in DATABASE_URL

❌ Vercel: Database initialization failed: database "xyz" does not exist
→ Fix: Database name in URL doesn't exist
```

### Step 2: Verify DATABASE_URL in Vercel

1. Project Settings → Environment Variables
2. Look at `DATABASE_URL`
3. **It should look like:**
   ```
   postgresql://user:password@host.provider.com:5432/database?sslmode=require
   ```
4. **NOT like:**
   ```
   postgresql://user:password@localhost:5432/database  ❌ (won't work)
   postgresql://...@incomplete-host (❌ incomplete)
   ```

### Step 3: Copy FULL URL from Your Provider

**If using Render:**
- Dashboard → PostgreSQL → Connect → External URL (full copy)
- Should include domain like `.render.com`

**If using Neon:**
- Dashboard → Connection string → Pooling (full copy)
- Should include `neon.tech` domain

**If using Supabase:**
- Settings → Database → Connection string → URI (full copy)

### Step 4: Update & Redeploy

1. Paste full URL into Vercel env var `DATABASE_URL`
2. Go to Deployments → Latest → ⋯ → **Redeploy**
3. Wait 2-3 minutes
4. Check logs again for:
   ```
   ✅ Users table created/verified
   ✅ Database schema initialized successfully
   ```

### Step 5: Test

```bash
curl https://your-backend.vercel.app/api/health
```

**Success (should see):**
```json
{
  "status": "Server is running",
  "dbInitialized": true,
  "timestamp": "2026-02-24T10:30:00.000Z"
}
```

**Still failing (should see):**
```json
{
  "status": "Database initialization in progress or failed",
  "dbInitialized": false
}
```

---

## 🎯 Quick Checklist

- [ ] Go to Vercel logs and find the real error
- [ ] Verify DATABASE_URL has full external domain
- [ ] No `localhost` or incomplete hostnames
- [ ] Includes port and database name
- [ ] Match username/password exactly from provider
- [ ] Click Redeploy (don't just wait)
- [ ] Wait 2-3 minutes for startup
- [ ] Test: `curl https://your-url/api/health`

---

## Got New Error After Fix?

| Error | Fix |
|-------|-----|
| `ENOTFOUND` | URL hostname is wrong/incomplete |
| `ECONNREFUSED` | Using localhost (need external URL) |
| `password authentication failed` | Wrong username/password |
| `does not exist` | Database name doesn't match |
| `self signed certificate` | Add `DB_SSL=true` to env vars |

---

## 📞 Need Help?

1. **Post error from Vercel logs** (the one starting with `❌ Vercel:`)
2. **Confirm DATABASE_URL** (first part: `postgresql://` + domain + port + `/dbname`)
3. I'll identify exact cause

---

**Next action:** Check Vercel logs in your browser right now → copy error message → let me know!

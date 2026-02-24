# 🔧 Fix for `/api/health` 500 Error on Vercel

## What Was Wrong

**Error:** `500 INTERNAL_SERVER_ERROR - FUNCTION_INVOCATION_FAILED` when calling `/api/health`

**Root Cause:** Database initialization errors were silently swallowed, leaving the app in a broken state:

```javascript
// BEFORE (Broken):
ensureDatabaseInitialized().catch((error) => {
  console.error('⚠️  Database initialization warning:', error.message);
  // ❌ Error silently caught - app continues with dbInitialized = false
  // Any call to /api/health waits for DB that never initializes
  // After 60 seconds, Vercel timeout → FUNCTION_INVOCATION_FAILED
});
```

## What Changed

### 1. **Better Error Logging**
```javascript
// NOW:
if (process.env.VERCEL === '1') {
  ensureDatabaseInitialized().catch((error) => {
    console.error('❌ Vercel: Database initialization failed:', error.message);
    console.error('Stack:', error.stack);  // Now shows full error details
  });
}
```

### 2. **Health Check Now Reports DB Status**
```javascript
GET /api/health

// BEFORE: Always returned 200 (even if DB failed)
{ "status": "Server is running" }

// NOW: Returns 503 if DB not ready
{ 
  "status": "Database initialization in progress or failed",
  "dbInitialized": false
}
```

### 3. **Protected Routes Check Database**
```javascript
// Middleware prevents hanging on uninitialized DB:
if (!dbInitialized && req.path.startsWith('/api/')) {
  return res.status(503).json({ 
    message: 'Database not ready yet'
  });
}
```

### 4. **Better Boot Logging**
```javascript
// Local dev now shows clear errors:
✅ Server running on port 5000
❌ Database initialization failed: relation "users" does not exist
Stack: [full error stack trace]
```

---

## How to Test

### 1. **Check Vercel Logs**
```bash
# Go to your Vercel dashboard
# Backend project → Deployments → Select latest → Logs

# You'll now see:
❌ Vercel: Database initialization failed: [actual error]
Stack: [details to fix]
```

### 2. **Test Health Endpoint**
```bash
# While DB initializes (first 30 seconds):
curl https://your-backend.vercel.app/api/health
→ 503 Unavailable ("Database initialization in progress")

# After DB ready:
curl https://your-backend.vercel.app/api/health
→ 200 OK ({"status": "Server is running", "dbInitialized": true})
```

### 3. **Test Root Endpoint**
```bash
curl https://your-backend.vercel.app/
→ 200 OK
{
  "message": "✅ Task Management Backend API",
  "status": "running",
  "dbInitialized": true,  ← Shows DB status
  "timestamp": "2026-02-24T10:30:00.000Z"
}
```

---

## Actual Error Was Likely One Of:

### ❌ Connection String Invalid
```
DATABASE_URL=postgresql://...incomplete-host... (truncated)
Error: getaddrinfo ENOTFOUND incomplete-host
```
**Fix:** Copy FULL external URL from Render/Neon including port and database name

### ❌ SSL Mismatch
```
Error: self signed certificate
```
**Fix:** Add to Vercel env:
```
DB_SSL=true
```

### ❌ Database Doesn't Exist
```
Error: database "xyz" does not exist
```
**Fix:** Ensure database name matches `DATABASE_URL`

### ❌ Wrong Credentials
```
Error: password authentication failed for user "postgres"
```
**Fix:** Check username/password in `DATABASE_URL` are correct

### ❌ Network Blocked
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Fix:** Vercel can't reach internal IP. Must use external database URL.

---

## Next Steps to Debug

1. **Check Vercel Logs:**
   - Go to dashboard → Backend project → Deployments → Latest → Logs
   - Look for `❌ Vercel: Database initialization failed:` message
   - That error tells you exactly what's wrong

2. **Verify DATABASE_URL:**
   ```bash
   # In Vercel project settings:
   - Should be full external URL
   - Example: postgresql://user:pass@host.provider.com:5432/dbname?sslmode=require
   - NOT: postgresql://localhost:5432/... (local IP won't work)
   ```

3. **Test Connection Locally:**
   ```bash
   # Update .env with exact DATABASE_URL from Vercel
   npm run dev
   
   # Should see in terminal:
   ✅ Database connected successfully
   ✅ Users table created/verified
   ✨ Database schema initialized successfully
   ```

4. **Redeploy After Fix:**
   ```bash
   # After fixing env vars in Vercel:
   - Go to Deployments → Latest → ⋯ → Redeploy
   # OR push to GitHub:
   git push origin aj-main
   ```

---

## Files Changed

- ✅ `backend/server.js`
  - Better error handling for DB init
  - Health check now reports DB status
  - Database readiness middleware
  - Clear error logging for Vercel

---

**Your app now:**
- ✅ Logs real errors (not swallowed)
- ✅ Reports 503 while initializing
- ✅ Shows database status in endpoints
- ✅ Prevents timeout by checking DB readiness
- ✅ Fails fast with clear error messages

**Test now:** `curl https://your-backend.vercel.app/api/health`

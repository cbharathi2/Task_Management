# Network Error Fix - Task Management App

## Problem
When trying to sign up or login, you see a "Network Error" message.

## Root Cause
The backend server is not running. The frontend cannot connect to `http://localhost:5000/api`.

## Solution

### Step 1: Start the Backend Server

Open a terminal and run:

```bash
cd backend
npm start
```

You should see:
```
✅ Server running on port 5000
🗄️  Database: task_management @ localhost
✅ Database connected successfully
```

**Do not close this terminal - keep the backend running!**

### Step 2: Start the Frontend Server

Open **another terminal** and run:

```bash
cd frontend
npm run dev
```

You should see:
```
➜  Local:   http://localhost:5174/
```

Or if port 5173 is available:
```
➜  Local:   http://localhost:5173/
```

### Step 3: Test the Application

1. Open your browser and go to: `http://localhost:5174` (or `5173`)
2. Try to sign up or login
3. You should now see success messages instead of network errors

## Troubleshooting

### Still Getting Network Error?

1. **Check if backend is running:**
   ```bash
   # Run this in PowerShell
   Invoke-WebRequest 'http://localhost:5000/api/health' -UseBasicParsing
   ```
   Should return: `{"status":"Server is running",...}`

2. **Check if MySQL is running:**
   - Open MySQL Command Line Client or MySQL Workbench
   - Verify you can connect with credentials in `.env` file
   - Make sure `task_management` database exists

3. **Check .env file in backend folder:**
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=bharathi
   DB_NAME=task_management
   JWT_SECRET=your_secret_key
   PORT=5000
   ```

4. **Database Tables Missing?**
   You need these tables in your MySQL database:
   - `users` table
   - `tasks` table
   - `projects` table
   - `goals` table

   If tables don't exist, ask your administrator to create them.

### Common Errors

| Error | Solution |
|-------|----------|
| "Cannot GET /api/health" | Backend is not running. Run `npm start` in backend folder |
| "ECONNREFUSED" | MySQL is not running. Start MySQL service |
| "ER_ACCESS_DENIED_ERROR" | Wrong database credentials in `.env` |
| "ER_NO_DB_ERROR" | Database doesn't exist. Create `task_management` database |
| "ER_NO_SUCH_TABLE" | Tables don't exist. Ask admin to create them |

## Console Logs

When you sign up/login, check your browser console (F12 > Console tab) for detailed logs:

```
🌐 Backend API URL: http://localhost:5000/api
📡 Request: POST http://localhost:5000/api/auth/login
✅ Response: 200 http://localhost:5000/api/auth/login
✅ Login successful
```

These logs help diagnose issues.

## Key Features Implemented

✅ Better error messages for network issues  
✅ Automatic console logging of all requests  
✅ Validation of required fields (name, email, password)  
✅ CORS configured for localhost:5173, 5174, and 3000  
✅ Health check endpoint for testing backend connectivity  
✅ Comprehensive error handling in login/registration

## Need More Help?

1. Make sure BOTH terminals are running (backend AND frontend)
2. Check that no other services are using ports 5000, 5173, or 5174
3. Restart both servers if you make code changes
4. Clear browser cache and localStorage if still having issues

---

**Last Updated:** February 17, 2026

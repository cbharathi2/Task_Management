# Debugging 400 & 500 Errors - Step-by-Step Fix

## What Changed
1. ✅ Better error logging in frontend (Check browser DevTools console)
2. ✅ Better error messages in backend (Shows specific reasons for failures)
3. ✅ Fixed database schema initialization (Separate ALTER TABLE statements)

## CRITICAL: Restart Backend Server

**The backend MUST be restarted** for these fixes to take effect:

### Step 1: Kill Existing Process
```powershell
taskkill /F /IM node.exe
```

### Step 2: Start Backend
```powershell
cd c:\task-management\backend
npm start
```

### Step 3: Verify Server Started
You should see:
```
✅ Server running on port 5000
✅ Database initialized successfully
   - teams table created/verified
   - team_members table created/verified
   ✅ Added team_id column to tasks table (or ℹ️  already exists)
   ✅ Added team_id column to goals table (or ℹ️  already exists)
```

**IF YOU DON'T SEE THIS, THE FIX WON'T WORK!**

---

## How to Debug Errors

### For Task Creation (400 Error)

1. **Open Browser DevTools** (F12)
2. **Go to Console tab**
3. **Try to create a task** - You'll see logs like:
   ```
   📝 Creating task with data: {title: "...", description: "...", ...}
   📝 Sending taskData: {
     title: "...",
     description: "...",
     projectId: null,
     priority: "Medium",
     dueDate: "",
     assignedTo: 1    <-- Should be a number, not empty
   }
   ❌ Error creating task: AxiosError: ...
   Full error response: {message: "...", error: "ERROR_CODE", ...}
   Display message: "..."
   ```

4. **Look for the error code** in the response:
   - `MISSING_TITLE` → You didn't fill in the title
   - `MISSING_ASSIGNMENT` → Neither user nor team is selected
   - `DOUBLE_ASSIGNMENT` → Both user AND team are selected (pick one)
   - `USER_NOT_FOUND` → The selected user doesn't exist
   - `TEAM_NOT_FOUND` → The selected team doesn't exist

### For Goal Creation (500 Error)

1. **Open Browser DevTools** (F12)
2. **Go to Console tab**
3. **Try to create a goal** - You'll see logs like:
   ```
   📝 Sending goalData: {
     title: "...",
     targetDate: "",
     goalType: "personal" (or "team"),
     progress: 0,
     teamId: 2         <-- Only for team goals
   }
   ❌ Goal creation error: AxiosError: ...
   Full error response: {
     message: "...",
     error: "...",
     code: "ER_DUP_FIELDNAME",
     sqlState: "42S21"
   }
   ```

4. **SQL Error Codes Explained**:
   - `ER_DUP_FIELDNAME` → Column already exists (shouldn't cause 500)
   - `ER_NO_SUCH_TABLE` → goals table doesn't exist
   - Other codes → Database schema issue

---

## Quick Test Checklist

### Test 1: Create Task (User Assignment)
- [ ] Frontend built successfully
- [ ] Backend restarted
- [ ] Open DevTools Console
- [ ] Type title
- [ ] Select "👤 Assign to User"
- [ ] Click a user from list
- [ ] Click "Create Task"
- [ ] Check console for: "✅ Task created with ID:"

### Test 2: Create Task (Team Assignment)
- [ ] Title filled in
- [ ] Select "👥 Assign to Team"
- [ ] Click a team from list
- [ ] Click "Create Task"
- [ ] Check console for: "✅ Task created with ID:"

### Test 3: Create Personal Goal
- [ ] Title and target date filled in
- [ ] Click "Create Goal"
- [ ] Check console for: "✅ Goal created with ID:"

### Test 4: Create Team Goal
- [ ] Title filled in
- [ ] Click "Create Team Goal"
- [ ] Select a team
- [ ] Click "Create Goal"
- [ ] Check console for: "✅ Goal created with ID:"

---

## If Still Getting 400/500 After Restart

### 1. Verify Backend Is Actually Running
Open another terminal:
```powershell
python -c "import requests; r = requests.get('http://localhost:5000/'); print(r.status_code, r.text)"
```
Should print: `200 {...}`

### 2. Check Backend Logs
In the backend terminal, you should see:
```
📝 Task controller received: {title: "...", assignedTo: 1, ...}
📝 Creating task: {...}
✅ Task created with ID: 123
```

If you don't see task logs, frontend request isn't reaching backend.

### 3. Check Network Request
In DevTools:
- Go to **Network** tab
- Create a task
- Find request `POST /api/tasks`
- Click it
- Check **Request** → **Payload** tab
- Verify data looks correct (shows proper numbers, not empty strings)

### 4. Check Response
Still in Network tab, check **Response** tab:
```json
{
  "message": "...",
  "error": "ERROR_CODE",
  "code": "SQL_ERROR_CODE"
}
```

---

## Common Issues and Solutions

### Problem: Still getting 400 even after fix
**Solution**: Make sure you:
1. Killed old Node process completely with `taskkill /F /IM node.exe`
2. Waited 2 seconds before starting new server
3. See "✅ Server running on port 5000" in the terminal
4. Refreshed browser (Ctrl+Shift+R for hard refresh)

### Problem: Getting 500 on goal creation
**Solution**: 
1. Backend must have restarted with new database initialization
2. Check if `goals` table exists: `team_id` column should be added
3. Look at backend console for "✅ Added team_id column to goals table"

### Problem: Can see logs in console, but still error
**Solution**: Look for the specific error code:
- Find the line: `Full error response: {...error: "YOUR_ERROR_CODE"}`
- Match against the error codes listed above
- Fix the issue (e.g., select both user AND team → select only one)

---

## Database Quick Check

If you have database access, you can verify:
```sql
-- Check goals table has team_id
DESCRIBE goals;
-- Should show a "team_id" column

-- Check tasks table has team_id  
DESCRIBE tasks;
-- Should show a "team_id" column
```

---

## Still Need Help?

If you've followed all these steps and still getting errors:

1. Take a screenshot of the error in browser console
2. Copy the "Full error response" object
3. Copy the "Display message" 
4. Show the backend terminal logs when trying to create the task/goal
5. Tell me exactly what steps you did before the error

This will help identify the exact issue!

# Fixes Applied - February 19, 2026

## Issues Fixed

### 1. ✅ Task Creation Error: "Title and assignedTo are required"
**Problem:** Even when providing title and an assignment, task creation was failing.

**Root Cause:** 
- Type mismatch: Form IDs were being sent as strings but backend expected numbers or proper validation
- Logic error in form submission order

**Solution Applied:**
- Fixed data type conversion: `parseInt(formData.assignedTo)` and `parseInt(formData.teamId)`
- Fixed form submission order: Now properly builds taskData object before using it
- Fixed validation: Properly checks if either assignedTo OR teamId is provided
- Added projectId parsing: `projectId: formData.projectId ? parseInt(formData.projectId) : null`

**Files Modified:**
- `frontend/src/components/Modals/CreateTaskModal.jsx`

---

### 2. ✅ Goal Creation Server Error
**Problem:** Goal creation shows "server error" without details when creating team goals.

**Root Cause:**
- teamId was being sent as string instead of integer
- Error messages weren't detailed enough to debug

**Solution Applied:**
- Convert teamId to integer: `parseInt(formData.teamId)`
- Enhanced error handling to show detailed error messages from backend
- Added server error console logging for debugging

**Files Modified:**
- `frontend/src/components/Modals/CreateGoalModal.jsx`

**Backend Changes Made:**
- Updated `goalController.js` to accept and store `team_id` in goals table
- Updated `initDatabase.js` to create `team_id` column in goals table (if not exists)

---

### 3. ✅ PDF Viewer Not Displaying with Permission Errors
**Problem:** Employees couldn't view uploaded PDFs even though they were assigned.

**Root Cause:**
- PDF viewer endpoint was receiving authorization header, but error state wasn't being tracked
- No detailed error messages to understand what was failing
- Browser trying to render blob URL in iframe before blob was ready

**Solution Applied:**
- Added detailed error state tracking in PDF viewer
- Added comprehensive console logging to debug:
  - PDF fetch status and response
  - Blob size and type
  - Permission check details
- Improved error display to show:
  - Specific error message from server
  - Loading state indication
  - More user-friendly error message with permission hint
- Secure blob URL handling with proper cleanup

**Files Modified:**
- `frontend/src/components/TaskCard.jsx`
- `backend/routes/files.js` (viewer endpoint with auth checks)

**How PDF Viewing Works Now:**
1. Employee clicks "View PDF" button
2. Frontend fetches from `/api/files/viewer/{attachmentId}` with Bearer token
3. Backend verifies:
   - Is the file attached to a task?
   - Is the user an admin? OR
   - Is the user assigned to this task? OR
   - Is the user a member of the team assigned to this task?
4. If authorized: Returns PDF blob with correct content type
5. Frontend creates blob URL and displays in iframe

---

## CRITICAL: Backend Server Restart Required

The backend needs to be restarted for these changes to take effect:

### Steps:
1. Kill any existing Node.js process on port 5000:
   ```powershell
   taskkill /F /IM node.exe
   # OR if running on specific port:
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```

2. Navigate to backend folder:
   ```powershell
   cd c:\task-management\backend
   ```

3. Start the server:
   ```powershell
   npm start
   ```

4. You should see:
   ```
   ✅ Server running on port 5000
   ✅ Database initialized successfully
      - teams table created/verified
      - team_members table created/verified
   ```

---

## Testing Steps

### Test 1: Create Task with User Assignment
1. Go to Home page
2. Click "Create Task"
3. Fill in title (required)
4. Click "👤 Assign to User"
5. Select a user from the list
6. Click "Create Task"
✅ Should succeed with green alert

### Test 2: Create Task with Team Assignment
1. Go to Home page
2. Click "Create Task"
3. Fill in title (required)
4. Click "👥 Assign to Team"
5. Select a team from the list
6. Click "Create Task"
✅ Should succeed with green alert

### Test 3: Create Goal with Team Assignment
1. Go to Home page or Goals page
2. Click "Create Team Goal" button
3. Fill in title and target date
4. Select a team
5. Click "Create Goal"
✅ Should succeed with green alert

### Test 4: View Uploaded PDF as Employee
1. Admin creates task and assigns to employee
2. Admin uploads PDF when creating/editing task
3. Employee logs in and sees task
4. Employee clicks "Show Attachments"
5. Employee clicks eye icon to view PDF
6. PDF should display in modal with clear download/close options
✅ PDF should display correctly, not show permission error

---

## If Issues Persist

### Enable Debug Mode
Open browser DevTools (F12) and check:
1. **Console tab** - Look for logs starting with:
   - 📝 Creating task
   - 📄 Fetching PDF
   - ❌ Error messages
   
2. **Network tab** - Check API calls:
   - POST `/api/tasks` - Should return 201 with taskId
   - GET `/api/files/viewer/{id}` - Should return 200 with PDF blob
   - GET `/api/teams` - Should return team list

### Common Issues

**Error: "Cannot assign task to both user and team"**
- Make sure you select either User OR Team, not both
- Don't mix selection by clicking both toggle buttons

**Error: "Team not found"**
- Make sure backend is restarted
- Check if you have teams created in the system
- Admin can create teams in the Teams page

**PDF shows "Access denied" error**
- Verify PDF was uploaded when creating task
- Verify task is assigned to you (as user or team member)
- Check browser console for detailed error message
- Restart backend server

**Goal creation shows server error**
- Check that backend is running: `http://localhost:5000/`
- If creating team goal, verify a team is selected
- Check backend console for error messages

---

## Summary of Code Changes

### Frontend
- ✅ CreateTaskModal: Fixed type conversion and form logic
- ✅ CreateGoalModal: Added team assignment support with type conversion
- ✅ TaskCard: Enhanced PDF viewer with error tracking and logging

### Backend
- ✅ taskController: Already supports team_id assignment
- ✅ goalController: Updated to support team_id
- ✅ files.js: Added `/api/files/viewer/:id` endpoint with auth checks
- ✅ initDatabase: Added team_id column to goals table

### Database
- ✅ tasks table: Already has team_id column
- ✅ goals table: Will get team_id column on backend restart

# Quick Testing Guide - Task Management System

## 🚀 System Status: READY FOR TESTING

### Current Server Status
- ✅ **Backend Server**: Running on `http://localhost:5000`
- ✅ **Frontend Server**: Running on `http://localhost:5175`  
- ✅ **Database**: Connected and ready
- ✅ **CORS**: Configured for ports 5173, 5174, 5175, 3000

---

## 📝 Quick Start

### 1. Open Application
```
URL: http://localhost:5175
```

### 2. Create Test Accounts
**Admin Account:**
- Username: `admin123`
- Password: `admin123`
- Role: Select "admin"

**Employee Account:**
- Username: `employee123`
- Password: `employee123`
- Role: Select "employee"

---

## ✅ Feature Testing Checklist

### Phase 1: Authentication (5 mins)
- [ ] Login with admin credentials → Verify home page loads
- [ ] Logout → Verify redirect to login page
- [ ] Login with employee credentials → Verify different UI (no admin options)
- [ ] Signup new user → Verify account creation
- [ ] Try login with wrong password → Verify error message

### Phase 2: Task Management (15 mins)

#### Create Tasks (Admin Only)
1. Login as **admin**
2. Click "Create Task" button
3. Fill in:
   - **Title**: "Sample Task 1"
   - **Description**: "Test task for today"
   - **Priority**: High
   - **Due Date**: Today's date
   - **Assign To**: employee123
4. Click "Create" → Verify success message

#### Repeat for different dates:
- Task 2: Due date = 3 days from now (Next Week)
- Task 3: Due date = 10 days from now (Do Later)
- Task 4: Due date = yesterday (Overdue)

#### Verify Task Categorization (Employee)
1. Login as **employee123**
2. Click "My Tasks" in sidebar
3. **Verify categories appear with correct tasks:**
   - ✅ **Assigned Today** - Shows recently assigned tasks
   - ✅ **Do Today** - Shows Task 1 (due today)
   - ✅ **Do Next Week** - Shows Task 2 (3 days away)
   - ✅ **Do Later** - Shows Task 3 (10 days away)
   - ✅ **Overdue** - Shows Task 4 (past due)
   - ✅ **Completed** - Currently empty

### Phase 3: Task Operations (10 mins)

#### Mark Task Complete (Employee)
1. Click on any task in "Do Today" section
2. Click "Mark Complete" button
3. **Verify:**
   - ✅ Task moved to "Completed" section
   - ✅ Status changed to "Completed"

#### Test Delete Task (Admin Only)
1. Login as **admin**
2. Click on any task
3. **Observe:**
   - ✅ Employee sees NO delete button
   - ✅ Admin sees red "Delete" button
4. Admin clicks delete → Verify removal with confirmation

### Phase 4: Project Management (10 mins)

#### Create Project (Admin)
1. Login as **admin**
2. Click "Projects"
3. Click "Create Project"
4. Enter:
   - **Name**: "Sample Project"
   - **Description**: "Test project"
5. Click "Create"
6. **Verify:**
   - ✅ Project appears in list
   - ✅ Status badge shows "Active" (teal)

#### Mark Project Complete (Employee)
1. Login as **employee**
2. View the created project
3. Click "Mark Complete" button
4. **Verify:**
   - ✅ Status changes to "Completed" (green)
   - ✅ Button becomes disabled/removed

#### Delete Project (Admin)
1. Login as **admin**
2. View any project  
3. Click delete button (should appear for admin)
4. Confirm removal

### Phase 5: Analytics Dashboard (15 mins)

#### Access Reporting Page
1. Click "Reporting" in sidebar
2. **Wait for data to load** (should show stats)

#### Verify KPI Cards (First Row)
- [ ] **📊 Total Tasks**: Shows count of all tasks
- [ ] **✅ Completed**: Shows count + completion percentage
- [ ] **📝 Incomplete**: Shows count of pending tasks
- [ ] **🔴 Overdue**: Shows count of past-due tasks

Example: "Total Tasks: 4 | Completed: 1 | Incomplete: 2 | Overdue: 1"

#### Verify KPI Cards (Second Row)
- [ ] **📌 Assigned Today**: Shows recently assigned count
- [ ] **⚡ Due Today**: Shows tasks due today count
- [ ] **📅 Next Week**: Shows tasks due within 7 days
- [ ] **🎯 Do Later**: Shows tasks due after next week

#### Verify Charts Display
- [ ] **Task Categories Chart** (Bar Chart)
  - X-axis: Recently Assigned, Do Today, Do Next Week, Do Later
  - Y-axis: Count of tasks
  - Should show distribution of tasks

- [ ] **Completion Status Chart** (Pie Chart)
  - Shows breakdown by status (To-Do, In Progress, Completed)
  - Colors: Blue (To-Do), Orange (In Progress), Green (Completed)

- [ ] **Task Completion Trend** (Line Chart)
  - X-axis: Dates (last 30 days)
  - Y-axis: Task count
  - Two lines: Total tasks and Completed tasks
  - Pattern: Orange line (Total), Green line (Completed)

#### Export Report
1. Click "Export PDF" button
2. File downloads as `task-report.pdf`
3. Open PDF and verify:
   - ✅ KPI cards visible
   - ✅ Charts rendered properly
   - ✅ Professional formatting

### Phase 6: Role-Based Access Control (10 mins)

#### Employee Cannot Create Tasks
1. Login as **employee**
2. Try to access `/create-task` directly
3. **Verify:**
   - ✅ Form shows but submit button disabled/error
   - ✅ Error message: "Only admins can create tasks"

#### Employee Cannot Delete Tasks
1. Login as **employee**
2. View any task
3. **Verify:**
   - ✅ NO delete button visible
   - ✅ Even with direct API call, receives 403 Forbidden

#### Employee Cannot Create Projects
1. Login as **employee**
2. Look for "Create Project" button
3. **Verify:**
   - ✅ Button either hidden or disabled
   - ✅ (If clicked) Error: "Only admins can create projects"

---

## 📊 Expected Test Results

### After Creating 4 Test Tasks
| Category | Count | Expected Tasks |
|----------|-------|-----------------|
| Due Today | 1 | Sample Task 1 |
| Next Week | 1 | Sample Task 2 |
| Do Later | 1 | Sample Task 3 |
| Overdue | 1 | Sample Task 4 |
| Completed | 0 | (after marking Task 1 complete: 1) |

### Expected Analytics Numbers
- **Total Tasks**: 4
- **Completed**: 1 (after marking Task 1 complete)
- **Incomplete**: 3 (Tasks 2, 3, 4)
- **Overdue**: 1 (Task 4)
- **Completion Rate**: 25%

---

## 🐛 Troubleshooting During Testing

### Issue: Tasks Not Appearing
**Steps:**
1. Refresh page with `F5`
2. Check browser console for errors
3. Verify backend is running: `curl http://localhost:5000/api/health`

### Issue: Charts Not Displaying
**Steps:**
1. Check that at least 5 tasks exist in database
2. Check browser console for errors
3. Verify data loads in Network tab (API response)

### Issue: Delete Button Not Showing for Admin
**Steps:**
1. Logout and login again as admin
2. Check that `user.role === 'admin'` in AuthContext
3. Hard refresh page: `Ctrl+Shift+R`
4. Clear browser cache if issues persist

### Issue: Task Not Moving to Completed
**Steps:**
1. Check that task status in DB is being updated
2. Look for error message in browser console
3. Verify API endpoint is working: `GET /tasks/my`

---

## 📝 Notes for QA Team

1. **Date Testing**: Tasks are categorized based on UTC dates. Verify timezone handling if tests fail.

2. **PDF Export**: May take 2-3 seconds to generate. Large dashboards may have rendering issues.

3. **Real-Time Updates**: Currently page requires refresh. Future version should implement WebSocket.

4. **Sample Data**: It's recommended to create at least 4-5 tasks with varied due dates for proper dashboard visualization.

5. **Browser Testing**: Tested on Chrome/Edge. Firefox/Safari compatibility not verified.

---

## ✨ Success Criteria

All tests should result in:
- ✅ No JavaScript errors in console
- ✅ Proper authorization enforcement (admin/employee)
- ✅ Task categorization working correctly
- ✅ Analytics dashboard displaying accurate data
- ✅ Charts rendering without errors
- ✅ PDF export working properly
- ✅ Delete operations requiring confirmation
- ✅ Completion status updating correctly

---

## 📞 Support

If you encounter any issues:
1. Check the browser console (F12)
2. Check backend logs in terminal
3. Verify database is accessible
4. Restart both servers if needed

---

**Happy Testing! 🎉**

*Last Updated: February 2026*

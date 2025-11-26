# Testing Guide

## Prerequisites

- Both backend and mobile app running
- Camera access enabled
- QR code scanner app or physical QR codes

## Test Data

### Teachers

| ID | Full Name | Password |
|-----|----------|----------|
| TCHR001 | Demo Teacher | teacher123 |

**Teacher QR Code:**
```
TCHR|TCHR001|Demo Teacher
```

### Students

Generate test QR codes using: https://www.qr-code-generator.com/

| QR Content | Full Name | Student ID | Department |
|-----------|----------|-----------|-----------|
| NHEM DAY G. ACLO\|20203300076\|BSIT | NHEM DAY G. ACLO | 20203300076 | BSIT |
| JOHN DOE\|20203300001\|BSIT | JOHN DOE | 20203300001 | BSIT |
| JANE SMITH\|20203300002\|BSCS | JANE SMITH | 20203300002 | BSCS |
| MARK WILSON\|20203300003\|BSIT | MARK WILSON | 20203300003 | BSIT |

## Test Scenarios

### ✅ Scenario 1: Teacher Login

**Steps:**
1. Launch app
2. Tap "Teacher Login"
3. Scan teacher QR (or type manually for testing)
4. Enter password: `teacher123`
5. Tap "Login"

**Expected Result:**
- ✓ Login successful
- ✓ Redirected to section selection
- ✓ Token stored securely
- ✓ Teacher name displayed

**Failure Modes:**
- ✗ Invalid QR → "Invalid QR code or password"
- ✗ Wrong password → "Invalid QR code or password"
- ✗ Backend down → Network error

---

### ✅ Scenario 2: Create Section

**Steps:**
1. On section selection screen, tap "+ Create"
2. Enter section name: `BSIT-S1`
3. Tap "Create Section"
4. Verify section appears in list

**Expected Result:**
- ✓ Section created successfully
- ✓ Appears in list immediately
- ✓ Can be selected

**Failure Modes:**
- ✗ Empty name → "Section name required"
- ✗ Duplicate name → "Section already exists"
- ✗ Network error → Show error message

---

### ✅ Scenario 3: Select Section Before Scanning

**Steps:**
1. On section selection screen
2. See list of created sections
3. Tap "BSIT-S1"
4. Should navigate to scanner

**Expected Result:**
- ✓ Section is locked for scanning
- ✓ Scanner shows section name
- ✓ All scans belong to this section

**Test Edge Case:**
- Don't select section, try to access scanner directly
- Should redirect back with error message

---

### ✅ Scenario 4: Student Time In

**Steps:**
1. On scanner screen
2. Scan student QR: `NHEM DAY G. ACLO|20203300076|BSIT`
3. See success alert

**Expected Result:**
- ✓ Alert: "Time In recorded at XX:XX"
- ✓ Log entry shows status "In"
- ✓ Student visible in dashboard
- ✓ lastScanAt saved (cooldown timer starts)

**What was created:**
- New student record (if first time)
- Attendance record with timeIn
- Empty timeOut

---

### ✅ Scenario 5: 60-Second Cooldown Enforcement

**Steps:**
1. Scan student immediately (< 60 seconds after previous scan)
2. Should be blocked
3. Wait 60+ seconds
4. Scan again (should succeed)

**Expected Result (< 60s):**
- ✓ Error: "Slow down! Please wait 47s before scanning again"
- ✓ Countdown timer visible on screen
- ✓ Scanner disabled during cooldown

**Expected Result (> 60s):**
- ✓ Scan processed successfully
- ✓ Time Out recorded

**Critical:** Both client AND server enforce cooldown

---

### ✅ Scenario 6: Student Time Out

**Steps:**
1. Initial scan (Time In) - Status: "In"
2. Wait 60+ seconds
3. Scan same student again
4. See success alert

**Expected Result:**
- ✓ Alert: "Time Out recorded at XX:XX"
- ✓ Log entry shows status "Out" or "Completed"
- ✓ Attendance shows both timeIn and timeOut
- ✓ Dashboard marks as "Completed"

**Database State:**
```sql
attendance table:
id | studentId | timeIn | timeOut | section
-- | --------- | ------ | ------- | -------
1  | 20203... | 08:00 | 09:00 | BSIT-S1
```

---

### ✅ Scenario 7: Duplicate Scan Rejection

**Steps:**
1. Scan student (Time In)
2. Wait 60+ seconds
3. Scan again (Time Out)
4. Try to scan third time

**Expected Result:**
- ✓ Third scan rejected
- ✓ Error: "Attendance complete. Manual override required."
- ✓ No new record created
- ✓ Status shows "Completed"

---

### ✅ Scenario 8: View Dashboard

**Steps:**
1. After scanning multiple students
2. Tap "View Dashboard"
3. Check stats and logs

**Expected Result:**
- ✓ Shows real-time stats:
  - Total Present (students with timeIn)
  - Time In Only (no timeOut)
  - Completed (both times)
  - Attendance Rate %
- ✓ Scan logs show all scans today
- ✓ Auto-refreshes every 10 seconds
- ✓ Stats update as you scan

**Example Stats After 3 Scans:**
```
Today's Overview
Total Present: 3
Time In Only: 1
Completed: 2
Attendance Rate: (depends on total expected)
```

---

### ✅ Scenario 9: Attendance History Filtering

**Steps:**
1. Tap "View Attendance History"
2. Apply filters:

**Filter by Date:**
1. Tap calendar button
2. Select date (today by default)
3. Records update

**Filter by Section:**
1. See section buttons at top
2. Tap "BSIT-S1"
3. Show only that section's attendance

**Filter by Search:**
1. Type student name: "NHEM"
2. Results filter in real-time
3. Show only matching records

**Expected Result:**
- ✓ All filters work individually
- ✓ Can combine filters
- ✓ Shows: Name, ID, Time In, Time Out
- ✓ Shows status badge (In/Out/Completed)

---

### ✅ Scenario 10: Manual Attendance Entry

**Steps:**
1. Tap "Manual Entry"
2. Fill form:
   - Student ID: `20203300076`
   - Full Name: `NHEM DAY G. ACLO`
   - Department: `BSIT`
   - Section: `BSIT-S1`
   - Date: Today (or select)
   - Time In: `08:30`
   - Time Out: `09:30`
   - Password: `teacher123`
3. Tap "Add Attendance Record"

**Expected Result:**
- ✓ Record created/updated
- ✓ Success message shows
- ✓ Form clears
- ✓ Visible in attendance history

**Security Check:**
- ✗ Wrong password → "Invalid password"
- ✗ Correct password → Allowed

---

### ✅ Scenario 11: Manage Sections

**Steps:**
1. Tap "Manage Sections" from dashboard
2. See list of all sections

**Edit Section:**
1. Tap section → "Edit"
2. Change name to `BSIT-S2`
3. Tap "Update Section"
4. Verify change

**Delete Section:**
1. Tap section → "Delete"
2. Confirm deletion
3. Section removed from list

**Expected Result:**
- ✓ List loads all sections
- ✓ Edit updates name
- ✓ Delete removes section
- ✓ Changes reflect everywhere

---

### ✅ Scenario 12: Student Self-Scan Flow

**Steps:**
1. From landing page, tap "Student Login"
2. Grant camera permission
3. Scan student QR
4. See Time In recorded

**Expected Result:**
- ✓ Works without teacher authentication
- ✓ 60-second cooldown still enforced
- ✓ Automatic Time In/Time Out
- ✓ No section selection needed

---

### ✅ Scenario 13: Logout

**Steps:**
1. From dashboard, tap "Logout"
2. Confirm

**Expected Result:**
- ✓ Token cleared from SecureStore
- ✓ Auth state cleared
- ✓ Redirected to landing page
- ✓ Cannot access protected screens

---

## Performance Tests

### Test 1: Scan Speed
**Steps:**
1. Scan 10 students in sequence
2. Measure time for each

**Expected:**
- ✓ Each scan processes in < 2 seconds
- ✓ No lag or freezing

### Test 2: Dashboard Load Time
**Steps:**
1. After 50+ scans today
2. Tap dashboard
3. Measure load time

**Expected:**
- ✓ Loads in < 3 seconds
- ✓ Stats visible
- ✓ Logs scrollable

### Test 3: History Filter Speed
**Steps:**
1. 100+ records in database
2. Apply filters
3. Measure response time

**Expected:**
- ✓ Filters respond in < 1 second
- ✓ Search returns results instantly

---

## Error Handling Tests

### Test 1: Network Disconnected
**Steps:**
1. Turn off WiFi/mobile data
2. Try to login or scan
3. Turn back on

**Expected:**
- ✓ Shows network error message
- ✓ Allows retry
- ✓ Works once reconnected

### Test 2: Backend Down
**Steps:**
1. Stop backend server
2. Try any API action

**Expected:**
- ✓ Shows "Connection failed" error
- ✓ Doesn't crash app
- ✓ Can retry once backend restarts

### Test 3: Invalid QR Code
**Steps:**
1. Scan non-QR object
2. Scan random QR (not in format)
3. Scan empty QR

**Expected:**
- ✓ All show appropriate error
- ✓ Option to rescan
- ✓ App doesn't crash

---

## Database Verification

After running tests, verify database:

```bash
sqlite3 backend/data/attendance.db
```

### Check Teachers
```sql
SELECT * FROM teachers;
```

Expected:
```
TCHR001|Demo Teacher|$2a$10$...|2024-01-15 10:30:00|2024-01-15 09:00:00
```

### Check Students
```sql
SELECT * FROM students;
```

Expected:
```
20203300076|NHEM DAY G. ACLO|BSIT||2024-01-15 09:05:00|...
```

### Check Attendance
```sql
SELECT * FROM attendance WHERE date = '2024-01-15' ORDER BY createdAt;
```

Expected:
```
uuid|20203300076|BSIT-S1|2024-01-15|2024-01-15 08:00:00|2024-01-15 09:00:00|...
uuid|20203300001|BSIT-S1|2024-01-15|2024-01-15 08:05:00||...
```

### Check Sections
```sql
SELECT * FROM sections;
```

Expected:
```
uuid|BSIT-S1|TCHR001|2024-01-15 09:00:00
uuid|BSIT-S2|TCHR001|2024-01-15 09:30:00
```

---

## Checklist

Before considering tests complete:

- [ ] All 13 scenarios pass
- [ ] Performance tests acceptable
- [ ] Error handling graceful
- [ ] Database accurate
- [ ] 60-second cooldown enforced (client + server)
- [ ] Section locking works
- [ ] Manual entry requires password
- [ ] Dashboard stats correct
- [ ] History filters accurate
- [ ] No console errors
- [ ] No memory leaks (check in Profiler)
- [ ] App handles network disconnection

---

## Final Sign-Off

Once all tests pass, the system is **production-ready** for:
- Real student data
- Real QR code IDs
- Classroom deployment
- Real-time attendance tracking

# Implementation Guide - Teacher-Only QR Attendance System

## Overview
This guide explains how to implement the corrected flow where only teachers can use the app.

### Key Changes Required:
1. **Remove student functionality** - No student login/scanning
2. **Add teacher registration** - Teachers can create accounts
3. **2FA Authentication** - QR code + password verification
4. **Section management** - Teachers create sections before scanning
5. **Automatic 1-minute cooldown** - For student time in/out
6. **Auto-logout after 1 minute** - Student can logout after 1 minute

---

## Step 1: Update Backend Routes

### Replace old teacher routes with new implementation:

**Replace:** `backend/src/routes/teacher.ts`
**With:** `backend/src/routes/teacher-new.ts`

**Replace:** `backend/src/routes/sections.ts`
**With:** `backend/src/routes/sections-new.ts`

**Replace:** `backend/src/routes/attendance.ts`
**With:** `backend/src/routes/attendance-new.ts`

**Commands:**
```bash
# In backend folder
mv src/routes/teacher.ts src/routes/teacher-old.ts
cp src/routes/teacher-new.ts src/routes/teacher.ts

mv src/routes/sections.ts src/routes/sections-old.ts
cp src/routes/sections-new.ts src/routes/sections.ts

mv src/routes/attendance.ts src/routes/attendance-old.ts
cp src/routes/attendance-new.ts src/routes/attendance.ts
```

### Update `backend/src/index.ts` if needed:
Routes should already be correct, but verify:
```typescript
import teacherRoutes from './routes/teacher';
import attendanceRoutes from './routes/attendance';
import sectionsRoutes from './routes/sections';

app.use('/api/teacher', teacherRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/sections', sectionsRoutes);
```

---

## Step 2: Update Mobile App - Landing Page

Already done in `app/index.tsx`:
- Removed "Student Login" button
- Changed "Teacher Login" and "Create Account"
- This is correct ✓

---

## Step 3: Create Teacher Registration Screen

Create: `app/teacher/register.tsx`

Key features:
- Username input
- Full name input
- Password input
- Confirm password input
- Register button
- Call POST `/api/teacher/register`
- Generate QR code for teacher (display it)
- Save token and redirect to dashboard

---

## Step 4: Update Teacher Login Screen

Update: `app/teacher/login.tsx`

Key features:
- **Step 1:** QR Scanner to scan teacher's own QR code
- **Step 2:** Password input field
- Parse QR data: "TCHR|{TEACHER_ID}|{TEACHER_NAME}"
- Call POST `/api/teacher/login` with qrCodeData + password
- Save JWT token
- Redirect to dashboard on success

---

## Step 5: Update Dashboard

Update: `app/teacher/dashboard.tsx`

Key features:
- Display teacher name (from token)
- Show sections list (GET `/api/sections`)
- "Start Scanning" button
- "Add Section" button (opens modal)
- Logout button (clear token, redirect to landing)
- Display today's stats:
  - Total students present
  - Currently checked in
  - Already checked out
  - Active sections

---

## Step 6: Create Section Management

Screens needed:
- Modal for creating section (name, optional description)
- Modal for editing section
- Delete section (with confirmation)

API calls:
- POST `/api/sections` - Create
- PUT `/api/sections/:id` - Update
- DELETE `/api/sections/:id` - Delete
- GET `/api/sections` - List

---

## Step 7: Update Scanner Screen

Update: `app/teacher/scanner.tsx`

Key features:
- Show "Select Section" picker at top (required)
- When section selected, activate QR scanner
- Scanner accepts student QR codes
- QR format: "{STUDENT_NAME}|{STUDENT_ID}|{COURSE}"
- Call POST `/api/attendance/scan` with:
  - sectionId
  - studentQrData
- Display responses:
  - Time In: Show student name, time, "Ready to scan again in 1 minute"
  - Cooldown: Show countdown timer
  - Time Out: Show success, duration
  - Completed: Show error (can't scan again)
- Real-time log showing recent scans

---

## Step 8: Update Attendance History

Update: `app/teacher/attendance/index.tsx`

Key features:
- Filter by section (dropdown)
- Filter by date (date picker)
- Display table:
  - Student name
  - Student ID
  - Course
  - Time In
  - Time Out
  - Duration
  - Status (In/Out)
- Call GET `/api/attendance/section/:sectionId`
- With date query parameter

---

## Step 9: Update Dashboard Stats

Dashboard should call GET `/api/attendance/stats/today`

Display:
- Total students present today
- Currently checked in
- Already checked out
- Number of active sections

---

## Step 10: Backend Database

Already updated in `backend/src/database.ts`:
- Teachers table: Added username, email, qrCodeData fields
- Sections table: Changed to have teacherId (sections belong to teachers)
- Attendance table: Changed sectionId (instead of string section name), removed student table
- Removed students table (data stored in attendance records)

This is correct ✓

---

## API Endpoints Summary

### Teacher Routes
```
POST   /api/teacher/register       - Create account
POST   /api/teacher/login          - Login with QR + password
GET    /api/teacher/profile        - Get teacher info
GET    /api/teacher/dashboard      - Get dashboard data (stats, logs)
POST   /api/teacher/logout         - Logout
```

### Sections Routes
```
GET    /api/sections               - List teacher's sections
POST   /api/sections               - Create section
PUT    /api/sections/:id           - Update section
DELETE /api/sections/:id           - Delete section
```

### Attendance Routes
```
POST   /api/attendance/scan        - Scan student (time in/out)
GET    /api/attendance/section/:id - Get section history
GET    /api/attendance/today       - Get today's records
GET    /api/attendance/stats/today - Get stats
POST   /api/attendance/manual      - Manual entry (requires password)
DELETE /api/attendance/:id         - Delete record (requires password)
```

---

## Data Models

### Request: Teacher Login
```json
{
  "qrCodeData": "TCHR|TCHR001|Demo Teacher",
  "password": "teacher123"
}
```

### Response: Teacher Login
```json
{
  "token": "jwt_token_here",
  "teacherId": "TCHR001",
  "username": "demoteacher",
  "fullName": "Demo Teacher",
  "email": "teacher@email.com"
}
```

### Request: Scan Student
```json
{
  "sectionId": "section-uuid",
  "studentQrData": "John Doe|20203300001|BSIT"
}
```

### Response: Scan Student (Time In)
```json
{
  "message": "Time In recorded",
  "status": "IN",
  "studentName": "John Doe",
  "studentId": "20203300001",
  "timeIn": "2024-01-15T10:30:45Z",
  "timeOut": null,
  "nextActionAfter": 60
}
```

### Response: Scan Student (Cooldown)
```json
{
  "message": "Wait 45 seconds before scanning out",
  "status": "COOLDOWN",
  "secondsRemaining": 45,
  "studentName": "John Doe"
}
```

---

## Testing Checklist

### Backend Testing
- [ ] Start backend: `cd backend && npm run dev`
- [ ] Test registration: POST `/api/teacher/register`
- [ ] Test login: POST `/api/teacher/login`
- [ ] Create section: POST `/api/sections`
- [ ] Scan student: POST `/api/attendance/scan`
- [ ] Check cooldown works (60 seconds)
- [ ] Check history: GET `/api/attendance/section/:id`

### Mobile App Testing
1. **Landing Page**
   - [ ] Two buttons visible (Login, Create Account)
   - [ ] No student button

2. **Registration**
   - [ ] Can enter username, name, password
   - [ ] Passwords must match
   - [ ] Creates account successfully
   - [ ] Shows QR code for teacher
   - [ ] Redirects to dashboard

3. **Login**
   - [ ] Can scan QR code
   - [ ] Can enter password
   - [ ] Both must be correct for login
   - [ ] Redirects to dashboard

4. **Dashboard**
   - [ ] Shows teacher name
   - [ ] Shows list of sections
   - [ ] Can add section
   - [ ] Can edit section
   - [ ] Can delete section
   - [ ] Shows today's stats

5. **Scanner**
   - [ ] Must select section first
   - [ ] Can scan student QR
   - [ ] Shows Time In message
   - [ ] Cooldown countdown appears
   - [ ] After 60s can scan again
   - [ ] Shows Time Out message
   - [ ] Real-time log updates

6. **History**
   - [ ] Can view section records
   - [ ] Can filter by date
   - [ ] Shows duration calculations
   - [ ] Shows student info

---

## Default Test Credentials

**Teacher (Auto-seeded):**
- Username: `demoteacher`
- Password: `teacher123`
- QR Code: `TCHR|TCHR001|Demo Teacher`

**Create test student QR codes at:** https://www.qr-code-generator.com/

Format: `{STUDENT_NAME}|{STUDENT_ID}|{COURSE}`

Examples:
```
John Doe|20203300001|BSIT
Jane Smith|20203300002|BSCS
NHEM DAY G. ACLO|20203300076|BSIT
```

---

## File Status

### Backend Files
- ✓ `backend/src/database.ts` - Updated (schema changes)
- ✓ `backend/src/routes/teacher-new.ts` - Created
- ✓ `backend/src/routes/sections-new.ts` - Created
- ✓ `backend/src/routes/attendance-new.ts` - Created
- ⏳ Need to replace old routes with new ones

### Mobile App Files
- ✓ `app/index.tsx` - Updated (landing page)
- ⏳ `app/teacher/register.tsx` - Need to create
- ⏳ `app/teacher/login.tsx` - Need to update
- ⏳ `app/teacher/dashboard.tsx` - Need to update
- ⏳ `app/teacher/scanner.tsx` - Need to update
- ⏳ `app/teacher/attendance/` - Need to update
- ⏳ Remove `app/student/` folder - Not needed

---

## Next Steps

1. **Replace backend routes** (copy new files over old ones)
2. **Update mobile screens** (registration, login, dashboard, scanner)
3. **Test backend** with Postman or curl
4. **Test mobile app** with Expo Go
5. **Fix any issues** found during testing
6. **Deploy** when ready

---

## Important Notes

1. **QR Code for Teachers:** Generated during registration, shows as `TCHR|{TEACHER_ID}|{TEACHER_NAME}`
2. **QR Code for Students:** Format is `{STUDENT_NAME}|{STUDENT_ID}|{COURSE}`, no prefix
3. **1-Minute Cooldown:** Enforced server-side, starts from timeIn, prevents duplicate scans
4. **Auto-Logout:** Student is automatically eligible for logout after 60 seconds, no timer needed
5. **Section Required:** Teacher must select section before scanning, prevents mixed records
6. **Password Required:** For manual entry and deletion, ensures teacher authorization

---

## Troubleshooting

**Backend won't start:**
- Check Node.js version: `node -v` (need 16+)
- Delete node_modules: `rm -rf node_modules && npm install`
- Check port 3000 is free

**Mobile app won't login:**
- Verify API_BASE_URL in `hooks/useApi.ts`
- Ensure backend is running
- Check QR code format matches exactly

**Scans not working:**
- Verify section was selected
- Check QR code format (use | as separator)
- Ensure cooldown timer is working (60 seconds)

**Database issues:**
- Delete `backend/data/attendance.db`
- Restart backend (will recreate)
- Verify foreign key relationships

---

For more details, see:
- `CORRECT_FLOW.md` - Business logic overview
- `backend/src/routes/` - API implementation
- `app/` - Mobile screens


# Correct QR Attendance Flow - Teacher Only

## Application Flow

### 1. Landing Page
- Remove "Student Login" button
- Keep only "Teacher Login" or "Teacher Register"
- Simple design

### 2. Teacher Registration/Sign Up
- Email or Username
- Password (create)
- Confirm password
- Create account button
- Should store teacher info in database

### 3. Teacher Login
**Step 1: Scan QR Code**
- Teacher scans their own QR code
- QR format: `TCHR|{TEACHER_ID}|{TEACHER_NAME}`

**Step 2: Password Authentication**
- Enter password
- Verify both QR code data and password match
- Issue JWT token on success (12 hours expiration)

### 4. Dashboard
After successful login, teacher sees:
- Welcome message with teacher name
- "Start Scanning" button
- View attendance history
- Logout button
- Settings/Profile options

### 5. Start Scanning Flow
When teacher clicks "Start Scanning":

**Step 5a: Section Management**
- Display available sections (from database)
- Options to:
  - Create new section (popup/modal)
  - Edit existing section
  - Delete section
  - Select a section to start scanning

**Step 5b: Scan Students**
After selecting section:
- Show section name at top
- QR scanner active
- When student QR scanned:
  - Extract: `{STUDENT_NAME}|{STUDENT_ID}|{COURSE}`
  - Record attendance:
    - First scan = Time In
    - After 1 minute, can scan again = Time Out
  - Show confirmation with student name
  - Reset scanner for next student
  - Display real-time scan log

### 6. Automatic Logout After 1 Minute
- Once student's time in is recorded, start countdown
- After 60 seconds, student is automatically eligible for logout
- Can be done via same QR code scan (automatically logs them out instead of time in)
- Teacher sees logout in the log with timestamp

### 7. View Attendance
- Filter by section
- Filter by date
- Show list of:
  - Student name
  - Student ID
  - Time In
  - Time Out
  - Duration

---

## Database Schema Changes Needed

### Teachers Table
```
id (PK)
username
email
password_hash
qr_code_data
created_at
updated_at
```

### Sections Table
```
id (PK)
teacher_id (FK)
name
description
created_at
updated_at
```

### Attendance Table
```
id (PK)
section_id (FK)
student_id
student_name
course
time_in
time_out
created_at
```

---

## API Endpoints Needed

### Authentication
- POST `/api/teacher/register` - Create new teacher
- POST `/api/teacher/login` - Login with QR + password
- POST `/api/teacher/logout` - Logout
- GET `/api/teacher/profile` - Get teacher info

### Sections
- GET `/api/sections` - List all sections for teacher
- POST `/api/sections` - Create section
- PUT `/api/sections/:id` - Update section
- DELETE `/api/sections/:id` - Delete section

### Attendance
- POST `/api/attendance/scan` - Record scan (time in/out)
- GET `/api/attendance/history` - Get attendance records
- GET `/api/attendance/today` - Get today's attendance

---

## Key Business Logic

1. **2FA Authentication:**
   - QR code must match teacher record
   - Password must match hash
   - Only after both verified = login success

2. **Cooldown Logic:**
   - First scan of student in a session = Time In
   - If last record has time_in but no time_out, next scan = Time Out
   - Enforced on server side
   - Cooldown: 1 minute between in/out

3. **Automatic Logout:**
   - Timer starts when time_in is recorded
   - After 60 seconds, student is automatically logged out
   - No action needed from teacher
   - Can optionally scan again to confirm logout

4. **Section Isolation:**
   - Attendance only recorded for selected section
   - Teacher must select section before scanning
   - Section can be created/edited/deleted from dashboard

---

## File Structure After Fix

```
qr-attendance-v2/
├── app/
│   ├── index.tsx (REMOVE student button)
│   ├── teacher/
│   │   ├── login.tsx (2FA: QR + password)
│   │   ├── register.tsx (NEW: teacher registration)
│   │   ├── dashboard.tsx (UPDATED: dashboard with sections)
│   │   ├── scanner.tsx (UPDATED: scan students)
│   │   ├── sections/ (UPDATED: manage sections)
│   │   └── attendance/ (UPDATED: view history)
│   └── _layout.tsx
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── teacher.ts (UPDATED: register + login)
│   │   │   ├── sections.ts (NEW: section management)
│   │   │   ├── attendance.ts (UPDATED: scan logic)
│   │   │   └── auth.ts (NEW: 2FA logic)
│   │   ├── database.ts (UPDATED: new schema)
│   │   └── index.ts
│   └── .env
└── store/
    └── authStore.ts (UPDATED: include teacher info)
```

---

## Implementation Steps

1. Update database schema (add teachers table, modify attendance)
2. Create teacher registration endpoint
3. Update login endpoint (2FA: QR + password)
4. Add section management endpoints
5. Update attendance scanning logic (1 minute cooldown)
6. Create register screen UI
7. Update login screen (2FA flow)
8. Update dashboard (section management)
9. Update scanner (section selection, proper logging)
10. Test entire flow end-to-end

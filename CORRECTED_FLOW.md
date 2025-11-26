# Corrected QR Attendance App Flow

## Updated 2FA Login Process

### Previous (Wrong) Understanding:
1. Scan QR code
2. Enter password

### Correct Process (NEW):
1. Enter email + password
2. If correct → proceed to QR scanning
3. Scan teacher's QR code to verify
4. Login complete

---

## Complete User Flow

### 1. Landing Page
```
┌─────────────────────────────────┐
│  QR Attendance System            │
│  Teacher System                  │
│                                  │
│  [Teacher Login]                 │
│  [Create Account]                │
└─────────────────────────────────┘
```

### 2. Create Account Page
```
┌─────────────────────────────────┐
│  Create Teacher Account          │
│                                  │
│  Email:              [_______]   │
│  Full Name:          [_______]   │
│  Password:           [_______]   │
│  Confirm Password:   [_______]   │
│                                  │
│  [Create Account]                │
│  [Back to Login]                 │
└─────────────────────────────────┘

On Success:
└─→ Show QR Code
└─→ Display: "Your Teacher QR Code"
└─→ [Continue to Dashboard]
```

### 3. Teacher Login - Step 1: Email & Password
```
┌─────────────────────────────────┐
│  Teacher Login                   │
│  (Step 1 of 2)                   │
│                                  │
│  Email:    [_______]             │
│  Password: [_______]             │
│                                  │
│  [Next]  [Back]                  │
└─────────────────────────────────┘

Validation:
- Check email exists
- Verify password matches
- If WRONG → Show error, stay on this page
- If CORRECT → Proceed to Step 2
```

### 4. Teacher Login - Step 2: QR Code Scan
```
┌─────────────────────────────────┐
│  Teacher Login                   │
│  (Step 2 of 2)                   │
│                                  │
│  Scan your teacher QR code:      │
│                                  │
│  [QR Scanner View]               │
│                                  │
│  [Cancel]  [Manual Entry]        │
└─────────────────────────────────┘

Expected QR Format:
TCHR|{TEACHER_ID}|{TEACHER_NAME}

Validation:
- QR scanned must match teacher's stored QR
- If MATCH → Login successful, go to Dashboard
- If NO MATCH → Show error, rescan
```

### 5. Dashboard (After Login)
```
┌─────────────────────────────────┐
│  Dashboard                       │
│  Welcome, [Teacher Name]!        │
│                                  │
│  Stats:                          │
│  Today: 45 students present      │
│  Now: 12 checked in              │
│                                  │
│  ┌─────────────────────────────┐ │
│  │ Sections                    │ │
│  │ BSIT-101 (Morning)   [Sel]  │ │
│  │ BSIT-102 (Afternoon) [Sel]  │ │
│  │ [+ Add Section]             │ │
│  └─────────────────────────────┘ │
│                                  │
│  [Start Scanning] [History]      │
│  [Settings] [Logout]             │
└─────────────────────────────────┘
```

### 6. Attendance Scanning
```
┌─────────────────────────────────┐
│  Attendance Scanner              │
│  Section: [BSIT-101 ▼]           │
│                                  │
│  [QR Scanner - Scan Students]    │
│                                  │
│  ┌─────────────────────────────┐ │
│  │ Scans Today:                │ │
│  │ 10:30 - John Doe    [IN]    │ │
│  │ 10:31 - Jane Smith  [OUT]   │ │
│  │ 10:35 - Mike Brown  [IN]    │ │
│  └─────────────────────────────┘ │
│                                  │
│  [Back to Dashboard]             │
└─────────────────────────────────┘
```

---

## Database Schema

### Teachers Table
```sql
CREATE TABLE teachers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  fullName TEXT NOT NULL,
  passwordHash TEXT NOT NULL,
  qrCodeData TEXT NOT NULL,
  createdAt DATETIME,
  updatedAt DATETIME
);
```

### Sections Table
```sql
CREATE TABLE sections (
  id TEXT PRIMARY KEY,
  teacherId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  createdAt DATETIME,
  updatedAt DATETIME,
  FOREIGN KEY (teacherId) REFERENCES teachers(id),
  UNIQUE(teacherId, name)
);
```

### Attendance Table
```sql
CREATE TABLE attendance (
  id TEXT PRIMARY KEY,
  sectionId TEXT NOT NULL,
  studentId TEXT NOT NULL,
  studentName TEXT NOT NULL,
  course TEXT,
  timeIn DATETIME,
  timeOut DATETIME,
  createdAt DATETIME,
  updatedAt DATETIME,
  FOREIGN KEY (sectionId) REFERENCES sections(id)
);
```

---

## API Endpoints

### Teacher Authentication
```
POST /api/teacher/register
  Body: { email, fullName, password, confirmPassword }
  Response: { message, teacherId, qrCodeData }

POST /api/teacher/login/step1
  Body: { email, password }
  Response: { success, message, tempToken }

POST /api/teacher/login/step2
  Body: { tempToken, qrCodeData }
  Response: { token, teacherId, email, fullName }

POST /api/teacher/logout
  Headers: { Authorization: Bearer {token} }
  Response: { message }
```

### Sections
```
GET /api/sections
  Headers: { Authorization: Bearer {token} }
  Response: { sections: [...] }

POST /api/sections
  Body: { name, description }
  Response: { section }

PUT /api/sections/:id
  Body: { name, description }
  Response: { section }

DELETE /api/sections/:id
  Response: { message }
```

### Attendance
```
POST /api/attendance/scan
  Body: { sectionId, studentQrData }
  Response: { status, message, timeIn, timeOut, ... }

GET /api/attendance/section/:id
  Query: { date }
  Response: { records: [...] }

GET /api/attendance/stats/today
  Response: { totalPresent, currentlyIn, checkedOut, ... }
```

---

## Registration Flow

```
User Taps [Create Account]
           ↓
┌─────────────────────────────────┐
│  Registration Form              │
│  Email: ________                │
│  Full Name: ________            │
│  Password: ________             │
│  Confirm: ________              │
│  [Create Account]               │
└─────────────────────────────────┘
           ↓
Validate:
- Email format valid
- Email not already used
- Password length >= 6
- Passwords match
           ↓
If Errors: Show messages, stay on page
           ↓
If Valid: POST /api/teacher/register
           ↓
Generate QR Code: TCHR|{ID}|{FullName}
           ↓
Save Token (JWT)
           ↓
┌─────────────────────────────────┐
│  Account Created!               │
│                                  │
│  Your Teacher QR Code:          │
│  [QR Code Display]              │
│                                  │
│  Email: teacher@example.com     │
│  Name: John Smith               │
│                                  │
│  [Continue to Dashboard]        │
└─────────────────────────────────┘
           ↓
Dashboard
```

---

## Login Flow (Corrected)

```
User Taps [Teacher Login]
           ↓
┌─────────────────────────────────┐
│  Login - Step 1 of 2            │
│  Email: ________                │
│  Password: ________             │
│  [Next] [Back]                  │
└─────────────────────────────────┘
           ↓
Validate Email & Password:
- Email exists in database
- Password matches hash
           ↓
If WRONG: Show error
  "Email or password incorrect"
  Stay on Step 1
           ↓
If CORRECT: 
  Generate temporary token
  Clear sensitive data
           ↓
┌─────────────────────────────────┐
│  Login - Step 2 of 2            │
│  Verify with QR Code            │
│                                  │
│  [QR Scanner]                   │
│                                  │
│  Expected Format:               │
│  TCHR|{TEACHER_ID}|{NAME}       │
│                                  │
│  [Scan] [Cancel]                │
└─────────────────────────────────┘
           ↓
Validate QR Code:
- Parse QR format
- Get teacher ID from QR
- Verify QR matches database QR
           ↓
If MISMATCH: Show error
  "QR code doesn't match"
  Allow rescan
           ↓
If MATCH: 
  POST /api/teacher/login/step2
  { tempToken, qrCodeData }
           ↓
Save JWT Token
           ↓
Redirect to Dashboard
```

---

## Key Points

### 2FA Authentication (Corrected)
1. **Step 1:** Email + Password verification
   - Server validates credentials
   - If wrong, user stays on login page
   - If correct, proceed to Step 2

2. **Step 2:** QR Code scanning
   - Teacher scans their own QR code
   - QR must match teacher's stored QR
   - If no match, allow rescan
   - If match, login complete

### Registration
- Email + Full Name + Password
- Generate QR code automatically
- Display QR code to user
- Redirect to dashboard

### Why This Order?
1. **Email + Password first** - Fast verification
2. **QR Code second** - Harder to fake, additional security
3. **Both required** - True 2FA protection

---

## Attendance Flow (Unchanged)

```
Dashboard
  ↓
Select Section (Required)
  ↓
Start Scanning
  ↓
Scan Student QR: {NAME}|{ID}|{COURSE}
  ↓
First Scan: TIME IN recorded
  ↓
Wait 60 Seconds (Cooldown)
  ↓
Second Scan: TIME OUT recorded
  ↓
Complete - Cannot scan again
```

---

## Summary of Changes

| Step | Before | After |
|------|--------|-------|
| 1 | Scan QR | Enter Email + Password |
| 2 | Enter Password | Scan Teacher QR |
| 3 | Login | Login |

All other features remain the same:
- ✓ Sections management
- ✓ Student attendance scanning
- ✓ 1-minute cooldown
- ✓ Attendance history
- ✓ Dashboard stats


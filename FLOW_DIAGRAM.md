# QR Attendance System - Flow Diagrams

## 1. Teacher Registration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Landing Page                              │
│  [Teacher Login]  [Create Account]                           │
└────────┬────────────────────────┬──────────────────────────┘
         │                        │
         └────────────┬───────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
   [Existing Teacher]      [New Teacher]
         │                         │
         ▼                         ▼
┌─────────────────────┐  ┌────────────────────┐
│   Teacher Login     │  │ Teacher Register   │
│  (QR + Password)    │  │  (Create Account)  │
└─────────┬───────────┘  └────────┬───────────┘
          │                       │
          │ Step 1: Scan QR       │ Username
          │ Step 2: Enter Pass    │ Full Name
          │ Step 3: Verify       │ Password
          │                       │ Confirm Pass
          │                       │
          └─────────┬─────────────┘
                    │
         ┌──────────▼──────────┐
         │ Verify Credentials  │
         │ Generate JWT Token  │
         │ Create QR Code      │
         │ (TCHR|ID|NAME)      │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │  Save Token (Secure)│
         │  Show QR Code       │
         │  Redirect Dashboard │
         └─────────────────────┘
```

## 2. Teacher Dashboard Flow

```
┌──────────────────────────────────────────┐
│           Teacher Dashboard              │
│  Welcome, [Teacher Name]                 │
│                                          │
│  Stats:                                  │
│  • Total Present: X                      │
│  • Currently In: Y                       │
│  • Already Out: Z                        │
│                                          │
│  [+ Add Section] [Start Scanning]        │
│  [View History]  [Settings]              │
│  [Logout]                                │
└────┬────────────────────┬────────┬───────┘
     │                    │        │
     ▼                    ▼        ▼
┌──────────┐  ┌─────────────────┐  ┌──────┐
│ Sections │  │ Add Section     │  │Log  │
│ BSIT-101 │  │ Modal/Form      │  │out  │
│ BSIT-102 │  │ [Name]          │  │     │
│ BSCS-201 │  │ [Description]   │  │Clear│
│ [Edit]   │  │ [Create]        │  │Token│
│ [Delete] │  └─────────────────┘  └──────┘
└──────────┘
     │
     ▼
  [Select Section]
     │
     ▼
  [Start Scanning]
     │
     └────→ Scanner Screen
```

## 3. Student Attendance Scanning Flow

```
┌────────────────────────────────────────────┐
│          Teacher Scanner Screen             │
│  Section: [BSIT-101 ▼]                     │
│                                            │
│  [QR Scanner - Scan Student]               │
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │ Recent Scans:                        │  │
│  │ • John Doe     ⏰ 10:30 [IN]          │  │
│  │ • Jane Smith   ⏰ 10:15 [IN]          │  │
│  │ • Mike Brown   ⏰ 10:05 [OUT]         │  │
│  └──────────────────────────────────────┘  │
└────────┬─────────────────────────────────┘
         │
         ├─── Scan Student QR
         │    "John Doe|12345|BSIT"
         │
         ▼
    ┌──────────────────────┐
    │ Check Database       │
    │ ├─ Record exists?    │
    │ ├─ Has timeIn?       │
    │ └─ Has timeOut?      │
    └──────────┬───────────┘
               │
         ┌─────┴─────┬──────────┬──────────┐
         │           │          │          │
         ▼           ▼          ▼          ▼
     ┌────┐  ┌──────────┐  ┌──────────┐  ┌──────┐
     │NEW │  │COOLDOWN  │  │TIMEOUT   │  │DONE  │
     │    │  │ CHECK    │  │ELIGIBLE  │  │      │
     └──┬─┘  └────┬─────┘  └────┬─────┘  └──┬───┘
       │         │              │           │
   ┌───▼──┐ ┌────▼────┐    ┌────▼────┐  ┌──▼──┐
   │TIME  │ │< 60sec? │    │>= 60sec?│  │ERROR│
   │IN    │ │BLOCKED  │    │TIME OUT │  │     │
   │      │ │WAIT     │    │RECORDED │  │Both │
   │ ✓    │ │ X sec   │    │  ✓      │  │Exist│
   └──────┘ └────┬────┘    └─────────┘  └─────┘
                  │
              ┌───▼───┐
              │ UI    │
              │Display│
              │Counter│
              └───────┘
```

## 4. Attendance State Machine

```
                    ┌─────────────────────────┐
                    │    NO RECORD           │
                    │   (Student not scanned) │
                    └────────┬────────────────┘
                             │
              First Scan at T0 (time = T0)
                             │
                             ▼
                    ┌─────────────────────────┐
                    │ TIME IN = T0            │
                    │ TIME OUT = null         │
                    │ Status = IN             │
                    └────────┬────────────────┘
                             │
                    ┌────────▼────────┐
                    │ Cooldown Timer  │
                    │ 60 Seconds      │
                    │                 │
                    │ T: T0 → T0+60s  │
                    └────────┬────────┘
                             │
                    Scan after 60s at T1 (T1 >= T0+60s)
                             │
                             ▼
                    ┌─────────────────────────┐
                    │ TIME IN = T0            │
                    │ TIME OUT = T1           │
                    │ Status = OUT            │
                    │ Duration = T1 - T0      │
                    └──────────┬──────────────┘
                               │
                           COMPLETE
                               │
                               ▼
                    ┌─────────────────────────┐
                    │ CANNOT SCAN AGAIN       │
                    │ (Record is complete)    │
                    │                         │
                    │ Manual override needed  │
                    └─────────────────────────┘
```

## 5. Section Management Flow

```
┌────────────────────────────────────────┐
│        Dashboard Sections List          │
│  ┌────────────────────────────────┐   │
│  │ BSIT-101 (Morning Class)       │   │
│  │ [Select] [Edit] [Delete]       │   │
│  └────────────────────────────────┘   │
│  ┌────────────────────────────────┐   │
│  │ BSIT-102 (Afternoon Class)     │   │
│  │ [Select] [Edit] [Delete]       │   │
│  └────────────────────────────────┘   │
│  ┌────────────────────────────────┐   │
│  │ BSCS-201 (Computer Science)    │   │
│  │ [Select] [Edit] [Delete]       │   │
│  └────────────────────────────────┘   │
│                                        │
│  [+ Add New Section]                   │
└────┬────────────────────┬──────────────┘
     │                    │
     ▼                    ▼
┌──────────────┐   ┌──────────────────┐
│ Select Sec.  │   │ Add Section      │
│ Go to Scanner│   │ Modal/Form       │
└──────────────┘   │ Name: _____      │
     │             │ Desc: _____      │
     │             │ [Create]         │
     │             │ [Cancel]         │
     │             └────────────────┬─┘
     │                              │
     │                    ┌─────────▼──────┐
     │                    │ Verify Name     │
     │                    │ Not Duplicate   │
     │                    │ Create Record   │
     │                    └─────────┬──────┘
     │                              │
     ▼                              ▼
┌──────────────────┐      ┌──────────────────┐
│ Scanner Screen   │      │ Return to List   │
│ Section: BSIT-101│      │ Show New Section │
│ [Scan QR codes]  │      │ Ready to Select  │
└──────────────────┘      └──────────────────┘
```

## 6. API Request/Response Flow

```
Mobile App                          Backend Server
    │                                      │
    ├─ POST /api/teacher/register ──────>│
    │  {username, fullName, password}    │
    │                                    │
    │<─────── {token, qrCodeData} ──────┤
    │                                    │
    ├─ POST /api/teacher/login ────────>│
    │  {qrCodeData, password}            │
    │                                    │
    │<─────── {token, teacherId} ───────┤
    │                                    │
    ├─ GET /api/sections ───────────────>│
    │  (with JWT token)                  │
    │                                    │
    │<─────── {sections: []} ───────────┤
    │                                    │
    ├─ POST /api/sections ──────────────>│
    │  {name, description}               │
    │                                    │
    │<─────── {section} ────────────────┤
    │                                    │
    ├─ POST /api/attendance/scan ──────>│
    │  {sectionId, studentQrData}       │
    │                                    │
    │<─────── {status, timeIn} ────────┤
    │                                    │
    ├─ (Wait 60 seconds) ─────────────── │
    │                                    │
    ├─ POST /api/attendance/scan ──────>│
    │  {sectionId, studentQrData}       │
    │                                    │
    │<─────── {status, timeOut} ───────┤
    │                                    │
```

## 7. Authentication State

```
┌──────────────┐
│  Not Logged  │
│     In       │
└────┬─────────┘
     │
     │ Register / Login
     │
     ▼
┌──────────────────────────────────┐
│   JWT Token Obtained             │
│   (Valid for 12 hours)           │
│                                  │
│   Stored in Secure Storage       │
└────┬─────────────────────────────┘
     │
     │ Added to each API request
     │ Authorization: Bearer {token}
     │
     ▼
┌──────────────────────────────────┐
│   Authenticated State             │
│   Access Protected Routes         │
│   Can perform actions             │
└────┬─────────────────────────────┘
     │
     │ Logout / Token Expires
     │
     ▼
┌──────────────────────────────────┐
│   Token Deleted                   │
│   Redirect to Landing             │
│                                   │
│   Must Login Again                │
└───────────────────────────────────┘
```

## 8. Attendance Record Lifecycle

```
Day Start (8:00 AM)
    │
    ├─ Teacher logs in ✓
    │
    ├─ Teacher selects section (BSIT-101) ✓
    │
    ├─ Student scans QR code (First) 
    │  └─ Attendance Record Created
    │     ├─ studentId: 20203300001
    │     ├─ timeIn: 08:30
    │     ├─ timeOut: null
    │     └─ status: IN
    │
    ├─ Cooldown Period (60 seconds)
    │  └─ Server prevents re-scan
    │
    ├─ After 60 seconds, Student scans again
    │  └─ Attendance Record Updated
    │     ├─ studentId: 20203300001
    │     ├─ timeIn: 08:30
    │     ├─ timeOut: 08:31
    │     ├─ duration: 1 minute
    │     └─ status: OUT
    │
    └─ Record is COMPLETE
       Can only be modified with password
```

---

## Summary

The system ensures:
1. ✓ Only teachers can login/register
2. ✓ 2FA authentication (QR + password)
3. ✓ Section isolation (attendance per section)
4. ✓ Automatic time tracking (in/out)
5. ✓ Cooldown enforcement (60 seconds)
6. ✓ Security (password-protected modifications)


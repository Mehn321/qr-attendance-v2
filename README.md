# QR Attendance System - Complete Implementation

## Overview

A complete Expo SDK 54 mobile attendance system with QR code scanning, teacher 2FA authentication, section management, and real-time dashboard.

## ✅ Features Implemented

### 1. **Student Attendance Scanning**
- Scan student QR code (Format: `FULLNAME|STUDENTID|DEPARTMENT`)
- Automatic Time In/Time Out detection
- **60-second cooldown enforcement** (client + server)
- Prevents duplicate scans

### 2. **Teacher 2FA Authentication**
- Step 1: Scan Teacher QR code (Format: `TCHR|TEACHERID|FULLNAME`)
- Step 2: Enter password
- JWT token-based session management
- 12-hour session expiration

### 3. **Section Management**
- Create, read, update, delete sections
- Teacher must select section before scanning
- Section locks scanning workflow
- Shows all available sections

### 4. **Teacher Scanner**
- Scans with section context
- 60-second cooldown enforcement (server-side STRICT)
- Real-time scan logs display
- End session capability

### 5. **Teacher Dashboard**
- Today's overview (stats: present, time-in, completed, rate)
- Real-time scan logs
- Quick action buttons
- Auto-refresh every 10 seconds

### 6. **Attendance History**
- Filter by:
  - Date (calendar picker)
  - Section (dropdown)
  - Search (name or student ID)
- Shows time in/out, status, department

### 7. **Manual Attendance Entry**
- Add attendance for missing students
- Requires password re-entry
- Fill time in/out optionally
- Full form validation

## 📁 Project Structure

```
qr-attendance-v2/
├── app/                           # Expo Router navigation
│   ├── _layout.tsx
│   ├── index.tsx                  # Landing page
│   ├── student/
│   │   ├── _layout.tsx
│   │   └── scan.tsx               # Student QR scanner
│   └── teacher/
│       ├── _layout.tsx
│       ├── login.tsx              # 2FA login (QR + password)
│       ├── dashboard.tsx          # Dashboard with stats
│       ├── scanner.tsx            # Teacher scanner
│       ├── session/
│       │   └── choose-section-before-scan.tsx
│       ├── sections/
│       │   ├── _layout.tsx
│       │   ├── list.tsx
│       │   ├── create.tsx
│       │   └── edit.tsx
│       └── attendance/
│           ├── _layout.tsx
│           ├── history.tsx
│           └── manual.tsx
├── store/
│   └── authStore.ts               # Zustand auth state
├── hooks/
│   └── useApi.ts                  # Axios API client
├── backend/
│   ├── src/
│   │   ├── index.ts
│   │   ├── database.ts            # SQLite setup
│   │   ├── middleware/
│   │   │   └── auth.ts            # JWT verification
│   │   └── routes/
│   │       ├── teacher.ts
│   │       ├── attendance.ts
│   │       └── sections.ts
│   ├── package.json
│   └── tsconfig.json
├── package.json
├── app.json
├── tsconfig.json
└── README.md
```

## 🚀 Setup Instructions

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
npm install
```

2. **Create `.env` file**
```bash
cp .env.example .env
```

3. **Start backend**
```bash
npm run dev
```

Server runs on `http://localhost:3000`

### Mobile App Setup

1. **Install dependencies**
```bash
npm install
```

2. **Update API base URL** (if needed in `hooks/useApi.ts`)
```typescript
const API_BASE_URL = 'http://localhost:3000/api';
```

3. **Start Expo**
```bash
npm start
```

4. **On phone/emulator**
- Scan QR code with Expo Go app
- Or press `a` for Android, `i` for iOS

## 📱 QR Code Formats

### Student QR Code
```
NHEM DAY G. ACLO|20203300076|BSIT
```

### Teacher QR Code
```
TCHR|TCHR001|Demo Teacher
```

## 🔐 Cooldown Logic (STRICT)

**Client-side check:**
```typescript
if (lastScanAt && now - lastScanAt < 60000) {
  // Block scan, show remaining seconds
}
```

**Server-side check (enforces even if client bypassed):**
```typescript
if (timeSinceLastScan < 60000) {
  return 429 // Too Many Requests
}
```

## 🔑 Default Teacher Credentials

- **ID**: `TCHR001`
- **Password**: `teacher123`

Teacher QR code to scan:
```
TCHR|TCHR001|Demo Teacher
```

## 📊 Database Schema

### Teachers
```sql
id (TEXT PRIMARY KEY)
fullName (TEXT)
passwordHash (TEXT)
lastLoginAt (DATETIME)
createdAt (DATETIME)
```

### Sections
```sql
id (UUID PRIMARY KEY)
name (TEXT UNIQUE)
createdBy (TEXT FK -> teachers.id)
createdAt (DATETIME)
```

### Students
```sql
id (TEXT PRIMARY KEY)
fullName (TEXT)
department (TEXT)
section (TEXT)
lastScanAt (DATETIME)
createdAt (DATETIME)
```

### Attendance
```sql
id (UUID PRIMARY KEY)
studentId (TEXT FK -> students.id)
section (TEXT)
date (TEXT YYYY-MM-DD)
timeIn (DATETIME)
timeOut (DATETIME)
createdAt (DATETIME)
updatedAt (DATETIME)
```

## 🎨 UI Features

- **Safe area insets** properly applied
- **Clean minimal design** with consistent styling
- **All buttons** have same shape, colors, borders
- **Loading states** on all async operations
- **Error handling** with user-friendly messages
- **Empty states** for no data
- **Toast-like alerts** for feedback

## 📝 Important Logic

### 1. Section Locking
- Teacher MUST select section before scanning
- If section not selected → show error message
- Locks entire scanning workflow

### 2. 60-Second Cooldown
- **BOTH** client and server enforce
- Shows countdown timer on student scanner
- Server rejects requests < 60s apart
- Prevents spam/accidental double scans

### 3. Automatic Time In/Out
- No section = Time In
- Section exists, no time out = Time Out
- Both exist = Reject (manual override needed)

### 4. Manual Attendance
- Requires password re-entry
- Fully functional CRUD
- Can edit time in/out

## 🌐 API Endpoints

### Teacher Routes
- `POST /api/teacher/login` - 2FA login
- `GET /api/teacher/dashboard` - Dashboard stats

### Attendance Routes
- `POST /api/attendance/student-scan` - Student self-scan
- `POST /api/attendance/scan` - Teacher scan (with section)
- `GET /api/attendance/history` - History with filters
- `POST /api/attendance/manual` - Add manual record

### Sections Routes
- `GET /api/sections` - List all sections
- `POST /api/sections` - Create section
- `PUT /api/sections/:id` - Update section
- `DELETE /api/sections/:id` - Delete section

## 🧪 Testing Workflow

1. **Teacher Login**
   - Launch app → Teacher Login
   - Scan: `TCHR|TCHR001|Demo Teacher`
   - Password: `teacher123`

2. **Select Section**
   - Create a section (e.g., "BSIT-S1")
   - Select it from list

3. **Scan Students**
   - Scan student QR: `NHEM DAY G. ACLO|20203300076|BSIT`
   - Time In recorded
   - Wait 60+ seconds
   - Scan again for Time Out

4. **View Dashboard**
   - See stats update in real-time
   - Check logs

## 📋 Configuration

Edit `app.json`:
```json
{
  "expo": {
    "name": "QR Attendance",
    "plugins": [
      ["expo-camera", {
        "cameraPermission": "Camera access required"
      }]
    ]
  }
}
```

## ⚡ Performance Notes

- Uses AsyncStorage for client-side caching
- Secure Store for token storage
- SQLite for fast local queries
- JWT tokens expire after 12 hours
- Real-time stats refresh every 10 seconds

## 🐛 Troubleshooting

**API not connecting?**
- Ensure backend is running on port 3000
- Check network connectivity
- Update `API_BASE_URL` in `hooks/useApi.ts`

**Camera permission denied?**
- iOS: Check Settings → Privacy → Camera
- Android: Grant camera permission in app

**Cooldown not working?**
- Clear AsyncStorage: Developer menu → Logout
- Wait 60+ seconds between scans
- Check both client (AsyncStorage) and server (lastScanAt)

## 📄 License

MIT

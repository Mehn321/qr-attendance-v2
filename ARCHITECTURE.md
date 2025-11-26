# Architecture Overview

## System Design

```
┌─────────────────────────────────────────────────────────────┐
│                   EXPO MOBILE APP (SDK 54)                  │
│                   React Native + TypeScript                 │
└─────────────┬───────────────────────────────────────────────┘
              │
              │ HTTP/REST
              │ JWT Tokens
              │
┌─────────────▼───────────────────────────────────────────────┐
│              BACKEND API (Express.js + SQLite)              │
│                      Node.js TypeScript                     │
└─────────────┬───────────────────────────────────────────────┘
              │
              │ SQL Queries
              │
┌─────────────▼───────────────────────────────────────────────┐
│                  DATABASE (SQLite)                          │
│              Teachers | Sections | Students | Attendance    │
└─────────────────────────────────────────────────────────────┘
```

## Mobile App Architecture

### 1. Navigation (expo-router)

```
Landing (/)
├── Student Flow
│   └── /student/scan
└── Teacher Flow
    ├── /teacher/login (2FA)
    ├── /teacher/dashboard
    ├── /teacher/scanner
    ├── /teacher/session
    │   └── /choose-section-before-scan
    ├── /teacher/sections
    │   ├── /list
    │   ├── /create
    │   └── /edit/:id
    └── /teacher/attendance
        ├── /history
        └── /manual
```

### 2. State Management (Zustand)

**authStore:**
```typescript
{
  token: string | null
  teacherId: string | null
  teacherName: string | null
  selectedSection: string | null
  selectedSectionId: string | null
  sessionStartTime: number | null
  
  // Async actions
  setAuth(token, teacherId, teacherName)
  clearAuth()
  setSelectedSection(sectionId, sectionName)
  clearSelectedSection()
  loadAuth()
}
```

Persists to:
- **SecureStore:** `authToken` (encrypted)
- **AsyncStorage:** `teacherId`, `teacherName`, `sessionStartTime`

### 3. API Client (Axios + Interceptors)

```typescript
apiClient
├── Base URL: http://localhost:3000/api
├── Request interceptor
│   └── Adds Authorization: Bearer {token}
└── Response interceptor
    └── Handles 401 → clears auth
```

### 4. Key Components

#### Student Scanner (`/student/scan.tsx`)
```
QR Scan
  ├── Check cooldown (60s)
  ├── Parse QR: FULLNAME|STUDENTID|DEPARTMENT
  ├── POST /api/attendance/student-scan
  └── Show success/error alert
```

#### Teacher Login (`/teacher/login.tsx`)
```
Step 1: Scan QR
  ├── Parse: TCHR|TEACHERID|FULLNAME
  └── Proceed to password

Step 2: Password
  ├── POST /api/teacher/login (teacherId + password)
  ├── Store token in SecureStore
  └── Redirect to section selection
```

#### Section Selection (`/teacher/session/choose-section-before-scan.tsx`)
```
Get Sections
  ├── GET /api/sections
  ├── Display list
  └── On select:
      ├── Save to AsyncStorage
      └── Redirect to /teacher/scanner
```

#### Teacher Scanner (`/teacher/scanner.tsx`)
```
QR Scan (with section context)
  ├── Check section selected
  ├── Check cooldown (60s)
  ├── Parse student QR
  ├── POST /api/attendance/scan (with section)
  ├── Update local cooldowns
  └── Show logs in real-time
```

#### Dashboard (`/teacher/dashboard.tsx`)
```
Load Data (every 10 seconds)
  ├── GET /api/teacher/dashboard
  ├── Display stats
  ├── Show scan logs
  └── Quick action buttons
```

#### History (`/teacher/attendance/history.tsx`)
```
Filter Controls
  ├── Date picker
  ├── Section dropdown
  ├── Search box
  └── GET /api/attendance/history with params
```

#### Manual Attendance (`/teacher/attendance/manual.tsx`)
```
Form Submission
  ├── Collect all fields
  ├── POST /api/attendance/manual
  ├── Include password for verification
  └── Show success/error
```

## Backend Architecture

### 1. Express Routes

```
/api/
├── /teacher
│   ├── POST /login
│   └── GET /dashboard (protected)
├── /attendance
│   ├── POST /student-scan
│   ├── POST /scan (protected, with section)
│   ├── GET /history (protected, with filters)
│   └── POST /manual (protected, with password)
└── /sections
    ├── GET / (protected)
    ├── POST / (protected)
    ├── PUT /:id (protected)
    └── DELETE /:id (protected)
```

### 2. Middleware

**Authentication Middleware:**
```typescript
authenticateToken(req, res, next)
├── Extract JWT from Authorization header
├── Verify with secret
├── Set req.teacherId
└── Block unauthorized
```

### 3. Database Schema

#### Teachers
```sql
id (PK): string
fullName: string
passwordHash: hashed with bcryptjs
lastLoginAt: timestamp
createdAt: timestamp (auto)
```

#### Sections
```sql
id (PK): UUID
name: string (UNIQUE)
createdBy (FK): teachers.id
createdAt: timestamp (auto)
```

#### Students
```sql
id (PK): string (from QR)
fullName: string
department: string
section: string
lastScanAt: timestamp (for cooldown)
createdAt: timestamp (auto)
```

#### Attendance
```sql
id (PK): UUID
studentId (FK): students.id
section: string
date: YYYY-MM-DD
timeIn: timestamp | NULL
timeOut: timestamp | NULL
createdAt: timestamp (auto)
updatedAt: timestamp (auto)

Indexes:
- studentId (for quick lookups)
- date (for filtering)
- section (for filtering)
```

## Business Logic

### 1. 60-Second Cooldown

**Client-side enforcement** (`/student/scan.tsx`):
```typescript
// Load from AsyncStorage on app start
const lastScanAt = await AsyncStorage.getItem('studentLastScan')

// Before scanning
if (lastScanAt && Date.now() - lastScanAt < 60000) {
  const remaining = Math.ceil((60000 - elapsed) / 1000)
  showError(`Slow down! Please wait ${remaining}s`)
  return
}

// After successful scan
await AsyncStorage.setItem('studentLastScan', Date.now().toString())
```

**Server-side enforcement** (`/backend/src/routes/attendance.ts`):
```typescript
const lastScanTime = new Date(student.lastScanAt).getTime()
const timeSinceLastScan = Date.now() - lastScanTime

if (timeSinceLastScan < 60000) {
  return res.status(429).json({ 
    message: `Please wait ${remaining}s` 
  })
}
```

### 2. Automatic Time In/Out

```
First scan (no attendance record) → Create with timeIn
Second scan (timeIn exists, no timeOut) → Update with timeOut
Third+ scan (both exist) → Return 400 error
```

### 3. Section Locking

1. Teacher logs in
2. Must select section from list (`/teacher/session/choose-section-before-scan`)
3. Section stored in authStore
4. If section not selected → scanner not accessible
5. All scans must include section

### 4. JWT Session Management

```
Login successful
  ├── Generate JWT with teacherId
  ├── Set expiration: 12 hours
  ├── Store in SecureStore
  └── Store timestamp in AsyncStorage

On API request
  ├── Attach to Authorization header
  └── If 401 → clearAuth() and redirect to login

Expiration
  ├── Backend: 12 hours
  ├── Client: Could show warning at 30min idle
  └── Auto-logout on 401
```

## Data Flow Examples

### Student Scan Flow

```
Student opens app
  ↓
Selects "Student Login"
  ↓
Scans QR: "NHEM DAY G. ACLO|20203300076|BSIT"
  ↓
Check lastScan in AsyncStorage (cooldown)
  ↓
POST /api/attendance/student-scan
  {studentId, fullName}
  ↓
Backend:
  - Create student if not exists
  - Check if attendance exists for today
  - If not → Create with timeIn
  - If timeIn exists → Update with timeOut
  - Update student.lastScanAt (for server-side cooldown)
  ↓
Response: {timeIn, timeOut}
  ↓
Save to AsyncStorage
  ↓
Show alert "Time In recorded at XX:XX"
```

### Teacher Scan Flow

```
Teacher logs in
  ↓
Selects section from list
  ↓
Section locked in navigation
  ↓
Scans QR with camera
  ↓
Check clientCooldowns in AsyncStorage
  ↓
POST /api/attendance/scan
  {studentId, fullName, section, sectionId}
  ↓
Backend:
  - Check student.lastScanAt (strict 60s)
  - If < 60s → 429 error
  - Otherwise → Create/update attendance
  - Update student.lastScanAt
  ↓
Response: {timeIn, timeOut, status}
  ↓
Update localCooldowns and persist
  ↓
Add to logs UI
```

### Teacher Manual Attendance Flow

```
Teacher opens /teacher/attendance/manual
  ↓
Fills form:
  - studentId
  - fullName
  - department
  - section
  - date
  - timeIn (optional)
  - timeOut (optional)
  - password (required)
  ↓
POST /api/attendance/manual
  {all fields + password}
  ↓
Backend:
  - Verify JWT (teacher authenticated)
  - Verify password against teacher.passwordHash
  - Get or create student
  - Create or update attendance
  ↓
Response: success/error
  ↓
Clear form, show success alert
```

## Security Measures

1. **Password Storage:** bcryptjs with 10-round salt
2. **JWT Tokens:** Signed with secret, 12-hour expiration
3. **Secure Storage:** Expo SecureStore for token (encrypted)
4. **Database:** Foreign keys enabled, SQL injection prevention
5. **API:** Bearer token required for protected routes
6. **HTTPS Ready:** Can deploy with SSL certs

## Performance Optimizations

1. **Client-side Cooldown:** Prevents unnecessary API calls
2. **Local AsyncStorage:** Quick access to lastScan time
3. **SQLite Indexes:** Fast lookups on studentId, date, section
4. **Batch Updates:** Dashboard refreshes every 10s (not every scan)
5. **Token Caching:** SecureStore prevents re-login

## Error Handling

| Error | HTTP Status | Action |
|-------|-------------|--------|
| Invalid QR format | 400 | Show error toast |
| Cooldown active | 429 | Show countdown |
| Wrong password | 401 | Clear auth, redirect login |
| Attendance complete | 400 | Show message |
| Database error | 500 | Show generic error |
| Network error | N/A | Show "Check connection" |

## Deployment Checklist

- [ ] Change JWT_SECRET in .env
- [ ] Update API_BASE_URL to production domain
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Use production database (not SQLite)
- [ ] Configure CORS for frontend domain
- [ ] Add rate limiting
- [ ] Set up logging/monitoring
- [ ] Test all endpoints with real data
- [ ] Backup database regularly

# Complete Setup Guide

## System Requirements

- Node.js 16+ 
- npm or yarn
- Expo CLI (optional, will use npx)
- Android emulator, iOS simulator, or Expo Go app

## Step 1: Clone/Setup Project Structure

The project is already created at:
```
QrAttendance2/qr-attendance-v2/
├── app/              (Mobile app - Expo Router)
├── backend/          (Express.js API)
├── store/            (Zustand auth store)
├── hooks/            (API client hook)
├── package.json      (Mobile app deps)
└── README.md
```

## Step 2: Install Backend Dependencies

```bash
cd qr-attendance-v2/backend
npm install
```

This installs:
- `express` - Web server
- `sqlite3` - Database
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT auth
- `ts-node` - TypeScript runner

**Expected time:** 2-3 minutes

## Step 3: Configure Backend

1. Create `.env` file in `backend/`:
```bash
cp .env.example .env
```

2. Edit `backend/.env` (optional, defaults work):
```
PORT=3000
NODE_ENV=development
JWT_SECRET=super-secret-key-change-in-production
DB_PATH=./data/attendance.db
```

3. Create data directory:
```bash
mkdir -p backend/data
```

## Step 4: Start Backend Server

```bash
cd qr-attendance-v2/backend
npm run dev
```

Expected output:
```
> qr-attendance-backend@1.0.0 dev
> ts-node src/index.ts

Server running on http://localhost:3000
Database initialized successfully
Default teacher created: ID=TCHR001, Password=teacher123
```

**Keep this terminal open.** Backend must run continuously.

## Step 5: Install Mobile App Dependencies

In a **NEW terminal**, navigate to project root:

```bash
cd qr-attendance-v2
npm install
```

This installs:
- `expo` - Mobile framework
- `expo-router` - Navigation
- `expo-camera` - QR scanning
- `expo-secure-store` - Secure token storage
- `@react-native-async-storage/async-storage` - Local storage
- `zustand` - State management
- `axios` - HTTP client

**Expected time:** 3-5 minutes

## Step 6: Verify API Connection

Edit `qr-attendance-v2/hooks/useApi.ts`:

```typescript
const API_BASE_URL = 'http://localhost:3000/api';
```

For **Android Emulator**, use:
```typescript
const API_BASE_URL = 'http://10.0.2.2:3000/api';
```

For **Physical device**, use your computer's IP:
```typescript
const API_BASE_URL = 'http://192.168.1.X:3000/api';  // Replace X with your IP
```

## Step 7: Start Mobile App

```bash
cd qr-attendance-v2
npm start
```

Expected output:
```
> expo start
...
You can open the app in Expo Go by scanning this QR code:
[QR CODE]
```

## Step 8: Open App

Choose one option:

### Option A: Expo Go App (Easiest)
1. Install Expo Go from App Store / Google Play
2. Scan QR code from terminal
3. App loads in Expo Go

### Option B: Android Emulator
```bash
npm start
# Then press 'a' in terminal
```

### Option C: iOS Simulator (Mac only)
```bash
npm start
# Then press 'i' in terminal
```

## Step 9: Test Login Flow

1. **See landing page** with "Student Login" and "Teacher Login" buttons
2. **Tap Teacher Login**
3. **Scan QR code:**
   - Create test QR with content: `TCHR|TCHR001|Demo Teacher`
   - Or use QR code generator at: https://www.qr-code-generator.com/
4. **Enter password:** `teacher123`
5. **You should be logged in!**

## Step 10: Create Test Section

1. **See section selection screen**
2. **Tap "Create New Section"**
3. **Enter section name:** `BSIT-S1`
4. **Submit**
5. **Select it from list**

## Step 11: Test Student Scanning

1. **You're now in scanner view**
2. **Scan student QR code:**
   - Create with: `NHEM DAY G. ACLO|20203300076|BSIT`
   - Full name, pipe, student ID, pipe, department
3. **Alert shows "Time In recorded"** ✓
4. **Wait 60+ seconds**
5. **Scan same QR again** → "Time Out recorded" ✓

## Step 12: Verify Everything Works

### Dashboard
- [ ] Shows today's stats (present, time in, completed)
- [ ] Shows attendance rate percentage
- [ ] Scan logs visible
- [ ] Numbers update in real-time

### Attendance History
- [ ] Can filter by date
- [ ] Can filter by section
- [ ] Can search by name/ID
- [ ] Shows time in/out correctly

### Sections Management
- [ ] Can create sections
- [ ] Can edit section names
- [ ] Can delete sections

### Manual Attendance
- [ ] Can add attendance for missing students
- [ ] Requires password
- [ ] Validates all fields

## 🧪 Test Checklist

Verify these before moving to production:

- [ ] Backend server running and accessible
- [ ] Mobile app connects to backend (no "Network Error")
- [ ] Teacher login works with QR + password
- [ ] Student QR scanning works
- [ ] 60-second cooldown enforced
- [ ] Time In/Out logic correct
- [ ] Dashboard stats accurate
- [ ] History filtering works
- [ ] Manual attendance works
- [ ] Can create/edit/delete sections

## 📱 Multiple Test Users

Create more test QR codes:

**Teacher:**
```
TCHR|TCHR002|Another Teacher
```

**Students:**
```
JOHN DOE|20203300001|BSIT
JANE SMITH|20203300002|BSCS
MARK WILSON|20203300003|BSIT
```

Use QR code generator to create printable QR codes.

## 🔧 Common Issues

### Backend fails to start
```
Error: EADDRINUSE: address already in use :::3000
```

**Solution:** Kill process on port 3000
```bash
# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# On Mac/Linux
lsof -i :3000
kill -9 <PID>
```

### API connection errors
```
Network Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Solution:** 
- Check backend is running
- Verify API_BASE_URL in `hooks/useApi.ts`
- For emulator, use `http://10.0.2.2:3000/api`

### Camera permission denied
- **iOS:** Settings → QR Attendance → Camera → Allow
- **Android:** App Settings → Permissions → Camera → Allow

### Port already in use
```bash
npm start -- --clear
```

### Module not found errors
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📝 File Organization

After setup, you should have:

```
qr-attendance-v2/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── student/
│   │   ├── _layout.tsx
│   │   └── scan.tsx
│   └── teacher/
│       ├── login.tsx
│       ├── dashboard.tsx
│       ├── scanner.tsx
│       ├── sections/
│       │   ├── list.tsx
│       │   ├── create.tsx
│       │   └── edit.tsx
│       └── attendance/
│           ├── history.tsx
│           └── manual.tsx
├── backend/
│   ├── src/
│   │   ├── index.ts
│   │   ├── database.ts
│   │   ├── middleware/auth.ts
│   │   └── routes/
│   │       ├── teacher.ts
│   │       ├── attendance.ts
│   │       └── sections.ts
│   ├── data/attendance.db (created on first run)
│   ├── .env
│   └── package.json
├── store/authStore.ts
├── hooks/useApi.ts
├── package.json
├── app.json
└── README.md
```

## 🚀 Ready to Deploy!

Once all tests pass, you can:

1. **Build APK/IPA:**
   ```bash
   eas build --platform android
   ```

2. **Deploy backend:**
   - Use Heroku, AWS, or your own server
   - Update `API_BASE_URL` to production domain
   - Change JWT_SECRET to strong value

3. **Generate real QR codes:**
   - Student IDs from your database
   - Teacher credentials
   - Print or display as needed

---

**Questions?** Check README.md or QUICKSTART.md

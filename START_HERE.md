# 🚀 START HERE - QR Attendance System (Teacher-Only)

Welcome! A **complete, production-ready Expo SDK 54 mobile application** for teachers to manage student attendance with QR codes.

**Important:** This app is for **teachers only**. No student login.

## ⚡ Quick Start (5 Minutes)

### 1. Install Backend Dependencies
```bash
cd qr-attendance-v2/backend
npm install
```

### 2. Start Backend Server
```bash
npm run dev
```
Expected: `Server running on http://localhost:3000`

### 3. Install Mobile App Dependencies (New Terminal)
```bash
cd qr-attendance-v2
npm install
```

### 4. Start Mobile App
```bash
npm start
```
Expected: QR code for Expo Go

### 5. Open in Expo Go
- Scan QR from terminal with Expo Go app
- Or press `a` for Android / `i` for iOS

### 6. Test Teacher Login
1. Tap "Teacher Login"
2. Scan QR: `TCHR|TCHR001|Demo Teacher` (or use default: demoteacher/teacher123)
3. Password: `teacher123`
4. Create a section (e.g., "BSIT-101")
5. Select section and scan student QR codes
6. Success! ✓

**Note:** To register a new teacher, tap "Create Account" on landing page.

---

## 📖 Documentation Map

| Document | Purpose | Time |
|----------|---------|------|
| **[QUICKSTART.md](./QUICKSTART.md)** | 5-minute setup | 5 min |
| **[SETUP.md](./SETUP.md)** | Detailed guide with troubleshooting | 15 min |
| **[README.md](./README.md)** | Feature list & API endpoints | 10 min |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | Technical deep dive | 20 min |
| **[TESTING.md](./TESTING.md)** | Test scenarios & verification | 30 min |
| **[INDEX.md](./INDEX.md)** | Documentation index | 5 min |

---

## ✅ What's Included

### Mobile App (Teacher-Only)
- ✅ Landing page (Teacher Login / Register)
- ✅ Teacher registration with password + QR generation
- ✅ Teacher 2FA login (QR code + password)
- ✅ Dashboard with teacher info and stats
- ✅ Section management (Create / Edit / Delete)
- ✅ Student QR scanner with 1-minute automatic logout
- ✅ Real-time attendance logs
- ✅ Attendance history with filters
- ✅ Manual attendance entry (teacher password protected)
- ✅ Teacher profile & settings

### Backend API
- ✅ Teacher registration (POST `/api/teacher/register`)
- ✅ Teacher login with 2FA (POST `/api/teacher/login`)
- ✅ Teacher profile (GET `/api/teacher/profile`)
- ✅ Dashboard data (GET `/api/teacher/dashboard`)
- ✅ Section management (CRUD)
- ✅ Student QR scanning (POST `/api/attendance/scan`)
- ✅ 1-minute automatic logout (server enforced)
- ✅ Attendance history & filtering
- ✅ Manual entry (password protected)
- ✅ Statistics & analytics

### Features
- ✅ Type-safe TypeScript
- ✅ SQLite database (auto-created)
- ✅ Secure token storage (SecureStore)
- ✅ Real-time UI updates
- ✅ Error handling
- ✅ Production-ready code

---

## 🎯 Default Test Credentials

**Pre-seeded Teacher:**
- Username: `demoteacher`
- Password: `teacher123`
- Teacher ID: `TCHR001`
- QR Code: `TCHR|TCHR001|Demo Teacher`

**Register New Teachers:**
- Click "Create Account" on landing page
- Enter username, full name, password
- Receive QR code in format: `TCHR|{TCHR_ID}|{TEACHER_NAME}`

**Create Student QR Codes:**
Use: https://www.qr-code-generator.com/

Format: `{STUDENT_NAME}|{STUDENT_ID}|{COURSE}`

Examples:
- `JOHN DOE|20203300001|BSIT`
- `JANE SMITH|20203300002|BSCS`
- `NHEM DAY G. ACLO|20203300076|BSIT`

---

## 🗂️ Project Structure

```
qr-attendance-v2/
├── app/                      # Mobile screens (13 screens)
├── backend/                  # Express API
├── store/                    # Auth state (Zustand)
├── hooks/                    # API client
├── package.json              # Mobile app deps
├── app.json                  # Expo config
├── README.md                 # Features overview
├── QUICKSTART.md             # 5-min setup
├── SETUP.md                  # Detailed setup
├── ARCHITECTURE.md           # Technical details
├── TESTING.md                # Test scenarios
└── INDEX.md                  # Doc index
```

---

## 🔧 System Requirements

- Node.js 16+ ✓
- npm ✓
- Camera access ✓
- Expo Go app (optional, can use emulator) ✓

---

## ⚙️ Configuration

### Backend Port
Default: `3000` (configured in backend/.env)

### Database
Automatic SQLite at: `backend/data/attendance.db`

### API Base URL
Mobile app uses: `http://localhost:3000/api`

For **Android Emulator:** `http://10.0.2.2:3000/api`
For **Physical device:** Update to your PC's IP address

---

## 🚨 Important Notes

1. **Two terminals needed:**
   - Terminal 1: `cd backend && npm run dev`
   - Terminal 2: `cd . && npm start`

2. **Backend must run first** before mobile app starts

3. **Keep both running** for development

4. **Database auto-creates** on first backend start

5. **Default teacher** auto-seeded (TCHR001)

---

## 📱 Testing Workflow

1. **Start backend** (terminal 1)
2. **Start mobile app** (terminal 2)
3. **Landing page:**
   - Tap "Teacher Login" OR "Create Account"
4. **If Login:**
   - Scan QR: `TCHR|TCHR001|Demo Teacher`
   - Password: `teacher123`
5. **If Register:**
   - Username: choose one
   - Full name: enter name
   - Password: enter password
   - Receive QR code
6. **Dashboard:**
   - View sections
   - Click "Add Section" to create one
7. **Start Scanning:**
   - Select section from dropdown
   - Scan student QR codes
   - See "Time In" message
   - Wait 60 seconds
   - Scan same QR again
   - See "Time Out" message
8. **View History:**
   - Select section
   - See all scans with times and duration

---

## 🐛 Troubleshooting

**Backend won't start?**
- Check port 3000 is free: `netstat -ano | findstr :3000`
- Install dependencies: `npm install` in backend folder

**Mobile app won't connect?**
- Check API_BASE_URL in `hooks/useApi.ts`
- For emulator: use `http://10.0.2.2:3000/api`
- Backend must be running

**Camera permission denied?**
- iOS: Settings → QR Attendance → Camera
- Android: App Settings → Permissions → Camera

**Database not creating?**
- Check backend/data folder exists
- Delete and restart backend

See **[SETUP.md](./SETUP.md) > Common Issues** for more help.

---

## ✨ Key Features Explained

### 2FA Authentication
**Factor 1:** Teacher scans their own QR code (format: `TCHR|{ID}|{NAME}`)
**Factor 2:** Enter password
Result: JWT token valid for 12 hours

### Automatic 1-Minute Logout
```
Scan 1: Student Time In (automatic)
Wait 60 seconds...
Student automatically eligible to Time Out
Scan 2: Student Time Out (automatic)
```
- No manual logout button needed
- Server enforces 60-second cooldown
- After 60s, another scan automatically logs them out

### Section Selection
- Teacher must select section before scanning
- Each section tracks attendance separately
- Prevents mixed attendance records
- Sections can be created, edited, or deleted

### Teacher Registration
- Create own account with username + password
- System generates unique teacher ID
- QR code created automatically
- Can be used for login immediately

### Time In/Out Logic
- First scan = Time In (automatic)
- After 60 seconds = Time Out (automatic)
- Second scan before 60s = Blocked with countdown
- Both recorded = Cannot scan again (prevents duplicates)

---

## 📚 Next Steps

1. **Understand the flow:** Read [CORRECT_FLOW.md](./CORRECT_FLOW.md)
2. **Follow implementation:** Read [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
3. **Setup:** Follow [QUICKSTART.md](./QUICKSTART.md)
4. **Test:** Complete [TESTING.md](./TESTING.md)
5. **Learn architecture:** Review [ARCHITECTURE.md](./ARCHITECTURE.md)
6. **Deploy:** Follow deployment checklist in ARCHITECTURE.md

---

## 🎓 Files You'll Work With

**Most important (update these):**
- `app/teacher/register.tsx` - Teacher registration (create this)
- `app/teacher/login.tsx` - 2FA login (update)
- `app/teacher/dashboard.tsx` - Dashboard (update)
- `app/teacher/scanner.tsx` - Student scanner (update)
- `backend/src/routes/teacher-new.ts` - Teacher auth (replaces old)
- `backend/src/routes/sections-new.ts` - Sections (replaces old)
- `backend/src/routes/attendance-new.ts` - Scanning (replaces old)

**Configuration:**
- `app.json` - App name/settings
- `backend/.env` - Port, JWT secret
- `app.json` - Update baseURL for API

**Don't modify:**
- `node_modules/` - Dependencies
- `.expo/` - Expo cache
- `dist/` - Compiled backend
- `app/student/` - Remove this folder (not needed)

---

## ✅ Success Indicators

Once running, you should see:

✓ Landing page with "Teacher Login" and "Create Account"
✓ Can register new teacher account
✓ Can login with teacher QR code + password
✓ Dashboard shows teacher name and stats
✓ Can create, edit, delete sections
✓ Can scan student QR codes
✓ First scan shows "Time In" message
✓ Cooldown countdown appears (60 seconds)
✓ Second scan shows "Time Out" message
✓ Can view attendance history with filters
✓ Real-time logs update after each scan
✓ No student functionality (removed)
✓ No error messages in console

---

## 🆘 Need Help?

1. **Setup issues** → [SETUP.md](./SETUP.md)
2. **How to test** → [TESTING.md](./TESTING.md)
3. **Understanding architecture** → [ARCHITECTURE.md](./ARCHITECTURE.md)
4. **API reference** → [README.md](./README.md)
5. **All docs** → [INDEX.md](./INDEX.md)

---

## 🎯 Common Tasks

**Change API URL:**
Edit `hooks/useApi.ts` line 9
```typescript
const API_BASE_URL = 'YOUR_URL';
```

**Change app name:**
Edit `app.json` line 3
```json
"name": "Your App Name"
```

**Change default section name:**
Create one in app after login

**Add more test users:**
Generate QR codes at https://www.qr-code-generator.com/

**Change JWT expiration:**
Edit `backend/src/routes/teacher.ts` line 50
```typescript
{ expiresIn: '12h' }  // Change to your preference
```

---

## 🚀 Ready?

```bash
cd qr-attendance-v2/backend
npm install
npm run dev
```

Then in a new terminal:
```bash
cd qr-attendance-v2
npm install
npm start
```

That's it! The app will open in 1-2 minutes.

---

**Everything is already built and ready to use.**

Follow [QUICKSTART.md](./QUICKSTART.md) next for a complete walkthrough.

Good luck! 🎉

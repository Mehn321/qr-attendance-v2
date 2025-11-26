# Quick Start Guide

## 1. Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Mobile App
```bash
cd ..
npm install
```

## 2. Start Backend

```bash
cd backend
npm run dev
```

Expected output:
```
Server running on http://localhost:3000
Database initialized successfully
Default teacher created: ID=TCHR001, Password=teacher123
```

## 3. Start Mobile App

```bash
npm start
```

Choose:
- `a` for Android emulator
- `i` for iOS simulator
- Scan QR with Expo Go app on real device

## 4. Test Teacher Login

1. Tap "Teacher Login"
2. Scan QR code: `TCHR|TCHR001|Demo Teacher`
3. Enter password: `teacher123`
4. Select a section or create one first

## 5. Create a Section

1. On dashboard, tap "Manage Sections"
2. Tap "+ Create"
3. Enter name (e.g., "BSIT-S1")
4. Submit

## 6. Test Student Scanning

1. Tap "Start Scanning"
2. Select the section you created
3. Scan student QR: `NHEM DAY G. ACLO|20203300076|BSIT`
4. Time In recorded ✓
5. Wait 60 seconds
6. Scan again for Time Out ✓

## 7. View Results

- Dashboard shows real-time stats
- Attendance history filters by date/section/search
- Manual entry available for corrections

## 🎓 Student Flow (Standalone)

1. Tap "Student Login"
2. Scan student QR (same format)
3. Automatic Time In/Out
4. 60-second cooldown enforced

## 🎨 Generate QR Codes

Use any QR code generator:

**Student:**
```
NHEM DAY G. ACLO|20203300076|BSIT
```

**Teacher:**
```
TCHR|TCHR001|Demo Teacher
```

Print or display on screen to scan with mobile camera.

## 📝 Default Data

| Type | ID | Password |
|------|-----|----------|
| Teacher | TCHR001 | teacher123 |

## 🔧 Troubleshooting

**Port 3000 already in use?**
```bash
lsof -i :3000  # Find process
kill -9 <PID>  # Kill it
```

**Module not found?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Expo not starting?**
```bash
npm start -- --clear
```

## ✅ Success Checklist

- [ ] Backend running on localhost:3000
- [ ] Mobile app loads landing page
- [ ] Can login with teacher QR + password
- [ ] Can create sections
- [ ] Can select section before scanning
- [ ] Student scanning works with Time In/Out
- [ ] 60-second cooldown enforced
- [ ] Dashboard stats update in real-time
- [ ] History filtering works
- [ ] Manual attendance entry works

---

**Everything working?** You're ready to deploy and test with real QR codes!

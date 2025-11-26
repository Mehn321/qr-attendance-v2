# 🚀 How to Run

## Dependencies Installed ✅
- Backend: 497 packages installed
- Mobile: 1438 packages installed

## Start Backend Server

**Terminal 1:**
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

---

## Start Mobile App

**Terminal 2** (new terminal):
```bash
cd qr-attendance-v2
npm start
```

Expected output:
```
> expo start

Starting Expo CLI...
[QR Code will appear]
```

---

## Open App

Choose one:

### Expo Go (Easiest)
1. Install Expo Go app (iOS App Store / Google Play)
2. Scan QR code from terminal
3. App loads in ~30 seconds

### Android Emulator
Press `a` in terminal running `npm start`

### iOS Simulator (Mac only)
Press `i` in terminal running `npm start`

---

## Test Immediately

1. **See landing page** ✓
2. **Tap "Teacher Login"** ✓
3. **Scan or manually enter:** TCHR|TCHR001|Demo Teacher
4. **Enter password:** teacher123
5. **Success!** ✓

---

## Next Steps

1. Create a test section (e.g., "BSIT-S1")
2. Select it from list
3. Scan student QR code
4. View dashboard
5. Check history

See **QUICKSTART.md** for full walkthrough.

---

## Default Credentials

**Teacher Login:**
- ID: `TCHR001`
- Password: `teacher123`
- QR Code: `TCHR|TCHR001|Demo Teacher`

**Backend:**
- Port: 3000
- API: `http://localhost:3000/api`
- Database: `backend/data/attendance.db` (auto-created)

---

## Troubleshooting

**Backend won't start?**
```
npm run dev
# Should see "Server running on http://localhost:3000"
```

**Mobile app won't connect?**
- Ensure backend is running on port 3000
- Check API URL in `hooks/useApi.ts`
- For Android emulator: use `http://10.0.2.2:3000/api`

**Camera permission?**
- iPhone: Settings → QR Attendance → Camera
- Android: App Settings → Permissions → Camera

---

## Keep Both Running

✅ Backend terminal (port 3000)
✅ Mobile app terminal (npm start)

Both must run for full functionality.

---

**Everything is ready!** Start with the Backend command above.

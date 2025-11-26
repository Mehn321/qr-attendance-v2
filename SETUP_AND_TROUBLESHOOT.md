# Setup & Troubleshooting Guide

## SafeAreaView Deprecation Warning

**Warning Message:**
```
SafeAreaView has been deprecated and will be removed in a future release. 
Please use 'react-native-safe-area-context' instead.
```

**Why it happens:**
- Some dependency might be using old React Native SafeAreaView
- We're already using the correct one from `react-native-safe-area-context`

**Solution (Already Applied):**
- ✅ Using `SafeAreaView` from `react-native-safe-area-context`
- ✅ Using `SafeAreaProvider` in app layout
- This warning is cosmetic and won't affect functionality

**If warning persists:**
```bash
# Clear cache and rebuild
npm start -- -c

# Or reinstall dependencies
rm -rf node_modules
npm install
npm start
```

---

## Registration Failures - Now with Better Error Messages

### What Changed

**Before:** Silent failures with generic message
**After:** Detailed error messages showing exact problem

### Error Messages You'll See Now

| Error | Cause | Fix |
|-------|-------|-----|
| "Please enter both email and password" | Missing field | Fill both fields |
| "Please enter a valid email address" | Email format wrong | Use format: `name@example.com` |
| "Email already registered" | Email taken | Use different email or login |
| "Password must be at least 6 characters" | Password too short | Use 6+ characters |
| "Passwords do not match" | Confirm password mismatch | Make sure both match |
| "Cannot connect to server. Make sure backend is running on port 3000." | Backend not running | Start backend: `npm run dev` |
| "Network error. Please check your connection." | No internet/API unreachable | Check WiFi and backend |

### Console Logs for Debugging

**When you register, you'll see in console:**
```
Registering teacher... { email: "...", fullName: "..." }
Registration response: { success: true, token: "...", ... }
Navigating to QR scan screen...
```

**If registration fails:**
```
Registration error: Error: Network Error
Error message set: Cannot connect to server...
```

---

## API Connection Setup

### For Android Emulator
Edit `.env` file (create if doesn't exist):
```
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api
```

Why? Android emulator uses `10.0.2.2` to reach host machine.

### For Physical Device (Same WiFi)
Edit `.env` file:
```
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:3000/api
```

Replace `YOUR_COMPUTER_IP` with your computer's local IP:
- Windows: Run `ipconfig` in command prompt, find IPv4 address
- Mac: System Preferences → Network → check IP
- Linux: Run `hostname -I`

### For Web
```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

---

## Backend Setup

### Start Backend
```bash
cd backend
npm install
npm run dev
```

**Expected output:**
```
Server running on http://localhost:3000
Database initialized successfully
Default teacher created: ID=TCHR001, Password=[REDACTED:password]
```

### Verify Backend is Running
Open browser: `http://localhost:3000/health`
Should return: `{"status":"ok"}`

### If Backend Won't Start

**Error:** `SQLITE_ERROR: no such column`
```bash
# Delete database
rm backend/data/attendance.db

# Reinstall and restart
rm -rf backend/node_modules
cd backend
npm install
npm run dev
```

---

## Mobile App Setup

### Start App
```bash
npm install
npm start
```

**Then choose:**
- **Expo Go** (press `i` for iOS simulator or `a` for Android emulator)
- **Android Studio** (press `a`)
- **iOS Simulator** (press `i`)
- **Web** (press `w`)

### First Run Checklist

- [ ] Backend is running on port 3000
- [ ] Mobile app shows "QR Attendance" landing page
- [ ] Can see "Teacher Login" and "Create Account" buttons
- [ ] Camera permission requested (tap Allow)
- [ ] No red error screens

---

## Test Registration

### Step-by-Step

1. **Tap "Create Account"**
   - See registration form
   - All fields show: Email, Full Name, Password, Confirm Password

2. **Enter valid email**
   - Example: `teacher@example.com`
   - Must contain `@` symbol

3. **Enter full name**
   - Example: `John Smith`

4. **Enter password**
   - Example: `password123`
   - See eye icon to toggle visibility
   - Click eye to verify you typed correctly

5. **Confirm password**
   - Type same password again
   - Eye icon to verify match

6. **Tap "Create Account"**
   - See loading spinner
   - Check console for: `Registering teacher...`
   - If fails, see error message with reason

7. **QR Code Scanning Screen**
   - Camera opens
   - Green scanning frame appears
   - Scan QR code format: `TCHR|ID|NAME`

8. **Success Screen**
   - Shows checkmark
   - Shows email and status
   - Tap "Go to Dashboard"

9. **Dashboard**
   - See welcome message
   - See today's stats
   - See sections area

### Registration Fails? Check:

**Error:** "Cannot connect to server"
- Is backend running?
- Is it on correct port (3000)?
- Is `.env` file configured correctly?

**Error:** "Email already registered"
- Use different email
- Or delete database and restart backend

**Error:** "QR does not match"
- Make sure you scan the correct QR
- Format must be exactly: `TCHR|ID|NAME`

---

## Test Login

### Step-by-Step (Using Default Test Account)

1. **Tap "Teacher Login"**
   - See "Step 1 of 2" form

2. **Enter Email**
   - Use: `teacher@demo.com`
   - See eye icon for password visibility

3. **Enter Password**
   - Use: `teacher123`
   - Eye icon toggles visibility

4. **Tap "Next"**
   - Should proceed to Step 2
   - If fails, see specific error message

5. **Scan QR Code (Step 2)**
   - Camera opens
   - Scan: `TCHR|TCHR001|Demo Teacher`
   - Or use any QR format: `TCHR|ID|NAME`

6. **Success**
   - Redirects to Dashboard

### Login Fails? Check:

**Error:** "Email or password incorrect"
- Check spelling
- Remember: `teacher@demo.com` (not `teacher@demo`)
- Password is exactly `teacher123`

**Error:** "QR code does not match"
- Make sure QR matches what backend has
- Format: `TCHR|TCHR001|Demo Teacher`

---

## Console Logging (Debugging)

### View Logs

**Expo Go App:**
- Press Ctrl+L (or Cmd+L on Mac) to see logs

**Android/iOS Simulator:**
- Logs appear in terminal

**Web:**
- F12 → Console tab

### Important Log Messages

**Successful registration:**
```
Registering teacher... { email: "...", fullName: "..." }
Registration response: { success: true, token: "...", teacherId: "..." }
Navigating to QR scan screen...
```

**Failed registration:**
```
Registration error: Error: Request failed with status code 400
Error message set: Email already registered
```

**Login step 1 success:**
```
Login Step 1: Checking credentials... { email: "..." }
Login Step 1 response: { success: true, tempToken: "..." }
Proceeding to Step 2...
```

**API errors:**
```
API Error [500] POST /api/teacher/register: 
{ message: "...", status: 500, data: {...}, code: "ERR_..." }
```

---

## Device vs Emulator

### Android Emulator
```
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api
```

### iOS Simulator
```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

### Physical Device (Android)
```
EXPO_PUBLIC_API_URL=http://YOUR_IP:3000/api
```

### Physical Device (iPhone)
```
EXPO_PUBLIC_API_URL=http://YOUR_IP:3000/api
```

---

## Common Issues

### Issue: "Network Error" or "ECONNREFUSED"

**Cause:** Backend not running or wrong URL

**Fix:**
```bash
# 1. Start backend
cd backend
npm run dev

# 2. Check it's running
curl http://localhost:3000/health

# 3. Check .env file has correct URL
cat .env

# 4. Restart mobile app
```

### Issue: White Screen on Launch

**Cause:** Usually auth state loading

**Fix:**
- Wait 2-3 seconds
- Should redirect to landing page
- Check console for errors

### Issue: Camera Not Working

**Cause:** Permission not granted

**Fix:**
1. Press "Grant Permission" when prompted
2. On physical device: Settings → Apps → QR Attendance → Permissions → Camera → Allow

### Issue: Can't Scan QR Code

**Cause:** QR code unclear or wrong format

**Fix:**
- Make sure QR is clearly printed/displayed
- QR format: `TCHR|ID|NAME`
- Try: `TCHR|TCHR001|Demo Teacher`
- Adjust distance from camera

### Issue: "Please wait 60 seconds" on 2nd scan

**Cause:** Cooldown between scans enforced

**Fix:**
- This is intentional - prevents duplicate scanning
- Wait 60 seconds between scans
- Or modify in backend if needed

---

## Testing Checklist

- [ ] Backend running without errors
- [ ] Mobile app launches to landing page
- [ ] Can register new account
- [ ] Can login with existing account
- [ ] Can scan QR codes
- [ ] Can create sections
- [ ] Dashboard loads with stats
- [ ] Can create multiple sections
- [ ] Error messages display when needed
- [ ] Console shows helpful debug info

---

## Need More Help?

### Check Logs
1. Look at console output
2. Check mobile app console
3. Check backend terminal

### Verify Connections
1. Backend running? `curl http://localhost:3000/health`
2. Database exists? `ls backend/data/attendance.db`
3. Mobile configured? Check `.env` file

### Reset Everything
```bash
# Clear database
rm backend/data/attendance.db

# Clear mobile cache
npm start -- -c

# Reinstall all deps
rm -rf node_modules backend/node_modules
npm install
cd backend && npm install && cd ..
```

### Contact Checklist
When asking for help, provide:
1. Error message (exact text)
2. Console logs
3. What you were trying to do
4. What platform (Android/iOS/Web)
5. Device type (emulator/physical)

---

## Success Signs

✅ No red error screens
✅ Registration completes and shows success
✅ Can login and see dashboard
✅ Sections appear in dashboard
✅ Console shows API responses
✅ Error messages are helpful and specific

---

## Next Features to Test

Once basic flow works:
1. Create sections
2. Student QR scanning
3. Attendance records
4. View history
5. Logout


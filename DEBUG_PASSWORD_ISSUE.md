# Change Password Debug Guide - "Current Password is Incorrect"

## Issue
User reports that the correct current password is being rejected with message "Current password is incorrect"

## Root Causes to Check

### 1. **Offline Mode vs Online Mode**
First, determine which mode you're using:

```
Check in: hooks/useApi.ts
Look for: OFFLINE_MODE = true or false
```

**If OFFLINE_MODE = true:** Uses local AsyncStorage
**If OFFLINE_MODE = false:** Uses backend API

---

## Debugging Steps

### Step 1: Check Console Logs
After I added debugging, you should now see detailed logs when trying to change password.

**Look for these messages:**

#### If Offline Mode:
```
🔐 Change password attempt - Teacher ID: {ID}
📚 Total teachers found: {NUMBER}
🔍 Teacher index found: {INDEX}
👤 Teacher found: {ID, EMAIL, hasHash}
🔑 Verifying current password...
✓ Password match result: true/false
```

**If you see `false` in the password match result**, the issue is in the hash verification.

#### If Online Mode:
```
🔐 Change password attempt - Teacher ID: {ID}
👤 Teacher found: {ID, EMAIL}
🔑 Verifying current password against stored hash...
✓ Password match result: true/false
```

---

### Step 2: Identify the Exact Problem

#### Problem A: Teacher Not Found
```
❌ No teacher ID found in storage  (Offline)
❌ Teacher not found in database   (Online)
```
**Solution:** User needs to log in again to store teacher ID

#### Problem B: Password Hash Mismatch
```
✓ Password match result: false
```
**Solution:** See below for why this happens

#### Problem C: Teacher ID Mismatch
```
❌ Teacher not found in database (ID from token doesn't match)
```
**Solution:** Token may be invalid or corrupted

---

## Why Password Hash Verification Fails

### Offline Mode Issues

**Issue 1: Password stored with WRONG HASH during registration**
- If registered password hash is corrupted, login would also fail
- Solution: Create new account from scratch

**Issue 2: AsyncStorage data corrupted**
- Password hash in storage is corrupted
- Solution: Clear app data, re-register

**Issue 3: Salt mismatch (UNLIKELY but possible)**
- Hash function always uses same salt: `'qr_attendance_salt'`
- If somehow using different function...
- Solution: Check `useOfflineApi.ts` lines 9-11

### Online Mode Issues

**Issue 1: Password hash in database is wrong**
- Database was corrupted or password hash wasn't saved properly during registration
- Solution: Delete user from database, re-register

**Issue 2: Teacher ID in token is wrong**
- Token has incorrect teacherId
- Solution: Log out and log in again

**Issue 3: Database connection issue**
- Query returns old/cached password hash
- Solution: Check database is running properly

---

## Testing the Fix

### Quick Test (Offline Mode)

1. **Register a new account:**
   - Email: `test@example.com`
   - Name: `Test User`
   - Password: `TestPass123!`

2. **Immediately try to change password:**
   - Current Password: `TestPass123!`
   - New Password: `NewPass456!`

3. **If this works**, the issue is with OLD passwords from before the fix

4. **If this fails**, there's a deeper issue to investigate

### Detailed Debugging (Enable Console)

1. Open your app with developer console visible
2. Open Settings
3. Try to change password
4. Check console for detailed logs
5. Share the console output with specific log lines

---

## Solution: What I Fixed

I added comprehensive logging to both:

1. **Frontend** (`app/teacher/settings.tsx`):
   - Already has complete form validation
   - Button disabled until all conditions met

2. **Backend** (`backend/src/routes/teacher-new.ts`):
   - Added logging at each verification step
   - Shows exact password verification result

3. **Offline** (`hooks/useOfflineApi.ts`):
   - Added detailed logging
   - Shows teacher lookup, hash verification
   - Tracks exact point of failure

---

## Most Likely Scenarios

### Scenario 1: Using ONLINE Mode (Most Likely)
**If online mode:**
- Your password is stored in backend database
- Backend uses **bcryptjs** for hashing
- If working during login, should work for password change
- Check if server is running and database connected

**Check:**
```
1. Can you log in? (If yes, password hash is valid)
2. Is backend server running?
3. Is database connected?
```

### Scenario 2: Using OFFLINE Mode
**If offline mode:**
- Your password stored in device AsyncStorage
- Uses simple Base64+salt hashing
- Should work if login works

**Check:**
```
1. Can you log in locally? (If yes, hash is valid)
2. Did you register with current password?
3. Did you clear app data recently?
```

### Scenario 3: Mixed Mode Issue
**If switching between online/offline:**
- Password in backend ≠ Password in local storage
- Each mode stores passwords separately
- Solution: Use consistent mode (clear local storage or go online)

---

## Quick Fixes to Try

### If Offline Mode:
1. Go to Settings
2. Clear app cache/data
3. Log out completely
4. Register new account
5. Try change password immediately

### If Online Mode:
1. Check backend server is running
2. Verify database connection works
3. Try logging out and back in
4. Try change password again

### If Stuck:
1. Check console logs (see Step 1 above)
2. Share the exact console output
3. Specify: online mode or offline mode?
4. Specify: can you log in successfully?

---

## Summary

The password verification process is:

```
User enters password → Hash it → Compare with stored hash → Should match
```

If at any step the hashes don't match:
- Could be wrong password
- Could be corrupted stored hash
- Could be wrong teacher being checked
- Could be database/storage issue

The debugging logs will pinpoint exactly which step is failing.

**Try logging out and logging back in first** - this refreshes the teacher ID in storage.

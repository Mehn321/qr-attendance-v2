# Password Change Email Consistency Fix

## Problem Identified

After the email-only lookup fix, password change was still failing with "incorrect password" even when the password was correct. Root cause:

**Email Mismatch Between Login and Password Change**

1. User logs in with: `day@gmail.com`
2. Login Step 1 succeeds and password verifies correctly
3. But during Login Step 2, the system saves a different email: `aclo@gmail.com` (from database)
4. When changing password, it looks up using `aclo@gmail.com` 
5. The teacher record is found but it's the WRONG record with a different password hash
6. Password verification fails because the new record has different password

### Evidence from Logs

```
LOG  Login Step 1: Checking credentials... {"email": "day@gmail.com"}
LOG     Password match result: true  // ✅ Correct password works with day@gmail.com

LOG  Changing password...
LOG  👤 Current teacher: {"email": "aclo@gmail.com"}  // ❌ Different email!
LOG  ✓ Password match result: false  // ❌ Now fails
```

## Root Cause

In `loginStep2()`, the code was saving `teacher.email` (from database) instead of the email used for login:

```typescript
// WRONG: Saves database email, not login email
await AsyncStorage.setItem('lastTeacherEmail', teacher.email);
```

This broke the chain: `password verified with day@gmail.com` → `stored as aclo@gmail.com` → `can't verify with stored email`

## Solution Implemented

### 1. Update `loginStep2()` to accept and save login email

**File**: `hooks/useOfflineApi.ts`

Changed signature to accept the email used in loginStep1:

```typescript
// NEW: Accept loginEmail parameter
async loginStep2(tempToken: string, qrCodeData: string, loginEmail?: string) {
  // ... validation code ...
  
  // Save the email used for login, not the database email
  const emailToSave = loginEmail || teacher.email;
  await AsyncStorage.setItem('lastTeacherEmail', emailToSave);
  
  return {
    success: true,
    email: emailToSave,  // Return the correct email
  };
}
```

### 2. Pass email from Step 1 to Step 2

**File**: `app/teacher/login.tsx`

Updated the call to pass the email used in login:

```typescript
const apiResponse = await offlineApi.loginStep2(
  tempToken, 
  scannedQrData.raw, 
  email.trim()  // Pass the email from Step 1
);
```

## How It Works Now

### Login Flow (Fixed)

```
Step 1: User enters day@gmail.com + password
        ✅ Password verified against day@gmail.com hash
        → Returns tempToken

Step 2: User scans QR code
        → loginStep2(tempToken, qrCode, "day@gmail.com")
        → Finds teacher by ID from tempToken
        → Saves "day@gmail.com" to lastTeacherEmail (CORRECT!)
        → Returns success

Change Password:
        → Looks up teacher by lastTeacherEmail: "day@gmail.com"
        → Finds correct teacher record
        → Password verification succeeds because it's the same email
        ✅ Password change works!
```

### Why This Matters

- **Consistency**: The email used to verify login is now the same email used for password changes
- **Multiple Emails**: If a teacher has multiple email addresses on record, the one they use to LOGIN is the one used for password operations
- **Session Continuity**: The email stored for the session matches what the user actually logged in with

## Files Modified

1. **hooks/useOfflineApi.ts**
   - Added `loginEmail?: string` parameter to `loginStep2()`
   - Changed email save logic to use passed email with fallback to database email
   - Added logging to show which email is being saved

2. **app/teacher/login.tsx**
   - Updated `loginStep2()` call to pass `email.trim()` 
   - Added logging to show email being passed

## Testing

### Scenario 1: Single Email Teacher
```
Username: teacher@example.com
Password: NewPass123!
Result: ✅ Works (falls back to database email if no email param)
```

### Scenario 2: Multiple Emails (Teacher Record)
```
Database email: aclo@gmail.com
Login email: day@gmail.com (alias)
Password: TestPass123!

1. Login with day@gmail.com
   → Step 1 verifies with day@gmail.com
   → Step 2 saves day@gmail.com to storage
   
2. Change password
   → Looks up with day@gmail.com
   → Password change succeeds ✅
```

## Session Persistence

After logout and login again:
- New session will store the login email
- Each session uses the email the user actually logged in with
- No persistent email mismatch issues

## Edge Cases Handled

1. **No email parameter**: Falls back to `teacher.email` from database
2. **Empty email**: Uses database email as fallback
3. **New sessions**: Each new login establishes its own email context

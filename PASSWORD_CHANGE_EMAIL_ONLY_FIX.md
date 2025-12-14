# Password Change Email-Only Lookup Fix

## Problem Identified

The password change feature was failing because:

1. **Root Cause**: The `changePassword()` method in `useOfflineApi.ts` was trying to find teachers by ID first, then email
2. **Issue**: In your database, there were duplicate teacher IDs ("2023300076" appeared twice in the logs)
3. **Result**: When changing password, it found the wrong teacher record, causing password verification to fail

### Evidence from Logs

```
LOG  Teacher IDs in DB: ["2023300001", "2023300100", "2024300002", "2023300076", "2023300076"]
LOG  Search by ID result: 3
```

This shows duplicate IDs, causing the wrong record to be selected.

## Solution Implemented

Changed the `changePassword()` method to use **email-only lookup** exclusively:

### Changes Made

#### 1. `hooks/useOfflineApi.ts` - `changePassword()` method
- **Before**: Accepted both `teacherEmail` and `teacherId` parameters, with ID lookup as priority
- **After**: Accepts only `teacherEmail` parameter, uses email-only lookup

```typescript
// OLD: async changePassword(currentPassword: string, newPassword: string, teacherEmail?: string, teacherId?: string)

// NEW: async changePassword(currentPassword: string, newPassword: string, teacherEmail?: string)
```

**Key Changes:**
- Removed `teacherId` parameter entirely
- Removed all ID-based lookups
- Find teacher using: `teachers.findIndex(t => t.email === targetEmail)`
- Verify after save using email: `t.email === targetEmail`
- Removed unused `changePasswordWithHash()` helper method

#### 2. `app/teacher/settings.tsx` - Call site
- Updated the call to only pass email parameter
- Removed teacherId from logging

```typescript
response = await offlineApi.changePassword(
  currentPassword.trim(),
  newPassword.trim(),
  teacher?.email  // Email-only lookup
);
```

## Why This Works

1. **Email Uniqueness**: Each teacher has a unique email in the system
2. **No Duplication**: Even if duplicate IDs exist, email lookup won't have this problem
3. **Persistent Storage**: Email is saved in `lastTeacherEmail` during login (line 352 in useOfflineApi.ts)
4. **Consistent with Login**: Login also uses email-based verification (line 250)

## Testing Steps

1. Change password in settings with new credentials (8+ chars, uppercase, lowercase, number, special char)
2. Log out completely
3. Log in again with the new password
4. The new password should work correctly
5. The old password should be rejected

## Files Modified

1. `hooks/useOfflineApi.ts` - changePassword() method
2. `app/teacher/settings.tsx` - changePassword call site

## Security Note

Email-only lookup is appropriate here because:
- Email is the unique identifier in the auth system
- Both login and password change use email verification
- ID can have duplicates in edge cases, email cannot

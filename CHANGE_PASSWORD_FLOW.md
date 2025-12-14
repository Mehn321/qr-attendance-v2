# Change Password - Complete Flow Diagram

## User Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User Opens Settings Screen                                 │
│  (/teacher/settings)                                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Form Initialized (Empty States)                            │
│  - currentPassword: ""                                      │
│  - newPassword: ""                                          │
│  - confirmPassword: ""                                      │
│  - loading: false                                           │
│  - error: ""                                                │
│  - success: ""                                              │
│                                                             │
│  "Change Password" Button: DISABLED                         │
│  (Because all password fields are empty)                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  User Enters Current Password                               │
│  - currentPassword: "OldPass123!"                            │
│                                                             │
│  Real-time Checks:                                          │
│  ✓ Current password entered                                 │
│  ✗ New password empty                                       │
│                                                             │
│  "Change Password" Button: DISABLED                         │
│  (New password and confirm fields still empty)              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  User Enters New Password                                   │
│  - newPassword: "NewPass456!"                               │
│                                                             │
│  Real-time Password Requirements:                           │
│  ✓ At least 8 characters (11 chars)                         │
│  ✓ One uppercase letter (N)                                 │
│  ✓ One lowercase letter (e, w, a, s, s)                    │
│  ✓ One number (4, 5, 6)                                    │
│  ✓ One special character (!)                                │
│                                                             │
│  Real-time Validation:                                      │
│  ✓ Current password entered                                 │
│  ✓ New password meets all requirements                      │
│  ✗ Confirm password empty                                   │
│  ✗ Passwords don't match yet                                │
│                                                             │
│  "Change Password" Button: DISABLED                         │
│  (Confirm password still empty)                             │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  User Enters Confirm Password (Wrong)                       │
│  - confirmPassword: "DifferentPass789!"                      │
│                                                             │
│  Real-time Validation:                                      │
│  ✓ Current password entered                                 │
│  ✓ New password meets all requirements                      │
│  ✗ Passwords don't match                                    │
│      "NewPass456!" ≠ "DifferentPass789!"                    │
│                                                             │
│  "Change Password" Button: DISABLED                         │
│  (Passwords don't match)                                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  User Fixes Confirm Password                                │
│  - confirmPassword: "NewPass456!"                            │
│                                                             │
│  Real-time Validation:                                      │
│  ✓ Current password entered                                 │
│  ✓ New password meets all requirements                      │
│  ✓ Passwords match                                          │
│  ✓ New password differs from current                        │
│      "OldPass123!" ≠ "NewPass456!"                          │
│  ✓ No loading in progress                                   │
│                                                             │
│  "Change Password" Button: ENABLED 🟢                       │
│  All validations passed!                                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
                User Clicks Button
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  handleChangePassword() Triggered                           │
│  - loading: true                                            │
│  - Button: DISABLED with spinner                            │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
   [OFFLINE MODE]        [ONLINE MODE]
        │                     │
        ├──────────┐  ┌──────────────────────┐
        │          │  │  POST /teacher/change-password
        │          │  │  Headers:
        │          │  │  - Authorization: Bearer {token}
        │          │  │  Body:
        │          │  │  {
        │          │  │    currentPassword: "OldPass123!"
        │          │  │    newPassword: "NewPass456!"
        │          │  │    confirmPassword: "NewPass456!"
        │          │  │  }
        │          │  │
        │          │  └───────────┬──────────────┘
        │          │              │
        │          │              ▼
        │          │  ┌─────────────────────────────┐
        │          │  │  Backend Validation        │
        │          │  │  ✓ All fields present      │
        │          │  │  ✓ Passwords match         │
        │          │  │  ✓ Password length >= 8    │
        │          │  │  ✓ Current password valid  │
        │          │  │  ✓ New ≠ Current password  │
        │          │  └─────────────┬───────────────┘
        │          │                │
        │          │                ▼
        │          │  ┌──────────────────────────┐
        │          │  │ Hash New Password        │
        │          │  │ - Salt: 10 rounds        │
        │          │  │ - Algorithm: bcryptjs    │
        │          │  │ - Hash: $2b$10$...      │
        │          │  └──────────┬─────────────┘
        │          │             │
        │          │             ▼
        │          │  ┌──────────────────────────┐
        │          │  │ Update Database          │
        │          │  │ UPDATE teachers SET      │
        │          │  │ passwordHash = $2b$10...|
        │          │  │ WHERE id = req.teacherId│
        │          │  │ updatedAt = NOW()        │
        │          │  └──────────┬─────────────┘
        │          │             │
        │          │             ▼
        │          │  ┌──────────────────────────┐
        │          │  │ Return Success           │
        │          │  │ {                        │
        │          │  │   success: true,         │
        │          │  │   message: "Password..." │
        │          │  │ }                        │
        └──────────┘  └──────────┬─────────────┘
                                 │
        ┌────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│ offlineApi.changePassword()                                 │
│ - Get lastTeacherId from AsyncStorage                       │
│ - Find teacher in local data                                │
│ - Verify current password against hash                      │
│ - Check new password is different                           │
│ - Hash new password                                         │
│ - Update teacher in AsyncStorage                            │
│ - Return success response                                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
    [SUCCESS]            [ERROR]
        │                     │
        ▼                     ▼
┌──────────────────┐  ┌────────────────────────┐
│ response.success │  │ response.success = false
│    = true        │  │                        │
└────────┬─────────┘  │ Possible Errors:       │
         │            │ - Current password     │
         │            │   incorrect            │
         │            │ - New password same as │
         │            │   current              │
         │            │ - Network error        │
         │            │ - Teacher not found    │
         │            │                        │
         │            └────────┬───────────────┘
         │                     │
         ▼                     ▼
   ┌─────────────────┐  ┌──────────────────┐
   │ success = true  │  │ setError()       │
   │ error = ""      │  │ Display error    │
   │ Clear form      │  │ message to user  │
   │ loading = false │  │ loading = false  │
   │                 │  │                  │
   │ Show Alert:     │  │ Button: ENABLED  │
   │ "Success"       │  │ User can retry   │
   │ "Password       │  │                  │
   │  changed..."    │  │                  │
   │                 │  │                  │
   │ On OK:          │  │                  │
   │ router.back()   │  │                  │
   │ Return to       │  │                  │
   │ Dashboard       │  │                  │
   └─────────────────┘  └──────────────────┘
         │                     │
         │                     │
         └─────────┬───────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ End of Process  │
          └─────────────────┘
```

## Validation Check Points

### Point 1: Frontend Button Enable/Disable
```javascript
Button is ENABLED when:
  ✓ !loading
  ✓ passwordRules.minLength (>= 8 chars)
  ✓ passwordRules.hasUppercase ([A-Z])
  ✓ passwordRules.hasLowercase ([a-z])
  ✓ passwordRules.hasNumber ([0-9])
  ✓ passwordRules.hasSpecialChar ([!@#$...])
  ✓ newPassword === confirmPassword
  ✓ currentPassword !== newPassword
  ✓ currentPassword.trim() !== ""
```

### Point 2: Frontend Form Validation (Before API Call)
```javascript
validateForm() checks:
  1. currentPassword is not empty
  2. newPassword is not empty
  3. All passwordRules are met
  4. newPassword === confirmPassword
  5. currentPassword !== newPassword
```

### Point 3: Backend Validation (API Endpoint)
```javascript
Backend checks:
  1. currentPassword provided
  2. newPassword provided
  3. confirmPassword provided
  4. newPassword === confirmPassword
  5. newPassword.length >= 8
  6. currentPassword matches stored hash (bcryptjs)
  7. newPassword !== stored hash (password uniqueness)
  8. Teacher authenticated (via token middleware)
```

### Point 4: Offline Mode Validation
```javascript
Offline mode checks:
  1. Teacher found in local storage
  2. currentPassword matches stored hash
  3. newPassword !== stored hash
  4. Successful update to AsyncStorage
```

---

## Error Scenarios

| Scenario | Error Message | HTTP Status |
|----------|---------------|------------|
| Current password wrong | "Current password is incorrect" | 401 |
| Passwords don't match | "New passwords do not match" | 400 |
| Password too short | "Password must be at least 8 characters" | 400 |
| New same as current | "New password must be different" | 400 |
| Missing fields | "All fields are required" | 400 |
| Teacher not found | "Teacher not found" | 404 |
| Network error | "Network error. Please check connection" | Network |
| Server error | "Failed to change password" | 500 |

---

## Security Summary

✓ **Password Hashing**: bcryptjs (10 rounds) on backend, Base64+salt offline
✓ **No Plain Text**: Passwords never stored or transmitted unencrypted
✓ **Current Password Verification**: Required before change allowed
✓ **Password Uniqueness**: New password must differ from current
✓ **Password Complexity**: Enforced requirements (8+ chars, uppercase, lowercase, number, special)
✓ **Authentication**: Bearer token required for API calls
✓ **Error Handling**: Detailed but secure error messages
✓ **Input Validation**: Multiple validation layers (frontend + backend)


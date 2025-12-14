# Offline Password Verification Debug Guide

## Problem
Offline mode password verification failing with: "Current password verification failed"

## Root Cause Investigation

The offline mode uses a simple hash function:
```javascript
function hashPassword(password) {
  const salt = 'qr_attendance_salt';
  return btoa(password + salt);  // Base64 encoding
}
```

When you try to change password:
1. Stored password during registration: `hash("MyPassword123!")` = `"TXlQYXNzd29yZDEyMyFxcl9hdHRlbmRhbmNlX3NhbHQ="`
2. Input password during change: `hash("MyPassword123!")` = `"TXlQYXNzd29yZDEyMyFxcl9hdHRlbmRhbmNlX3NhbHQ="`
3. They should match, but something is corrupting one of them

## Likely Causes

### Cause 1: Data Type Issue in AsyncStorage
AsyncStorage stores everything as JSON strings. The teacher object might be getting corrupted:

```javascript
// When stored
teacher = {
  id: "123",
  passwordHash: "TXlQYXNzd29yZDEyMyFxcl9hdHRlbmRhbmNlX3NhbHQ="
}
JSON.stringify(teacher)
// Result: {"id":"123","passwordHash":"TXlQYXNzd29yZDEyMyFxcl9hdHRlbmRhbmNlX3NhbHQ="}

// When retrieved
const retrieved = JSON.parse(data)
// Should be same, but might have issue if passwordHash contains special chars
```

### Cause 2: Character Encoding Issue
Base64 encoding can sometimes have issues with:
- Special characters in password
- Unicode characters
- Control characters
- Null bytes

### Cause 3: Hash Function Changed Between Registration and Change
If the hash function was modified between when you registered and now, the old hash won't match.

### Cause 4: Password Contains Characters That Break btoa()
The `btoa()` function only works with Latin1 characters. If password contains:
- Unicode characters (emoji, accents, etc.)
- Character codes > 255
- Will throw error

### Cause 5: Whitespace Already Trimmed at Registration
If registration trimmed the password but change password didn't (or vice versa):
- Registered: `hash("MyPassword123!")`
- Trying to verify: `hash(" MyPassword123! ")` with spaces
- They won't match

## Solution: Add Ultra-Detailed Debugging

I'll create a test file to help diagnose the exact issue. Run this test:

```javascript
// Test the hash function directly
function testHashFunction() {
  const testPassword = "MyPassword123!";
  
  // Test 1: Hash same password twice
  const hash1 = hashPassword(testPassword);
  const hash2 = hashPassword(testPassword);
  console.log('Test 1 - Same password hashed twice:');
  console.log('  Hash 1:', hash1);
  console.log('  Hash 2:', hash2);
  console.log('  Match:', hash1 === hash2);
  
  // Test 2: Verify function
  const verified = verifyPassword(testPassword, hash1);
  console.log('Test 2 - Verify password:');
  console.log('  Password:', testPassword);
  console.log('  Stored hash:', hash1);
  console.log('  Verified:', verified);
  
  // Test 3: With whitespace
  const withSpace = " MyPassword123! ";
  const hashWithSpace = hashPassword(withSpace);
  const verifyWithSpace = verifyPassword(withSpace, hash1);
  console.log('Test 3 - Password with spaces:');
  console.log('  Password:', JSON.stringify(withSpace));
  console.log('  Hash:', hashWithSpace);
  console.log('  Matches original:', verifyWithSpace);
}
```

## Files to Check

### 1. Check Registration Password Storage
File: `hooks/useOfflineApi.ts` Line 152

```javascript
// During registration
const newTeacher: Teacher = {
  id: tempTeacherId,
  email,
  fullName,
  passwordHash: hashPassword(password),  // ← What gets stored here?
  qrCodeData: '',
  isVerified: 0,
  createdAt: new Date().toISOString(),
};

teachers.push(newTeacher);
await this.saveTeachers(teachers);  // ← Saved to AsyncStorage
```

**Check:** Is `passwordHash` being stored correctly? Does it contain special characters that JSON.stringify might corrupt?

### 2. Check Change Password Retrieval
File: `hooks/useOfflineApi.ts` Line 714-736

```javascript
const lastTeacherId = await AsyncStorage.getItem('lastTeacherId');
const teachers = await this.getTeachers();  // ← Retrieves from AsyncStorage
const teacherIndex = teachers.findIndex(t => t.id === lastTeacherId);
const teacher = teachers[teacherIndex];

// At this point, is teacher.passwordHash correct?
const passwordMatch = verifyPassword(currentPassword, teacher.passwordHash);
```

**Check:** When you retrieve the teacher object, is `passwordHash` the same as what was stored?

### 3. Check getTeachers() Function
File: `hooks/useOfflineApi.ts` Lines 56-67

```javascript
async getTeachers(): Promise<Teacher[]> {
  try {
    const data = await AsyncStorage.getItem('teachers');
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Error reading teachers:', err);
    return [];
  }
}
```

**Check:** Is JSON.parse corrupting the passwordHash?

## Quick Diagnosis Steps

### Step 1: Create New Test Account
1. Register brand new account with password: `Test123!`
2. Immediately try to change password
3. If it works: Old account has corrupted password hash
4. If it fails: Hash function or retrieval has issue

### Step 2: Check Character Encoding
1. Register with simple password: `abc123ABC!`
2. Try to change it
3. If fails: Might be encoding issue
4. Try with even simpler: `abc123!`

### Step 3: Check Data Retrieval
1. After registration, check what's stored in AsyncStorage
2. Retrieve it back
3. Verify the passwordHash is the same

## Alternative Solution: Use Better Hashing

Instead of `btoa()`, use a more robust method:

```javascript
// Better hash function using simple crypto
function hashPassword(password) {
  const salt = 'qr_attendance_salt';
  let hash = 0;
  const string = password + salt;
  
  for (let i = 0; i < string.length; i++) {
    const char = string.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return 'hash_' + Math.abs(hash).toString(36);
}
```

This avoids btoa() issues with character encoding.

## Summary

The offline password verification is failing because:
1. Either the stored hash is corrupted
2. Or the retrieved hash doesn't match
3. Or the hash function has an issue with your specific password

**Quick test:** Create brand new account and try change password on it immediately. If that works, old account's password is corrupted. If it also fails, there's a deeper issue with the hash function or AsyncStorage retrieval.

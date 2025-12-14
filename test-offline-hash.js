/**
 * Test Offline Password Hash Function
 * Tests the btoa() hash function used in offline mode
 */

// Current hash function (from useOfflineApi.ts)
function hashPassword(password) {
  const salt = 'qr_attendance_salt';
  return btoa(password + salt);
}

function verifyPassword(password, hash) {
  const computed = hashPassword(password);
  return computed === hash;
}

console.log('=== Offline Password Hash Function Tests ===\n');

// Test 1: Basic hash consistency
console.log('TEST 1: Hash Consistency');
const pwd1 = 'TestPass123!';
const hash1 = hashPassword(pwd1);
const hash2 = hashPassword(pwd1);
console.log(`Password: "${pwd1}"`);
console.log(`Hash 1: ${hash1}`);
console.log(`Hash 2: ${hash2}`);
console.log(`Match: ${hash1 === hash2 ? '✓ YES' : '✗ NO'}`);
console.log();

// Test 2: Verification
console.log('TEST 2: Password Verification');
const verified = verifyPassword(pwd1, hash1);
console.log(`Password: "${pwd1}"`);
console.log(`Stored hash: ${hash1}`);
console.log(`Verified: ${verified ? '✓ YES' : '✗ NO'}`);
console.log();

// Test 3: Wrong password
console.log('TEST 3: Wrong Password Rejection');
const wrongPwd = 'WrongPass123!';
const wrongVerify = verifyPassword(wrongPwd, hash1);
console.log(`Correct hash: ${hash1}`);
console.log(`Wrong password: "${wrongPwd}"`);
console.log(`Wrong password hash: ${hashPassword(wrongPwd)}`);
console.log(`Verified with wrong password: ${wrongVerify ? '✗ FAIL' : '✓ PASS'}`);
console.log();

// Test 4: Whitespace handling
console.log('TEST 4: Whitespace Handling');
const pwdWithSpace = ' TestPass123! ';
const hashWithSpace = hashPassword(pwdWithSpace);
const hashWithoutSpace = hashPassword(pwd1);
console.log(`Password without space: "${pwd1}"`);
console.log(`Password with spaces: "${pwdWithSpace}"`);
console.log(`Hash without space: ${hashWithoutSpace}`);
console.log(`Hash with spaces: ${hashWithSpace}`);
console.log(`Are they same? ${hashWithSpace === hashWithoutSpace ? '✗ NO MISMATCH' : '✓ YES DIFFERENT'}`);
console.log();

// Test 5: Special characters
console.log('TEST 5: Special Characters');
const specialPwd = 'P@ss!w#rd123$%';
const specialHash = hashPassword(specialPwd);
const specialVerify = verifyPassword(specialPwd, specialHash);
console.log(`Password: "${specialPwd}"`);
console.log(`Hash: ${specialHash}`);
console.log(`Verified: ${specialVerify ? '✓ YES' : '✗ NO'}`);
console.log();

// Test 6: Unicode characters
console.log('TEST 6: Unicode Characters (May Fail with btoa)');
try {
  const unicodePwd = 'Pässwörd123!';
  const unicodeHash = hashPassword(unicodePwd);
  const unicodeVerify = verifyPassword(unicodePwd, unicodeHash);
  console.log(`Password: "${unicodePwd}"`);
  console.log(`Hash: ${unicodeHash}`);
  console.log(`Verified: ${unicodeVerify ? '✓ YES' : '✗ NO'}`);
} catch (err) {
  console.log(`❌ FAILED: ${err.message}`);
  console.log(`Reason: btoa() cannot encode non-Latin1 characters`);
}
console.log();

// Test 7: Long password
console.log('TEST 7: Long Password');
const longPwd = 'VeryLongPassword123!@#$%^&*()_+-=[]{}|;:,.<>?';
const longHash = hashPassword(longPwd);
const longVerify = verifyPassword(longPwd, longHash);
console.log(`Password length: ${longPwd.length}`);
console.log(`Hash: ${longHash.substring(0, 50)}...`);
console.log(`Verified: ${longVerify ? '✓ YES' : '✗ NO'}`);
console.log();

// Test 8: Empty password
console.log('TEST 8: Empty Password');
const emptyPwd = '';
const emptyHash = hashPassword(emptyPwd);
const emptyVerify = verifyPassword(emptyPwd, emptyHash);
console.log(`Password: "${emptyPwd}"`);
console.log(`Hash: ${emptyHash}`);
console.log(`Verified: ${emptyVerify ? '✓ YES' : '✗ NO'}`);
console.log();

// Test 9: Case sensitivity
console.log('TEST 9: Case Sensitivity');
const pwd1Case = 'TestPass123!';
const pwd2Case = 'testpass123!';
const hash1Case = hashPassword(pwd1Case);
const hash2Case = hashPassword(pwd2Case);
console.log(`Password 1: "${pwd1Case}"`);
console.log(`Password 2: "${pwd2Case}"`);
console.log(`Hash 1: ${hash1Case}`);
console.log(`Hash 2: ${hash2Case}`);
console.log(`Match: ${hash1Case === hash2Case ? '✗ NO (not case-sensitive)' : '✓ YES (case-sensitive)'}`);
console.log();

// Test 10: Numeric characters
console.log('TEST 10: Numeric Passwords');
const numPwd = '12345678!';
const numHash = hashPassword(numPwd);
const numVerify = verifyPassword(numPwd, numHash);
console.log(`Password: "${numPwd}"`);
console.log(`Hash: ${numHash}`);
console.log(`Verified: ${numVerify ? '✓ YES' : '✗ NO'}`);
console.log();

// Summary
console.log('=== SUMMARY ===');
console.log('✓ btoa() hash function works for:');
console.log('  - Latin1 characters (A-Z, a-z, 0-9, !@#$%^&*...)');
console.log('  - Special characters');
console.log('  - Long passwords');
console.log('  - Case-sensitive comparison');
console.log();
console.log('✗ btoa() hash function fails for:');
console.log('  - Unicode characters (accents, emoji, non-Latin1)');
console.log('  - Will throw error if password contains non-Latin1 chars');
console.log();
console.log('⚠️  Whitespace is handled as different character:');
console.log('  - "password" != " password "');
console.log('  - You must trim consistently!');
console.log();

// Diagnostic check
console.log('=== DIAGNOSTIC CHECK ===');
if (hashPassword('MyPassword123!') === hashPassword('MyPassword123!')) {
  console.log('✓ Hash function is deterministic');
} else {
  console.log('✗ Hash function is NOT deterministic - BIG PROBLEM');
}

if (verifyPassword('MyPassword123!', hashPassword('MyPassword123!'))) {
  console.log('✓ Verify function works correctly');
} else {
  console.log('✗ Verify function broken - BIG PROBLEM');
}

console.log();
console.log('If offline password change fails:');
console.log('1. Check if stored password has extra spaces');
console.log('2. Check if password contains Unicode characters');
console.log('3. Try with new account and simple password like "Test123!"');
console.log('4. If new account works, old password hash is corrupted');

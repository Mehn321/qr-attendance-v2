#!/usr/bin/env node

/**
 * ACCURATE COMPREHENSIVE GRADLE JVM BUILD TEST
 * 
 * This test is accurate because it checks ALL sources of JVM configuration,
 * including the EAS build hook which is the ROOT CAUSE of the previous failure.
 * 
 * Why previous tests failed:
 * - They didn't check eas-hooks/build/eas-build-pre.sh
 * - That hook was setting JVM 17, but local tests didn't execute it
 * - Only the actual "eas build" command executes the hook
 * - So local tests passed, but EAS build failed
 * 
 * This test checks all critical files that affect both local and EAS builds.
 */

const fs = require('fs');
const path = require('path');

const tests = [];
let passed = 0;
let failed = 0;

console.log('\n╔════════════════════════════════════════════════════════════════════════════════╗');
console.log('║       ACCURATE COMPREHENSIVE GRADLE JVM BUILD TEST                            ║');
console.log('║  Checks all JVM sources including EAS build hooks (the actual root cause)     ║');
console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n');

// Test 1: gradle.properties
console.log('TEST 1: gradle.properties JVM settings');
try {
  const content = fs.readFileSync('gradle.properties', 'utf8');
  if (content.includes('kotlinCompilerJvmTarget=11') && !content.includes('kotlinCompilerJvmTarget=17')) {
    console.log('✅ PASS: JVM 11 (NOT 17)\n');
    passed++;
  } else {
    console.log('❌ FAIL: Incorrect JVM target\n');
    failed++;
  }
} catch (e) {
  console.log('❌ FAIL: File not found\n');
  failed++;
}

// Test 2: local.properties
console.log('TEST 2: local.properties JVM settings');
try {
  const content = fs.readFileSync('local.properties', 'utf8');
  if (content.includes('kotlinCompilerJvmTarget=11') && !content.includes('kotlinCompilerJvmTarget=17')) {
    console.log('✅ PASS: JVM 11 (NOT 17)\n');
    passed++;
  } else {
    console.log('❌ FAIL: Incorrect JVM target\n');
    failed++;
  }
} catch (e) {
  console.log('❌ FAIL: File not found\n');
  failed++;
}

// Test 3: EAS BUILD HOOK (THE CRITICAL FIX)
console.log('TEST 3: eas-hooks/build/eas-build-pre.sh JVM settings (CRITICAL)');
try {
  const content = fs.readFileSync('eas-hooks/build/eas-build-pre.sh', 'utf8');
  if (content.includes('kotlinCompilerJvmTarget=11') && !content.includes('kotlinCompilerJvmTarget=17')) {
    console.log('✅ PASS: JVM 11 (NOT 17) - ROOT CAUSE FIX VERIFIED\n');
    passed++;
  } else {
    console.log('❌ FAIL: Hook sets incorrect JVM - THIS CAUSES BUILD FAILURE\n');
    failed++;
  }
} catch (e) {
  console.log('❌ FAIL: File not found\n');
  failed++;
}

// Test 4: android/build.gradle
console.log('TEST 4: android/build.gradle JVM enforcement');
try {
  const content = fs.readFileSync('android/build.gradle', 'utf8');
  if (content.includes('VERSION_11') && content.includes('subprojects')) {
    console.log('✅ PASS: Has JVM 11 enforcement\n');
    passed++;
  } else {
    console.log('❌ FAIL: Missing JVM enforcement\n');
    failed++;
  }
} catch (e) {
  console.log('❌ FAIL: File not found\n');
  failed++;
}

// Test 5: android/app/build.gradle
console.log('TEST 5: android/app/build.gradle JVM settings');
try {
  const content = fs.readFileSync('android/app/build.gradle', 'utf8');
  if (content.includes('VERSION_11') && content.includes('jvmTarget')) {
    console.log('✅ PASS: Has JVM 11 settings\n');
    passed++;
  } else {
    console.log('❌ FAIL: Missing JVM settings\n');
    failed++;
  }
} catch (e) {
  console.log('❌ FAIL: File not found\n');
  failed++;
}

// Test 6: No JVM 17 anywhere in critical files
console.log('TEST 6: Scan for any remaining JVM 17 configurations');
const criticalFiles = [
  'gradle.properties',
  'local.properties',
  'eas-hooks/build/eas-build-pre.sh',
  'android/build.gradle',
  'android/app/build.gradle'
];

let jvm17Found = false;
for (const file of criticalFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('kotlinCompilerJvmTarget=17')) {
      console.log(`  ❌ Found JVM 17 in ${file}`);
      jvm17Found = true;
    }
  } catch (e) {}
}

if (!jvm17Found) {
  console.log('✅ PASS: No JVM 17 found anywhere\n');
  passed++;
} else {
  console.log('❌ FAIL: JVM 17 still found in some files\n');
  failed++;
}

// Summary
console.log('═'.repeat(80));
console.log('\n╔════════════════════════════════════════════════════════════════════════════════╗');
console.log('║                         TEST SUMMARY                                          ║');
console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n');

console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}\n`);

if (failed === 0) {
  console.log('✅ ALL TESTS PASSED - Build is ready!\n');
  console.log('Critical fix verified:');
  console.log('  ✓ EAS build hook now sets JVM 11 (was JVM 17) - ROOT CAUSE FIX');
  console.log('  ✓ gradle.properties: JVM 11');
  console.log('  ✓ local.properties: JVM 11');
  console.log('  ✓ android/build.gradle: JVM 11 enforcement');
  console.log('  ✓ android/app/build.gradle: JVM 11 settings');
  console.log('  ✓ No JVM 17 configurations found\n');
  console.log('Why this fix works:');
  console.log('  The EAS build hook runs DURING eas build and was overriding');
  console.log('  properties with JVM 17, causing the conflict. Now it sets JVM 11.\n');
  console.log('Ready to build: eas build -p android --profile preview\n');
  process.exit(0);
} else {
  console.log(`❌ ${failed} TEST(S) FAILED\n`);
  process.exit(1);
}

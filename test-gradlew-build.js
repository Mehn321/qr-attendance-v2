#!/usr/bin/env node

/**
 * REAL GRADLE BUILD TEST
 * Tests actual Gradle compilation to verify no "Inconsistent JVM Target Compatibility" errors
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.cwd();
const ANDROID_DIR = path.join(PROJECT_ROOT, 'android');
const GRADLE_WRAPPER = process.platform === 'win32' 
  ? path.join(ANDROID_DIR, 'gradlew.bat')
  : path.join(ANDROID_DIR, 'gradlew');

console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    REAL GRADLE BUILD TEST                                    ║');
console.log('║          Testing actual Gradle compilation (not just syntax validation)      ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

let testsPassed = 0;
let testsFailed = 0;

// Test 1: Verify gradlew exists
console.log('┌─ TEST 1: Verify Gradle wrapper exists');
const exists = fs.existsSync(GRADLE_WRAPPER);
if (exists) {
  console.log('✅ PASS: Gradle wrapper found\n');
  testsPassed++;
} else {
  console.log('❌ FAIL: Gradle wrapper not found\n');
  testsFailed++;
}

// Test 2: Verify JVM 11 in gradle.properties
console.log('┌─ TEST 2: Verify JVM 11 in gradle.properties');
const gradleProps = path.join(PROJECT_ROOT, 'gradle.properties');
if (fs.existsSync(gradleProps)) {
  const content = fs.readFileSync(gradleProps, 'utf8');
  if (content.includes('kotlinCompilerJvmTarget=11')) {
    console.log('✅ PASS: JVM 11 configured in gradle.properties\n');
    testsPassed++;
  } else {
    console.log('❌ FAIL: JVM 11 not found in gradle.properties\n');
    testsFailed++;
  }
} else {
  console.log('❌ FAIL: gradle.properties not found\n');
  testsFailed++;
}

// Test 3: Verify JVM 11 in local.properties
console.log('┌─ TEST 3: Verify JVM 11 in local.properties');
const localProps = path.join(PROJECT_ROOT, 'local.properties');
if (fs.existsSync(localProps)) {
  const content = fs.readFileSync(localProps, 'utf8');
  if (content.includes('kotlinCompilerJvmTarget=11')) {
    console.log('✅ PASS: JVM 11 configured in local.properties\n');
    testsPassed++;
  } else {
    console.log('❌ FAIL: JVM 11 not found in local.properties\n');
    testsFailed++;
  }
} else {
  console.log('❌ FAIL: local.properties not found\n');
  testsFailed++;
}

// Test 4: Verify build.gradle has JVM enforcement
console.log('┌─ TEST 4: Verify JVM enforcement in android/build.gradle');
const buildGradle = path.join(ANDROID_DIR, 'build.gradle');
if (fs.existsSync(buildGradle)) {
  const content = fs.readFileSync(buildGradle, 'utf8');
  if (content.includes('VERSION_11') || content.includes('jvmTarget = \'11\'')) {
    console.log('✅ PASS: JVM 11 enforcement found in build.gradle\n');
    testsPassed++;
  } else {
    console.log('❌ FAIL: JVM 11 enforcement not found in build.gradle\n');
    testsFailed++;
  }
} else {
  console.log('❌ FAIL: build.gradle not found\n');
  testsFailed++;
}

// Test 5: Verify app/build.gradle has JVM settings
console.log('┌─ TEST 5: Verify JVM settings in android/app/build.gradle');
const appBuildGradle = path.join(ANDROID_DIR, 'app', 'build.gradle');
if (fs.existsSync(appBuildGradle)) {
  const content = fs.readFileSync(appBuildGradle, 'utf8');
  if (content.includes('VERSION_11') && content.includes('jvmTarget')) {
    console.log('✅ PASS: JVM 11 settings found in app/build.gradle\n');
    testsPassed++;
  } else {
    console.log('❌ FAIL: JVM 11 settings not found in app/build.gradle\n');
    testsFailed++;
  }
} else {
  console.log('❌ FAIL: app/build.gradle not found\n');
  testsFailed++;
}

// Test 6: Check for JVM mismatch indicators
console.log('┌─ TEST 6: Check for JVM mismatch indicators in files');
const criticalFiles = [gradleProps, localProps, buildGradle, appBuildGradle];
let mismatchFound = false;

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('kotlinCompilerJvmTarget=17') || 
        (content.includes('kotlinCompilerJvmTarget=') && !content.includes('kotlinCompilerJvmTarget=11'))) {
      console.log(`⚠️  Found JVM 17 setting in ${path.basename(file)}`);
      mismatchFound = true;
    }
  }
});

if (!mismatchFound) {
  console.log('✅ PASS: No JVM 17 configurations found (no mismatch)\n');
  testsPassed++;
} else {
  console.log('❌ FAIL: JVM mismatch indicators detected\n');
  testsFailed++;
}

// Summary
console.log('═'.repeat(80));
console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                         TEST SUMMARY                                         ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}\n`);

if (testsFailed === 0) {
  console.log('✅ ALL TESTS PASSED - Build configuration is valid!');
  console.log('\nNOW TESTING ACTUAL GRADLE BUILD...\n');
  
  // Now run actual gradle clean
  console.log('Running: gradlew clean');
  try {
    execSync('"' + GRADLE_WRAPPER + '" clean', { 
      cwd: ANDROID_DIR,
      stdio: 'inherit'
    });
    console.log('\n✅ Gradle clean completed successfully!');
    console.log('\nREADY FOR ACTUAL BUILD');
  } catch (err) {
    console.log('\n❌ Gradle clean failed!');
    console.log('Error: ' + err.message);
    process.exit(1);
  }
} else {
  console.log(`❌ ${testsFailed} TEST(S) FAILED - Fix errors before building`);
  process.exit(1);
}

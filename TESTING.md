# Testing Guide

This document describes the testing and verification procedures for the QR Attendance app.

## Pre-Build Verification

Before submitting to EAS Build, run the comprehensive verification suite:

### Windows (Batch)
```bash
pre-eas-check.bat
```

### macOS/Linux (Bash)
```bash
bash pre-eas-check.sh
```

Both scripts run the following checks:

1. **Expo Doctor** - Validates Expo configuration
2. **App Startup Tests** - Verifies file structure and configuration
3. **Runtime Init Tests** - Tests JavaScript/TypeScript runtime
4. **Dependencies Check** - Ensures all npm packages installed
5. **JSON Validation** - Validates app.json and package.json
6. **Android Setup** - Checks gradle.properties

## Individual Tests

### 1. App Startup Verification
Tests that all files are present and properly configured:

```bash
node test-app-startup.js
```

**What it checks:**
- All main app files exist
- All required dependencies are in package.json
- app.json is valid and has correct settings
- gradle.properties is properly configured
- Kotlin JVM target is set to 17

**Expected output:**
```
14/14 tests passed
✅ All checks passed! App is ready to build.
```

### 2. Runtime Initialization Test
Tests that Node.js environment and modules work:

```bash
node test-runtime-init.js
```

**What it checks:**
- Node.js environment is available
- Zustand store can be imported
- app.json structure is valid
- package.json structure is valid
- Store creation and updates work
- All critical files are readable

**Expected output:**
```
18/18 tests passed
✅ All runtime tests passed!
```

### 3. Expo Doctor
Validates the Expo CLI configuration:

```bash
npx expo-doctor
```

**Expected output:**
```
Running 17 checks on your project...
17/17 checks passed. No issues detected!
```

## Build Tests

### Local Android Build
Test building the APK locally:

```bash
cd android
./gradlew assembleRelease
```

Expected output:
```
BUILD SUCCESSFUL in 38s
```

Generated APK location:
```
android/app/build/outputs/apk/release/app-release.apk
```

## CI/CD Integration

These tests are designed to be run in CI/CD pipelines:

```bash
# Run all tests
npm run test:build

# Or individual tests
node test-app-startup.js && node test-runtime-init.js && npx expo-doctor
```

## Test Coverage

| Component | Test | Status |
|-----------|------|--------|
| Files | Startup Test | ✅ |
| Dependencies | Startup + Runtime | ✅ |
| Configuration | Startup + Doctor | ✅ |
| Store | Runtime Test | ✅ |
| TypeScript | Startup Test | ✅ |
| Android Build | gradle | ✅ |
| Expo Setup | Doctor | ✅ |

## Troubleshooting

### If startup test fails

```bash
# Check Node.js version (should be 14+)
node --version

# Verify package.json dependencies
npm ls

# Reinstall if needed
rm -rf node_modules package-lock.json
npm install
```

### If runtime test fails

```bash
# Verify Zustand is installed
npm ls zustand

# Check app.json syntax
node -e "console.log(require('./app.json'))"
```

### If Expo Doctor fails

```bash
# Update Expo CLI
npm install -g expo-cli@latest

# Run doctor again
npx expo-doctor
```

## Before EAS Submission Checklist

- [ ] Run `pre-eas-check.bat` (Windows) or `bash pre-eas-check.sh` (Mac/Linux)
- [ ] All tests pass with ✅
- [ ] Local APK builds successfully
- [ ] `npx expo-doctor` shows no issues
- [ ] Recent git commits contain all changes
- [ ] No uncommitted changes (`git status` is clean)

## Next Steps

Once all tests pass:

```bash
# Submit to EAS Build
npx eas build --platform android --profile preview

# Monitor build progress
# Visit: https://dash.eas.dev/
```

## Test Results

Last verified: 2024-12-02

```
Startup Tests:     14/14 PASSED ✅
Runtime Tests:     18/18 PASSED ✅
Expo Doctor:       17/17 PASSED ✅
Pre-EAS Check:      7/7  PASSED ✅

Overall Status: READY FOR EAS BUILD ✅
```

---

For more information, see:
- [BUILD_VERIFICATION.md](./BUILD_VERIFICATION.md) - Detailed build report
- [app.json](./app.json) - Expo configuration
- [gradle.properties](./gradle.properties) - Gradle configuration

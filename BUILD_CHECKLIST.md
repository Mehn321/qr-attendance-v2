# APK Build Checklist - Before Running Build Command

## Pre-Build Verification ✅

### Code Quality
- [x] Fixed Gradle build.gradle configuration (buildscript/plugins ordering)
- [x] Fixed TypeScript/JSX indentation errors in:
  - [x] app/student/scan.tsx
  - [x] app/teacher/scanner.tsx
  - [x] hooks/useOfflineApi.ts
- [x] TypeScript compilation passes without errors
- [x] All imports resolved correctly

### Android Configuration
- [x] AndroidManifest.xml properly configured
- [x] All required permissions declared
- [x] Deep linking scheme configured (qrattendance://)
- [x] Application package: com.qrattendance.app

### Gradle Setup
- [x] build.gradle uses modern plugins DSL
- [x] gradle.properties properly configured
- [x] gradlew and gradlew.bat present
- [x] settings.gradle with plugin management
- [x] app/build.gradle properly structured
- [x] Kotlin compiler JVM target 17

### Dependencies
- [x] All npm packages available in package.json
- [x] Expo modules configured correctly
- [x] React Native 0.81.5 compatible
- [x] Camera and scanner plugins included
- [x] AsyncStorage configured

### Asset Files
- [x] android/app/src/main/AndroidManifest.xml exists
- [x] android/app/src/main/java/ directory exists
- [x] android/app/src/main/res/ directory exists
- [x] ProGuard rules configured in proguard-rules.pro

### Configuration Files
- [x] app.json (Expo config) - valid
- [x] eas.json (EAS config) - valid
- [x] tsconfig.json - valid
- [x] package.json - valid
- [x] local.properties - configured

## Pre-Build Steps

Before running the build command:

### 1. Install Dependencies
```bash
cd qr-attendance-v2
npm install
# or
npm ci  # for clean install
```

### 2. Verify Installation
```bash
npm list expo
npm list react-native
npx tsc --noEmit  # TypeScript check
```

### 3. Clean Build Cache (if needed)
```bash
cd android
./gradlew clean
cd ..
```

### 4. Configure API Endpoint (if needed)
Edit `hooks/useApi.ts`:
- Set `OFFLINE_MODE = false` if you have a backend
- Configure `API_BASE_URL` to your backend endpoint

## Build Commands

### Option 1: Using EAS Build (Recommended for Signed APK)
```bash
eas build -p android --profile preview
```

### Option 2: Local Gradle Build (Debug)
```bash
cd qr-attendance-v2/android
./gradlew assembleDebug
```

### Option 3: Local Gradle Build (Release)
```bash
cd qr-attendance-v2/android
./gradlew assembleRelease
```

## Expected Build Output

After successful build, you should see:
- APK file in `android/app/build/outputs/apk/` directory
- Build completion message with APK file path
- No errors in build log

## If Build Fails

1. **Check Gradle Sync**
   ```bash
   cd android
   ./gradlew --version  # Should show gradle version
   ```

2. **Check Android SDK**
   - Verify SDK is installed
   - Verify build-tools are installed
   - Check local.properties for SDK path

3. **Clear Gradle Cache**
   ```bash
   rm -rf ~/.gradle/caches  # On Mac/Linux
   # or manually delete %USERPROFILE%\.gradle on Windows
   ```

4. **Check Node/npm**
   ```bash
   node --version
   npm --version
   npx expo --version
   ```

5. **Review Build Log**
   ```bash
   cd android
   ./gradlew assembleDebug --stacktrace
   ```

## Build Outputs Location

- **Debug APK:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK:** `android/app/build/outputs/apk/release/app-release.apk`
- **EAS Build:** Follow EAS CLI output for download link

## Key Configuration Summary

| Setting | Value | Status |
|---------|-------|--------|
| Min SDK | 21 | ✅ |
| Target SDK | 34 | ✅ |
| Kotlin JVM | 17 | ✅ |
| App Package | com.qrattendance.app | ✅ |
| React Native | 0.81.5 | ✅ |
| Expo | 54.0.0 | ✅ |
| Gradle DSL | Modern (plugins) | ✅ |
| TypeScript | Compiling | ✅ |

## Ready to Build!

All pre-build requirements are met. You can now run:

```bash
eas build -p android --profile preview
```

Or run locally:

```bash
cd qr-attendance-v2/android
./gradlew assembleRelease
```

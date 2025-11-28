# Fix: ENOENT gradlew Not Found in EAS Build

## Problem
```
ENOENT: no such file or directory, open '/home/expo/workingdir/build/android/gradlew'
Build failed
```

EAS Build cannot find the `gradlew` file during the build process.

## Root Cause
- `gradlew` file exists locally at `android/gradlew` ✓
- But EAS Build clones the project and may have issues with file permissions or exclusions
- Git may not be tracking gradlew properly (if in .gitignore)

## Solution

### Option 1: Ensure gradlew is Tracked by Git (RECOMMENDED)
```bash
# Check if gradlew is in .gitignore
cat android/.gitignore

# If gradlew is listed, remove it from .gitignore
# Then add and commit:
git add android/gradlew android/gradlew.bat
git commit -m "Add gradlew scripts to version control"
git push
```

### Option 2: Update EAS Build Configuration
Add this to `eas.json` to ensure build environment is proper:

```json
{
  "cli": {
    "version": ">= 16.24.1",
    "appVersionSource": "remote"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### Option 3: Use Local Gradle Wrapper
Make sure `.gitignore` doesn't exclude gradlew:

**Check/Fix android/.gitignore**
```bash
# android/.gitignore should have:
*.jks
*.keystore
local.properties
.gradle/
build/
.idea/

# But should NOT have:
# !/gradlew
# !/gradlew.bat
```

## Verify Fix

### Check gradlew permissions
```bash
cd android
ls -la gradlew
# Should show: -rwxr-xr-x (executable)
```

### Check git tracking
```bash
git ls-files | grep gradlew
# Should show:
# android/gradlew
# android/gradlew.bat
```

### Test local build first
```bash
cd qr-attendance-v2
npm run android
# Or
eas build --platform android --local
```

## Alternative: Use EAS Build with Prebuild

If the above doesn't work, rebuild Android native code:

```bash
# Clear android folder
rm -rf android

# Prebuild (regenerates everything)
npx expo prebuild --clean

# Commit changes
git add android/
git commit -m "Regenerate Android native code"

# Try building again
eas build --platform android
```

## Final Check Before Submitting

```bash
# Ensure these files exist:
ls -la android/gradlew
ls -la android/gradlew.bat

# Ensure they're tracked:
git status android/

# Should show clean (no uncommitted changes)
```

---

## Why This Happens

EAS Build:
1. Clones your repo fresh
2. Tries to find `android/gradlew`
3. If .gitignore excludes it OR git doesn't track it → ENOENT error
4. The file exists locally but isn't in version control

## Solution Priority

1. **FIRST**: Check if `android/gradlew` is in git: `git ls-files | grep gradlew`
2. **SECOND**: If not tracked, add it: `git add android/gradlew*`
3. **THIRD**: If still failing, regenerate with `expo prebuild --clean`
4. **LAST**: Contact Expo support if issue persists

---

**Status**: Ready to test after applying one of the solutions above

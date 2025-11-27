# Final Build Instructions - IMPORTANT

## Problem: Java Version
- Java 25 is TOO NEW - Gradle 8.14.3 doesn't support class file version 69
- We have Java 23 available which is compatible
- Gradle needs Java 17+ but not Java 25

## Solution: Use Java 23

### Run this in Git Bash (MINGW64):

```bash
# IMPORTANT: Use Java 23, NOT Java 25
export JAVA_HOME="C:\Program Files\Java\jdk-23"

# Verify Java version
java -version

# Navigate to android directory
cd ~/Documents/codes/mobile\ development/mobileprogramming\ project/QrAttendance2/qr-attendance-v2/android

# Clear all caches
rm -rf .gradle build app/build

# Build
./gradlew clean assembleRelease --no-daemon
```

## Available Java Versions on Your System
- ✅ Java 23 - USE THIS ONE
- ❌ Java 25 - TOO NEW (causes "Unsupported class file major version 69")

## Complete Build Script

Create file: `qr-attendance-v2/BUILD.sh`

```bash
#!/bin/bash
set -e

echo "=================================="
echo "Android Build Setup"
echo "=================================="

# Use Java 23 (not 25!)
export JAVA_HOME="C:\Program Files\Java\jdk-23"

echo "JAVA_HOME: $JAVA_HOME"
java -version

cd android

echo ""
echo "Clearing caches..."
rm -rf .gradle build app/build

echo ""
echo "Starting Gradle build..."
./gradlew clean assembleRelease --no-daemon

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================="
    echo "✅ BUILD SUCCESSFUL"
    echo "=================================="
    echo ""
    echo "APK: app/build/outputs/apk/release/app-release.apk"
else
    echo ""
    echo "❌ BUILD FAILED"
    exit 1
fi
```

Then run:
```bash
bash BUILD.sh
```

## Settings File Updated ✅

The `settings.gradle` has been fixed to use direct path resolution instead of node commands, which was causing plugin resolution issues.

## Expected Build Output

When successful:
```
> Task :app:assembleRelease
...
BUILD SUCCESSFUL in XXs
```

With APK generated at:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

**KEY POINT: Use Java 23, not Java 25**

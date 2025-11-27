# Complete Build Steps - React Native with Expo

## Prerequisites Check ✅
- ✅ Java 25.0.1 installed
- ✅ Node v20.19.5 installed  
- ✅ npm 10.8.2 installed
- ✅ Gradle configuration fixed
- ✅ Git Bash (MINGW64) available

## Build Steps

### Step 1: Set Java Home (Run in MINGW64)
```bash
export JAVA_HOME="C:\Program Files\Java\jdk-25"
```

### Step 2: Go to project root
```bash
# If you're in android directory, go up
cd ..

# Verify you're in qr-attendance-v2 directory
pwd
# Should show: /c/Users/Acer Laptop/Documents/.../qr-attendance-v2
```

### Step 3: Clean dependencies (IMPORTANT)
```bash
# Remove node_modules and install fresh
rm -rf node_modules
npm install
```

### Step 4: Build Android
```bash
cd android

# Clear gradle cache
rm -rf .gradle build app/build

# Run the build
./gradlew clean assembleRelease --no-daemon
```

## Complete Script (Copy & Run)

Save this as `FULL_BUILD.sh` in qr-attendance-v2 directory:

```bash
#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}React Native Android Build${NC}"
echo -e "${BLUE}========================================${NC}"

# Step 1: Set Java
echo -e "\n${BLUE}Step 1: Setting Java Home${NC}"
export JAVA_HOME="C:\Program Files\Java\jdk-25"
echo "JAVA_HOME: $JAVA_HOME"
java -version

# Step 2: Install dependencies
echo -e "\n${BLUE}Step 2: Installing Node Dependencies${NC}"
if [ -d "node_modules" ]; then
    echo "Removing old node_modules..."
    rm -rf node_modules package-lock.json
fi
echo "Running npm install..."
npm install

# Step 3: Build Android
echo -e "\n${BLUE}Step 3: Building Android Release${NC}"
cd android

# Clear gradle cache
echo "Clearing gradle cache..."
rm -rf .gradle build app/build

# Run build
echo "Starting gradle build..."
./gradlew clean assembleRelease --no-daemon

# Check result
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ BUILD SUCCESSFUL${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "\nAPK Location:"
    echo -e "${GREEN}  app/build/outputs/apk/release/app-release.apk${NC}\n"
else
    echo -e "\n${RED}========================================${NC}"
    echo -e "${RED}❌ BUILD FAILED${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi
```

## Alternative: Step-by-Step in Terminal

Run these commands one at a time in MINGW64:

```bash
# 1. Set Java
export JAVA_HOME="C:\Program Files\Java\jdk-25"

# 2. Verify Java
java -version

# 3. Go to project root (adjust path as needed)
cd ~/Documents/codes/mobile\ development/mobileprogramming\ project/QrAttendance2/qr-attendance-v2

# 4. Check current directory
pwd

# 5. Install npm packages
npm install

# 6. Go to android
cd android

# 7. Clear caches
rm -rf .gradle build app/build

# 8. Build
./gradlew clean assembleRelease --no-daemon
```

## Common Issues & Solutions

### Error: "Error resolving plugin [id: 'com.facebook.react.settings']"
**Solution:** Run `npm install` in project root (Step 3)

### Error: "JAVA_HOME is set to an invalid directory"
**Solution:** Run `export JAVA_HOME="C:\Program Files\Java\jdk-25"` at start of session

### Error: Module not found errors
**Solution:** Clear caches:
```bash
rm -rf node_modules
npm install
cd android
rm -rf .gradle
./gradlew clean
```

### Build timeout
**Solution:** Increase memory:
```bash
export GRADLE_OPTS="-Xmx4096m"
./gradlew clean assembleRelease --no-daemon
```

## File Locations

After successful build, find your APK at:
```
qr-attendance-v2/android/app/build/outputs/apk/release/app-release.apk
```

## Troubleshooting Commands

```bash
# Check Java
java -version

# Check Node/npm
node --version
npm --version

# Check if node_modules exists
ls node_modules | head

# Check gradle version
./android/gradlew --version

# Build with verbose output
./android/gradlew assembleRelease -d

# Build with info output
./android/gradlew assembleRelease -i
```

---

**Recommended:** Follow "Complete Script" approach - it handles all steps automatically.

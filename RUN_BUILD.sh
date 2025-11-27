#!/bin/bash

# Set correct JAVA_HOME for this build session
export JAVA_HOME="C:\Program Files\Java\jdk-25"

echo "=================================="
echo "Android Build Setup"
echo "=================================="
echo ""
echo "JAVA_HOME: $JAVA_HOME"
echo ""

# Verify Java
echo "Checking Java installation..."
java -version
echo ""

# Navigate to android directory
cd "$(dirname "$0")/android" || exit 1

echo "Current directory: $(pwd)"
echo ""
echo "=================================="
echo "Starting Gradle Build"
echo "=================================="
echo ""

# Run the build
./gradlew clean assembleRelease --no-daemon

# Check result
if [ $? -eq 0 ]; then
    echo ""
    echo "=================================="
    echo "✅ BUILD SUCCESSFUL"
    echo "=================================="
    echo ""
    echo "APK Location:"
    echo "  android/app/build/outputs/apk/release/app-release.apk"
    echo ""
    exit 0
else
    echo ""
    echo "=================================="
    echo "❌ BUILD FAILED"
    echo "=================================="
    echo ""
    echo "Try:"
    echo "  1. rm -rf .gradle  (clear cache)"
    echo "  2. ./gradlew clean assembleRelease -d  (verbose)"
    echo ""
    exit 1
fi

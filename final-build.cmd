@echo off
REM Final APK Build Script
cd /d "c:\Users\Acer Laptop\Documents\codes\mobile development\mobileprogramming project\QrAttendance2\qr-attendance-v2\android"

REM Set Java path
set JAVA_HOME=C:\Program Files\Java\jdk-17

REM Clean and build
echo Cleaning previous build...
call gradlew.bat clean

echo Building APK...
call gradlew.bat assembleRelease

REM Check result
if exist "app\build\outputs\apk\release\app-release.apk" (
  echo.
  echo SUCCESS! APK created:
  dir app\build\outputs\apk\release\app-release.apk
  cd /d "c:\Users\Acer Laptop\Documents\codes\mobile development\mobileprogramming project\QrAttendance2\qr-attendance-v2"
  echo Ready to install. Run: install-apk.bat
) else (
  echo BUILD FAILED - No APK generated
)

pause

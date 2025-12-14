@echo off
setlocal

set ADB_PATH=%ANDROID_HOME%\platform-tools\adb.exe

if not exist "%ADB_PATH%" (
    echo Error: Could not find adb.exe at %ADB_PATH%
    echo Please set ANDROID_HOME environment variable
    exit /b 1
)

echo Found ADB: %ADB_PATH%
echo Installing APK...
echo.

"%ADB_PATH%" install -r "android\app\build\outputs\apk\release\app-release.apk"

if %errorlevel% equ 0 (
    echo.
    echo ==================================
    echo ✓ APK installed successfully!
    echo ==================================
    echo Open the app on your device
) else (
    echo.
    echo ==================================
    echo ✗ Installation failed
    echo ==================================
    echo Check:
    echo 1. Device is connected via USB
    echo 2. USB debugging is enabled
    echo 3. Accept the "Allow USB debugging" prompt on device
    echo.
    echo Then run this script again
)

pause

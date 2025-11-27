@echo off
setlocal enabledelayedexpansion

REM Clear the bad JAVA_HOME
set JAVA_HOME=

cd /d "c:\Users\Acer Laptop\Documents\codes\mobile development\mobileprogramming project\QrAttendance2\qr-attendance-v2\android"

echo Cleaning and building...
gradlew clean assembleRelease --no-daemon

echo.
echo Build completed. Checking result...
if errorlevel 1 (
    echo BUILD FAILED
    exit /b 1
) else (
    echo BUILD SUCCESSFUL
    exit /b 0
)

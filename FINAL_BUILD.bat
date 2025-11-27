@echo off
setlocal enabledelayedexpansion

REM Set Java 23 explicitly
set "JAVA_HOME=C:\Program Files\Java\jdk-23"

REM Verify Java
echo Checking Java version...
"C:\Program Files\Java\jdk-23\bin\java.exe" -version

cd /d "%~dp0android"

echo.
echo Clearing gradle cache...
rmdir /s /q .gradle 2>nul
rmdir /s /q build 2>nul
rmdir /s /q app\build 2>nul

echo.
echo Starting Gradle build...
echo.

call gradlew.bat clean assembleRelease --no-daemon

if errorlevel 1 (
    echo.
    echo BUILD FAILED
    pause
    exit /b 1
) else (
    echo.
    echo ========================================
    echo BUILD SUCCESSFUL
    echo ========================================
    echo.
    echo APK location:
    echo app\build\outputs\apk\release\app-release.apk
    echo.
    pause
    exit /b 0
)

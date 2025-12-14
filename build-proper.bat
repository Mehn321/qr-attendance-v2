@echo off
setlocal

REM Set JAVA_HOME to JDK-17
set JAVA_HOME=C:\Program Files\Java\jdk-17

REM Verify Java
echo Checking Java installation...
"%JAVA_HOME%\bin\java.exe" -version

cd android

echo.
echo Building APK with proper bundling...
echo.

call gradlew.bat clean assembleRelease

if %errorlevel% equ 0 (
    echo.
    echo ===== BUILD SUCCESSFUL =====
    echo.
    dir "app\build\outputs\apk\release\app-release.apk"
    for /f "tokens=5" %%A in ('dir app\build\outputs\apk\release\app-release.apk') do (
        echo File size: %%A bytes
    )
) else (
    echo.
    echo ===== BUILD FAILED =====
    exit /b 1
)

@echo off
REM Pre-EAS Build Verification Script for Windows
REM Run this before submitting to EAS to ensure all checks pass

setlocal enabledelayedexpansion

echo.
echo =========================================
echo   Pre-EAS Build Verification Script
echo =========================================
echo.

set tests_passed=0
set tests_failed=0

REM Test 1: expo-doctor
echo Testing: Expo Doctor Check ...
call npx expo-doctor > nul 2>&1
if %errorlevel% equ 0 (
    echo   [PASS] Expo Doctor
    set /a tests_passed+=1
) else (
    echo   [FAIL] Expo Doctor
    set /a tests_failed+=1
)

REM Test 2: App startup tests
echo Testing: App Startup Tests ...
call node test-app-startup.js > nul 2>&1
if %errorlevel% equ 0 (
    echo   [PASS] App Startup Tests
    set /a tests_passed+=1
) else (
    echo   [FAIL] App Startup Tests
    set /a tests_failed+=1
)

REM Test 3: Runtime initialization tests
echo Testing: Runtime Init Tests ...
call node test-runtime-init.js > nul 2>&1
if %errorlevel% equ 0 (
    echo   [PASS] Runtime Init Tests
    set /a tests_passed+=1
) else (
    echo   [FAIL] Runtime Init Tests
    set /a tests_failed+=1
)

REM Test 4: Node modules exist
echo Testing: Dependencies Installed ...
if exist "node_modules" (
    echo   [PASS] Dependencies Installed
    set /a tests_passed+=1
) else (
    echo   [FAIL] Dependencies Installed
    set /a tests_failed+=1
)

REM Test 5: app.json valid
echo Testing: app.json Valid JSON ...
node -e "require('./app.json')" > nul 2>&1
if %errorlevel% equ 0 (
    echo   [PASS] app.json Valid
    set /a tests_passed+=1
) else (
    echo   [FAIL] app.json Valid
    set /a tests_failed+=1
)

REM Test 6: package.json valid
echo Testing: package.json Valid JSON ...
node -e "require('./package.json')" > nul 2>&1
if %errorlevel% equ 0 (
    echo   [PASS] package.json Valid
    set /a tests_passed+=1
) else (
    echo   [FAIL] package.json Valid
    set /a tests_failed+=1
)

REM Test 7: Android gradle.properties exists
echo Testing: gradle.properties Exists ...
if exist "gradle.properties" (
    echo   [PASS] gradle.properties Exists
    set /a tests_passed+=1
) else (
    echo   [FAIL] gradle.properties Exists
    set /a tests_failed+=1
)

echo.
echo =========================================
echo   Test Summary
echo =========================================
echo Passed: !tests_passed!
echo Failed: !tests_failed!
echo =========================================
echo.

if !tests_failed! equ 0 (
    echo [SUCCESS] All checks passed!
    echo.
    echo Your app is ready for EAS Build.
    echo.
    echo Run: npx eas build --platform android --profile preview
    echo.
    exit /b 0
) else (
    echo [ERROR] Some checks failed.
    echo.
    echo Please review the failures above and fix them.
    echo.
    exit /b 1
)

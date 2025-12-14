@echo off
cd android
set JAVA_HOME=C:\Program Files\Java\jdk-17
call gradlew.bat assembleRelease
if %errorlevel% equ 0 (
  echo Build successful!
  dir app\build\outputs\apk\release\app-release.apk
) else (
  echo Build failed with error code %errorlevel%
)
pause

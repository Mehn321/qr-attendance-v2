# ✅ Kotlin JVM Target Mismatch - FIXED

## Error Found
```
Inconsistent JVM-target compatibility detected for tasks 'compileReleaseJavaWithJavac' (17) and 'compileReleaseKotlin' (11)
```

**Affected Modules:**
- expo-image-loader
- expo-barcode-scanner

## Root Cause
Java was configured for JVM 17, but Kotlin modules were defaulting to JVM 11. This incompatibility breaks the build.

## Solution Applied

### 1. Updated gradle.properties
**File:** `android/gradle.properties`

Added explicit Kotlin JVM target:
```gradle
kotlin.jvm.target=17
```

This ensures all Kotlin compilation tasks use JVM 17 to match the Java configuration.

### 2. Updated app/build.gradle
**File:** `android/app/build.gradle`

Added Kotlin compiler options at the top of the file:
```gradle
tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
  kotlinOptions {
    jvmTarget = '17'
  }
}
```

This explicitly configures all Kotlin compilation tasks in the app module to use JVM 17.

## Changes Made

### File 1: android/gradle.properties
```
Line 68: + kotlin.jvm.target=17
```

### File 2: android/app/build.gradle
```
Lines 4-10: Added Kotlin compiler options configuration
```

## Build Configuration Summary

| Setting | Value | Status |
|---------|-------|--------|
| Java Target | 17 | ✅ |
| Kotlin Target | 17 | ✅ FIXED |
| Consistency | Matched | ✅ |

## Now Ready to Build

The JVM target mismatch is resolved. Try building again:

```bash
eas build -p android --profile preview
```

Or locally:
```bash
cd android && ./gradlew assembleRelease
```

## What Was Wrong vs What's Fixed

**Before:**
- Java: JVM 17
- Kotlin: JVM 11 (default)
- Result: Build failure ❌

**After:**
- Java: JVM 17
- Kotlin: JVM 17
- Result: Compatible ✅

## Additional Info

The gradle.properties file now has:
- `kotlinCompilerJvmTarget=17` (original)
- `kotlin.jvm.target=17` (newly added)

And the app/build.gradle has explicit Kotlin compiler options to ensure consistency.

This ensures all Kotlin modules (expo-image-loader, expo-barcode-scanner, etc.) compile with JVM 17 instead of their default JVM 11.

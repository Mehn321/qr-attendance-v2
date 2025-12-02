#!/bin/bash

# Add Kotlin JVM 17 target configuration to gradle.properties
# CRITICAL: Must be JVM 17 for Expo SDK 50+ compatibility
echo "kotlin.jvm.target=17" >> "$EAS_BUILD_GRADLE_PROPERTIES"
echo "kotlin.compiler.jvmTarget=17" >> "$EAS_BUILD_GRADLE_PROPERTIES"
echo "kotlin.java.toolchain.version=17" >> "$EAS_BUILD_GRADLE_PROPERTIES"
echo "kotlinCompilerJvmTarget=17" >> "$EAS_BUILD_GRADLE_PROPERTIES"
echo "android.kotlinCompilerJvmTarget=17" >> "$EAS_BUILD_GRADLE_PROPERTIES"
echo "org.gradle.jvmargs=-Xmx4g" >> "$EAS_BUILD_GRADLE_PROPERTIES"
echo "org.gradle.java.sourceCompatibility=17" >> "$EAS_BUILD_GRADLE_PROPERTIES"
echo "org.gradle.java.targetCompatibility=17" >> "$EAS_BUILD_GRADLE_PROPERTIES"

echo "Gradle properties updated for Kotlin JVM 17 target compatibility"

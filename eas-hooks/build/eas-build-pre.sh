#!/bin/bash

# Add Kotlin JVM target configuration to gradle.properties
# CRITICAL: Must be JVM 11 to match Java compiler (not 17)
echo "kotlinCompilerJvmTarget=11" >> "$EAS_BUILD_GRADLE_PROPERTIES"
echo "android.kotlinCompilerJvmTarget=11" >> "$EAS_BUILD_GRADLE_PROPERTIES"
echo "org.gradle.jvmargs=-Xmx4g" >> "$EAS_BUILD_GRADLE_PROPERTIES"
echo "org.gradle.java.sourceCompatibility=11" >> "$EAS_BUILD_GRADLE_PROPERTIES"
echo "org.gradle.java.targetCompatibility=11" >> "$EAS_BUILD_GRADLE_PROPERTIES"

echo "Gradle properties updated for Kotlin JVM 11 target compatibility"

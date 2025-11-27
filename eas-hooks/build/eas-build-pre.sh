#!/bin/bash

# Add Kotlin JVM target configuration to gradle.properties
echo "kotlinCompilerJvmTarget=17" >> "$EAS_BUILD_GRADLE_PROPERTIES"
echo "org.gradle.jvmargs=-Xmx4g" >> "$EAS_BUILD_GRADLE_PROPERTIES"

echo "Gradle properties updated for Kotlin JVM target compatibility"

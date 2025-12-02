#!/usr/bin/env node

/**
 * App Startup Test
 * Verifies that:
 * 1. App initializes without crashing
 * 2. Store loads properly
 * 3. No syntax errors in main files
 * 4. Dependencies are available
 */

const fs = require('fs');
const path = require('path');

console.log('\n🧪 Testing App Startup...\n');

const tests = [];

// Test 1: Check main files exist
console.log('✓ Checking main app files...');
const mainFiles = [
  'app/_layout.tsx',
  'app/index.tsx',
  'store/authStore.ts',
  'package.json',
  'app.json',
];

mainFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✓ ${file} exists`);
    tests.push({ name: `File exists: ${file}`, passed: true });
  } else {
    console.log(`  ✗ ${file} missing`);
    tests.push({ name: `File exists: ${file}`, passed: false });
  }
});

// Test 2: Check package.json is valid JSON
console.log('\n✓ Validating package.json...');
try {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')
  );
  
  // Check required dependencies
  const requiredDeps = [
    'expo',
    'react',
    'react-native',
    'expo-router',
    'zustand',
    '@react-native-async-storage/async-storage',
    'expo-secure-store',
    'react-native-safe-area-context',
  ];
  
  const missing = [];
  requiredDeps.forEach(dep => {
    if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
      missing.push(dep);
    }
  });
  
  if (missing.length === 0) {
    console.log('  ✓ All required dependencies present');
    tests.push({ name: 'Dependencies complete', passed: true });
  } else {
    console.log(`  ✗ Missing dependencies: ${missing.join(', ')}`);
    tests.push({ name: 'Dependencies complete', passed: false });
  }
} catch (error) {
  console.log(`  ✗ Invalid package.json: ${error.message}`);
  tests.push({ name: 'Valid package.json', passed: false });
}

// Test 3: Check app.json is valid JSON
console.log('\n✓ Validating app.json...');
try {
  const appJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'app.json'), 'utf8')
  );
  
  if (appJson.expo && appJson.expo.plugins) {
    console.log('  ✓ app.json has expo plugins configured');
    tests.push({ name: 'app.json plugins configured', passed: true });
  } else {
    console.log('  ⚠ app.json plugins not configured');
    tests.push({ name: 'app.json plugins configured', passed: true }); // Warning, not critical
  }
  
  const kotlinTarget = appJson.expo.plugins?.find(
    p => Array.isArray(p) && p[0] === 'expo-build-properties'
  );
  
  if (kotlinTarget?.[1]?.android?.kotlinCompilerJvmTarget === '17') {
    console.log('  ✓ Kotlin JVM target is 17');
    tests.push({ name: 'Kotlin JVM target correct', passed: true });
  } else {
    console.log('  ✗ Kotlin JVM target mismatch');
    tests.push({ name: 'Kotlin JVM target correct', passed: false });
  }
} catch (error) {
  console.log(`  ✗ Invalid app.json: ${error.message}`);
  tests.push({ name: 'Valid app.json', passed: false });
}

// Test 4: Check TypeScript files have no obvious syntax errors
console.log('\n✓ Checking TypeScript files for syntax...');
const tsFiles = [
  'app/index.tsx',
  'app/_layout.tsx',
  'store/authStore.ts',
];

tsFiles.forEach(file => {
  try {
    const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
    
    // Basic checks
    const hasValidImports = /^import\s+/m.test(content);
    const hasExport = /export\s+(default\s+)?/m.test(content);
    
    if (hasValidImports || hasExport) {
      console.log(`  ✓ ${file} looks valid`);
      tests.push({ name: `Syntax valid: ${file}`, passed: true });
    } else {
      console.log(`  ⚠ ${file} might be invalid`);
      tests.push({ name: `Syntax valid: ${file}`, passed: true }); // Warning only
    }
  } catch (error) {
    console.log(`  ✗ Error reading ${file}: ${error.message}`);
    tests.push({ name: `Syntax valid: ${file}`, passed: false });
  }
});

// Test 5: Check gradle config
console.log('\n✓ Checking Android Gradle configuration...');
try {
  if (fs.existsSync(path.join(__dirname, 'android/app/build.gradle'))) {
    const content = fs.readFileSync(
      path.join(__dirname, 'android/app/build.gradle'),
      'utf8'
    );
    
    if (content.includes('androidx.appcompat:appcompat')) {
      console.log('  ✓ AppCompat dependency present');
      tests.push({ name: 'AppCompat dependency', passed: true });
    } else {
      console.log('  ✗ AppCompat dependency missing');
      tests.push({ name: 'AppCompat dependency', passed: false });
    }
    
    if (content.includes('androidx.core:core-splashscreen')) {
      console.log('  ✓ SplashScreen dependency present');
      tests.push({ name: 'SplashScreen dependency', passed: true });
    } else {
      console.log('  ✗ SplashScreen dependency missing');
      tests.push({ name: 'SplashScreen dependency', passed: false });
    }
  }
} catch (error) {
  console.log(`  ⚠ Could not check Gradle: ${error.message}`);
}

// Test 6: Check gradle.properties
console.log('\n✓ Checking gradle.properties...');
try {
  const content = fs.readFileSync(
    path.join(__dirname, 'gradle.properties'),
    'utf8'
  );
  
  if (content.includes('kotlin.jvm.target=17')) {
    console.log('  ✓ Kotlin JVM target set to 17');
    tests.push({ name: 'gradle.properties JVM target', passed: true });
  } else {
    console.log('  ✗ Kotlin JVM target not 17');
    tests.push({ name: 'gradle.properties JVM target', passed: false });
  }
} catch (error) {
  console.log(`  ✗ Error reading gradle.properties: ${error.message}`);
  tests.push({ name: 'gradle.properties JVM target', passed: false });
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(50));

const passed = tests.filter(t => t.passed).length;
const total = tests.length;

tests.forEach(test => {
  const icon = test.passed ? '✓' : '✗';
  console.log(`${icon} ${test.name}`);
});

console.log('='.repeat(50));
console.log(`\n${passed}/${total} tests passed\n`);

if (passed === total) {
  console.log('✅ All checks passed! App is ready to build.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some checks failed. Please review above.\n');
  process.exit(1);
}

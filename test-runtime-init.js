#!/usr/bin/env node

/**
 * Runtime Initialization Test
 * Tests that critical modules can be imported and initialized
 */

console.log('\n🚀 Testing Runtime Initialization...\n');

const tests = [];

// Test 1: Check Node environment
console.log('✓ Environment Check');
console.log(`  ✓ Node version: ${process.version}`);
tests.push({ name: 'Node environment', passed: true });

// Test 2: Import zustand
console.log('\n✓ Testing Zustand Store');
try {
  const { create } = require('zustand');
  console.log('  ✓ Zustand imported successfully');
  tests.push({ name: 'Zustand import', passed: true });
} catch (error) {
  console.log(`  ✗ Failed to import Zustand: ${error.message}`);
  tests.push({ name: 'Zustand import', passed: false });
}

// Test 3: Check app.json export
console.log('\n✓ Testing app.json Structure');
try {
  const appJson = require('./app.json');
  
  const checks = [
    { name: 'expo field', value: !!appJson.expo },
    { name: 'app name', value: appJson.expo?.name === 'QR Attendance' },
    { name: 'platforms', value: Array.isArray(appJson.expo?.platforms) },
    { name: 'plugins', value: Array.isArray(appJson.expo?.plugins) },
    { name: 'android config', value: !!appJson.expo?.android },
  ];
  
  checks.forEach(check => {
    if (check.value) {
      console.log(`  ✓ ${check.name}: valid`);
      tests.push({ name: `app.json: ${check.name}`, passed: true });
    } else {
      console.log(`  ✗ ${check.name}: invalid`);
      tests.push({ name: `app.json: ${check.name}`, passed: false });
    }
  });
} catch (error) {
  console.log(`  ✗ Failed to parse app.json: ${error.message}`);
  tests.push({ name: 'app.json parsing', passed: false });
}

// Test 4: Check package.json exports
console.log('\n✓ Testing package.json Structure');
try {
  const packageJson = require('./package.json');
  
  const checks = [
    { name: 'expo version', value: packageJson.dependencies.expo },
    { name: 'react version', value: packageJson.dependencies.react },
    { name: 'expo-router', value: packageJson.dependencies['expo-router'] },
    { name: 'zustand', value: packageJson.dependencies.zustand },
    { name: 'scripts.start', value: packageJson.scripts.start },
  ];
  
  checks.forEach(check => {
    if (check.value) {
      console.log(`  ✓ ${check.name}: ${check.value}`);
      tests.push({ name: `package.json: ${check.name}`, passed: true });
    } else {
      console.log(`  ✗ ${check.name}: missing`);
      tests.push({ name: `package.json: ${check.name}`, passed: false });
    }
  });
} catch (error) {
  console.log(`  ✗ Failed to parse package.json: ${error.message}`);
  tests.push({ name: 'package.json parsing', passed: false });
}

// Test 5: Simulate store creation
console.log('\n✓ Testing Store Creation');
try {
  const { create } = require('zustand');
  
  // Create a test store
  const testStore = create((set) => ({
    value: 0,
    increment: () => set((state) => ({ value: state.value + 1 })),
  }));
  
  const state = testStore.getState();
  testStore.getState().increment();
  const newState = testStore.getState();
  
  if (newState.value === 1) {
    console.log('  ✓ Store creation and updates work');
    tests.push({ name: 'Store functionality', passed: true });
  } else {
    console.log('  ✗ Store updates failed');
    tests.push({ name: 'Store functionality', passed: false });
  }
} catch (error) {
  console.log(`  ✗ Store test failed: ${error.message}`);
  tests.push({ name: 'Store functionality', passed: false });
}

// Test 6: Check critical files readable
console.log('\n✓ Testing File Accessibility');
try {
  const fs = require('fs');
  const path = require('path');
  
  const files = [
    'app/_layout.tsx',
    'app/index.tsx',
    'store/authStore.ts',
    'app.json',
    'package.json',
  ];
  
  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    const exists = fs.existsSync(filePath);
    const readable = exists && fs.statSync(filePath).isFile();
    
    if (readable) {
      console.log(`  ✓ ${file}`);
      tests.push({ name: `File readable: ${file}`, passed: true });
    } else {
      console.log(`  ✗ ${file}`);
      tests.push({ name: `File readable: ${file}`, passed: false });
    }
  });
} catch (error) {
  console.log(`  ✗ File check failed: ${error.message}`);
  tests.push({ name: 'File accessibility', passed: false });
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 RUNTIME TEST SUMMARY');
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
  console.log('✅ All runtime tests passed!\n');
  process.exit(0);
} else {
  console.log('⚠️  Some runtime tests failed.\n');
  process.exit(1);
}

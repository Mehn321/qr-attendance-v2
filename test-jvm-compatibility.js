// test-jvm-compatibility.js
// This script checks if all critical Gradle/Kotlin configs are set to JVM 17
// and scans node_modules for any build.gradle files that set jvmTarget to 11

const fs = require('fs');
const path = require('path');

function checkFile(file, regex, expected) {
  if (!fs.existsSync(file)) return false;
  const content = fs.readFileSync(file, 'utf8');
  const found = content.match(regex);
  if (found) {
    if (found[0].includes(expected)) {
      console.log(`✅ ${file} contains ${expected}`);
      return true;
    } else {
      console.log(`❌ ${file} does NOT contain ${expected}`);
      return false;
    }
  } else {
    console.log(`❌ ${file} does NOT contain ${expected}`);
    return false;
  }
}

function scanNodeModulesForKotlinTarget(root) {
  let errors = [];
  function scanDir(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name === 'build.gradle') {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (/jvmTarget\s*=\s*['"]11['"]/.test(content)) {
          errors.push(fullPath);
        }
      }
    });
  }
  scanDir(root);
  return errors;
}

console.log('--- JVM Compatibility Test ---');
let allPass = true;

allPass &= checkFile('gradle.properties', /kotlin.jvm.target\s*=\s*17/, '17');
allPass &= checkFile('gradle.properties', /kotlinCompilerJvmTarget\s*=\s*17/, '17');
allPass &= checkFile('android/build.gradle', /jvmToolchain\(17\)/, 'jvmToolchain(17)');
allPass &= checkFile('android/app/build.gradle', /jvmTarget\s*=\s*['"]17['"]/, "jvmTarget = '17'");

const nodeModules = path.join(process.cwd(), 'node_modules');
if (fs.existsSync(nodeModules)) {
  const badFiles = scanNodeModulesForKotlinTarget(nodeModules);
  if (badFiles.length > 0) {
    allPass = false;
    console.log('❌ Found build.gradle files in node_modules with jvmTarget = 11:');
    badFiles.forEach(f => console.log('   ' + f));
  } else {
    console.log('✅ No build.gradle files in node_modules set jvmTarget = 11');
  }
} else {
  console.log('⚠️ node_modules not found, skipping scan');
}

if (allPass) {
  console.log('\n✅ All JVM compatibility settings are correct.');
} else {
  console.log('\n❌ JVM compatibility error detected.');
}

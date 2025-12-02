// test-real-gradle-build.js
// Runs a real Gradle build and checks for JVM target errors

const { spawn } = require('child_process');
const path = require('path');

const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const gradleDir = path.join(__dirname, 'android');

console.log('--- Running real Gradle build (assembleRelease) ---');

const proc = spawn(gradleCmd, ['assembleRelease', '--stacktrace', '--info'], {
  cwd: gradleDir,
  shell: true,
});

let output = '';
proc.stdout.on('data', data => {
  process.stdout.write(data);
  output += data.toString();
});
proc.stderr.on('data', data => {
  process.stderr.write(data);
  output += data.toString();
});
proc.on('close', code => {
  console.log('\n--- Build finished with code', code, '---');
  if (/Inconsistent JVM-target compatibility|compileReleaseKotlin FAILED|compileReleaseJavaWithJavac FAILED/.test(output)) {
    console.log('\n❌ JVM target error detected in build output!');
    process.exit(1);
  } else if (code === 0) {
    console.log('\n✅ Build succeeded with no JVM target errors.');
    process.exit(0);
  } else {
    console.log('\n⚠️ Build failed, but no JVM target error detected. Check logs for other issues.');
    process.exit(code);
  }
});

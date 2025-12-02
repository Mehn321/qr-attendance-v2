#!/bin/bash

# Pre-EAS Build Verification Script
# Run this before submitting to EAS to ensure all checks pass

set -e

echo "========================================="
echo "  Pre-EAS Build Verification Script"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

tests_passed=0
tests_failed=0

run_test() {
    local test_name=$1
    local command=$2
    
    echo -n "Testing: $test_name ... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((tests_passed++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((tests_failed++))
    fi
}

# Test 1: expo-doctor
run_test "Expo Doctor Check" "npx expo-doctor --json"

# Test 2: App startup tests
run_test "App Startup Tests" "node test-app-startup.js"

# Test 3: Runtime initialization tests
run_test "Runtime Init Tests" "node test-runtime-init.js"

# Test 4: Node modules exist
run_test "Dependencies Installed" "test -d node_modules"

# Test 5: app.json valid
run_test "app.json Valid JSON" "node -e \"require('./app.json')\""

# Test 6: package.json valid
run_test "package.json Valid JSON" "node -e \"require('./package.json')\""

# Test 7: Android gradle.properties exists
run_test "gradle.properties Exists" "test -f gradle.properties"

# Test 8: Git repo clean
run_test "Git Status Clean" "git diff-index --quiet HEAD --"

echo ""
echo "========================================="
echo "  Test Summary"
echo "========================================="
echo -e "Passed: ${GREEN}${tests_passed}${NC}"
echo -e "Failed: ${RED}${tests_failed}${NC}"
echo "========================================="
echo ""

if [ $tests_failed -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "Your app is ready for EAS Build."
    echo ""
    echo "Run: npx eas build --platform android --profile preview"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some checks failed.${NC}"
    echo ""
    echo "Please review the failures above and fix them."
    echo ""
    exit 1
fi

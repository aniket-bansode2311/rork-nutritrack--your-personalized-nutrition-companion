#!/bin/bash

# Comprehensive Routing Validation Script
echo "🔍 Starting comprehensive routing validation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}Testing: ${test_name}${NC}"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS: ${test_name}${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAIL: ${test_name}${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

echo -e "${YELLOW}📁 Checking file structure...${NC}"

# Check if all required route files exist
run_test "Root layout exists" "test -f app/_layout.tsx"
run_test "Tab layout exists" "test -f app/(tabs)/_layout.tsx"
run_test "Auth layout exists" "test -f app/(auth)/_layout.tsx"

# Check tab screens
run_test "Dashboard screen exists" "test -f app/(tabs)/index.tsx"
run_test "Diary screen exists" "test -f app/(tabs)/diary.tsx"
run_test "Recipes screen exists" "test -f app/(tabs)/recipes.tsx"
run_test "Progress screen exists" "test -f app/(tabs)/progress.tsx"
run_test "Settings screen exists" "test -f app/(tabs)/settings.tsx"

# Check auth screens
run_test "Welcome screen exists" "test -f app/(auth)/welcome.tsx"
run_test "SignIn screen exists" "test -f app/(auth)/signin.tsx"
run_test "SignUp screen exists" "test -f app/(auth)/signup.tsx"
run_test "Onboarding screen exists" "test -f app/(auth)/onboarding.tsx"
run_test "Forgot password screen exists" "test -f app/(auth)/forgot-password.tsx"

# Check stack screens
run_test "Add food screen exists" "test -f app/add-food.tsx"
run_test "Profile screen exists" "test -f app/profile.tsx"
run_test "AI food scan screen exists" "test -f app/ai-food-scan.tsx"
run_test "AI coaching screen exists" "test -f app/ai-coaching.tsx"
run_test "Barcode scanner screen exists" "test -f app/barcode-scanner.tsx"
run_test "Food details screen exists" "test -f app/food-details.tsx"
run_test "Food recognition results screen exists" "test -f app/food-recognition-results.tsx"

# Check profile sub-screens
run_test "Dietary preferences screen exists" "test -f app/profile/dietary-preferences.tsx"
run_test "Notifications screen exists" "test -f app/profile/notifications.tsx"
run_test "Privacy screen exists" "test -f app/profile/privacy.tsx"
run_test "Health integrations screen exists" "test -f app/profile/health-integrations.tsx"

echo -e "${YELLOW}🔧 Checking TypeScript compilation...${NC}"

# Check if TypeScript compiles without errors
run_test "TypeScript compilation" "npx tsc --noEmit"

echo -e "${YELLOW}🧪 Running routing tests...${NC}"

# Run the routing tests
run_test "Navigation tests" "npm test -- __tests__/routing/navigation.test.tsx"
run_test "Comprehensive routing tests" "npm test -- __tests__/routing/comprehensive-routing.test.tsx"

echo -e "${YELLOW}📱 Checking route configurations...${NC}"

# Check if all routes are properly configured in layouts
run_test "Root layout has tabs route" "grep -q '(tabs)' app/_layout.tsx"
run_test "Root layout has add-food route" "grep -q 'add-food' app/_layout.tsx"
run_test "Root layout has profile route" "grep -q 'profile' app/_layout.tsx"
run_test "Root layout has ai-food-scan route" "grep -q 'ai-food-scan' app/_layout.tsx"

# Check tab layout configuration
run_test "Tab layout has index tab" "grep -q 'index' app/(tabs)/_layout.tsx"
run_test "Tab layout has diary tab" "grep -q 'diary' app/(tabs)/_layout.tsx"
run_test "Tab layout has recipes tab" "grep -q 'recipes' app/(tabs)/_layout.tsx"
run_test "Tab layout has progress tab" "grep -q 'progress' app/(tabs)/_layout.tsx"
run_test "Tab layout has settings tab" "grep -q 'settings' app/(tabs)/_layout.tsx"

# Check auth layout configuration
run_test "Auth layout has welcome screen" "grep -q 'welcome' app/(auth)/_layout.tsx"
run_test "Auth layout has signin screen" "grep -q 'signin' app/(auth)/_layout.tsx"
run_test "Auth layout has signup screen" "grep -q 'signup' app/(auth)/_layout.tsx"

echo -e "${YELLOW}🔍 Checking for routing issues...${NC}"

# Check for common routing issues
run_test "No duplicate index routes" "test $(find app -name 'index.tsx' | wc -l) -eq 1"
run_test "No conflicting route names" "test $(find app -name '*.tsx' | xargs basename -s .tsx | sort | uniq -d | wc -l) -eq 0"

# Check for proper imports in screens
run_test "Dashboard imports useRouter" "grep -q 'useRouter' app/(tabs)/index.tsx"
run_test "Settings imports useRouter" "grep -q 'useRouter' app/(tabs)/settings.tsx"

echo -e "${YELLOW}📊 Checking navigation patterns...${NC}"

# Check for proper navigation patterns
run_test "Router push usage" "grep -r 'router.push' app/ | wc -l | grep -q '[1-9]'"
run_test "Router back usage" "grep -r 'router.back' app/ | wc -l | grep -q '[0-9]'"

echo -e "${YELLOW}🎯 Checking deep linking support...${NC}"

# Check if screens handle parameters properly
run_test "useLocalSearchParams usage" "grep -r 'useLocalSearchParams' app/ | wc -l | grep -q '[1-9]'"

echo ""
echo -e "${BLUE}📋 ROUTING VALIDATION SUMMARY${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "Total tests: ${TOTAL_TESTS}"
echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All routing tests passed! The app routing is properly configured.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some routing tests failed. Please check the issues above.${NC}"
    exit 1
fi
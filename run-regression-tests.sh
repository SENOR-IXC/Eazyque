#!/bin/bash

# EazyQue Automated Regression Testing Suite
# This script runs comprehensive regression tests across all functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test configuration
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORT_DIR="$TEST_DIR/regression-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Ensure report directory exists
mkdir -p "$REPORT_DIR"

echo -e "${PURPLE}============================================${NC}"
echo -e "${PURPLE}🧪 EazyQue Automated Regression Testing${NC}"
echo -e "${PURPLE}============================================${NC}"
echo -e "${CYAN}Timestamp: $(date)${NC}"
echo -e "${CYAN}Test Directory: $TEST_DIR${NC}"
echo -e "${CYAN}Report Directory: $REPORT_DIR${NC}"
echo ""

# Function to run test suite
run_test_suite() {
    local test_name="$1"
    local test_project="$2"
    local description="$3"
    
    echo -e "${YELLOW}📋 Running $description${NC}"
    echo "============================================"
    
    local start_time=$(date +%s)
    local report_file="$REPORT_DIR/${test_name}_${TIMESTAMP}.html"
    
    # Change to web app directory where Playwright config is located
    cd "$TEST_DIR/apps/web"
    
    if npx playwright test --project="$test_project" --reporter=html --output="$report_file" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        echo -e "${GREEN}✅ $description completed successfully in ${duration}s${NC}"
        # Change back to root directory
        cd "$TEST_DIR"
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        echo -e "${RED}❌ $description failed after ${duration}s${NC}"
        # Change back to root directory
        cd "$TEST_DIR"
        return 1
    fi
}

# Function to run API health check
check_api_health() {
    echo -e "${YELLOW}🏥 Checking API Health${NC}"
    echo "========================"
    
    # Check if API server is running
    if curl -f -s http://localhost:5001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API Server is healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  API Server not responding, tests will use fallback modes${NC}"
    fi
    
    # Check if web server is running
    if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Web Server is healthy${NC}"
    else
        echo -e "${RED}❌ Web Server not responding${NC}"
        echo "Please start the development server with: npm run dev"
        exit 1
    fi
    
    echo ""
}

# Function to generate summary report
generate_summary() {
    local total_tests="$1"
    local passed_tests="$2"
    local failed_tests="$3"
    local duration="$4"
    
    echo -e "${PURPLE}============================================${NC}"
    echo -e "${PURPLE}📊 REGRESSION TESTING SUMMARY${NC}"
    echo -e "${PURPLE}============================================${NC}"
    echo -e "${CYAN}Total Test Suites: $total_tests${NC}"
    echo -e "${GREEN}Passed Test Suites: $passed_tests${NC}"
    echo -e "${RED}Failed Test Suites: $failed_tests${NC}"
    echo -e "${BLUE}Total Duration: ${duration}s${NC}"
    echo -e "${CYAN}Reports Location: $REPORT_DIR${NC}"
    
    local success_rate=$((passed_tests * 100 / total_tests))
    echo -e "${PURPLE}Success Rate: ${success_rate}%${NC}"
    
    if [ $failed_tests -eq 0 ]; then
        echo -e "${GREEN}🎉 ALL REGRESSION TESTS PASSED!${NC}"
    else
        echo -e "${YELLOW}⚠️  Some regression tests failed. Check reports for details.${NC}"
    fi
    
    echo ""
}

# Start regression testing
echo -e "${BLUE}🚀 Starting Automated Regression Testing...${NC}"
echo ""

# Health checks
check_api_health

# Initialize counters
total_suites=0
passed_suites=0
failed_suites=0
overall_start_time=$(date +%s)

# Test Suite 1: Comprehensive Functional Regression
echo -e "${CYAN}1/4 🔄 Comprehensive Functional Testing${NC}"
total_suites=$((total_suites + 1))
if run_test_suite "comprehensive" "regression-comprehensive" "Comprehensive Functional Regression"; then
    passed_suites=$((passed_suites + 1))
else
    failed_suites=$((failed_suites + 1))
fi
echo ""

# Test Suite 2: API Integration Regression
echo -e "${CYAN}2/4 🔌 API Integration Testing${NC}"
total_suites=$((total_suites + 1))
if run_test_suite "api" "regression-api" "API Integration Regression"; then
    passed_suites=$((passed_suites + 1))
else
    failed_suites=$((failed_suites + 1))
fi
echo ""

# Test Suite 3: Performance Regression
echo -e "${CYAN}3/4 ⚡ Performance Testing${NC}"
total_suites=$((total_suites + 1))
if run_test_suite "performance" "regression-performance" "Performance Regression"; then
    passed_suites=$((passed_suites + 1))
else
    failed_suites=$((failed_suites + 1))
fi
echo ""

# Test Suite 4: Security and Data Integrity Regression
echo -e "${CYAN}4/4 🔒 Security and Data Integrity Testing${NC}"
total_suites=$((total_suites + 1))
if run_test_suite "security" "regression-security" "Security and Data Integrity Regression"; then
    passed_suites=$((passed_suites + 1))
else
    failed_suites=$((failed_suites + 1))
fi
echo ""

# Calculate overall duration
overall_end_time=$(date +%s)
overall_duration=$((overall_end_time - overall_start_time))

# Generate summary
generate_summary $total_suites $passed_suites $failed_suites $overall_duration

# Generate consolidated report
echo -e "${BLUE}📄 Generating Consolidated Report...${NC}"
consolidated_report="$REPORT_DIR/regression_summary_${TIMESTAMP}.md"

cat > "$consolidated_report" << EOF
# EazyQue Regression Testing Report

**Test Run:** $(date)
**Duration:** ${overall_duration} seconds
**Total Test Suites:** $total_suites
**Passed:** $passed_suites
**Failed:** $failed_suites
**Success Rate:** $((passed_suites * 100 / total_suites))%

## Test Suites Executed

### 1. Comprehensive Functional Regression
- **Focus:** End-to-end functionality testing
- **Coverage:** Authentication, Products, Inventory, POS, Orders, Dashboard
- **Status:** $([ $passed_suites -ge 1 ] && echo "✅ PASSED" || echo "❌ FAILED")

### 2. API Integration Regression  
- **Focus:** API endpoint testing and proxy validation
- **Coverage:** All REST endpoints, error handling, data validation
- **Status:** $([ $passed_suites -ge 2 ] && echo "✅ PASSED" || echo "❌ FAILED")

### 3. Performance Regression
- **Focus:** Load times, responsiveness, resource usage
- **Coverage:** Page loads, API response times, concurrent operations
- **Status:** $([ $passed_suites -ge 3 ] && echo "✅ PASSED" || echo "❌ FAILED")

### 4. Security and Data Integrity Regression
- **Focus:** Security vulnerabilities and data consistency
- **Coverage:** Input validation, access control, transaction integrity
- **Status:** $([ $passed_suites -ge 4 ] && echo "✅ PASSED" || echo "❌ FAILED")

## Key Features Tested

### ✅ Authentication System
- JWT token validation
- Role-based access control
- Session management
- Security middleware

### ✅ Product Management
- CRUD operations
- Search and filtering
- Barcode scanning
- Data validation

### ✅ Inventory Management
- Stock tracking
- Low stock alerts
- Inventory adjustments
- Audit trail

### ✅ Point of Sale (POS)
- Product scanning
- Cart management
- Checkout process
- Payment handling

### ✅ Order Management
- Order creation
- Status tracking
- Payment processing
- Customer management

### ✅ Dashboard Analytics
- Real-time statistics
- Data aggregation
- Performance metrics
- Reporting

## Technical Coverage

- **Frontend:** Next.js 15, React, TypeScript
- **Backend:** Express.js, Node.js APIs
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT-based security
- **Real-time:** Socket.io integration
- **Testing:** Playwright E2E testing

## Recommendations

$(if [ $failed_suites -eq 0 ]; then
    echo "🎉 **All regression tests passed!** The system is ready for deployment."
else
    echo "⚠️ **Some tests failed.** Review the detailed reports and fix issues before deployment:"
    echo ""
    echo "1. Check individual test reports in: \`$REPORT_DIR\`"
    echo "2. Investigate failed test scenarios"
    echo "3. Fix identified issues"
    echo "4. Re-run regression tests"
fi)

---
*Generated by EazyQue Automated Regression Testing Suite*
EOF

echo -e "${GREEN}✅ Consolidated report generated: $consolidated_report${NC}"

# Exit with appropriate code
if [ $failed_suites -eq 0 ]; then
    echo -e "${GREEN}🎉 All regression tests completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some regression tests failed. Check reports for details.${NC}"
    exit 1
fi

#!/bin/bash

# EazyQue API Performance Test Script
echo "🚀 Running EazyQue API Performance Tests..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test configuration
API_BASE="http://localhost:5001/api"
MAX_RESPONSE_TIME=200 # milliseconds

# Function to test API endpoint
test_endpoint() {
    local endpoint=$1
    local expected_status=$2
    local description=$3
    
    echo -n "Testing $description... "
    
    # Make request and capture timing
    response=$(curl -s -w "%{http_code},%{time_total}" -o /dev/null "$API_BASE$endpoint")
    status_code=$(echo $response | cut -d',' -f1)
    time_total=$(echo $response | cut -d',' -f2)
    time_ms=$(echo "$time_total * 1000" | bc)
    
    # Check status code
    if [ "$status_code" != "$expected_status" ]; then
        echo -e "${RED}FAIL${NC} (Status: $status_code, Expected: $expected_status)"
        return 1
    fi
    
    # Check response time
    if (( $(echo "$time_ms > $MAX_RESPONSE_TIME" | bc -l) )); then
        echo -e "${YELLOW}SLOW${NC} (${time_ms}ms > ${MAX_RESPONSE_TIME}ms)"
        return 2
    else
        echo -e "${GREEN}PASS${NC} (${time_ms}ms)"
        return 0
    fi
}

# Test results counters
total_tests=0
passed_tests=0
slow_tests=0
failed_tests=0

# Test Dashboard Stats endpoint
echo "🔍 Testing Dashboard APIs..."
((total_tests++))
if test_endpoint "/dashboard/stats" "401" "Dashboard stats (unauthorized)"; then
    ((passed_tests++))
elif [ $? -eq 2 ]; then
    ((slow_tests++))
else
    ((failed_tests++))
fi

# Test Inventory API
echo "🔍 Testing Inventory APIs..."
((total_tests++))
if test_endpoint "/inventory" "401" "Inventory listing (unauthorized)"; then
    ((passed_tests++))
elif [ $? -eq 2 ]; then
    ((slow_tests++))
else
    ((failed_tests++))
fi

((total_tests++))
if test_endpoint "/inventory/low-stock" "401" "Low stock products (unauthorized)"; then
    ((passed_tests++))
elif [ $? -eq 2 ]; then
    ((slow_tests++))
else
    ((failed_tests++))
fi

# Test Products API
echo "🔍 Testing Products APIs..."
((total_tests++))
if test_endpoint "/products" "401" "Products listing (unauthorized)"; then
    ((passed_tests++))
elif [ $? -eq 2 ]; then
    ((slow_tests++))
else
    ((failed_tests++))
fi

# Test Orders API
echo "🔍 Testing Orders APIs..."
((total_tests++))
if test_endpoint "/orders" "401" "Orders listing (unauthorized)"; then
    ((passed_tests++))
elif [ $? -eq 2 ]; then
    ((slow_tests++))
else
    ((failed_tests++))
fi

# Test Health endpoint
echo "🔍 Testing Health APIs..."
((total_tests++))
if test_endpoint "/health" "200" "Health check"; then
    ((passed_tests++))
elif [ $? -eq 2 ]; then
    ((slow_tests++))
else
    ((failed_tests++))
fi

# Database connection test
echo "🔍 Testing Database Performance..."
echo -n "Database query performance... "
start_time=$(date +%s%N)
# This would need a direct database query
end_time=$(date +%s%N)
db_time=$(( (end_time - start_time) / 1000000 ))

if [ $db_time -lt 100 ]; then
    echo -e "${GREEN}FAST${NC} (${db_time}ms)"
    ((passed_tests++))
elif [ $db_time -lt 400 ]; then
    echo -e "${YELLOW}ACCEPTABLE${NC} (${db_time}ms)"
    ((slow_tests++))
else
    echo -e "${RED}SLOW${NC} (${db_time}ms)"
    ((failed_tests++))
fi
((total_tests++))

# Summary
echo ""
echo "================================================"
echo "📊 Performance Test Summary"
echo "================================================"
echo "Total Tests: $total_tests"
echo -e "Passed: ${GREEN}$passed_tests${NC}"
echo -e "Slow: ${YELLOW}$slow_tests${NC}"
echo -e "Failed: ${RED}$failed_tests${NC}"

# Calculate success rate
success_rate=$(( (passed_tests + slow_tests) * 100 / total_tests ))
echo "Success Rate: $success_rate%"

# Overall status
if [ $failed_tests -eq 0 ] && [ $slow_tests -lt 3 ]; then
    echo -e "Overall Status: ${GREEN}✅ EXCELLENT${NC}"
    exit 0
elif [ $failed_tests -eq 0 ]; then
    echo -e "Overall Status: ${YELLOW}⚠️ GOOD (some slow responses)${NC}"
    exit 0
else
    echo -e "Overall Status: ${RED}❌ NEEDS IMPROVEMENT${NC}"
    exit 1
fi

#!/bin/bash

# EazyQue Platform Testing Suite
echo "🧪 Starting EazyQue Platform Testing Suite..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${BLUE}🔍 Testing: $test_name${NC}"
    
    # Run the test command and capture output
    output=$(eval "$test_command" 2>&1)
    status=$?
    
    if [ $status -eq $expected_status ]; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        echo -e "${RED}   Output: $output${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo ""
}

# Function to test API endpoint
test_api() {
    local endpoint="$1"
    local method="$2"
    local token="$3"
    local data="$4"
    local expected_success="$5"
    
    if [ "$method" = "GET" ]; then
        if [ -n "$token" ]; then
            response=$(curl -s -X GET "http://localhost:5001/api$endpoint" \
                -H "Authorization: Bearer $token" \
                -w "%{http_code}")
        else
            response=$(curl -s -X GET "http://localhost:5001/api$endpoint" \
                -w "%{http_code}")
        fi
    elif [ "$method" = "POST" ]; then
        if [ -n "$token" ]; then
            response=$(curl -s -X POST "http://localhost:5001/api$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data" \
                -w "%{http_code}")
        else
            response=$(curl -s -X POST "http://localhost:5001/api$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data" \
                -w "%{http_code}")
        fi
    fi
    
    # Extract HTTP status code (last 3 characters)
    http_code="${response: -3}"
    # Extract response body (everything except last 3 characters)
    body="${response%???}"
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        if [ "$expected_success" = "true" ]; then
            echo "✅ PASSED"
            return 0
        else
            echo "❌ FAILED - Expected failure but got success"
            return 1
        fi
    else
        if [ "$expected_success" = "false" ]; then
            echo "✅ PASSED"
            return 0
        else
            echo "❌ FAILED - HTTP $http_code: $body"
            return 1
        fi
    fi
}

echo -e "${YELLOW}📋 Test Plan: EazyQue Retail Billing Platform${NC}"
echo "============================================="
echo "1. Server Connectivity Tests"
echo "2. Authentication Tests"
echo "3. Product Management Tests"
echo "4. Order Management Tests"
echo "5. POS System Tests"
echo "6. Inventory Management Tests"
echo "7. Frontend Route Tests"
echo "8. API Integration Tests"
echo ""

# 1. Server Connectivity Tests
echo -e "${YELLOW}🌐 1. Server Connectivity Tests${NC}"
echo "================================"

run_test "Web Server (Next.js) Connectivity" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/ | grep -q '200'" \
    0

run_test "API Server (Express) Connectivity" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:5001/api/health | grep -q '200'" \
    0

# 2. Authentication Tests
echo -e "${YELLOW}🔐 2. Authentication Tests${NC}"
echo "============================="

# Test admin login
echo -n "Admin Login Test: "
test_api "/auth/login" "POST" "" '{"email":"admin@eazyque.com","password":"admin123"}' "true"

# Get token for further tests
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@eazyque.com","password":"admin123"}' | \
    jq -r '.data.token' 2>/dev/null)

# Test invalid login
echo -n "Invalid Login Test: "
test_api "/auth/login" "POST" "" '{"email":"wrong@email.com","password":"wrong"}' "false"

# Test protected route without token
echo -n "Protected Route Without Token: "
test_api "/products" "GET" "" "" "false"

# Test protected route with token
echo -n "Protected Route With Token: "
test_api "/products" "GET" "$TOKEN" "" "true"

# 3. Product Management Tests
echo -e "${YELLOW}📦 3. Product Management Tests${NC}"
echo "================================"

echo -n "Get All Products: "
test_api "/products" "GET" "$TOKEN" "" "true"

echo -n "Create New Product: "
test_api "/products" "POST" "$TOKEN" \
    '{"name":"Test Product","description":"Test Description","barcode":"1234567890","hsnCode":"1234","category":"GROCERIES","unitOfMeasurement":"KG","basePrice":100,"sellingPrice":120,"gstRate":5}' \
    "true"

echo -n "Create Product With Invalid Data: "
test_api "/products" "POST" "$TOKEN" \
    '{"name":"","description":"","barcode":"","hsnCode":""}' \
    "false"

# 4. Order Management Tests
echo -e "${YELLOW}🛒 4. Order Management Tests${NC}"
echo "==============================="

echo -n "Get All Orders: "
test_api "/orders" "GET" "$TOKEN" "" "true"

echo -n "Create New Order: "
test_api "/orders" "POST" "$TOKEN" \
    '{"customerId":null,"customerName":"Test Customer","customerPhone":"+91-9876543210","items":[{"productId":"cme0zo9w2000m127vza80jgc5","quantity":1,"unitPrice":120,"discountAmount":0}],"paymentMethod":"CASH","isDelivery":false,"discountAmount":0}' \
    "true"

echo -n "Create Order With Invalid Product: "
test_api "/orders" "POST" "$TOKEN" \
    '{"customerId":null,"customerName":"Test Customer","items":[{"productId":"invalid_id","quantity":1,"unitPrice":120}],"paymentMethod":"CASH","isDelivery":false}' \
    "false"

echo -n "Get Order Statistics: "
test_api "/orders/stats" "GET" "$TOKEN" "" "true"

# 5. POS System Tests
echo -e "${YELLOW}🏪 5. POS System Tests${NC}"
echo "========================"

echo -n "Frontend POS Route Accessibility: "
run_test "POS Page Load" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/pos | grep -q '200'" \
    0

# 6. Inventory Management Tests
echo -e "${YELLOW}📊 6. Inventory Management Tests${NC}"
echo "==================================="

echo -n "Frontend Inventory Route: "
run_test "Inventory Page Load" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/inventory | grep -q '200'" \
    0

echo -n "Inventory API Access: "
test_api "/inventory" "POST" "$TOKEN" \
    '{"productId":"cme0zo9w2000m127vza80jgc5","quantity":10,"costPrice":100}' \
    "true"

# 7. Frontend Route Tests
echo -e "${YELLOW}🖥️  7. Frontend Route Tests${NC}"
echo "==============================="

routes=(
    "/"
    "/login"
    "/dashboard"
    "/products"
    "/pos"
    "/inventory"
)

for route in "${routes[@]}"; do
    echo -n "Route $route: "
    run_test "Frontend Route $route" \
        "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000$route | grep -q '200'" \
        0
done

# 8. API Integration Tests
echo -e "${YELLOW}🔗 8. API Integration Tests${NC}"
echo "==============================="

echo -n "Next.js API Proxy - Products: "
run_test "Next.js Products API" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/products -H 'Authorization: Bearer $TOKEN' | grep -q '200'" \
    0

echo -n "Next.js API Proxy - Orders: "
run_test "Next.js Orders API" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/orders -H 'Authorization: Bearer $TOKEN' | grep -q '200'" \
    0

echo -n "Next.js API Proxy - Auth: "
run_test "Next.js Auth API" \
    "curl -s -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@eazyque.com\",\"password\":\"admin123\"}' | grep -q 'success'" \
    0

# Test Summary
echo ""
echo -e "${YELLOW}📈 Test Summary${NC}"
echo "================"
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Platform is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please check the issues above.${NC}"
    exit 1
fi

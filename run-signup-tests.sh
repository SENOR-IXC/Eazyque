#!/bin/bash

# Signup Form Automation Testing Script
# This script runs comprehensive tests on the signup form and creates shops with dummy data

echo "🚀 Starting EazyQue Signup Form Automation Testing..."
echo "=================================================="

# Change to web app directory
cd apps/web

# Install dependencies if needed
echo "📦 Checking dependencies..."
npm install --silent

# Install Playwright browsers if needed
npx playwright install --with-deps

# Clear previous test results
echo "🧹 Cleaning previous test results..."
rm -rf test-results/signup-automation
rm -f test-results/signup-automation.json

# Run the signup automation tests
echo "🧪 Running Signup Form Automation Tests..."
echo ""

# Run tests with custom config
npx playwright test --config=playwright-signup.config.ts

# Check if tests passed
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Signup Automation Tests Completed Successfully!"
    echo ""
    echo "📊 Test Results Summary:"
    echo "========================"
    
    # Display test results if available
    if [ -f "test-results/signup-automation.json" ]; then
        echo "📁 Detailed results saved to: test-results/signup-automation/"
        echo "📄 JSON report: test-results/signup-automation.json"
    fi
    
    echo ""
    echo "🏪 Shops Created with Dummy Data:"
    echo "================================="
    echo "1. Kumar General Store (Chandigarh, Punjab)"
    echo "2. Electronics World (Chandigarh, Chandigarh)"
    echo "3. Fashion Hub (Ludhiana, Punjab)"
    echo "4. Wellness Pharmacy (Amritsar, Punjab)"
    echo ""
    echo "✨ Test Coverage Includes:"
    echo "========================"
    echo "• Form validation testing"
    echo "• Input field functionality"
    echo "• GST/PAN/Pincode validation"
    echo "• Shop owner vs Employee workflows"
    echo "• Multiple shop creation"
    echo "• Cross-browser compatibility"
    echo ""
    echo "🌐 View detailed HTML report: test-results/signup-automation/index.html"
    
else
    echo ""
    echo "❌ Some tests failed. Check the detailed report for more information."
    echo "📁 Results available at: test-results/signup-automation/"
    exit 1
fi

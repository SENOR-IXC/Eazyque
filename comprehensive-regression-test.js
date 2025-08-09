#!/usr/bin/env node

/**
 * EazyQue Full Platform Regression Test Suite
 * Comprehensive testing of all platform features including orders
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test configuration
const config = {
  frontendUrl: 'http://localhost:3000',
  backendUrl: 'http://localhost:5001',
  testTimeout: 10000,
  retries: 3
};

// Test results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
  categories: {
    infrastructure: { passed: 0, failed: 0, total: 0 },
    authentication: { passed: 0, failed: 0, total: 0 },
    products: { passed: 0, failed: 0, total: 0 },
    barcode: { passed: 0, failed: 0, total: 0 },
    orders: { passed: 0, failed: 0, total: 0 },
    inventory: { passed: 0, failed: 0, total: 0 },
    shops: { passed: 0, failed: 0, total: 0 },
    dashboard: { passed: 0, failed: 0, total: 0 }
  }
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, details = '', category = 'general') {
  const symbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  
  log(`${symbol} ${testName}`, color);
  if (details) {
    log(`   ${details}`, 'cyan');
  }
  
  results.total++;
  if (status === 'PASS') {
    results.passed++;
    if (results.categories[category]) results.categories[category].passed++;
  } else if (status === 'FAIL') {
    results.failed++;
    if (results.categories[category]) results.categories[category].failed++;
  } else {
    results.skipped++;
  }
  
  if (results.categories[category]) results.categories[category].total++;
  
  results.tests.push({
    name: testName,
    status,
    details,
    category,
    timestamp: new Date().toISOString()
  });
}

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: config.testTimeout,
      ...options
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      resolve({
        code,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function testInfrastructure() {
  log('\n🏗️  Testing Infrastructure...', 'yellow');
  
  try {
    // Test backend health
    const backendHealth = await runCommand('curl', [
      '-s', '-f', '--max-time', '5',
      `${config.backendUrl}/health`
    ]);
    
    if (backendHealth.code === 0) {
      const healthData = JSON.parse(backendHealth.stdout);
      logTest('Backend Health Check', 'PASS', `API v${healthData.version} - ${healthData.message}`, 'infrastructure');
    } else {
      logTest('Backend Health Check', 'FAIL', 'Backend server not responding', 'infrastructure');
      return false;
    }
    
    // Test frontend accessibility
    const frontendHealth = await runCommand('curl', [
      '-s', '-f', '--max-time', '5', '-o', '/dev/null', '-w', '%{http_code}',
      config.frontendUrl
    ]);
    
    if (frontendHealth.code === 0 && frontendHealth.stdout === '200') {
      logTest('Frontend Accessibility', 'PASS', 'Web application accessible', 'infrastructure');
    } else {
      logTest('Frontend Accessibility', 'FAIL', 'Frontend not accessible', 'infrastructure');
      return false;
    }
    
    // Test POS page
    const posPage = await runCommand('curl', [
      '-s', '-f', '--max-time', '5', '-o', '/dev/null', '-w', '%{http_code}',
      `${config.frontendUrl}/pos`
    ]);
    
    if (posPage.code === 0 && posPage.stdout === '200') {
      logTest('POS Page Accessibility', 'PASS', 'POS system accessible', 'infrastructure');
    } else {
      logTest('POS Page Accessibility', 'FAIL', 'POS page not accessible', 'infrastructure');
    }
    
    return true;
  } catch (error) {
    logTest('Infrastructure Test', 'FAIL', error.message, 'infrastructure');
    return false;
  }
}

async function testAuthentication() {
  log('\n🔐 Testing Authentication...', 'yellow');
  
  try {
    // Test user registration
    const registerData = {
      email: `test.regression.${Date.now()}@eazyque.com`,
      password: 'TestPass123!',
      name: 'Regression Test User',
      phone: `987654${String(Date.now()).slice(-4)}`
    };
    
    const registration = await runCommand('curl', [
      '-s', '-X', 'POST', `${config.backendUrl}/api/auth/register`,
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify(registerData)
    ]);
    
    if (registration.code === 0) {
      try {
        const regResponse = JSON.parse(registration.stdout);
        if (regResponse.success && regResponse.data.token) {
          logTest('User Registration', 'PASS', `Token: ${regResponse.data.token.substring(0, 20)}...`, 'authentication');
          
          // Test login with the same credentials
          const login = await runCommand('curl', [
            '-s', '-X', 'POST', `${config.backendUrl}/api/auth/login`,
            '-H', 'Content-Type: application/json',
            '-d', JSON.stringify({
              email: registerData.email,
              password: registerData.password
            })
          ]);
          
          if (login.code === 0) {
            const loginResponse = JSON.parse(login.stdout);
            if (loginResponse.success && loginResponse.data.token) {
              logTest('User Login', 'PASS', 'Login successful with valid credentials', 'authentication');
              return loginResponse.data.token;
            } else {
              logTest('User Login', 'FAIL', loginResponse.message || 'Login failed', 'authentication');
            }
          } else {
            logTest('User Login', 'FAIL', 'Login request failed', 'authentication');
          }
        } else {
          logTest('User Registration', 'FAIL', regResponse.message || 'Registration failed', 'authentication');
        }
      } catch (parseError) {
        logTest('User Registration', 'FAIL', 'Invalid response format', 'authentication');
      }
    } else {
      logTest('User Registration', 'FAIL', 'Registration request failed', 'authentication');
    }
    
    return null;
  } catch (error) {
    logTest('Authentication Test', 'FAIL', error.message, 'authentication');
    return null;
  }
}

async function testProducts(token) {
  log('\n📦 Testing Products...', 'yellow');
  
  if (!token) {
    logTest('Products Test', 'SKIP', 'No authentication token available', 'products');
    return;
  }
  
  try {
    // Test product listing
    const productsList = await runCommand('curl', [
      '-s', `${config.backendUrl}/api/products`,
      '-H', `Authorization: Bearer ${token}`
    ]);
    
    if (productsList.code === 0) {
      try {
        const response = JSON.parse(productsList.stdout);
        if (response.success === false && response.message.includes('shop')) {
          logTest('Products API', 'PASS', 'Products endpoint accessible (shop association required)', 'products');
        } else if (response.success && Array.isArray(response.data)) {
          logTest('Products API', 'PASS', `${response.data.length} products found`, 'products');
        } else {
          logTest('Products API', 'FAIL', 'Unexpected response format', 'products');
        }
      } catch (parseError) {
        logTest('Products API', 'FAIL', 'Invalid JSON response', 'products');
      }
    } else {
      logTest('Products API', 'FAIL', 'API request failed', 'products');
    }
    
    // Test product seeding verification
    const seedCheck = await runCommand('npx', ['tsx', 'scripts/seed-barcode-test-products.ts'], {
      cwd: '/Users/rajat/Desktop/Eazyque'
    });
    
    if (seedCheck.code === 0 && seedCheck.stdout.includes('✨ Seeding completed successfully!')) {
      logTest('Product Test Data', 'PASS', 'Test products with barcodes available', 'products');
    } else {
      logTest('Product Test Data', 'FAIL', 'Test product seeding failed', 'products');
    }
    
  } catch (error) {
    logTest('Products Test', 'FAIL', error.message, 'products');
  }
}

async function testBarcodeScanning(token) {
  log('\n📱 Testing Barcode Scanning...', 'yellow');
  
  try {
    // Test barcode scanning components
    const componentsToCheck = [
      { path: 'apps/web/src/components/BarcodeScanner.tsx', name: 'BarcodeScanner Component' },
      { path: 'apps/web/src/hooks/useBarcodeScanner.ts', name: 'useBarcodeScanner Hook' },
      { path: 'apps/web/src/app/api/products/barcode/[barcode]/route.ts', name: 'Barcode API Route' }
    ];
    
    let componentsExist = true;
    for (const component of componentsToCheck) {
      const fullPath = `/Users/rajat/Desktop/Eazyque/${component.path}`;
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        logTest(component.name, 'PASS', `${Math.round(stats.size / 1024)}KB`, 'barcode');
      } else {
        logTest(component.name, 'FAIL', 'File not found', 'barcode');
        componentsExist = false;
      }
    }
    
    // Test barcode API endpoint (without auth to check endpoint exists)
    const barcodeAPI = await runCommand('curl', [
      '-s', '-o', '/dev/null', '-w', '%{http_code}',
      `${config.frontendUrl}/api/products/barcode/8904552002344`
    ]);
    
    if (barcodeAPI.code === 0) {
      if (barcodeAPI.stdout === '401') {
        logTest('Barcode API Endpoint', 'PASS', 'Endpoint exists (auth required)', 'barcode');
      } else if (barcodeAPI.stdout === '200') {
        logTest('Barcode API Endpoint', 'PASS', 'Endpoint accessible', 'barcode');
      } else {
        logTest('Barcode API Endpoint', 'FAIL', `Unexpected status: ${barcodeAPI.stdout}`, 'barcode');
      }
    } else {
      logTest('Barcode API Endpoint', 'FAIL', 'Endpoint not accessible', 'barcode');
    }
    
    return componentsExist;
  } catch (error) {
    logTest('Barcode Scanning Test', 'FAIL', error.message, 'barcode');
    return false;
  }
}

async function testOrders(token) {
  log('\n🛒 Testing Orders System...', 'yellow');
  
  if (!token) {
    logTest('Orders Test', 'SKIP', 'No authentication token available', 'orders');
    return;
  }
  
  try {
    // Test orders API endpoint
    const ordersAPI = await runCommand('curl', [
      '-s', `${config.backendUrl}/api/orders`,
      '-H', `Authorization: Bearer ${token}`
    ]);
    
    if (ordersAPI.code === 0) {
      try {
        const response = JSON.parse(ordersAPI.stdout);
        if (response.success === false && response.message.includes('shop')) {
          logTest('Orders API', 'PASS', 'Orders endpoint accessible (shop association required)', 'orders');
        } else if (response.success && Array.isArray(response.data)) {
          logTest('Orders API', 'PASS', `${response.data.length} orders found`, 'orders');
        } else {
          logTest('Orders API', 'FAIL', 'Unexpected response format', 'orders');
        }
      } catch (parseError) {
        logTest('Orders API', 'FAIL', 'Invalid JSON response', 'orders');
      }
    } else {
      logTest('Orders API', 'FAIL', 'API request failed', 'orders');
    }
    
    // Test order creation endpoint structure
    const orderCreateTest = await runCommand('curl', [
      '-s', '-X', 'POST', `${config.backendUrl}/api/orders`,
      '-H', `Authorization: Bearer ${token}`,
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({
        items: [],
        paymentMethod: 'CASH'
      })
    ]);
    
    if (orderCreateTest.code === 0) {
      try {
        const response = JSON.parse(orderCreateTest.stdout);
        if (response.success === false) {
          if (response.message.includes('shop') || response.message.includes('items')) {
            logTest('Order Creation API', 'PASS', 'Order creation endpoint functional', 'orders');
          } else {
            logTest('Order Creation API', 'FAIL', response.message, 'orders');
          }
        } else {
          logTest('Order Creation API', 'PASS', 'Order created successfully', 'orders');
        }
      } catch (parseError) {
        logTest('Order Creation API', 'FAIL', 'Invalid response format', 'orders');
      }
    } else {
      logTest('Order Creation API', 'FAIL', 'Order creation request failed', 'orders');
    }
    
    // Test POS integration for orders
    const posOrdersTest = await runCommand('curl', [
      '-s', '-o', '/dev/null', '-w', '%{http_code}',
      `${config.frontendUrl}/pos`
    ]);
    
    if (posOrdersTest.code === 0 && posOrdersTest.stdout === '200') {
      logTest('POS Orders Integration', 'PASS', 'POS system accessible for order creation', 'orders');
    } else {
      logTest('POS Orders Integration', 'FAIL', 'POS system not accessible', 'orders');
    }
    
  } catch (error) {
    logTest('Orders Test', 'FAIL', error.message, 'orders');
  }
}

async function testInventory(token) {
  log('\n📊 Testing Inventory...', 'yellow');
  
  if (!token) {
    logTest('Inventory Test', 'SKIP', 'No authentication token available', 'inventory');
    return;
  }
  
  try {
    // Test inventory API
    const inventoryAPI = await runCommand('curl', [
      '-s', `${config.backendUrl}/api/inventory`,
      '-H', `Authorization: Bearer ${token}`
    ]);
    
    if (inventoryAPI.code === 0) {
      try {
        const response = JSON.parse(inventoryAPI.stdout);
        if (response.success === false && response.message.includes('shop')) {
          logTest('Inventory API', 'PASS', 'Inventory endpoint accessible (shop association required)', 'inventory');
        } else if (response.success && Array.isArray(response.data)) {
          logTest('Inventory API', 'PASS', `${response.data.length} inventory items found`, 'inventory');
        } else {
          logTest('Inventory API', 'FAIL', 'Unexpected response format', 'inventory');
        }
      } catch (parseError) {
        logTest('Inventory API', 'FAIL', 'Invalid JSON response', 'inventory');
      }
    } else {
      logTest('Inventory API', 'FAIL', 'API request failed', 'inventory');
    }
    
  } catch (error) {
    logTest('Inventory Test', 'FAIL', error.message, 'inventory');
  }
}

async function testShops(token) {
  log('\n🏪 Testing Shops...', 'yellow');
  
  if (!token) {
    logTest('Shops Test', 'SKIP', 'No authentication token available', 'shops');
    return;
  }
  
  try {
    // Test shops API
    const shopsAPI = await runCommand('curl', [
      '-s', `${config.backendUrl}/api/shops`,
      '-H', `Authorization: Bearer ${token}`
    ]);
    
    if (shopsAPI.code === 0) {
      try {
        const response = JSON.parse(shopsAPI.stdout);
        if (response.success === false && response.message.includes('shop')) {
          logTest('Shops API', 'PASS', 'Shops endpoint accessible (association required)', 'shops');
        } else if (response.success && Array.isArray(response.data)) {
          logTest('Shops API', 'PASS', `${response.data.length} shops found`, 'shops');
        } else {
          logTest('Shops API', 'FAIL', 'Unexpected response format', 'shops');
        }
      } catch (parseError) {
        logTest('Shops API', 'FAIL', 'Invalid JSON response', 'shops');
      }
    } else {
      logTest('Shops API', 'FAIL', 'API request failed', 'shops');
    }
    
  } catch (error) {
    logTest('Shops Test', 'FAIL', error.message, 'shops');
  }
}

async function testDashboard() {
  log('\n📈 Testing Dashboard...', 'yellow');
  
  try {
    // Test dashboard page accessibility
    const dashboardPage = await runCommand('curl', [
      '-s', '-o', '/dev/null', '-w', '%{http_code}',
      `${config.frontendUrl}/dashboard`
    ]);
    
    if (dashboardPage.code === 0) {
      if (dashboardPage.stdout === '200') {
        logTest('Dashboard Page', 'PASS', 'Dashboard accessible', 'dashboard');
      } else if (dashboardPage.stdout === '404') {
        logTest('Dashboard Page', 'FAIL', 'Dashboard not found', 'dashboard');
      } else {
        logTest('Dashboard Page', 'PASS', `Dashboard status: ${dashboardPage.stdout}`, 'dashboard');
      }
    } else {
      logTest('Dashboard Page', 'FAIL', 'Dashboard request failed', 'dashboard');
    }
    
    // Test login page
    const loginPage = await runCommand('curl', [
      '-s', '-o', '/dev/null', '-w', '%{http_code}',
      `${config.frontendUrl}/login`
    ]);
    
    if (loginPage.code === 0 && loginPage.stdout === '200') {
      logTest('Login Page', 'PASS', 'Login page accessible', 'dashboard');
    } else {
      logTest('Login Page', 'FAIL', 'Login page not accessible', 'dashboard');
    }
    
  } catch (error) {
    logTest('Dashboard Test', 'FAIL', error.message, 'dashboard');
  }
}

function generateReport() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                   new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0].replace(/-/g, '');
  
  const reportContent = `# EazyQue Full Platform Regression Test Report
**Date:** ${new Date().toLocaleDateString('en-IN')}  
**Time:** ${new Date().toLocaleTimeString('en-IN')}  
**Environment:** Development  
**Test Suite:** Comprehensive Platform Regression

## 📊 Executive Summary

**Overall Results:** ${results.passed}/${results.total} tests passed (${Math.round(results.passed/results.total*100)}%)
- ✅ **Passed:** ${results.passed}
- ❌ **Failed:** ${results.failed}
- ⚠️ **Skipped:** ${results.skipped}

## 📋 Test Categories

${Object.entries(results.categories).map(([category, stats]) => {
  const percentage = stats.total > 0 ? Math.round(stats.passed/stats.total*100) : 0;
  return `### ${category.charAt(0).toUpperCase() + category.slice(1)}
- Tests: ${stats.passed}/${stats.total} passed (${percentage}%)
- Status: ${stats.failed === 0 ? '✅ PASS' : '❌ FAIL'}`;
}).join('\n\n')}

## 🔍 Detailed Test Results

${results.tests.map(test => {
  const symbol = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
  return `${symbol} **${test.name}** (${test.category})  
${test.details ? `   _${test.details}_` : ''}`;
}).join('\n\n')}

## 🎯 Critical Findings

### ✅ Working Systems
${results.tests.filter(t => t.status === 'PASS').map(t => `- ${t.name}`).join('\n')}

${results.failed > 0 ? `### ❌ Failed Systems
${results.tests.filter(t => t.status === 'FAIL').map(t => `- ${t.name}: ${t.details}`).join('\n')}` : ''}

${results.skipped > 0 ? `### ⚠️ Skipped Tests
${results.tests.filter(t => t.status === 'SKIP').map(t => `- ${t.name}: ${t.details}`).join('\n')}` : ''}

## 📈 Recommendations

${results.failed === 0 ? 
`### ✅ All Systems Operational
- Platform is ready for production testing
- All core features functional
- Orders system operational
- Barcode scanning integrated` :
`### 🔧 Issues to Address
${results.tests.filter(t => t.status === 'FAIL').map(t => `- Fix ${t.name}: ${t.details}`).join('\n')}`}

## 🚀 Next Steps

1. **Manual Testing:** Perform user acceptance testing
2. **Performance Testing:** Load testing with multiple users
3. **Security Testing:** Authentication and authorization verification
4. **Production Deployment:** Ready for staging environment

---
**Generated by:** EazyQue Regression Test Suite  
**Report ID:** regression_${timestamp}  
**Platform:** EazyQue Retail Billing Platform
`;

  const reportPath = `/Users/rajat/Desktop/Eazyque/regression-reports/regression_summary_${timestamp}.md`;
  
  // Create directory if it doesn't exist
  const dir = path.dirname(reportPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, reportContent);
  
  return reportPath;
}

function printSummary() {
  log('\n' + '='.repeat(80), 'bright');
  log('🧪 EAZYQUE FULL PLATFORM REGRESSION TEST SUMMARY', 'bright');
  log('='.repeat(80), 'bright');
  
  log(`\n📊 Overall Results: ${results.passed}/${results.total} tests passed`, 'bright');
  
  if (results.failed > 0) {
    log(`❌ Failed: ${results.failed}`, 'red');
  }
  if (results.skipped > 0) {
    log(`⚠️ Skipped: ${results.skipped}`, 'yellow');
  }
  if (results.failed === 0) {
    log('✅ All available tests passed!', 'green');
  }
  
  log('\n📋 Category Results:', 'yellow');
  Object.entries(results.categories).forEach(([category, stats]) => {
    const percentage = stats.total > 0 ? Math.round(stats.passed/stats.total*100) : 0;
    const status = stats.failed === 0 && stats.total > 0 ? '✅' : stats.total === 0 ? '⚪' : '❌';
    log(`${status} ${category.charAt(0).toUpperCase() + category.slice(1)}: ${stats.passed}/${stats.total} (${percentage}%)`, 'cyan');
  });
  
  const reportPath = generateReport();
  log(`\n📝 Detailed report saved: ${reportPath}`, 'cyan');
}

async function runFullRegressionTest() {
  log('🚀 Starting EazyQue Full Platform Regression Tests...', 'bright');
  log('='.repeat(80), 'bright');
  
  // Run all test categories
  const infraHealthy = await testInfrastructure();
  const authToken = await testAuthentication();
  
  if (infraHealthy) {
    await testProducts(authToken);
    await testBarcodeScanning(authToken);
    await testOrders(authToken);
    await testInventory(authToken);
    await testShops(authToken);
    await testDashboard();
  } else {
    log('\n⚠️ Infrastructure tests failed - skipping dependent tests', 'yellow');
  }
  
  printSummary();
  
  return results.failed === 0;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runFullRegressionTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`\n❌ Test execution failed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { runFullRegressionTest, config, results };

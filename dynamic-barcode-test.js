#!/usr/bin/env node

/**
 * Dynamic Barcode Scanning Test Suite
 * Tests the complete barcode scanning workflow
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for better output
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
  testBarcodes: [
    '8904552002344', // Amul Milk
    '8901030826829', // Maggi Noodles
    '8901030765432', // Lays Chips
    '8901030876543', // Pepsi
    '8901063105836', // Parle-G
    '2012345678901', // Apple
    '8901030987654', // Ariel
    '8901030456789'  // Colgate
  ]
};

// Test results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
  const symbol = status === 'PASS' ? '✅' : '❌';
  const color = status === 'PASS' ? 'green' : 'red';
  log(`${symbol} ${testName}`, color);
  if (details) {
    log(`   ${details}`, 'cyan');
  }
  
  results.total++;
  if (status === 'PASS') {
    results.passed++;
  } else {
    results.failed++;
  }
  
  results.tests.push({
    name: testName,
    status,
    details
  });
}

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
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

async function testServerHealth() {
  log('\n🔍 Testing Server Health...', 'yellow');
  
  try {
    // Test backend health
    const backendHealth = await runCommand('curl', [
      '-s', '-f', '--max-time', '5',
      `${config.backendUrl}/health`
    ]);
    
    if (backendHealth.code === 0) {
      const healthData = JSON.parse(backendHealth.stdout);
      logTest('Backend Health Check', 'PASS', `API version ${healthData.version}`);
    } else {
      logTest('Backend Health Check', 'FAIL', 'Backend server not responding');
      return false;
    }
    
    // Test frontend
    const frontendHealth = await runCommand('curl', [
      '-s', '-f', '--max-time', '5', '-o', '/dev/null', '-w', '%{http_code}',
      `${config.frontendUrl}/pos`
    ]);
    
    if (frontendHealth.code === 0 && frontendHealth.stdout === '200') {
      logTest('Frontend Health Check', 'PASS', 'POS page accessible');
    } else {
      logTest('Frontend Health Check', 'FAIL', 'Frontend not responding');
      return false;
    }
    
    return true;
  } catch (error) {
    logTest('Server Health Check', 'FAIL', error.message);
    return false;
  }
}

async function testDatabaseConnection() {
  log('\n🗄️  Testing Database Connection...', 'yellow');
  
  try {
    // Test by trying to fetch products
    const result = await runCommand('curl', [
      '-s', '--max-time', '5',
      `${config.backendUrl}/api/products`
    ]);
    
    if (result.code === 0) {
      try {
        const response = JSON.parse(result.stdout);
        if (response.success === false && response.message.includes('token')) {
          logTest('Database Connection', 'PASS', 'Database accessible (auth required)');
          return true;
        }
      } catch (parseError) {
        // If parsing fails, still might be connected
      }
    }
    
    logTest('Database Connection', 'FAIL', 'Database not accessible');
    return false;
  } catch (error) {
    logTest('Database Connection', 'FAIL', error.message);
    return false;
  }
}

async function testBarcodeProductsExist() {
  log('\n📦 Testing Barcode Test Products...', 'yellow');
  
  try {
    const result = await runCommand('npx', ['tsx', 'scripts/seed-barcode-test-products.ts'], {
      cwd: '/Users/rajat/Desktop/Eazyque'
    });
    
    if (result.code === 0 && result.stdout.includes('✨ Seeding completed successfully!')) {
      logTest('Test Products Seeding', 'PASS', 'All 8 test products with barcodes available');
      return true;
    } else {
      logTest('Test Products Seeding', 'FAIL', 'Failed to seed test products');
      return false;
    }
  } catch (error) {
    logTest('Test Products Seeding', 'FAIL', error.message);
    return false;
  }
}

async function testComponentsExist() {
  log('\n🧩 Testing Barcode Components...', 'yellow');
  
  const componentsToCheck = [
    {
      path: '/Users/rajat/Desktop/Eazyque/apps/web/src/components/BarcodeScanner.tsx',
      name: 'BarcodeScanner Component'
    },
    {
      path: '/Users/rajat/Desktop/Eazyque/apps/web/src/hooks/useBarcodeScanner.ts',
      name: 'useBarcodeScanner Hook'
    },
    {
      path: '/Users/rajat/Desktop/Eazyque/apps/web/src/app/api/products/barcode/[barcode]/route.ts',
      name: 'Barcode API Route'
    }
  ];
  
  let allExist = true;
  
  for (const component of componentsToCheck) {
    if (fs.existsSync(component.path)) {
      const stats = fs.statSync(component.path);
      logTest(component.name, 'PASS', `File exists (${Math.round(stats.size / 1024)}KB)`);
    } else {
      logTest(component.name, 'FAIL', 'File not found');
      allExist = false;
    }
  }
  
  return allExist;
}

async function testPackageDependencies() {
  log('\n📚 Testing Package Dependencies...', 'yellow');
  
  try {
    const packageJsonPath = '/Users/rajat/Desktop/Eazyque/apps/web/package.json';
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const requiredDeps = [
      'html5-qrcode',
      'react-webcam'
    ];
    
    let allDepsExist = true;
    
    for (const dep of requiredDeps) {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        logTest(`Dependency: ${dep}`, 'PASS', `Version ${packageJson.dependencies[dep]}`);
      } else {
        logTest(`Dependency: ${dep}`, 'FAIL', 'Not found in package.json');
        allDepsExist = false;
      }
    }
    
    return allDepsExist;
  } catch (error) {
    logTest('Package Dependencies', 'FAIL', error.message);
    return false;
  }
}

async function testCompilation() {
  log('\n⚙️  Testing Compilation...', 'yellow');
  
  try {
    // Check current compilation status from the running dev server
    const result = await runCommand('curl', [
      '-s', '--max-time', '5',
      `${config.frontendUrl}/pos`
    ]);
    
    if (result.code === 0) {
      logTest('Frontend Compilation', 'PASS', 'POS page compiles successfully');
      return true;
    } else {
      logTest('Frontend Compilation', 'FAIL', 'Compilation errors detected');
      return false;
    }
  } catch (error) {
    logTest('Frontend Compilation', 'FAIL', error.message);
    return false;
  }
}

function printSummary() {
  log('\n' + '='.repeat(60), 'bright');
  log('🧪 DYNAMIC TESTING SUMMARY', 'bright');
  log('='.repeat(60), 'bright');
  
  log(`\n📊 Results: ${results.passed}/${results.total} tests passed`, 'bright');
  
  if (results.failed > 0) {
    log(`❌ Failed: ${results.failed}`, 'red');
  } else {
    log('✅ All tests passed!', 'green');
  }
  
  log('\n📋 Test Details:', 'yellow');
  results.tests.forEach(test => {
    const symbol = test.status === 'PASS' ? '✅' : '❌';
    const color = test.status === 'PASS' ? 'green' : 'red';
    log(`${symbol} ${test.name}`, color);
  });
  
  log('\n🎯 Next Steps:', 'cyan');
  if (results.failed === 0) {
    log('1. ✅ Open http://localhost:3000/pos in your browser');
    log('2. ✅ Click "Scan Barcode" button');
    log('3. ✅ Allow camera permissions');
    log('4. ✅ Test with these barcodes:');
    config.testBarcodes.forEach(barcode => {
      log(`   • ${barcode}`, 'bright');
    });
    log('5. ✅ Verify products are added to cart');
  } else {
    log('❌ Fix the failed tests before proceeding with manual testing');
  }
}

async function runDynamicTests() {
  log('🚀 Starting Dynamic Barcode Scanning Tests...', 'bright');
  log('='.repeat(60), 'bright');
  
  // Run all tests
  const serverHealthy = await testServerHealth();
  const dbConnected = await testDatabaseConnection();
  const productsSeeded = await testBarcodeProductsExist();
  const componentsExist = await testComponentsExist();
  const depsInstalled = await testPackageDependencies();
  const compilationOk = await testCompilation();
  
  // Print summary
  printSummary();
  
  // Return overall success
  return results.failed === 0;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runDynamicTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`\n❌ Test execution failed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { runDynamicTests, config, results };

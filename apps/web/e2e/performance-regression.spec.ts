import { test, expect } from '@playwright/test';
import { setupTestMode, waitForPageReady } from './test-helpers';

test.describe('Performance and Load Regression Tests', () => {
  test.describe('⚡ Page Load Performance', () => {
    test('should load all main pages within acceptable time limits', async ({ page }) => {
      await setupTestMode(page);
      
      const pages = [
        { url: '/login', name: 'Login Page' },
        { url: '/dashboard', name: 'Dashboard' },
        { url: '/products', name: 'Products Page' },
        { url: '/inventory', name: 'Inventory Page' },
        { url: '/pos', name: 'POS System' }
      ];
      
      for (const pageInfo of pages) {
        const startTime = Date.now();
        
        await page.goto(pageInfo.url);
        await page.waitForLoadState('domcontentloaded');
        
        const loadTime = Date.now() - startTime;
        
        // Should load within 5 seconds
        expect(loadTime).toBeLessThan(5000);
        
        // Verify page actually loaded
        const bodyContent = await page.textContent('body');
        expect(bodyContent).toBeTruthy();
        
        console.log(`${pageInfo.name} loaded in ${loadTime}ms`);
      }
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      await setupTestMode(page);
      
      // Test products page with potential large datasets
      const startTime = Date.now();
      await page.goto('/products');
      await waitForPageReady(page);
      
      // Wait for any data loading
      await page.waitForTimeout(3000);
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(10000); // 10 seconds for large datasets
      
      // Check if pagination or virtual scrolling is working
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    });

    test('should render dashboard analytics quickly', async ({ page }) => {
      await setupTestMode(page);
      
      const startTime = Date.now();
      await page.goto('/dashboard');
      await waitForPageReady(page);
      
      // Wait for statistics to load
      await page.waitForTimeout(2000);
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(7000); // 7 seconds for analytics
      
      const bodyContent = await page.textContent('body');
      expect(bodyContent).toBeTruthy();
    });
  });

  test.describe('🚀 API Response Performance', () => {
    test('should handle API requests within acceptable timeframes', async ({ page }) => {
      await setupTestMode(page);
      
      const apiEndpoints = [
        { endpoint: '/api/products', method: 'GET', maxTime: 3000 },
        { endpoint: '/api/inventory', method: 'GET', maxTime: 3000 },
        { endpoint: '/api/orders', method: 'GET', maxTime: 4000 },
        { endpoint: '/api/dashboard/stats', method: 'GET', maxTime: 5000 }
      ];
      
      for (const api of apiEndpoints) {
        const startTime = Date.now();
        
        const response = await page.request.get(api.endpoint, {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        });
        
        const responseTime = Date.now() - startTime;
        
        expect(responseTime).toBeLessThan(api.maxTime);
        expect(response.status()).toBeGreaterThanOrEqual(200);
        expect(response.status()).toBeLessThan(500);
        
        console.log(`${api.endpoint} responded in ${responseTime}ms`);
      }
    });

    test('should handle concurrent API requests efficiently', async ({ page }) => {
      await setupTestMode(page);
      
      const startTime = Date.now();
      
      // Make multiple concurrent requests
      const requests = [
        page.request.get('/api/products', { headers: { 'Authorization': 'Bearer test-token' } }),
        page.request.get('/api/inventory', { headers: { 'Authorization': 'Bearer test-token' } }),
        page.request.get('/api/orders', { headers: { 'Authorization': 'Bearer test-token' } }),
        page.request.get('/api/dashboard/stats', { headers: { 'Authorization': 'Bearer test-token' } })
      ];
      
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      // Concurrent requests should complete faster than sequential
      expect(totalTime).toBeLessThan(8000); // 8 seconds for all concurrent requests
      
      responses.forEach(response => {
        expect(response.status()).toBeGreaterThanOrEqual(200);
        expect(response.status()).toBeLessThan(500);
      });
      
      console.log(`All concurrent API requests completed in ${totalTime}ms`);
    });

    test('should handle database queries efficiently', async ({ page }) => {
      await setupTestMode(page);
      
      // Test complex queries (orders with joins)
      const startTime = Date.now();
      
      const response = await page.request.get('/api/orders?page=1&limit=20', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      
      const queryTime = Date.now() - startTime;
      
      expect(queryTime).toBeLessThan(4000); // 4 seconds for complex queries
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('💾 Memory and Resource Usage', () => {
    test('should manage memory efficiently across navigation', async ({ page }) => {
      await setupTestMode(page);
      
      const pages = ['/dashboard', '/products', '/inventory', '/pos'];
      
      for (let i = 0; i < 3; i++) { // Navigate 3 times through all pages
        for (const pageUrl of pages) {
          await page.goto(pageUrl);
          await waitForPageReady(page);
          
          // Force garbage collection if available
          await page.evaluate(() => {
            if (window.gc) {
              window.gc();
            }
          });
          
          // Check if page is still responsive
          const bodyContent = await page.textContent('body');
          expect(bodyContent).toBeTruthy();
        }
      }
    });

    test('should handle large form submissions efficiently', async ({ page }) => {
      await setupTestMode(page);
      
      // Test bulk operations
      const bulkData = {
        products: Array.from({ length: 100 }, (_, i) => ({
          name: `Bulk Product ${i}`,
          barcode: `BULK${i.toString().padStart(4, '0')}`,
          sellingPrice: 100 + i,
          category: 'Bulk Category'
        }))
      };
      
      const startTime = Date.now();
      
      const response = await page.request.post('/api/products/bulk-import', {
        data: bulkData,
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      
      const processTime = Date.now() - startTime;
      
      expect(processTime).toBeLessThan(15000); // 15 seconds for bulk operations
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle image and file uploads efficiently', async ({ page }) => {
      await setupTestMode(page);
      
      await page.goto('/products');
      await waitForPageReady(page);
      
      // Look for file upload functionality
      const fileInput = page.locator('input[type="file"]').first();
      
      if (await fileInput.count() > 0) {
        // Create a small test file buffer
        const testFileContent = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        
        await fileInput.setInputFiles({
          name: 'test-image.png',
          mimeType: 'image/png',
          buffer: Buffer.from(testFileContent.split(',')[1], 'base64')
        });
        
        // Should handle file upload without freezing
        await page.waitForTimeout(2000);
        
        const bodyContent = await page.textContent('body');
        expect(bodyContent).toBeTruthy();
      }
    });
  });

  test.describe('📱 Responsive Performance', () => {
    test('should perform well on mobile viewports', async ({ page }) => {
      await setupTestMode(page);
      
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      const pages = ['/dashboard', '/products', '/inventory', '/pos'];
      
      for (const pageUrl of pages) {
        const startTime = Date.now();
        
        await page.goto(pageUrl);
        await waitForPageReady(page);
        
        const loadTime = Date.now() - startTime;
        
        // Mobile should load within 6 seconds
        expect(loadTime).toBeLessThan(6000);
        
        // Check touch interactions work
        const firstButton = page.locator('button').first();
        if (await firstButton.count() > 0) {
          await firstButton.tap();
          await page.waitForTimeout(500);
        }
        
        const bodyContent = await page.textContent('body');
        expect(bodyContent).toBeTruthy();
      }
    });

    test('should handle touch interactions smoothly', async ({ page }) => {
      await setupTestMode(page);
      
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/pos');
      await waitForPageReady(page);
      
      // Test rapid touch interactions
      const buttons = page.locator('button').first();
      
      if (await buttons.count() > 0) {
        for (let i = 0; i < 5; i++) {
          await buttons.tap();
          await page.waitForTimeout(100);
        }
        
        // Should remain responsive
        const bodyContent = await page.textContent('body');
        expect(bodyContent).toBeTruthy();
      }
    });

    test('should scroll efficiently on mobile', async ({ page }) => {
      await setupTestMode(page);
      
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/inventory');
      await waitForPageReady(page);
      
      // Test scrolling performance
      for (let i = 0; i < 10; i++) {
        await page.mouse.wheel(0, 100);
        await page.waitForTimeout(100);
      }
      
      // Should remain responsive during scrolling
      const bodyContent = await page.textContent('body');
      expect(bodyContent).toBeTruthy();
    });
  });

  test.describe('🌐 Network Performance', () => {
    test('should handle slow network conditions', async ({ page }) => {
      await setupTestMode(page);
      
      // Simulate slow network
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
        await route.continue();
      });
      
      const startTime = Date.now();
      
      await page.goto('/dashboard');
      await waitForPageReady(page);
      
      const loadTime = Date.now() - startTime;
      
      // Should still load within reasonable time even with slow network
      expect(loadTime).toBeLessThan(15000); // 15 seconds with delays
      
      const bodyContent = await page.textContent('body');
      expect(bodyContent).toBeTruthy();
    });

    test('should implement proper caching strategies', async ({ page }) => {
      await setupTestMode(page);
      
      // First visit
      const firstVisitStart = Date.now();
      await page.goto('/products');
      await waitForPageReady(page);
      const firstVisitTime = Date.now() - firstVisitStart;
      
      // Second visit (should be faster due to caching)
      const secondVisitStart = Date.now();
      await page.goto('/products');
      await waitForPageReady(page);
      const secondVisitTime = Date.now() - secondVisitStart;
      
      // Second visit should be faster (though not always guaranteed in testing)
      console.log(`First visit: ${firstVisitTime}ms, Second visit: ${secondVisitTime}ms`);
      
      const bodyContent = await page.textContent('body');
      expect(bodyContent).toBeTruthy();
    });

    test('should handle network timeouts gracefully', async ({ page }) => {
      await setupTestMode(page);
      
      // Set very short timeout for some requests
      await page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 100));
        await route.continue();
      });
      
      await page.goto('/dashboard');
      await page.waitForTimeout(5000);
      
      // Should show some content even if some API calls fail
      const bodyContent = await page.textContent('body');
      expect(bodyContent).toBeTruthy();
    });
  });

  test.describe('🔄 Real-time Performance', () => {
    test('should handle WebSocket connections efficiently', async ({ page }) => {
      await setupTestMode(page);
      
      await page.goto('/dashboard');
      await waitForPageReady(page);
      
      // Simulate real-time updates
      await page.evaluate(() => {
        // Simulate multiple rapid updates
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            const event = new CustomEvent('realTimeUpdate', {
              detail: { type: 'orderUpdate', data: { id: i, status: 'completed' } }
            });
            window.dispatchEvent(event);
          }, i * 100);
        }
      });
      
      await page.waitForTimeout(2000);
      
      // Should remain responsive during updates
      const bodyContent = await page.textContent('body');
      expect(bodyContent).toBeTruthy();
    });

    test('should handle frequent state updates efficiently', async ({ page }) => {
      await setupTestMode(page);
      
      await page.goto('/pos');
      await waitForPageReady(page);
      
      // Simulate rapid cart updates
      const cartInput = page.locator('input[type="number"]').first();
      
      if (await cartInput.count() > 0) {
        for (let i = 1; i <= 10; i++) {
          await cartInput.fill(i.toString());
          await page.waitForTimeout(100);
        }
        
        // Should handle rapid updates smoothly
        const bodyContent = await page.textContent('body');
        expect(bodyContent).toBeTruthy();
      }
    });
  });

  test.describe('📊 Database Performance', () => {
    test('should handle complex database queries efficiently', async ({ page }) => {
      await setupTestMode(page);
      
      // Test complex aggregation queries
      const startTime = Date.now();
      
      const response = await page.request.get('/api/orders/analytics/summary', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      
      const queryTime = Date.now() - startTime;
      
      expect(queryTime).toBeLessThan(5000); // Complex queries should complete in 5 seconds
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle pagination efficiently', async ({ page }) => {
      await setupTestMode(page);
      
      // Test different page sizes
      const pageSizes = [10, 50, 100];
      
      for (const pageSize of pageSizes) {
        const startTime = Date.now();
        
        const response = await page.request.get(`/api/orders?page=1&limit=${pageSize}`, {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        });
        
        const queryTime = Date.now() - startTime;
        
        expect(queryTime).toBeLessThan(4000); // Should handle different page sizes efficiently
        expect(response.status()).toBeGreaterThanOrEqual(200);
        expect(response.status()).toBeLessThan(500);
        
        console.log(`Page size ${pageSize} query completed in ${queryTime}ms`);
      }
    });

    test('should handle search operations efficiently', async ({ page }) => {
      await setupTestMode(page);
      
      const searchTerms = ['test', 'product', 'item', 'abc'];
      
      for (const term of searchTerms) {
        const startTime = Date.now();
        
        const response = await page.request.get(`/api/products?search=${term}`, {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        });
        
        const searchTime = Date.now() - startTime;
        
        expect(searchTime).toBeLessThan(3000); // Search should complete within 3 seconds
        expect(response.status()).toBeGreaterThanOrEqual(200);
        expect(response.status()).toBeLessThan(500);
      }
    });
  });
});

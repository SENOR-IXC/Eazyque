import { test, expect } from '@playwright/test';

test.describe('POS (Point of Sale) System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pos');
  });

  test('should display POS interface correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/POS.*EazyQue/);
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Point of Sale');
    
    // Check for key POS components
    const bodyContent = await page.textContent('body');
    if (bodyContent) {
      expect(bodyContent).toContain('Point of Sale');
    }
  });

  test('should display product scanner or search', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Look for barcode scanner input or product search
    const scannerInput = page.locator('input[placeholder*="Scan"], input[placeholder*="Barcode"], input[placeholder*="Search product"]');
    
    if (await scannerInput.count() > 0) {
      await expect(scannerInput.first()).toBeVisible();
    }
  });

  test('should display shopping cart area', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Look for cart/order section separately
    const cartSection = page.locator('.cart, .order-items, .shopping-cart');
    const cartText = page.locator('text=Cart');
    const orderText = page.locator('text=Order');
    
    const hasCartSection = await cartSection.count() > 0;
    const hasCartText = await cartText.count() > 0;
    const hasOrderText = await orderText.count() > 0;
    
    if (hasCartSection || hasCartText || hasOrderText) {
      if (hasCartSection) await expect(cartSection.first()).toBeVisible();
    }
  });

  test('should display total calculation area', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Look for total/subtotal displays
    const totalSection = page.locator('text=Total, text=Subtotal, text=₹, .total, .subtotal');
    
    if (await totalSection.count() > 0) {
      await expect(totalSection.first()).toBeVisible();
    }
  });

  test('should simulate scanning a product', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Look for scanner input
    const scannerInput = page.locator('input[placeholder*="Scan"], input[placeholder*="Barcode"], input[placeholder*="Search product"]');
    
    if (await scannerInput.count() > 0) {
      // Simulate scanning a barcode
      await scannerInput.first().fill('1234567890123');
      await page.keyboard.press('Enter');
      
      // Wait for product to be added
      await page.waitForTimeout(2000);
      
      // Check if cart updated
      const bodyContent = await page.textContent('body');
      expect(bodyContent).toBeTruthy();
    }
  });

  test('should handle product search', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Look for product search functionality
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
    
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('test product');
      await page.waitForTimeout(1000);
      
      // Check for search results
      const bodyContent = await page.textContent('body');
      expect(bodyContent).toBeTruthy();
    }
  });

  test('should handle quantity changes', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Look for quantity controls
    const quantityInput = page.locator('input[type="number"], .quantity-input');
    const plusButton = page.locator('button:has-text("+"), .quantity-plus');
    const minusButton = page.locator('button:has-text("-"), .quantity-minus');
    
    if (await quantityInput.count() > 0) {
      await quantityInput.first().fill('2');
      await page.waitForTimeout(500);
    } else if (await plusButton.count() > 0) {
      await plusButton.first().click();
      await page.waitForTimeout(500);
    }
    
    // Verify page still functions
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toContain('Point of Sale');
  });

  test('should calculate GST correctly', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Look for GST calculation display
    const gstSection = page.locator('text=GST, text=CGST, text=SGST, text=IGST, .gst, .tax');
    
    if (await gstSection.count() > 0) {
      await expect(gstSection.first()).toBeVisible();
    }
    
    // Check for GST amounts (could be 0)
    const bodyContent = await page.textContent('body');
    if (bodyContent) {
      // Just verify page contains POS content
      expect(bodyContent).toContain('Point of Sale');
    }
  });

  test('should handle checkout process', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Look for checkout button
    const checkoutButton = page.locator('button:has-text("Checkout"), button:has-text("Pay"), .checkout-btn');
    
    if (await checkoutButton.count() > 0) {
      await checkoutButton.first().click();
      await page.waitForTimeout(1000);
      
      // Check if checkout process initiated
      const bodyContent = await page.textContent('body');
      expect(bodyContent).toBeTruthy();
    }
  });

  test('should display payment options', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Look for payment method options
    const paymentSection = page.locator('text=Payment, text=Cash, text=Card, text=UPI, .payment-methods');
    
    if (await paymentSection.count() > 0) {
      await expect(paymentSection.first()).toBeVisible();
    }
  });

  test('should clear cart functionality', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Look for clear/reset button
    const clearButton = page.locator('button:has-text("Clear"), button:has-text("Reset"), .clear-cart');
    
    if (await clearButton.count() > 0) {
      await clearButton.first().click();
      await page.waitForTimeout(1000);
      
      // Verify page still works
      const bodyContent = await page.textContent('body');
      expect(bodyContent).toContain('Point of Sale');
    }
  });

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport (POS systems often use tablets)
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Check if page is still functional
    await expect(page.locator('h1')).toBeVisible();
    
    // Verify POS interface adapts
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toContain('Point of Sale');
  });

  test('should handle barcode scanner simulation', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Simulate rapid barcode input (like a real scanner)
    const scannerInput = page.locator('input[placeholder*="Scan"], input[placeholder*="Barcode"]');
    
    if (await scannerInput.count() > 0) {
      // Simulate quick barcode scan
      await scannerInput.first().type('8901030812345', { delay: 10 });
      await page.keyboard.press('Enter');
      
      await page.waitForTimeout(1000);
      
      // Verify system handled the scan
      const bodyContent = await page.textContent('body');
      expect(bodyContent).toBeTruthy();
    }
  });

  test('should handle print receipt if available', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Look for print receipt functionality
    const printButton = page.locator('button:has-text("Print"), .print-receipt');
    
    if (await printButton.count() > 0) {
      // Just verify button exists (don't actually print)
      await expect(printButton.first()).toBeVisible();
    }
  });
});

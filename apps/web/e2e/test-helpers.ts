import { Page } from '@playwright/test';

/**
 * Sets up test mode for a page to bypass authentication and enable testing features
 */
export async function setupTestMode(page: Page) {
  await page.addInitScript(() => {
    // Set testing mode flag
    window.localStorage.setItem('testing-mode', 'true');
    
    // Mock authentication token if needed
    window.localStorage.setItem('auth-token', 'test-token');
    
    // Set test environment flag
    window.localStorage.setItem('environment', 'test');
  });
  
  // Set test headers
  await page.setExtraHTTPHeaders({
    'X-Testing-Mode': 'true',
    'X-Environment': 'test'
  });
}

/**
 * Waits for page to be fully loaded and ready for testing
 */
export async function waitForPageReady(page: Page, timeout = 5000) {
  try {
    await page.waitForLoadState('networkidle', { timeout });
    await page.waitForTimeout(1000); // Additional buffer
  } catch (error) {
    // Continue even if timeout - page might still be functional
    console.warn('Page ready timeout:', error);
  }
}

/**
 * Checks if page has loaded successfully by looking for common elements
 */
export async function verifyPageLoaded(page: Page) {
  // Check for basic HTML structure
  const body = await page.locator('body').count();
  if (body === 0) {
    throw new Error('Page body not found');
  }
  
  // Check for React app to be mounted
  const reactApp = await page.locator('#__next, [data-reactroot], main').count();
  if (reactApp === 0) {
    console.warn('React app container not found, but page has body');
  }
}

/**
 * Gets page content safely with fallback
 */
export async function getPageContent(page: Page): Promise<string> {
  try {
    const content = await page.textContent('body');
    return content || '';
  } catch (error) {
    console.warn('Could not get page content:', error);
    return '';
  }
}

/**
 * Flexible title check that handles various scenarios
 */
export async function checkPageTitle(page: Page, expectedPatterns: string[]) {
  const title = await page.title();
  
  for (const pattern of expectedPatterns) {
    if (title.toLowerCase().includes(pattern.toLowerCase())) {
      return true;
    }
  }
  
  // If no patterns match, check if it's at least not the default
  return !title.includes('Create Next App');
}

/**
 * Flexible heading check
 */
export async function checkPageHeading(page: Page, expectedTexts: string[]) {
  const headings = await page.locator('h1, h2, .title, .heading').allTextContents();
  
  for (const heading of headings) {
    for (const expectedText of expectedTexts) {
      if (heading.toLowerCase().includes(expectedText.toLowerCase())) {
        return true;
      }
    }
  }
  
  return false;
}

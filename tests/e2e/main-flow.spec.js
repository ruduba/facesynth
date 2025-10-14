const { test, expect } = require('@playwright/test');

test.describe('FaceSynth.exe Main Flow', () => {
  test('should complete signup, editor, and export flow', async ({ page }) => {
    // Navigate to signup page
    await page.goto('http://localhost:3000/auth/signup');
    
    // Fill signup form
    const timestamp = Date.now();
    await page.fill('#name', 'Test User');
    await page.fill('#email', `test${timestamp}@example.com`);
    await page.fill('#password', 'testpassword123');
    await page.fill('#confirmPassword', 'testpassword123');
    
    // Submit signup
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await page.waitForURL('http://localhost:3000/');
    await expect(page.locator('.app-title')).toContainText('FaceSynth.exe');
    
    // Handle tutorial modal if present
    const tutorialModal = page.locator('.tutorial-modal');
    if (await tutorialModal.isVisible()) {
      await page.click('button:has-text("Skip Tutorial")');
    }
    
    // Click "Create New Mesh"
    await page.click('.card-create');
    
    // Should navigate to editor
    await page.waitForURL(/\/editor\//);
    
    // Wait for editor to load
    await page.waitForSelector('.editor-container', { timeout: 10000 });
    
    // Simulate slider change (jaw width)
    const jawSlider = page.locator('input[name="jawWidth"]');
    if (await jawSlider.isVisible()) {
      await jawSlider.fill('1.3');
    }
    
    // Wait a moment for mesh to update
    await page.waitForTimeout(1000);
    
    // Click export button
    const exportButton = page.locator('button:has-text("Export")');
    if (await exportButton.isVisible()) {
      // Setup download listener
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      
      // Select STL format if prompted
      const stlOption = page.locator('button:has-text("STL")');
      if (await stlOption.isVisible()) {
        await stlOption.click();
      }
      
      // Verify download started
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.stl$/);
    }
    
    // Test save functionality
    const saveButton = page.locator('button:has-text("Save")');
    if (await saveButton.isVisible()) {
      await saveButton.click();
      
      // Fill save dialog if present
      const nameInput = page.locator('input[placeholder*="name" i]');
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test Mesh');
        await page.click('button:has-text("Save")');
      }
      
      // Wait for success message
      await page.waitForSelector('.success-message, .toast-success', { timeout: 5000 });
    }
  });

  test('should login and view library', async ({ page }) => {
    // This test assumes a user already exists
    await page.goto('http://localhost:3000/auth/login');
    
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'testpassword123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await page.waitForURL('http://localhost:3000/');
    
    // Navigate to library
    await page.click('.card-library');
    await page.waitForURL('http://localhost:3000/library');
    
    // Should show library content
    await expect(page.locator('h1')).toContainText(/Library|My Meshes/i);
  });

  test('should view presets', async ({ page }) => {
    // Login first (assuming test user exists)
    await page.goto('http://localhost:3000/auth/login');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/');
    
    // Navigate to presets
    await page.click('.card-presets');
    await page.waitForURL('http://localhost:3000/presets');
    
    // Should show presets
    await expect(page.locator('h1')).toContainText(/Presets/i);
    
    // Should have preset cards
    const presetCards = page.locator('.preset-card');
    await expect(presetCards.first()).toBeVisible();
  });
});
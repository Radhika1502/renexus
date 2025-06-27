import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Verify login was successful
    await expect(page).toHaveURL('/dashboard');
  });

  test('Dashboard should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/dashboard');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Projects page should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/projects');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Task details page should not have any automatically detectable accessibility issues', async ({ page }) => {
    // Navigate to a task detail page
    await page.goto('/projects');
    await page.click('a.project-card:first-child');
    await page.click('a.task-item:first-child');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Forms should be keyboard navigable', async ({ page }) => {
    // Navigate to create project form
    await page.goto('/projects/new');
    
    // Tab to the title field
    await page.keyboard.press('Tab');
    
    // Verify focus is on title field
    const focusedElement = await page.evaluate(() => document.activeElement.getAttribute('name'));
    expect(focusedElement).toBe('title');
    
    // Fill in title using keyboard
    await page.keyboard.type('Keyboard Navigation Test');
    
    // Tab to description field
    await page.keyboard.press('Tab');
    
    // Verify focus is on description field
    const focusedTextarea = await page.evaluate(() => document.activeElement.getAttribute('name'));
    expect(focusedTextarea).toBe('description');
    
    // Fill in description
    await page.keyboard.type('Testing keyboard navigation');
    
    // Tab to submit button
    await page.keyboard.press('Tab');
    
    // Verify focus is on submit button
    const focusedButton = await page.evaluate(() => document.activeElement.textContent);
    expect(focusedButton).toContain('Create');
    
    // Press Enter to submit
    await page.keyboard.press('Enter');
    
    // Verify project was created
    await expect(page.locator('h1:has-text("Keyboard Navigation Test")')).toBeVisible();
  });

  test('Color contrast meets WCAG AA standards', async ({ page }) => {
    await page.goto('/dashboard');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .options({
        rules: {
          'color-contrast': { enabled: true }
        }
      })
      .analyze();
    
    const contrastIssues = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );
    
    expect(contrastIssues).toEqual([]);
  });

  test('Screen reader announcements work correctly', async ({ page }) => {
    await page.goto('/projects');
    
    // Check for proper aria-labels
    const newProjectButton = await page.locator('button[aria-label="Create new project"]');
    expect(await newProjectButton.getAttribute('aria-label')).toBe('Create new project');
    
    // Check for proper heading structure
    const headingLevel1Count = await page.locator('h1').count();
    expect(headingLevel1Count).toBe(1); // Should only be one h1 per page
    
    // Check for proper form labels
    await newProjectButton.click();
    const titleLabel = await page.locator('label[for="title"]');
    expect(await titleLabel.isVisible()).toBeTruthy();
  });
});

import { test, expect, Page, Browser, chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { AxeResults } from 'axe-core';

test.describe('Accessibility Tests', () => {
  let page: Page;
  let browser: Browser;

  test.beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page?.close();
    await browser?.close();
  });

  test('should pass accessibility checks on login page', async ({ page }) => {
    await page.goto('/login');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass accessibility checks on registration page', async ({ page }) => {
    await page.goto('/register');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass accessibility checks on dashboard', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass accessibility checks on project list', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');

    // Navigate to projects
    await page.click('[data-testid="projects-link"]');
    await page.waitForURL('/projects');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass accessibility checks on task list', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');

    // Navigate to tasks
    await page.click('[data-testid="tasks-link"]');
    await page.waitForURL('/tasks');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass accessibility checks on profile page', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');

    // Navigate to profile
    await page.click('[data-testid="profile-link"]');
    await page.waitForURL('/profile');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Dashboard should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/dashboard');
    
    const results: AxeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(results.violations).toEqual([]);
  });

  test('Projects page should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/projects');
    
    const results: AxeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(results.violations).toEqual([]);
  });

  test('Task details page should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/projects');
    await page.click('[data-testid="project-card"]:first-child');
    await page.click('[data-testid="task-item"]:first-child');
    
    const results: AxeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(results.violations).toEqual([]);
  });

  test('Forms should be keyboard navigable', async ({ page }) => {
    await page.goto('/projects/new');
    
    // Tab to the title field
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => {
      const element = document.activeElement;
      return element ? element.getAttribute('data-testid') : null;
    });
    expect(focusedElement).toBe('title-input');
    
    // Fill in title using keyboard
    await page.keyboard.type('Keyboard Navigation Test');
    
    // Tab to description field
    await page.keyboard.press('Tab');
    
    const focusedTextarea = await page.evaluate(() => {
      const element = document.activeElement;
      return element ? element.getAttribute('data-testid') : null;
    });
    expect(focusedTextarea).toBe('description-input');
    
    // Fill in description
    await page.keyboard.type('Testing keyboard navigation');
    
    // Tab to submit button
    await page.keyboard.press('Tab');
    
    const focusedButton = await page.evaluate(() => {
      const element = document.activeElement;
      return element ? element.textContent : null;
    });
    expect(focusedButton).toContain('Create');
  });

  test('Color contrast meets WCAG AA standards', async ({ page }) => {
    await page.goto('/dashboard');
    
    const results: AxeResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .options({
        rules: {
          'color-contrast': { enabled: true }
        }
      })
      .analyze();
    
    const contrastIssues = results.violations.filter(
      violation => violation.id === 'color-contrast'
    );
    
    expect(contrastIssues).toEqual([]);
  });

  test('Screen reader announcements work correctly', async ({ page }) => {
    await page.goto('/projects');
    
    // Check for proper aria-labels
    const newProjectButton = page.locator('[data-testid="new-project-button"]');
    const ariaLabel = await newProjectButton.getAttribute('aria-label');
    expect(ariaLabel).toBe('Create new project');
    
    // Check for proper heading structure
    const headingLevel1Count = await page.locator('h1').count();
    expect(headingLevel1Count).toBe(1);
    
    // Check for proper form labels
    await newProjectButton.click();
    const titleLabel = page.locator('label[for="title"]');
    await expect(titleLabel).toBeVisible();
  });

  test('ARIA labels are present and correct', async ({ page }) => {
    await page.goto('/');

    // Check navigation menu
    const navMenu = page.locator('nav');
    await expect(navMenu).toHaveAttribute('aria-label', 'Main navigation');

    // Check search input
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toHaveAttribute('aria-label', 'Search tasks and projects');

    // Check task list
    const taskList = page.locator('ul[role="list"]');
    await expect(taskList).toHaveAttribute('aria-label', 'Task list');
  });

  test('Images have meaningful alt text', async ({ page }) => {
    await page.goto('/');

    const images = await page.$$('img');
    for (const image of images) {
      const altText = await image.getAttribute('alt');
      expect(altText).toBeTruthy();
      expect(altText).not.toBe('image'); // Ensure alt text is descriptive
    }
  });

  test('Form fields have proper labels and ARIA attributes', async ({ page }) => {
    await page.goto('/tasks/new');

    const formFields = await page.$$('[data-testid^="form-field-"]');
    for (const field of formFields) {
      const id = await field.getAttribute('id');
      const label = await page.$(`label[for="${id}"]`);
      expect(label).toBeTruthy();

      const ariaLabel = await field.getAttribute('aria-label');
      const ariaLabelledBy = await field.getAttribute('aria-labelledby');
      expect(ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  });
});

// Helper function to calculate contrast ratio
function calculateContrastRatio(color1: string, color2: string): number {
  // Convert colors to relative luminance
  const l1 = getRelativeLuminance(color1);
  const l2 = getRelativeLuminance(color2);

  // Calculate contrast ratio
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getRelativeLuminance(color: string): number {
  // Convert color to RGB values
  const rgb = color.match(/\d+/g)?.map(Number) ?? [0, 0, 0];
  const [r, g, b] = rgb.map((val: number) => {
    val = val / 255;
    return val <= 0.03928
      ? val / 12.92
      : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  // Calculate relative luminance
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

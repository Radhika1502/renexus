import { test, expect } from '@playwright/test';

test.describe('Project Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Verify login was successful
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create a new project', async ({ page }) => {
    // Navigate to projects page
    await page.click('a[href="/projects"]');
    
    // Click on create new project button
    await page.click('button:has-text("New Project")');
    
    // Fill in project details
    await page.fill('input[name="title"]', 'E2E Test Project');
    await page.fill('textarea[name="description"]', 'This is a test project created by E2E tests');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify project was created
    await expect(page.locator('h1:has-text("E2E Test Project")')).toBeVisible();
    await expect(page.locator('div:has-text("This is a test project created by E2E tests")')).toBeVisible();
  });

  test('should edit an existing project', async ({ page }) => {
    // Navigate to projects page
    await page.click('a[href="/projects"]');
    
    // Click on the test project
    await page.click('a:has-text("E2E Test Project")');
    
    // Click edit button
    await page.click('button:has-text("Edit")');
    
    // Update project details
    await page.fill('input[name="title"]', 'Updated E2E Test Project');
    await page.fill('textarea[name="description"]', 'This project has been updated');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify project was updated
    await expect(page.locator('h1:has-text("Updated E2E Test Project")')).toBeVisible();
    await expect(page.locator('div:has-text("This project has been updated")')).toBeVisible();
  });

  test('should create a task in a project', async ({ page }) => {
    // Navigate to projects page
    await page.click('a[href="/projects"]');
    
    // Click on the test project
    await page.click('a:has-text("Updated E2E Test Project")');
    
    // Click on create task button
    await page.click('button:has-text("Add Task")');
    
    // Fill in task details
    await page.fill('input[name="title"]', 'E2E Test Task');
    await page.fill('textarea[name="description"]', 'This is a test task');
    await page.selectOption('select[name="status"]', 'TODO');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Verify task was created
    await expect(page.locator('div:has-text("E2E Test Task")')).toBeVisible();
  });

  test('should update task status', async ({ page }) => {
    // Navigate to projects page
    await page.click('a[href="/projects"]');
    
    // Click on the test project
    await page.click('a:has-text("Updated E2E Test Project")');
    
    // Find the test task and click on it
    await page.click('div:has-text("E2E Test Task")');
    
    // Change status
    await page.selectOption('select[name="status"]', 'IN_PROGRESS');
    
    // Save changes
    await page.click('button:has-text("Save")');
    
    // Verify status was updated
    await expect(page.locator('div:has-text("IN_PROGRESS")')).toBeVisible();
  });

  test('should delete a task', async ({ page }) => {
    // Navigate to projects page
    await page.click('a[href="/projects"]');
    
    // Click on the test project
    await page.click('a:has-text("Updated E2E Test Project")');
    
    // Find the test task and click on it
    await page.click('div:has-text("E2E Test Task")');
    
    // Click delete button
    await page.click('button:has-text("Delete")');
    
    // Confirm deletion
    await page.click('button:has-text("Confirm")');
    
    // Verify task was deleted
    await expect(page.locator('div:has-text("E2E Test Task")')).not.toBeVisible();
  });

  test('should delete a project', async ({ page }) => {
    // Navigate to projects page
    await page.click('a[href="/projects"]');
    
    // Click on the test project
    await page.click('a:has-text("Updated E2E Test Project")');
    
    // Click settings button
    await page.click('button:has-text("Settings")');
    
    // Click delete project button
    await page.click('button:has-text("Delete Project")');
    
    // Confirm deletion
    await page.fill('input[placeholder="Type project name to confirm"]', 'Updated E2E Test Project');
    await page.click('button:has-text("Permanently Delete")');
    
    // Verify project was deleted
    await expect(page.locator('a:has-text("Updated E2E Test Project")')).not.toBeVisible();
  });
});

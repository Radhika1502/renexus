/**
 * E2E Tests for Authentication Flow
 * Phase 5.1.3 - End-to-End Testing (User Journey Tests)
 */

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Reset state before each test
    cy.visit('/login');
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('should display login page', () => {
    cy.get('h1').should('contain', 'Sign In');
    cy.get('[data-testid="email-input"]').should('exist');
    cy.get('[data-testid="password-input"]').should('exist');
    cy.get('[data-testid="login-button"]').should('exist');
    cy.get('[data-testid="register-link"]').should('exist');
  });

  it('should display validation errors for invalid inputs', () => {
    // Empty form submission
    cy.get('[data-testid="login-button"]').click();
    cy.get('[data-testid="email-error"]').should('be.visible');
    cy.get('[data-testid="password-error"]').should('be.visible');
    
    // Invalid email
    cy.get('[data-testid="email-input"]').type('not-an-email');
    cy.get('[data-testid="login-button"]').click();
    cy.get('[data-testid="email-error"]').should('be.visible');
    
    // Too short password
    cy.get('[data-testid="email-input"]').clear().type('valid@renexus.com');
    cy.get('[data-testid="password-input"]').type('123');
    cy.get('[data-testid="login-button"]').click();
    cy.get('[data-testid="password-error"]').should('be.visible');
  });

  it('should show error message for incorrect login', () => {
    cy.get('[data-testid="email-input"]').type('wrong@renexus.com');
    cy.get('[data-testid="password-input"]').type('WrongPassword123!');
    cy.get('[data-testid="login-button"]').click();
    
    // Check for error message
    cy.get('[data-testid="login-error"]').should('be.visible')
      .and('contain', 'Invalid email or password');
    
    // Verify we're still on the login page
    cy.url().should('include', '/login');
  });

  it('should successfully login with valid credentials', () => {
    cy.get('[data-testid="email-input"]').type(Cypress.env('userEmail'));
    cy.get('[data-testid="password-input"]').type(Cypress.env('userPassword'));
    cy.get('[data-testid="login-button"]').click();
    
    // Verify successful login
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-greeting"]').should('contain', 'Welcome');
    cy.getCookie('authToken').should('exist');
  });

  it('should navigate to registration page', () => {
    cy.get('[data-testid="register-link"]').click();
    cy.url().should('include', '/register');
    cy.get('h1').should('contain', 'Create Account');
  });

  it('should redirect to requested page after login', () => {
    // Attempt to access protected page
    cy.visit('/projects');
    
    // Should be redirected to login
    cy.url().should('include', '/login');
    
    // Login
    cy.get('[data-testid="email-input"]').type(Cypress.env('userEmail'));
    cy.get('[data-testid="password-input"]').type(Cypress.env('userPassword'));
    cy.get('[data-testid="login-button"]').click();
    
    // Should be redirected to the originally requested page
    cy.url().should('include', '/projects');
  });

  it('should allow logout', () => {
    // Login first
    cy.get('[data-testid="email-input"]').type(Cypress.env('userEmail'));
    cy.get('[data-testid="password-input"]').type(Cypress.env('userPassword'));
    cy.get('[data-testid="login-button"]').click();
    
    // Verify login successful
    cy.url().should('include', '/dashboard');
    
    // Logout
    cy.get('[data-testid="user-menu"]').click();
    cy.get('[data-testid="logout-button"]').click();
    
    // Verify logout successful
    cy.url().should('include', '/login');
    cy.getCookie('authToken').should('not.exist');
  });
});

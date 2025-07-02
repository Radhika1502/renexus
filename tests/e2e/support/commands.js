/**
 * Custom Cypress commands for E2E tests
 * Phase 5.1.3 - End-to-End Testing
 */

// Login command
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    
    // Wait for login to complete and verify we're logged in
    cy.url().should('include', '/dashboard');
    cy.getCookie('authToken').should('exist');
  }, {
    cacheAcrossSpecs: true,
  });
});

// Admin login command
Cypress.Commands.add('loginAsAdmin', () => {
  cy.login(Cypress.env('adminEmail'), Cypress.env('adminPassword'));
});

// Regular user login command
Cypress.Commands.add('loginAsUser', () => {
  cy.login(Cypress.env('userEmail'), Cypress.env('userPassword'));
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/login');
  cy.getCookie('authToken').should('not.exist');
});

// Create project command
Cypress.Commands.add('createProject', (projectName, description) => {
  cy.visit('/projects');
  cy.get('[data-testid="create-project-button"]').click();
  cy.get('[data-testid="project-name-input"]').type(projectName);
  cy.get('[data-testid="project-description-input"]').type(description);
  cy.get('[data-testid="submit-project-button"]').click();
  
  // Verify project was created
  cy.contains(projectName).should('be.visible');
  
  // Get the project ID
  return cy.url().then((url) => {
    // Extract project ID from URL
    const projectId = url.split('/').pop();
    return projectId;
  });
});

// Create task command
Cypress.Commands.add('createTask', (projectId, taskName, description, priority = 'Medium') => {
  cy.visit(`/projects/${projectId}`);
  cy.get('[data-testid="create-task-button"]').click();
  cy.get('[data-testid="task-name-input"]').type(taskName);
  cy.get('[data-testid="task-description-input"]').type(description);
  cy.get('[data-testid="task-priority-select"]').select(priority);
  cy.get('[data-testid="submit-task-button"]').click();
  
  // Verify task was created
  cy.contains(taskName).should('be.visible');
  
  // Get the task ID
  return cy.url().then((url) => {
    // Extract task ID from URL
    const taskId = url.split('/').pop();
    return taskId;
  });
});

// API commands for faster test setup
Cypress.Commands.add('apiLogin', (email, password) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: { email, password },
  }).then((response) => {
    expect(response.status).to.eq(200);
    window.localStorage.setItem('authToken', response.body.tokens.accessToken);
    window.localStorage.setItem('refreshToken', response.body.tokens.refreshToken);
    return response.body;
  });
});

Cypress.Commands.add('apiCreateProject', (projectData) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/projects`,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
    body: projectData,
  }).then((response) => {
    expect(response.status).to.eq(201);
    return response.body;
  });
});

// Visual test commands
Cypress.Commands.add('compareSnapshot', (name, options = {}) => {
  cy.screenshot(name, options);
  // In a real implementation, this would compare with baseline images
  cy.log(`Visual comparison for ${name} would happen here`);
});

// Accessibility testing command
Cypress.Commands.add('checkA11y', (context, options) => {
  cy.injectAxe();
  cy.checkA11y(context, options);
});

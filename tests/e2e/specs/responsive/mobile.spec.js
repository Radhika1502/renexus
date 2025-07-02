/**
 * E2E Tests for Mobile Responsiveness
 * Phase 5.1.3 - End-to-End Testing (Mobile Responsiveness Tests)
 */

describe('Mobile Responsiveness', () => {
  // Define viewport sizes to test
  const viewports = {
    mobile: { width: 375, height: 667 }, // iPhone 8
    tablet: { width: 768, height: 1024 }, // iPad
    desktop: { width: 1280, height: 800 } // Standard desktop
  };
  
  const pages = [
    { path: '/', name: 'Home' },
    { path: '/login', name: 'Login' },
    { path: '/register', name: 'Register' },
    { path: '/dashboard', name: 'Dashboard', requiresAuth: true },
    { path: '/projects', name: 'Projects', requiresAuth: true },
    { path: '/tasks', name: 'Tasks', requiresAuth: true },
    { path: '/profile', name: 'Profile', requiresAuth: true },
  ];

  // Test each page on each viewport
  Object.entries(viewports).forEach(([device, viewport]) => {
    describe(`Testing on ${device} (${viewport.width}x${viewport.height})`, () => {
      beforeEach(() => {
        cy.viewport(viewport.width, viewport.height);
      });
      
      pages.forEach(page => {
        it(`should display ${page.name} page correctly on ${device}`, () => {
          // Log in first if needed
          if (page.requiresAuth) {
            cy.apiLogin(Cypress.env('userEmail'), Cypress.env('userPassword'));
          }
          
          // Visit the page
          cy.visit(page.path);
          
          // Check that the page loaded correctly
          cy.get('main').should('be.visible');
          
          // On mobile, check if mobile menu is present and functional
          if (device === 'mobile') {
            // Menu should be collapsed initially on mobile
            cy.get('[data-testid="nav-items"]').should('not.be.visible');
            
            // Mobile menu toggle should be visible
            cy.get('[data-testid="mobile-menu-toggle"]').should('be.visible');
            
            // Open the mobile menu
            cy.get('[data-testid="mobile-menu-toggle"]').click();
            
            // Nav items should now be visible
            cy.get('[data-testid="nav-items"]').should('be.visible');
            
            // Close the menu
            cy.get('[data-testid="mobile-menu-toggle"]').click();
            
            // Menu should be hidden again
            cy.get('[data-testid="nav-items"]').should('not.be.visible');
          }
          
          // On tablet and desktop, main menu should be visible by default
          if (device !== 'mobile') {
            cy.get('[data-testid="nav-items"]').should('be.visible');
            cy.get('[data-testid="mobile-menu-toggle"]').should('not.exist');
          }
          
          // Take screenshot for visual comparison
          cy.screenshot(`${page.name.toLowerCase()}-${device}`);
          
          // Check for overflow issues (content spilling outside viewport)
          cy.window().then((win) => {
            expect(win.innerWidth).to.equal(viewport.width);
            const body = win.document.body;
            const html = win.document.documentElement;
            
            // Check if body width exceeds viewport
            const scrollWidth = Math.max(body.scrollWidth, html.scrollWidth);
            expect(scrollWidth).to.be.at.most(viewport.width + 5); // Allow small margin of error
            
            // For mobile, check that text is properly sized
            if (device === 'mobile') {
              cy.get('p, h1, h2, h3, button').each(($el) => {
                const fontSize = parseInt(win.getComputedStyle($el[0]).fontSize);
                expect(fontSize).to.be.at.least(12); // Minimum readable font size
                expect(fontSize).to.be.at.most(32); // Maximum font size for mobile
              });
            }
          });
        });
      });
      
      // Test form elements on different viewports
      it(`should properly render form elements on ${device}`, () => {
        cy.visit('/login');
        
        // Form should be visible and properly sized
        cy.get('form').should('be.visible');
        cy.get('[data-testid="email-input"]').should('be.visible');
        cy.get('[data-testid="password-input"]').should('be.visible');
        cy.get('[data-testid="login-button"]').should('be.visible');
        
        // On mobile, form inputs should be full width
        if (device === 'mobile') {
          cy.get('[data-testid="email-input"]').invoke('outerWidth').then((width) => {
            cy.get('form').invoke('width').then((formWidth) => {
              expect(width).to.be.at.least(formWidth * 0.9); // Input should be at least 90% of form width
            });
          });
        }
        
        // Check form usability
        cy.get('[data-testid="email-input"]').type('test@example.com');
        cy.get('[data-testid="password-input"]').type('password123');
        cy.get('[data-testid="login-button"]').should('not.be.disabled');
      });
    });
  });

  // Test touch interactions specifically
  describe('Touch interactions on mobile', () => {
    beforeEach(() => {
      cy.viewport(viewports.mobile.width, viewports.mobile.height);
      cy.apiLogin(Cypress.env('userEmail'), Cypress.env('userPassword'));
    });
    
    it('should support touch gestures for common actions', () => {
      // Visit projects page
      cy.visit('/projects');
      
      // Test swipe to reveal actions on a project card
      cy.get('[data-testid="project-card"]').first()
        .trigger('touchstart', { touches: [{ clientX: 300, clientY: 100 }] })
        .trigger('touchmove', { touches: [{ clientX: 150, clientY: 100 }] })
        .trigger('touchend');
      
      // Action buttons should be visible after swipe
      cy.get('[data-testid="project-actions"]').should('be.visible');
      
      // Test tap to open project
      cy.get('[data-testid="project-card"]').first().click();
      cy.url().should('include', '/projects/');
      
      // Go back to projects
      cy.go('back');
      
      // Verify pull-to-refresh functionality (mock implementation)
      cy.get('body')
        .trigger('touchstart', { touches: [{ clientX: 200, clientY: 100 }] })
        .trigger('touchmove', { touches: [{ clientX: 200, clientY: 250 }] })
        .trigger('touchend');
      
      // Should show refresh indicator (this would depend on your implementation)
      cy.get('[data-testid="refresh-indicator"]').should('exist');
    });
  });
});

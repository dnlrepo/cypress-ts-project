import { selectors } from 'cypress/fixtures/selectors';

describe('When navigating to the homepage', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.intercept('POST', '/web/index.php/auth/validate').as(
      'loginValidationRequest'
    );
  });

  describe('when entering valid login credentials', () => {
    beforeEach(() => {
      cy.clearAndType(selectors.usernameInput, 'Admin');
      cy.clearAndType(selectors.passwordInput, 'admin123');
      cy.get(selectors.submitButton).click();
    });

    it('should redirect to dashboard on successful login and load main components', () => {
      cy.wait('@loginValidationRequest').then((interception) => {
        // Check if the Location header is present
        const locationHeader = interception.response.headers['location'];
        expect(locationHeader).to.include('/web/index.php/dashboard');
      });

      // Verify dashboard components are showing
      cy.get(selectors.breadcrumbModule).should('contain', 'Dashboard');
      cy.get(selectors.dashboardWidget).should('be.visible');

      cy.url().should('include', '/web/index.php/dashboard');
    });
  });

  describe('when entering invalid login credentials', () => {
    beforeEach(() => {
      cy.clearAndType(selectors.usernameInput, 'InvalidUser');
      cy.clearAndType(selectors.passwordInput, 'wrongPassword');
      cy.get(selectors.submitButton).click();
    });

    it('should redirect the user back to the login page and show error message', () => {
      cy.wait('@loginValidationRequest').then((interception) => {
        // Check if the Location header sends the user back to the login page
        const locationHeader = interception.response.headers['location'];
        expect(locationHeader).to.include('/web/index.php/auth/login');
      });

      cy.get(selectors.alertContentText).should(
        'contain',
        'Invalid credentials'
      );
    });
  });
});

describe('When mocking login HTML response with a different error string', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.fixture('login-error.html').then((mockHtml) => {
      cy.intercept('GET', '/web/index.php/auth/login', {
        body: mockHtml, // Use the fixture content as the response body
      }).as('loginRequest');
    });

    cy.clearAndType(selectors.usernameInput, 'InvalidUser');
    cy.clearAndType(selectors.passwordInput, 'InvalidPassword');
    cy.get(selectors.submitButton).click();

    cy.wait('@loginRequest');
  });

  it('should display "API error handling response" in the UI instead of the original response', () => {
    // Verify that the custom error message is displayed in the UI
    cy.get(selectors.alertContentText).should(
      'contain',
      'API error handling response'
    );
  });
});

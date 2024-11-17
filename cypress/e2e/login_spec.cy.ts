describe('When navigating to the homepage', () => {
  beforeEach(() => {
    cy.visit('/'); // Navigate to the login page
    cy.intercept('POST', '/web/index.php/auth/validate').as(
      'loginValidationRequest'
    ); // Intercept the login API request
  });
  describe('when entering valid login credentials', () => {
    beforeEach(() => {
      // Enter valid credentials
      cy.get('input[name="username"]').type('Admin');
      cy.get('input[name="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
    });
    it('should redirect to dashboard on successful login and load main componenets', () => {
      // Wait for the login API response
      cy.wait('@loginValidationRequest').then((interception) => {
        // Check if the Location header is present
        const locationHeader = interception.response.headers['location'];
        expect(locationHeader).to.include('/web/index.php/dashboard');
      });

      //Verify dashboard components are showing
      cy.get('header h6.oxd-topbar-header-breadcrumb-module').should(
        'contain',
        'Dashboard'
      );
      cy.get('.orangehrm-dashboard-widget').should('be.visible');

      // Verify redirection to the dashboard
      cy.url().should('include', '/web/index.php/dashboard');
    });
  });

  describe('when entering invalid login credentials', () => {
    beforeEach(() => {
      // Enter valid credentials
      cy.get('input[name="username"]').type('InvalidUser');
      cy.get('input[name="password"]').type('wrongPassword');
      cy.get('button[type="submit"]').click();
    });

    it('should redirect to the user back to the login page and show error message', () => {
      cy.wait('@loginValidationRequest').then((interception) => {
        // Check if the Location header is absent
        const locationHeader = interception.response.headers['location'];
        expect(locationHeader).to.include('/web/index.php/auth/login');
      });

      // Verify that an error message is displayed
      cy.get('.oxd-alert-content-text').should(
        'contain',
        'Invalid credentials'
      );
    });
  });
});

describe('When mocking login HTML response with a different error string', () => {
  beforeEach(() => {
    cy.visit('/'); // Navigate to the login page
    cy.fixture('login-error.html').then((mockHtml) => {
      cy.intercept('GET', '/web/index.php/auth/login', {
        body: mockHtml, // Use the fixture content as the response body
      }).as('loginRequest');
    });

    cy.get('input[name="username"]').type('InvalidUser');
    cy.get('input[name="password"]').type('InvalidPassword');
    cy.get('button[type="submit"]').click();

    // Wait for the mocked API response
    cy.wait('@loginRequest');
  });

  it('should display "API error handling response" in the UI instead of the original response', () => {
    // Verify that the custom error message is displayed in the UI
    cy.get('.oxd-alert-content-text').should(
      'contain',
      'API error handling response'
    );
  });
});

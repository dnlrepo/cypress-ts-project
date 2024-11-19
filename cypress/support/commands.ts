/// <reference types="cypress" />
import { inputData } from 'cypress/fixtures/input_data';
import { selectors } from 'cypress/fixtures/selectors';
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

/**
 * Finds an input element by its associated label.
 * @param label - The label text to search for.
 * @returns The input element associated with the label.
 */
Cypress.Commands.add(
  'findInputByLabel',
  (label: string): Cypress.Chainable<JQuery<HTMLInputElement>> => {
    return cy
      .contains('label', label)
      .parents('.oxd-input-group') // Traverse to the closest parent group
      .find('input'); // Locate the input within the field
  }
);

Cypress.Commands.add(
  'findSelectByLabel',
  (label: string): Cypress.Chainable<JQuery> => {
    return cy
      .contains('label', label) // Locate the label
      .parents('.oxd-input-group') // Traverse to the closest parent group
      .find('div[tabindex="0"]'); // Locate the dropdown
  }
);

Cypress.Commands.add(
  'findSelectByLabelAndChoose',
  (label: string, value: string): Cypress.Chainable<JQuery> => {
    return cy
      .contains('label', label) // Locate the label
      .parents('.oxd-input-group') // Traverse to the closest parent group
      .find('div[tabindex="0"]') // Locate the dropdown
      .click() // Open the dropdown
      .get('.oxd-select-dropdown') // Access the dropdown options
      .contains(value) // Locate the desired value
      .click(); // Select the value
  }
);

Cypress.Commands.add('findFirstPostByName', () => {
  // Intercept the Buzz feed API request
  cy.intercept(
    'GET',
    '/web/index.php/api/v2/buzz/feed?limit=10&offset=0&sortOrder=DESC&sortField=share.createdAtUtc'
  ).as('getFeed');

  // Wait for the feed API response and extract the first post
  return cy.wait('@getFeed').then((interception) => {
    const firstPost = interception.response?.body.data[0];
    expect(firstPost).to.exist;

    // Construct the full name of the employee
    const { firstName, middleName, lastName } = firstPost.employee;
    const fullName = middleName
      ? `${firstName} ${middleName} ${lastName}`
      : `${firstName} ${lastName}`;

    // Return the Cypress chainable for the located element
    return cy
      .contains('.orangehrm-buzz-post-header-text .oxd-text--p', fullName)
      .should('be.visible');
  });
});

Cypress.Commands.add('clearAndType', (selector: string, value?: string) => {
  cy.get(selector)
    .clear()
    .then(($input) => {
      if (value && value.trim() !== '') {
        cy.wrap($input).type(value);
      }
    });
});

Cypress.Commands.add('login', () => {
  // Intercept the personal details API request with a wildcard
  cy.intercept('POST', '/web/index.php/auth/validate').as(
    'loginValidationRequest'
  );

  // Fill in login credentials
  cy.clearAndType(selectors.usernameInput, inputData.validUsername);
  cy.clearAndType(selectors.passwordInput, inputData.validPassword);
  // Submit the login form
  cy.get(selectors.submitButton).click();

  // Wait for login validation
  cy.wait('@loginValidationRequest');
});

Cypress.Commands.add(
  'assertToastMessage',
  (type: 'error' | 'success', title: string, message: string) => {
    const toastSelector =
      type === 'error' ? selectors.toastError : selectors.toastSuccess;
    cy.get(toastSelector)
      .should('be.visible')
      .within(() => {
        cy.get(selectors.toastTitle).should('contain', title);
        cy.get(selectors.toastMessage).should('contain', message);
      });
  }
);

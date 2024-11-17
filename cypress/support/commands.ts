/// <reference types="cypress" />
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

import { selectors } from 'cypress/fixtures/selectors';
import { inputData } from 'cypress/fixtures/input_data';

// Utility Functions
// Added Utility functions here instead of cy.commands for non complex logic functions that are reused only in this spec
const assertToastMessage = (
  type: 'error' | 'success',
  title: string,
  message: string
) => {
  const toastSelector =
    type === 'error' ? selectors.toastError : selectors.toastSuccess;
  cy.get(toastSelector)
    .should('be.visible')
    .within(() => {
      cy.get(selectors.toastTitle).should('contain', title);
      cy.get(selectors.toastMessage).should('contain', message);
    });
};

const assertInputError = (selector: string, errorMessage: string) => {
  cy.get(selector)
    .parent()
    .siblings(selectors.inputGroupMessage)
    .should('be.visible')
    .and('contain.text', errorMessage);
};

const closeCalendar = () => {
  cy.get(selectors.calendarContainer).within(() => {
    cy.contains('Close').click();
  });
  cy.get('.oxd-date-input-calendar').within(() => {
    cy.contains('Close').click();
  });
};
const assertFieldsData = () => {
  cy.fixture('user_details.json').then((testData) => {
    testData = testData.data;
    cy.get(selectors.firstNameInput).should('have.value', testData.firstName);
    cy.get(selectors.middleNameInput).should('have.value', testData.middleName);
    cy.get(selectors.lastNameInput).should('have.value', testData.lastName);
    cy.findInputByLabel(inputData.employeeIdLabel).should(
      'have.value',
      testData.employeeId
    );
    cy.findInputByLabel(inputData.otherIdLabel).should(
      'have.value',
      testData.otherId
    );
    cy.findInputByLabel(inputData.licenseNumberLabel).should(
      'have.value',
      testData.drivingLicenseNo
    );
    // cy.findInputByLabel(inputData.licenseExpiryDateLabel).should(
    //   'have.value',
    //   testData.drivingLicenseExpiredDate
    // );
    // This assertion is disabled due to a bug - Details in the README file
    cy.findSelectByLabel(inputData.nationalityLabel)
      .invoke('text')
      .should('eq', testData.nationality.name);
    cy.findSelectByLabel(inputData.maritalStatusLabel)
      .invoke('text')
      .should('eq', testData.maritalStatus);
    cy.findInputByLabel(inputData.dateOfBirthLabel).should(
      'have.value',
      testData.birthday
    );
    cy.get(selectors.radioWrapper)
      .contains(testData.gender === 1 ? 'Male' : 'Female') // map the value "1" to the way it is presented in the UI
      .find('input[type="radio"]')
      .should('be.checked');
  });
};
const inputFieldsData = () => {
  cy.fixture('user_details.json').then((testData) => {
    testData = testData.data;
    cy.clearAndType(selectors.firstNameInput, testData.firstName);
    cy.clearAndType(selectors.middleNameInput, testData.middleName);
    cy.clearAndType(selectors.lastNameInput, testData.lastName);
    cy.findInputByLabel(inputData.employeeIdLabel)
      .clear()
      .type(testData.employeeId);
    cy.findInputByLabel(inputData.otherIdLabel).clear().type(testData.otherId);
    cy.findInputByLabel(inputData.licenseNumberLabel)
      .clear()
      .type(testData.drivingLicenseNo);
    cy.findInputByLabel(inputData.licenseExpiryDateLabel)
      .clear()
      .type(testData.drivingLicenseExpiredDate);

    closeCalendar();

    cy.findSelectByLabelAndChoose(
      inputData.nationalityLabel,
      testData.nationality.name
    );
    cy.findSelectByLabelAndChoose(
      inputData.maritalStatusLabel,
      testData.maritalStatus
    );
    cy.findInputByLabel(inputData.dateOfBirthLabel)
      .clear()
      .type(testData.birthday);
    closeCalendar();

    cy.get(selectors.radioWrapper)
      .contains(testData.gender === 1 ? 'Male' : 'Female') // map the value "1" to the way it is presented in the UI
      .parent()
      .click();
  });
};

describe('When navigating to the homepage', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.intercept('POST', '/web/index.php/auth/validate').as(
      'loginValidationRequest'
    );
  });

  describe('when entering valid login credentials', () => {
    beforeEach(() => {
      cy.login(inputData.validUsername, inputData.validPassword);
    });

    describe('when navigating to "My Info" page and filling the form', () => {
      beforeEach(() => {
        cy.intercept(
          'PUT',
          '/web/index.php/api/v2/pim/employees/*/personal-details'
        ).as('putPersonalDetails');
        cy.intercept(
          'GET',
          '/web/index.php/api/v2/pim/employees/*/personal-details'
        ).as('getPersonalDetails');
        cy.contains(inputData.myInfoTab).click();
        cy.wait('@getPersonalDetails');
        inputFieldsData();

        cy.get(selectors.submitButtonPrimary).first().click();
      });

      it('should verify success toast, validate API response, and check saved field values', () => {
        assertToastMessage('success', 'Success', 'Successfully Updated');

        cy.wait('@putPersonalDetails').then(({ response }) => {
          expect(response.statusCode).to.eq(200);
          cy.fixture('user_details.json').then((testData) => {
            const expectedData = testData.data;
            const actualData = response.body.data;
            expect(actualData).to.deep.include(expectedData);
          });
        });

        cy.reload();
        assertFieldsData();
      });
    });

    describe('when navigating to "My Info" page and attempting to submit the form with missing data', () => {
      beforeEach(() => {
        cy.intercept(
          'GET',
          '/web/index.php/api/v2/pim/employees/*/personal-details'
        ).as('getPersonalDetails');
        cy.contains(inputData.myInfoTab).click();
        cy.wait('@getPersonalDetails');

        cy.clearAndType(selectors.firstNameInput, '');
        cy.clearAndType(selectors.middleNameInput, '');
        cy.clearAndType(selectors.lastNameInput, '');
        cy.get(selectors.submitButtonPrimary).first().click();
      });

      it('should display validation errors and prevent form submission', () => {
        assertInputError(selectors.firstNameInput, 'Required');
        assertInputError(selectors.lastNameInput, 'Required');

        cy.get(selectors.toastSuccess).should('not.exist');
      });
    });

    describe('when navigating to "My Info" page with mocked data', () => {
      beforeEach(() => {
        // Intercept the GET request and use the fixture directly
        cy.fixture('user_details.json').then((mockResponse) => {
          cy.intercept(
            'GET',
            '/web/index.php/api/v2/pim/employees/*/personal-details',
            {
              statusCode: 200,
              body: mockResponse, // Use the updated fixture as the mock response
            }
          ).as('getMockedPersonalDetails');
        });

        cy.contains(inputData.myInfoTab).click();
        cy.wait('@getMockedPersonalDetails');
      });

      it('should display the mocked data correctly in the UI', () => {
        // Verify that the mocked data is displayed correctly in the UI
        assertFieldsData();
      });
    });

    describe('When Simulating No Response from Server on Personal Details Update', () => {
      beforeEach(() => {
        cy.on('uncaught:exception', (err) => {
          if (err.message.includes('Network Error')) return false;
        });

        cy.intercept(
          'GET',
          '/web/index.php/api/v2/pim/employees/*/personal-details'
        ).as('getPersonalDetails');
        cy.contains(inputData.myInfoTab).click();
        cy.wait('@getPersonalDetails').then((interception) => {
          expect(interception.response?.body.data).to.exist;
        });

        cy.intercept(
          'PUT',
          '/web/index.php/api/v2/pim/employees/*/personal-details',
          {
            forceNetworkError: true,
          }
        ).as('putPersonalDetails');

        cy.get(selectors.submitButtonPrimary).first().click();
      });

      it('should handle no response from the server gracefully', () => {
        cy.wait('@putPersonalDetails', { timeout: 10000 });

        assertToastMessage('error', 'Error', 'Unexpected Error!');
      });
    });
  });
});

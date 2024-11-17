import { selectors } from 'cypress/fixtures/selectors';

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

describe('When navigating to the homepage', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.intercept('POST', '/web/index.php/auth/validate').as(
      'loginValidationRequest'
    );
  });

  describe('when entering valid login credentials', () => {
    beforeEach(() => {
      cy.intercept(
        'GET',
        '/web/index.php/api/v2/pim/employees/7/personal-details'
      ).as('getPersonalDetails');
      cy.clearAndType(selectors.usernameInput, 'Admin');
      cy.clearAndType(selectors.passwordInput, 'admin123');
      cy.get(selectors.submitButton).click();
      cy.wait('@loginValidationRequest');
    });

    describe('when navigating to "My Info" page and filling the form', () => {
      beforeEach(() => {
        cy.intercept(
          'PUT',
          '/web/index.php/api/v2/pim/employees/7/personal-details'
        ).as('putPersonalDetails');
        cy.contains('My Info').click();
        cy.wait('@getPersonalDetails');
        cy.fixture('user_details.json').then((testData) => {
          testData = testData.data;
          cy.clearAndType(selectors.firstNameInput, testData.firstName);
          cy.clearAndType(selectors.middleNameInput, testData.middleName);
          cy.clearAndType(selectors.lastNameInput, testData.lastName);
          cy.findInputByLabel('Employee Id').clear().type(testData.employeeId);
          cy.findInputByLabel('Other Id').clear().type(testData.otherId);
          cy.findInputByLabel('License Number')
            .clear()
            .type(testData.drivingLicenseNo);
          cy.findInputByLabel('License Expiry Date')
            .clear()
            .type(testData.drivingLicenseExpiredDate);
          closeCalendar();

          cy.findSelectByLabelAndChoose(
            'Nationality',
            testData.nationality.name
          );
          cy.findSelectByLabelAndChoose(
            'Marital Status',
            testData.maritalStatus
          );
          cy.findInputByLabel('Date of Birth').clear().type(testData.birthday);
          closeCalendar();

          cy.get(selectors.radioWrapper)
            .contains(testData.gender === 1 ? 'Male' : 'Female')
            .parent()
            .click();
        });

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
        cy.fixture('user_details.json').then((testData) => {
          testData = testData.data;
          cy.get(selectors.firstNameInput).should(
            'have.value',
            testData.firstName
          );
          cy.get(selectors.middleNameInput).should(
            'have.value',
            testData.middleName
          );
          cy.get(selectors.lastNameInput).should(
            'have.value',
            testData.lastName
          );
          cy.findInputByLabel('Employee Id').should(
            'have.value',
            testData.employeeId
          );
          cy.findInputByLabel('Other Id').should(
            'have.value',
            testData.otherId
          );
          cy.findInputByLabel('License Number').should(
            'have.value',
            testData.drivingLicenseNo
          );
          cy.findInputByLabel('License Expiry Date').should(
            'have.value',
            testData.drivingLicenseExpiredDate
          );
          cy.findSelectByLabel('Nationality')
            .invoke('text')
            .should('eq', testData.nationality.name);
          cy.findSelectByLabel('Marital Status')
            .invoke('text')
            .should('eq', testData.maritalStatus);
          cy.findInputByLabel('Date of Birth').should(
            'have.value',
            testData.birthday
          );
          cy.get(selectors.radioWrapper)
            .contains(testData.gender === 1 ? 'Male' : 'Female')
            .find('input[type="radio"]')
            .should('be.checked');
        });
      });
    });

    describe('when navigating to "My Info" page and attempting to submit the form with missing data', () => {
      beforeEach(() => {
        cy.intercept(
          'GET',
          '/web/index.php/api/v2/pim/employees/7/personal-details'
        ).as('getPersonalDetails');
        cy.contains('My Info').click();
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
            '/web/index.php/api/v2/pim/employees/7/personal-details',
            {
              statusCode: 200,
              body: mockResponse, // Use the updated fixture as the mock response
            }
          ).as('getMockedPersonalDetails');
        });

        cy.contains(selectors.myInfoTab).click();
        cy.wait('@getMockedPersonalDetails');
      });

      it('should display the mocked data correctly in the UI', () => {
        // Verify that the mocked data is displayed correctly in the UI
        cy.fixture('user_details.json').then((mockResponse) => {
          const testData = mockResponse.data;

          cy.get(selectors.firstNameInput).should(
            'have.value',
            testData.firstName
          );
          cy.get(selectors.middleNameInput).should(
            'have.value',
            testData.middleName
          );
          cy.get(selectors.lastNameInput).should(
            'have.value',
            testData.lastName
          );

          cy.findInputByLabel('Employee Id').should(
            'have.value',
            testData.employeeId
          );
          cy.findInputByLabel('Other Id').should(
            'have.value',
            testData.otherId
          );

          cy.findInputByLabel('License Number').should(
            'have.value',
            testData.drivingLicenseNo
          );
          cy.findInputByLabel('License Expiry Date').should(
            'have.value',
            testData.drivingLicenseExpiredDate
          );

          cy.findSelectByLabel('Nationality')
            .invoke('text')
            .should('eq', testData.nationality.name);
          cy.findSelectByLabel('Marital Status')
            .invoke('text')
            .should('eq', testData.maritalStatus);

          cy.findInputByLabel('Date of Birth').should(
            'have.value',
            testData.birthday
          );

          cy.get(selectors.radioWrapper)
            .contains(testData.gender === 1 ? 'Male' : 'Female') // map the value "1" to the way it is presented in the UI
            .find('input[type="radio"]')
            .should('be.checked');
        });
      });
    });

    describe('When Simulating No Response from Server on Personal Details Update', () => {
      beforeEach(() => {
        cy.on('uncaught:exception', (err) => {
          if (err.message.includes('Network Error')) return false;
        });

        cy.intercept(
          'GET',
          '/web/index.php/api/v2/pim/employees/7/personal-details'
        ).as('getPersonalDetails');
        cy.contains('My Info').click();
        cy.wait('@getPersonalDetails').then((interception) => {
          expect(interception.response?.body.data).to.exist;
        });

        cy.intercept(
          'PUT',
          '/web/index.php/api/v2/pim/employees/7/personal-details',
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

describe('When navigating to the homepage', () => {
  beforeEach(() => {
    cy.visit('/'); // Navigate to the login page
    cy.intercept('POST', '/web/index.php/auth/validate').as(
      'loginValidationRequest'
    ); // Intercept the login API request
  });

  describe('when entering valid login credentials', () => {
    beforeEach(() => {
      cy.intercept(
        'GET',
        '/web/index.php/api/v2/pim/employees/7/personal-details'
      ).as('getPersonalDetails');
      // Enter valid credentials
      cy.get('input[name="username"]').type('Admin');
      cy.get('input[name="password"]').type('admin123');
      cy.get('button[type="submit"]').click();
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
          // Reassign testData to the data property for simpler access
          testData = testData.data;
          cy.get('[name="firstName"]').clear().type(testData.firstName);
          cy.get('[name="middleName"]').clear().type(testData.middleName);
          cy.get('[name="lastName"]').clear().type(testData.lastName);
          cy.findInputByLabel('Employee Id').clear().type(testData.employeeId);
          cy.findInputByLabel('Other Id').clear().type(testData.otherId);
          cy.findInputByLabel("Driver's License Number")
            .clear()
            .type(testData.drivingLicenseNo);
          cy.findInputByLabel('License Expiry Date')
            .clear()
            .type(testData.drivingLicenseExpiredDate);
          //close calendar componenet
          cy.get('.oxd-date-input-calendar').within(() => {
            cy.contains('Close').click();
          });

          cy.findSelectByLabelAndChoose(
            'Nationality',
            testData.nationality.name
          );
          cy.findSelectByLabelAndChoose(
            'Marital Status',
            testData.maritalStatus
          );
          cy.findInputByLabel('Date of Birth').clear().type(testData.birthday);

          //close calendar componenet
          cy.get('.oxd-date-input-calendar').within(() => {
            cy.contains('Close').click();
          });

          // implemented in this way due to the radio button being covered by parent element and preferred not to force click
          cy.get('.oxd-radio-wrapper')
            .contains(testData.gender === 1 ? 'Male' : 'Female') // map the value "1" to the way it is presented in the UI // map the value "1" to the way it is presented in the UI
            .parent()
            .click();
        });

        // Used this as there are two submit buttons under the same parent element
        cy.get('[type="submit"]').first().click();
      });

      it('should verify success toast, validate API response, and check saved field values', () => {
        //Verify success toast
        cy.get('.oxd-toast.oxd-toast--success') // Ensure toast exists
          .should('be.visible')
          .within(() => {
            cy.get('.oxd-text--toast-title').should('contain.text', 'Success'); // Verify title
            cy.get('.oxd-text--toast-message').should(
              'contain.text',
              'Successfully Updated'
            ); // Verify message
          });

        //Wait for API and validate response
        cy.wait('@putPersonalDetails').then(({ response }) => {
          expect(response.statusCode).to.eq(200); // Ensure successful response
          cy.fixture('user_details.json').then((testData) => {
            // Reassign testData to the data property for simpler access
            const expectedData = testData.data;

            const actualData = response.body.data;

            // Verify all key fields in the response
            expect(actualData).to.deep.include(expectedData);
          });
        });

        //Verify form field values in the UI
        cy.reload(); //Making sure the data persists post-reload
        cy.fixture('user_details.json').then((testData) => {
          // Reassign testData to the data property for simpler access
          testData = testData.data;
          cy.get('[name="firstName"]').should('have.value', testData.firstName);
          cy.get('[name="middleName"]').should(
            'have.value',
            testData.middleName
          );
          cy.get('[name="lastName"]').should('have.value', testData.lastName);

          cy.findInputByLabel('Employee Id').should(
            'have.value',
            testData.employeeId
          );
          cy.findInputByLabel('Other Id').should(
            'have.value',
            testData.otherId
          );

          cy.findInputByLabel("Driver's License Number").should(
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

          cy.get('.oxd-radio-wrapper')
            .contains(testData.gender === 1 ? 'Male' : 'Female') // map the value "1" to the way it is presented in the UI
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

        // Clear mandatory fields (First Name, Middle Name, Last Name)
        cy.get('[name="firstName"]').clear();
        cy.get('[name="middleName"]').clear();
        cy.get('[name="lastName"]').clear();

        // Attempt to submit the form
        cy.get('[type="submit"]').first().click();
      });

      it('should display validation errors and prevent form submission', () => {
        // Verify that validation errors are displayed for each mandatory field
        cy.get('[name="firstName"]')
          .parent()
          .siblings('.oxd-input-group__message')
          .should('be.visible')
          .and('contain.text', 'Required');

        cy.get('[name="middleName"]')
          .parent()
          .siblings('.oxd-input-group__message')
          .should('not.exist'); // Middle Name may not be mandatory

        cy.get('[name="lastName"]')
          .parent()
          .siblings('.oxd-input-group__message')
          .should('be.visible')
          .and('contain.text', 'Required');

        // Ensure that success toast does not appear
        cy.get('.oxd-toast.oxd-toast--success').should('not.exist');
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

        cy.contains('My Info').click();
        cy.wait('@getMockedPersonalDetails'); // Wait for the mocked request
      });

      it('should display the mocked data correctly in the UI', () => {
        // Verify that the mocked data is displayed correctly in the UI
        cy.fixture('user_details.json').then((mockResponse) => {
          const testData = mockResponse.data; // Access the data property

          cy.get('[name="firstName"]').should('have.value', testData.firstName);
          cy.get('[name="middleName"]').should(
            'have.value',
            testData.middleName
          );
          cy.get('[name="lastName"]').should('have.value', testData.lastName);

          cy.findInputByLabel('Employee Id').should(
            'have.value',
            testData.employeeId
          );
          cy.findInputByLabel('Other Id').should(
            'have.value',
            testData.otherId
          );

          cy.findInputByLabel("Driver's License Number").should(
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

          cy.get('.oxd-radio-wrapper')
            .contains(testData.gender === 1 ? 'Male' : 'Female') // map the value "1" to the way it is presented in the UI
            .find('input[type="radio"]')
            .should('be.checked');
        });
      });
    });

    describe('When Simulating No Response from Server on Personal Details Update', () => {
      beforeEach(() => {
        // Handle uncaught exceptions to prevent test failure
        cy.on('uncaught:exception', (err) => {
          if (err.message.includes('Network Error')) {
            return false; // Prevent test failure
          }
        });

        // Intercept the GET request to fetch personal details
        cy.intercept(
          'GET',
          '/web/index.php/api/v2/pim/employees/7/personal-details'
        ).as('getPersonalDetails');

        // Navigate to the "My Info" page
        cy.contains('My Info').click();

        // Wait for the GET request to complete
        cy.wait('@getPersonalDetails').then((interception) => {
          const personalDetails = interception.response?.body.data;
          expect(personalDetails).to.exist; // Verify the response exists
        });

        // Intercept the PUT request with a forced network error
        cy.intercept(
          'PUT',
          '/web/index.php/api/v2/pim/employees/7/personal-details',
          { forceNetworkError: true } // Simulate no response from the server
        ).as('putPersonalDetails');

        // Directly click the "Save" button
        cy.get('[type="submit"]').first().click();
      });

      it('should handle no response from the server gracefully', () => {
        // Wait for the PUT request to fail
        cy.wait('@putPersonalDetails', { timeout: 10000 });

        // Assert that the error toast is displayed
        cy.get('.oxd-toast--error')
          .should('be.visible')
          .within(() => {
            cy.get('.oxd-text--toast-title').should('contain', 'Error');
            cy.get('.oxd-text--toast-message').should(
              'contain',
              'Unexpected Error!'
            );
          });
      });
    });
  });
});

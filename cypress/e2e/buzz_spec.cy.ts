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

    describe('when navigating to the Buzz page and intercepting the first post request', () => {
      let firstPost: any = null;
      beforeEach(() => {
        // Navigate to the Buzz page
        cy.contains('Buzz').click();

        // Intercept the feed API request
        cy.intercept(
          'GET',
          '/web/index.php/api/v2/buzz/feed?limit=10&offset=0&sortOrder=DESC&sortField=share.createdAtUtc'
        ).as('getFeed');

        // Wait for the API response
        cy.wait('@getFeed').then((interception) => {
          // Get the first post from the API response
          firstPost = interception.response?.body.data[0];
        });
      });

      it('should show the likes and comments count according to the API response', () => {
        // Assert the first post data exists
        expect(firstPost).to.exist;

        // Locate the first post in the UI using the post text
        cy.contains('.orangehrm-buzz-post-body-text', firstPost.text)
          .should('be.visible')
          .parents('.orangehrm-buzz') // Navigate to the parent post element
          .within(() => {
            // Validate likes count
            cy.get('.orangehrm-buzz-stats-row')
              .eq(0) // First row for likes
              .contains(`${firstPost.stats.numOfLikes} Like`)
              .should('be.visible');

            // Validate comments count
            cy.get('.orangehrm-buzz-stats-row')
              .eq(1) // Second row for comments and shares
              .contains(`${firstPost.stats.numOfComments} Comment`)
              .should('be.visible');
          });
      });

      describe('when clicking the like button', () => {
        let initialLikes: any = null;
        beforeEach(() => {
          // Locate the first post in the UI using the post text
          cy.contains('.orangehrm-buzz-post-body-text', firstPost.text)
            .should('be.visible')
            .parents('.orangehrm-buzz') // Navigate to the parent post element
            .within(() => {
              // Get initial likes count
              initialLikes = firstPost.stats.numOfLikes;

              // Validate initial likes count
              cy.get('.orangehrm-buzz-stats-row')
                .eq(0) // First row for likes
                .contains(`${initialLikes} Like`)
                .should('be.visible');

              // Determine the request type based on current `liked` state
              const likeAction = firstPost.liked ? 'DELETE' : 'POST';

              // Intercept the like/unlike API request
              cy.intercept(
                likeAction,
                `/web/index.php/api/v2/buzz/shares/${firstPost.id}/likes`
              ).as('likeAction');

              // Click the like button
              cy.get('#heart-svg').click();
            });
        });

        it('should the like count change in the UI', () => {
          // Wait for the like API response
          cy.wait('@likeAction').then(() => {
            // Validate the updated likes count in the UI
            const updatedLikes = firstPost.liked
              ? initialLikes - 1 // If the post was liked, unliking reduces the count
              : initialLikes + 1; // Otherwise, liking increases the count

            cy.get('.orangehrm-buzz-stats-row')
              .eq(0)
              .contains(`${updatedLikes} Like`)
              .should('be.visible');
          });
        });
      });

      describe('when posting a new comment', () => {
        beforeEach(() => {
          cy.wait('@getFeed').then((interception) => {
            // Locate the first post in the UI using the post text
            cy.contains('.orangehrm-buzz-post-body-text', firstPost.text)
              .should('be.visible')
              .parents('.orangehrm-buzz') // Navigate to the parent post element
              .within(() => {
                // Verify initial comment count from API matches UI
                cy.contains(
                  '.orangehrm-buzz-stats-row',
                  `${firstPost.stats.numOfComments} Comment`
                ).should('be.visible');

                // Click the "Comment" icon to open the comment textbox
                cy.get('.oxd-icon.bi-chat-text-fill').click();

                // Intercept the POST request for adding a comment
                cy.intercept(
                  'POST',
                  `/web/index.php/api/v2/buzz/shares/${firstPost.id}/comments`
                ).as('addComment');

                // Add a new comment
                const newCommentText = 'This is a new comment!';
                cy.get('[placeholder="Write your comment..."]')
                  .type(newCommentText)
                  .type('{enter}');
              });
          });
        });

        it('should validate comment count updates after adding a comment', () => {
          // Wait for the POST request to complete
          cy.wait('@addComment').then((postInterception) => {
            // Validate that the POST request was successful
            expect(postInterception.response?.statusCode).to.equal(200);

            // Verify the updated comment count in the UI
            cy.contains(
              '.orangehrm-buzz-stats-row',
              `${firstPost.stats.numOfComments + 1} Comment`
            ).should('be.visible');
          });
        });
      });
    });

    describe('when mocking the first post response', () => {
      let mockedFirstPost: any;

      beforeEach(() => {
        // Load the mocked post data from the fixture
        cy.fixture('mocked_first_post.json').then((data) => {
          mockedFirstPost = data;

          // Intercept and mock the Buzz feed API with the fixture data
          cy.intercept(
            'GET',
            '/web/index.php/api/v2/buzz/feed?limit=10&offset=0&sortOrder=DESC&sortField=share.createdAtUtc',
            {
              statusCode: 200,
              body: {
                data: [mockedFirstPost],
                meta: { total: 1 },
                rels: [],
              },
            }
          ).as('mockedFeed');
        });

        // Navigate to the Buzz page
        cy.contains('Buzz').click();

        // Wait for the mocked feed API response
        cy.wait('@mockedFeed');
      });

      it('should display the mocked post data correctly in the UI', () => {
        // Locate the mocked post in the UI using the mocked text
        cy.contains('.orangehrm-buzz-post-body-text', mockedFirstPost.text)
          .should('be.visible')
          .parents('.orangehrm-buzz') // Navigate to the parent post element
          .within(() => {
            // Validate likes count
            cy.get('.orangehrm-buzz-stats-row')
              .eq(0) // First row for likes
              .contains(`${mockedFirstPost.stats.numOfLikes} Like`)
              .should('be.visible');

            // Validate comments count
            cy.get('.orangehrm-buzz-stats-row')
              .eq(1) // Second row for comments and shares
              .contains(`${mockedFirstPost.stats.numOfComments} Comment`)
              .should('be.visible');

            // Validate shares count
            cy.get('.orangehrm-buzz-stats-row')
              .contains(`${mockedFirstPost.stats.numOfShares} Share`)
              .should('be.visible');
          });
      });
    });
    describe('When Simulating No Response from Server on Like Action', () => {
      let firstPost: any;

      beforeEach(() => {
        // Handle uncaught exceptions to prevent test failure
        cy.on('uncaught:exception', (err) => {
          if (err.message.includes('Network Error')) {
            // Returning false prevents Cypress from failing the test
            return false;
          }
        });

        // Intercept the Buzz feed API request to fetch initial data
        cy.intercept(
          'GET',
          '/web/index.php/api/v2/buzz/feed?limit=10&offset=0&sortOrder=DESC&sortField=share.createdAtUtc'
        ).as('getFeed');

        // Navigate to the Buzz page
        cy.contains('Buzz').click();

        // Wait for the feed API response
        cy.wait('@getFeed')
          .then((interception) => {
            // Extract the first post from the API response
            firstPost = interception.response?.body.data[0];

            // Assert the first post data exists
            expect(firstPost).to.exist;
          })
          .then(() => {
            // Intercept the like action with no response simulation
            // Intercept the like/unlike API request
            const likeAction = firstPost.liked ? 'DELETE' : 'POST';

            cy.intercept(
              likeAction,
              `/web/index.php/api/v2/buzz/shares/${firstPost.id}/likes`,
              { forceNetworkError: true } // Simulates no response from the server
            ).as('likeNoResponse');

            // Locate the first post and attempt to like it
            cy.contains('.orangehrm-buzz-post-body-text', firstPost.text)
              .should('be.visible')
              .parents('.orangehrm-buzz') // Navigate to the parent post element
              .within(() => {
                cy.get('#heart-svg').click(); // Click the like button
              });
          });
      });

      it('should handle no response from the server gracefully', () => {
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

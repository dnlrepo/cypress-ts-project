import { selectors } from 'cypress/fixtures/selectors';
import { inputData } from 'cypress/fixtures/input_data';
// Utility Functions

const validatePostStats = (
  post: any,
  likesSelector: string,
  commentsSelector: string,
  sharesSelector?: string
) => {
  cy.get(likesSelector)
    .contains(`${post.stats.numOfLikes} Like`)
    .should('be.visible');

  cy.get(commentsSelector)
    .contains(`${post.stats.numOfComments} Comment`)
    .should('be.visible');

  if (sharesSelector) {
    cy.get(sharesSelector)
      .contains(`${post.stats.numOfShares} Share`)
      .should('be.visible');
  }
};

const findAndInteractWithPost = (
  date: string,
  time: string,
  action: (postElement: Cypress.Chainable) => void
) => {
  cy.findPostByDateTime(date, time)
    .should('be.visible')
    .parents(selectors.buzzPost)
    .within(() => action(cy.wrap(this)));
};

describe('When navigating to the homepage', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('when entering valid login credentials', () => {
    beforeEach(() => {
      cy.login(inputData.validUsername, inputData.validPassword);
    });

    describe('when navigating to the Buzz page and intercepting the first post request', () => {
      let firstPost: any;

      beforeEach(() => {
        cy.contains(inputData.buzzTab).click();

        cy.intercept(
          'GET',
          '/web/index.php/api/v2/buzz/feed?limit=10&offset=0&sortOrder=DESC&sortField=share.createdAtUtc'
        ).as('getFeed');

        cy.wait('@getFeed').then((interception) => {
          firstPost = interception.response?.body.data[0];
        });
      });

      it('should show the likes and comments count according to the API response', () => {
        expect(firstPost).to.exist;

        findAndInteractWithPost(
          firstPost.createdDate,
          firstPost.createdTime,
          () => {
            validatePostStats(
              firstPost,
              selectors.buzzStatsRow,
              selectors.buzzStatsRow
            );
          }
        );
      });

      describe('when clicking the like button', () => {
        let initialLikes: any;

        beforeEach(() => {
          findAndInteractWithPost(
            firstPost.createdDate,
            firstPost.createdTime,
            (postElement) => {
              initialLikes = firstPost.stats.numOfLikes;

              validatePostStats(
                firstPost,
                selectors.buzzStatsRow,
                selectors.buzzStatsRow
              );

              const likeAction = firstPost.liked ? 'DELETE' : 'POST';

              cy.intercept(
                likeAction,
                `/web/index.php/api/v2/buzz/shares/${firstPost.id}/likes`
              ).as('likeAction');

              postElement.get(selectors.likeButton).click();
            }
          );
        });

        it('should update the like count in the UI', () => {
          cy.wait('@likeAction').then(() => {
            const updatedLikes = firstPost.liked
              ? initialLikes - 1
              : initialLikes + 1;

            cy.get(selectors.buzzStatsRow)
              .eq(0)
              .contains(`${updatedLikes} Like`)
              .should('be.visible');
          });
        });
      });

      describe('when posting a new comment', () => {
        beforeEach(() => {
          findAndInteractWithPost(
            firstPost.createdDate,
            firstPost.createdTime,
            (postElement) => {
              validatePostStats(
                firstPost,
                selectors.buzzStatsRow,
                selectors.buzzStatsRow
              );

              postElement.get(selectors.commentIcon).click();

              cy.intercept(
                'POST',
                `/web/index.php/api/v2/buzz/shares/${firstPost.id}/comments`
              ).as('addComment');

              cy.clearAndType(
                selectors.commentInput,
                'This is a new comment!'
              ).type('{enter}');
            }
          );
        });

        it('should update the comment count in the UI', () => {
          cy.wait('@addComment').then((interception) => {
            expect(interception.response?.statusCode).to.equal(200);

            cy.contains(
              selectors.buzzStatsRow,
              `${firstPost.stats.numOfComments + 1} Comment`
            ).should('be.visible');
          });
        });
      });
    });

    describe('when mocking the first post response', () => {
      let mockedFirstPost: any;

      beforeEach(() => {
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

        cy.contains(inputData.buzzTab).click();

        cy.wait('@mockedFeed');
      });

      it('should display the mocked post data correctly in the UI', () => {
        cy.findPostByDateTime(
          mockedFirstPost.createdDate,
          mockedFirstPost.createdTime
        )
          .should('be.visible')
          .parents(selectors.buzzPost)
          .within(() => {
            // Validate likes count
            cy.get(selectors.buzzStatsRow)
              .eq(0) // First row for likes
              .contains(`${mockedFirstPost.stats.numOfLikes} Like`)
              .should('be.visible');

            // Validate comments count
            cy.get(selectors.buzzStatsRow)
              .eq(1) // Second row for comments and shares
              .contains(`${mockedFirstPost.stats.numOfComments} Comment`)
              .should('be.visible');

            // Validate shares count
            cy.get(selectors.buzzStatsRow)
              .contains(`${mockedFirstPost.stats.numOfShares} Share`)
              .should('be.visible');
          });
      });
    });

    describe('When Simulating No Response from Server on Like Action', () => {
      let firstPost: any;

      beforeEach(() => {
        cy.on('uncaught:exception', (err) => {
          if (err.message.includes('Network Error')) return false;
        });

        cy.intercept(
          'GET',
          '/web/index.php/api/v2/buzz/feed?limit=10&offset=0&sortOrder=DESC&sortField=share.createdAtUtc'
        ).as('getFeed');

        cy.contains(inputData.buzzTab).click();

        cy.wait('@getFeed')
          .then((interception) => {
            firstPost = interception.response?.body.data[0];
            expect(firstPost).to.exist;
          })
          .then(() => {
            const likeAction = firstPost.liked ? 'DELETE' : 'POST';

            cy.intercept(
              likeAction,
              `/web/index.php/api/v2/buzz/shares/${firstPost.id}/likes`,
              { forceNetworkError: true }
            ).as('likeNoResponse');

            findAndInteractWithPost(
              firstPost.createdDate,
              firstPost.createdTime,
              (postElement) => {
                postElement.get(selectors.likeButton).click();
              }
            );
          });
      });

      it('should handle no response from the server gracefully', () => {
        cy.wait('@likeNoResponse');

        cy.get(selectors.toastError)
          .should('be.visible')
          .within(() => {
            cy.get(selectors.toastTitle).should('contain', 'Error');
            cy.get(selectors.toastMessage).should(
              'contain',
              'Unexpected Error!'
            );
          });
      });
    });
  });
});

# Cypress Test Suite

This project includes a Cypress test suite to validate the integration of API and UI in a web application. The suite covers positive, negative, and edge cases to ensure reliability and graceful error handling.

## Setup Instructions

Follow these steps to set up and run the test suite:

### Prerequisites

Ensure the following tools are installed on your machine:

- **Node.js** (v14.x or later)
- **npm** (comes with Node.js)
- **Cypress** (no need for a global installation, as Cypress will be installed locally)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/dnlrepo/cypress-ts-project.git
   cd cypress-ts-project
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run Cypress tests:
   - To open the Cypress Test Runner and interact with the tests in a GUI:
     ```bash
     npx cypress open
     ```
   - To execute all tests in headless mode:
     ```bash
     npx cypress run
     ```

## Bugs found

I noticed that every few runs the date format will change, casuing the automation to fail.
I consider this as a bug, as I did not find a way that the application is letting the user dictate his date format, and this change is coming directly from the UI code, and hence cannot be mocked.

<img width="389" alt="image" src="https://github.com/user-attachments/assets/4153a89e-6cf0-4549-94a6-31527c1e280b">

I have diasbled the assertions for the date field, and changed one of my cy.commands that were using date to locate an element.

## Why did I use both JSON and TypeScript Fixtures?

JSON: Used for static test data (e.g., user details) that's easy to maintain and universally compatible with cy.fixture() for mock API responses and UI validation.

TypeScript: Provides type safety and dynamic data generation, allowing for reliable, scalable, and reusable test configurations. It also enables data transformation and supports system variables for multiple environments, making it flexible for diverse testing needs.

By combining both, it is possible to balance simplicity for static data with flexibility and error prevention for dynamic test scenarios.

## Utility Functions vs. cy.commands

This project utilizes both utility functions and custom Cypress commands (cy.commands) to streamline the test logic and enhance readability. Here's the distinction:

### Utility Functions: These are defined directly within individual spec files for logic that is:

Simple and non-complex.
Specific to a single spec file.
Primarily used to simplify long Cypress command chains, improving readability and maintainability.

### Custom Cypress Commands (cy.commands): These are implemented for:

Logic that is more complex or involves reusable patterns.
Functionality that is likely to be used across multiple spec files, ensuring consistency and scalability.
By adopting this approach, the test suite remains modular, readable, and easy to maintain while avoiding unnecessary overhead from over-generalization.

## Assumptions Made and Additional Notes

### Use of Application Actions Instead of Page Object Model

For this project, I adhered to Cypress's best practice of using **Application Actions** rather than the traditional **Page Object Model (POM)**. Application Actions are tailored to Cypress's testing paradigm and simplify test maintenance and readability. For more details, see [this article from Cypress](https://www.cypress.io/blog/stop-using-page-objects-and-start-using-app-actions).

While POM can be useful in certain contexts, I consciously opted not to use it here to align with modern best practices and leverage the simplicity and clarity that Application Actions provide. If asked, I will be prepared to explain this decision during discussions.

### Website Does Not Use `data-test-id` Attributes

The tested application does not include `data-test-id` attributes or other custom test-friendly identifiers. This limitation necessitated reliance on more complex DOM selectors, increasing the potential for brittleness in the test suite. If I were given the option, I would have loved to get my hands on the source code of the application and add the `data-test-id` attributes myself to improve the test suite's robustness and maintainability. If asked, I will emphasize this limitation and suggest introducing `data-test-id` attributes for enhanced test robustness during future development cycles.

### Development Instructions Considered

During test development, I incorporated the following instructions:

1. **UI and API Testing**: Both UI and API interactions were tested extensively.
2. **Mock Data**: Used mocked data to validate the accuracy of UI updates.
3. **Button-Triggered API Calls**: Ensured all relevant button clicks triggered the expected API calls.
4. **Post-API Call Verification**: Verified that the UI updated correctly once the API call was complete.
5. **Handling Success and Failure Responses**:
   - Positive scenarios validated the expected behavior on a successful response.
   - Negative cases tested the application's graceful error handling for failures.

### Test Suite Highlights

Each specification includes:

- **API/UI Integration Testing**: Verifying synchronization between UI actions and API requests/responses.
- **UI Validation**: Ensuring correct UI rendering and user interactions.
- **Negative Testing**: Validating that error cases are handled gracefully.
- **Data Mocking and Verification**: Mocked API responses to test UI behavior under controlled data scenarios.
- **No Response Handling**: Simulated scenarios where the server provided no response to ensure the UI responds gracefully.
  - **Login Spec**: While all other specs include graceful handling of server errors, the only exception is the login spec, where a failed API request is not gracefully handled, and the page will not load at all.

By mentioning these considerations, I aim to communicate my awareness of trade-offs and limitations, providing a comprehensive understanding of my approach to the test suite design.

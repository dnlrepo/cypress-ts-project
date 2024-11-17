import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'https://opensource-demo.orangehrmlive.com/',
    defaultCommandTimeout: 20000, // 20 seconds timeout for elements
    requestTimeout: 30000, // 30 seconds timeout for requests
    responseTimeout: 30000, // 30 seconds timeout for responses
  },
});

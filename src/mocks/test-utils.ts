/**
 * Test Utilities for Mock Data
 * Helper functions for testing components with mock data
 */

import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';
import { handlers } from './handlers';
import {
  createMockUser,
  createMockInnermost,
  createMockWillingBox,
  scenarioBuilders,
} from './fixtures';
import type { User, Innermost, WillingBox } from '../types';

// ============================================
// MSW SERVER SETUP FOR TESTS
// ============================================

// Create MSW server instance for tests
export const server = setupServer(...handlers);

// Enable API mocking before all tests
export function setupTests() {
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}

// ============================================
// TEST DATA GENERATORS
// ============================================

/**
 * Generate a complete test context with user, innermost, and willing box
 */
export function createTestContext(overrides?: {
  user?: Partial<User>;
  innermost?: Partial<Innermost>;
  willingBox?: Partial<WillingBox>;
}) {
  const user = createMockUser({
    id: 'test-user-1',
    email: 'test@example.com',
    displayName: 'Test User',
    subscriptionStatus: 'premium',
    ...overrides?.user,
  });

  const partner = createMockUser({
    id: 'test-user-2',
    email: 'partner@example.com',
    displayName: 'Test Partner',
  });

  const innermost = createMockInnermost({
    id: 'test-innermost-1',
    partnerA: user.id,
    partnerB: partner.id,
    partnerAName: user.displayName,
    partnerBName: partner.displayName,
    partnerAEmail: user.email,
    partnerBEmail: partner.email,
    status: 'active',
    ...overrides?.innermost,
  });

  const willingBox = createMockWillingBox({
    id: 'test-willingbox-1',
    innermostId: innermost.id,
    partnerA: user.id,
    partnerB: partner.id,
    weekNumber: 1,
    status: 'planting_trees',
    ...overrides?.willingBox,
  });

  return {
    user,
    partner,
    innermost,
    willingBox,
  };
}

// ============================================
// MOCK API RESPONSE HELPERS
// ============================================

/**
 * Mock a successful authentication
 */
export function mockAuthentication(user?: User) {
  const testUser = user || createMockUser();

  server.use(
    http.post('/api/auth/signin', () => {
      return HttpResponse.json({
        user: testUser,
        token: `mock-jwt-${testUser.id}`,
      });
    }),
    http.get('/api/auth/me', () => {
      return HttpResponse.json(testUser);
    })
  );

  return testUser;
}

/**
 * Mock an authentication failure
 */
export function mockAuthenticationFailure(message = 'Invalid credentials') {
  server.use(
    http.post('/api/auth/signin', () => {
      return HttpResponse.json(
        { error: message },
        { status: 401 }
      );
    }),
    http.get('/api/auth/me', () => {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    })
  );
}

/**
 * Mock network error
 */
export function mockNetworkError(endpoint: string) {
  server.use(
    http.get(endpoint, () => {
      return HttpResponse.error();
    }),
    http.post(endpoint, () => {
      return HttpResponse.error();
    })
  );
}

/**
 * Mock loading state with delay
 */
export function mockLoadingState(endpoint: string, delayMs = 1000) {
  server.use(
    http.get(endpoint, async () => {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return HttpResponse.json({});
    })
  );
}

// ============================================
// TEST SCENARIO HELPERS
// ============================================

/**
 * Set up a complete game scenario
 */
export function setupGameScenario() {
  const scenario = scenarioBuilders.createCompleteGameScenario();

  // Mock all related endpoints
  server.use(
    http.get('/api/auth/me', () => {
      return HttpResponse.json(scenario.user);
    }),
    http.get(`/api/innermosts/${scenario.innermost.id}`, () => {
      return HttpResponse.json(scenario.innermost);
    }),
    http.get(`/api/willing-boxes/${scenario.willingBox.id}`, () => {
      return HttpResponse.json(scenario.willingBox);
    }),
    http.get(`/api/innermosts/${scenario.innermost.id}/scores`, () => {
      return HttpResponse.json([scenario.weeklyScore]);
    })
  );

  return scenario;
}

/**
 * Set up a new user scenario
 */
export function setupNewUserScenario() {
  const scenario = scenarioBuilders.createNewUserScenario();

  server.use(
    http.get('/api/auth/me', () => {
      return HttpResponse.json(scenario.user);
    }),
    http.get(`/api/users/${scenario.user.id}/innermosts`, () => {
      return HttpResponse.json([]);
    }),
    http.get('/api/invitations', () => {
      return HttpResponse.json(scenario.invitations);
    })
  );

  return scenario;
}

/**
 * Set up a free user at limits scenario
 */
export function setupFreeUserLimitsScenario() {
  const scenario = scenarioBuilders.createFreeUserLimitsScenario();

  server.use(
    http.get('/api/auth/me', () => {
      return HttpResponse.json(scenario.user);
    }),
    http.post('/api/innermosts', () => {
      return HttpResponse.json(
        { error: 'Free users limited to 1 innermost relationship' },
        { status: 403 }
      );
    })
  );

  return scenario;
}

// ============================================
// COMPONENT TEST HELPERS
// ============================================

/**
 * Wait for async updates in tests
 */
export function waitForAsync(ms = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock console methods for cleaner test output
 */
export function mockConsole() {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };

  beforeAll(() => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  afterAll(() => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  return {
    log: console.log as jest.Mock,
    warn: console.warn as jest.Mock,
    error: console.error as jest.Mock,
  };
}

/**
 * Helper to test loading states
 */
export async function testLoadingState(
  renderComponent: () => any,
  getLoadingElement: () => HTMLElement | null
) {
  // Set up delayed response
  mockLoadingState('/api/auth/me', 100);

  // Render component
  const { rerender } = renderComponent();

  // Check loading state is shown
  expect(getLoadingElement()).toBeInTheDocument();

  // Wait for loading to complete
  await waitForAsync(150);

  // Check loading state is gone
  expect(getLoadingElement()).not.toBeInTheDocument();

  return { rerender };
}

/**
 * Helper to test error states
 */
export async function testErrorState(
  renderComponent: () => any,
  getErrorElement: () => HTMLElement | null,
  expectedError = 'An error occurred'
) {
  // Set up error response
  server.use(
    http.get('/api/auth/me', () => {
      return HttpResponse.json(
        { error: expectedError },
        { status: 500 }
      );
    })
  );

  // Render component
  const { rerender } = renderComponent();

  // Wait for error to appear
  await waitForAsync(100);

  // Check error is shown
  const errorElement = getErrorElement();
  expect(errorElement).toBeInTheDocument();
  expect(errorElement).toHaveTextContent(expectedError);

  return { rerender };
}

// ============================================
// EXPORT TEST UTILITIES
// ============================================

export const testUtils = {
  // Setup
  setupTests,
  server,

  // Data generators
  createTestContext,

  // Mock responses
  mockAuthentication,
  mockAuthenticationFailure,
  mockNetworkError,
  mockLoadingState,

  // Scenarios
  setupGameScenario,
  setupNewUserScenario,
  setupFreeUserLimitsScenario,

  // Helpers
  waitForAsync,
  mockConsole,
  testLoadingState,
  testErrorState,
};

export default testUtils;
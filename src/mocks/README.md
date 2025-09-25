# Willing Tree Mock Data Service

Comprehensive mock data service for testing the Willing Tree application without a real backend.

## Overview

This mock service provides:
- Realistic test data for all entities (users, innermosts, wishes, scores)
- Factory functions for generating custom test data
- MSW (Mock Service Worker) handlers for API mocking
- Test utilities for component and integration testing
- Support for both free and premium user scenarios
- Edge cases and error states

## Quick Start

### In Development

```javascript
// In your main.tsx or App.tsx
import { initializeMocks } from './mocks';

// Initialize mocks in development
if (process.env.NODE_ENV === 'development') {
  initializeMocks().then(() => {
    console.log('Mock server ready');
  });
}
```

### In Tests

```javascript
import { setupTests, createTestContext } from '../mocks/test-utils';

// Setup MSW server for all tests
setupTests();

describe('MyComponent', () => {
  it('should work with mock data', () => {
    const { user, innermost, willingBox } = createTestContext();
    // Use mock data in your tests
  });
});
```

## Available Mock Data

### Users
- `user-premium-1` - Alice Johnson (Premium, 2 active relationships)
- `user-premium-2` - Bob Smith (Premium, 1 active relationship)
- `user-free-1` - Charlie Davis (Free user)
- `user-free-2` - Diana Martinez (Free user, unverified email)
- `user-expired-1` - Edward Wilson (Expired subscription)
- `user-new-1` - Fiona Green (New user, no relationships)
- `user-max-capacity` - George Harrison (Premium at max capacity)

### Test Scenarios

```javascript
import { testScenarios } from './mocks/data';

// Empty state - new user with no data
const emptyState = testScenarios.emptyState;

// Active game - user in middle of game
const activeGame = testScenarios.activeGame;

// Max capacity - premium user with 5 relationships
const maxCapacity = testScenarios.maxCapacity;

// Free user limits - testing free tier restrictions
const freeUserLimits = testScenarios.freeUserLimits;
```

## Factory Functions

### Creating Custom Users

```javascript
import { createMockUser } from './mocks/fixtures';

const customUser = createMockUser({
  displayName: 'John Doe',
  email: 'john@example.com',
  subscriptionStatus: 'premium',
  age: 35,
  gender: 'male'
});
```

### Creating Custom Innermosts

```javascript
import { createMockInnermost } from './mocks/fixtures';

const customInnermost = createMockInnermost({
  partnerA: 'user-1',
  partnerB: 'user-2',
  currentWeek: 4,
  status: 'active'
});
```

### Creating Wish Lists

```javascript
import { createMockWishList } from './mocks/fixtures';

// Creates 12 wishes with one marked as mostWanted
const wishes = createMockWishList(12, 'user-id');
```

### Creating Complete Scenarios

```javascript
import { scenarioBuilders } from './mocks/fixtures';

// Complete game with all related data
const gameScenario = scenarioBuilders.createCompleteGameScenario();

// New user with pending invitations
const newUserScenario = scenarioBuilders.createNewUserScenario();

// Premium user at max capacity
const maxCapacityScenario = scenarioBuilders.createMaxCapacityScenario();
```

## MSW Handlers

### Available Endpoints

#### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/me` - Get current user
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/enable-2fa` - Enable 2FA

#### Users
- `GET /api/users/:userId` - Get user profile
- `PATCH /api/users/:userId` - Update profile
- `GET /api/users/:userId/innermosts` - Get user's relationships
- `POST /api/users/:userId/subscription` - Update subscription

#### Innermosts
- `POST /api/innermosts` - Create new relationship
- `GET /api/innermosts/:innermostId` - Get relationship details
- `POST /api/innermosts/:innermostId/accept` - Accept invitation
- `POST /api/innermosts/:innermostId/pause` - Pause relationship

#### Willing Boxes
- `GET /api/willing-boxes/:boxId` - Get willing box
- `GET /api/innermosts/:innermostId/willing-box` - Get active box
- `POST /api/willing-boxes/:boxId/wishes` - Create/update wishes
- `POST /api/willing-boxes/:boxId/willing` - Submit willing selections
- `POST /api/willing-boxes/:boxId/guess` - Submit guesses

#### Scores
- `GET /api/innermosts/:innermostId/scores` - Get all scores
- `GET /api/innermosts/:innermostId/scores/:week` - Get specific week

#### Analytics
- `GET /api/analytics/user/:userId` - User analytics
- `GET /api/analytics/global` - Global analytics (premium only)

### Customizing Responses

```javascript
// Add custom handler at runtime
if (window.__msw) {
  window.__msw.use(
    http.get('/api/custom', () => {
      return HttpResponse.json({ custom: 'data' });
    })
  );
}
```

## Test Utilities

### Setup Tests

```javascript
import { setupTests } from './mocks/test-utils';

// Automatically setup MSW server for all tests
setupTests();
```

### Mock Authentication

```javascript
import { mockAuthentication, mockAuthenticationFailure } from './mocks/test-utils';

// Mock successful auth
const user = mockAuthentication();

// Mock auth failure
mockAuthenticationFailure('Invalid password');
```

### Test Loading States

```javascript
import { testLoadingState } from './mocks/test-utils';

await testLoadingState(
  () => render(<MyComponent />),
  () => screen.queryByText('Loading...')
);
```

### Test Error States

```javascript
import { testErrorState } from './mocks/test-utils';

await testErrorState(
  () => render(<MyComponent />),
  () => screen.queryByRole('alert'),
  'Network error occurred'
);
```

## Configuration

### Environment Variables

```bash
# Enable mocks in production build
VITE_USE_MOCKS=true

# Configure mock delay (ms)
VITE_MOCK_DELAY=100

# Configure error rate (0-1)
VITE_MOCK_ERROR_RATE=0.1
```

### Development Helpers

When running in development, the following helpers are available:

```javascript
// Access MSW worker
window.__msw.worker

// Add runtime handlers
window.__msw.use(/* handlers */)

// Reset handlers
window.__msw.reset()

// Stop mock server
window.__msw.stop()
```

### Debugging

```javascript
import { logMockState } from './mocks';

// Log current mock data state
logMockState();
```

## Edge Cases Covered

- Empty states (no data)
- Maximum limits (5 innermosts for premium)
- Free user restrictions (1 innermost)
- Expired subscriptions
- Pending invitations
- Unverified emails
- Network errors
- Loading states
- Partial data states

## Performance

The mock service is optimized for:
- Fast responses (100ms default delay)
- Realistic data relationships
- Consistent IDs across entities
- Proper error handling
- Browser and Node.js environments

## Troubleshooting

### Mock Service Worker not starting

Make sure you have the service worker file in your public directory:

```bash
npx msw init public/ --save
```

### Handlers not intercepting requests

Check that your API calls use the `/api` prefix:

```javascript
// Correct
fetch('/api/auth/me')

// Incorrect
fetch('https://api.example.com/auth/me')
```

### Data not persisting

Mock data is reset on page reload. For persistent testing, consider using localStorage:

```javascript
// Save state
localStorage.setItem('mockState', JSON.stringify(currentState));

// Restore state
const savedState = JSON.parse(localStorage.getItem('mockState') || '{}');
```
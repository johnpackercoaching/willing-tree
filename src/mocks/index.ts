/**
 * Mock Data Service Entry Point
 * Central export for all mock data, fixtures, and MSW handlers
 */

// Export all mock data
export {
  mockUsers,
  mockInnermosts,
  mockWishes,
  mockWillingBoxes,
  mockWeeklyScores,
  mockPairingInvitations,
  mockAnalyticsData,
  getCurrentUser,
  getUserById,
  getInnermostById,
  getWillingBoxById,
  getUserInnermosts,
  getActiveWillingBox,
  getWeeklyScoresForInnermost,
  testScenarios,
} from './data';

// Export all factory functions
export {
  createMockUser,
  createMockInnermost,
  createMockWant,
  createMockWishList,
  createMockWillingItem,
  createMockWillingList,
  createMockWillingBox,
  createMockWeeklyScore,
  createMockPairingInvitation,
  scenarioBuilders,
} from './fixtures';

// Export MSW handlers
export {
  handlers,
  authHandlers,
  userHandlers,
  innermostHandlers,
  willingBoxHandlers,
  scoreHandlers,
  analyticsHandlers,
  invitationHandlers,
  setupMockServer,
} from './handlers';

// Export types for convenience
export type {
  User,
  Innermost,
  Wish,
  Want,
  WillingBox,
  WillingItem,
  WeeklyScore,
  WeeklyGuess,
  PairingInvitation,
} from '../types';

/**
 * Initialize Mock Service Worker for development/testing
 * Call this in your app entry point or test setup
 */
export async function initializeMocks() {
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    const { setupMockServer } = await import('./handlers');
    return setupMockServer();
  }
  return Promise.resolve(null);
}

/**
 * Quick start function to get a complete test scenario
 * Useful for component development and testing
 */
export function getQuickStartData() {
  const { testScenarios } = require('./data');
  return testScenarios.activeGame;
}

/**
 * Reset all mock data to initial state
 * Useful for test cleanup
 */
export function resetMockData() {
  // Re-import to get fresh copies
  const { mockUsers, mockInnermosts, mockWillingBoxes, mockWeeklyScores } = require('./data');

  // Reset any runtime modifications
  mockUsers.forEach(user => {
    user.lastLogin = new Date();
  });

  mockInnermosts.forEach(innermost => {
    if (innermost.status === 'pending') {
      innermost.status = 'pending';
    }
  });

  return {
    users: mockUsers,
    innermosts: mockInnermosts,
    willingBoxes: mockWillingBoxes,
    scores: mockWeeklyScores,
  };
}

/**
 * Utility to simulate user interactions for testing
 */
export const mockInteractions = {
  // Simulate a complete week cycle
  async completeWeekCycle(innermostId: string) {
    const { getInnermostById, getActiveWillingBox } = await import('./data');
    const innermost = getInnermostById(innermostId);

    if (!innermost) throw new Error('Innermost not found');

    const willingBox = getActiveWillingBox(innermostId);
    if (!willingBox) throw new Error('No active willing box');

    // Simulate progression through phases
    willingBox.status = 'planting_trees';
    await new Promise(resolve => setTimeout(resolve, 100));

    willingBox.status = 'selecting_willing';
    await new Promise(resolve => setTimeout(resolve, 100));

    willingBox.status = 'guessing';
    willingBox.isLocked = true;
    willingBox.lockedAt = new Date();
    await new Promise(resolve => setTimeout(resolve, 100));

    willingBox.status = 'revealed';

    return willingBox;
  },

  // Simulate creating a new pairing
  async createNewPairing(userAId: string, userBEmail: string) {
    const { createMockInnermost, createMockPairingInvitation } = await import('./fixtures');
    const { getUserById } = await import('./data');

    const userA = getUserById(userAId);
    if (!userA) throw new Error('User not found');

    const innermost = createMockInnermost({
      partnerA: userAId,
      partnerAName: userA.displayName,
      partnerAEmail: userA.email,
      partnerBEmail: userBEmail,
      status: 'pending',
    });

    const invitation = createMockPairingInvitation({
      fromUserId: userAId,
      fromUserName: userA.displayName,
      toEmail: userBEmail,
      status: 'pending',
    });

    return { innermost, invitation };
  },

  // Simulate premium upgrade
  async upgradeToPremium(userId: string) {
    const { getUserById } = await import('./data');
    const user = getUserById(userId);

    if (!user) throw new Error('User not found');

    user.subscriptionStatus = 'premium';
    user.subscriptionEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    return user;
  },
};

/**
 * Development helper to log current mock state
 */
export function logMockState() {
  const { mockUsers, mockInnermosts, mockWillingBoxes } = require('./data');

  console.group('Mock Data State');
  console.log('Users:', mockUsers.length);
  console.log('- Premium:', mockUsers.filter(u => u.subscriptionStatus === 'premium').length);
  console.log('- Free:', mockUsers.filter(u => u.subscriptionStatus === 'free').length);
  console.log('- Expired:', mockUsers.filter(u => u.subscriptionStatus === 'expired').length);

  console.log('Innermosts:', mockInnermosts.length);
  console.log('- Active:', mockInnermosts.filter(i => i.status === 'active').length);
  console.log('- Pending:', mockInnermosts.filter(i => i.status === 'pending').length);
  console.log('- Paused:', mockInnermosts.filter(i => i.status === 'paused').length);

  console.log('Willing Boxes:', mockWillingBoxes.length);
  console.log('- Planting Trees:', mockWillingBoxes.filter(w => w.status === 'planting_trees').length);
  console.log('- Selecting Willing:', mockWillingBoxes.filter(w => w.status === 'selecting_willing').length);
  console.log('- Guessing:', mockWillingBoxes.filter(w => w.status === 'guessing').length);
  console.log('- Revealed:', mockWillingBoxes.filter(w => w.status === 'revealed').length);
  console.groupEnd();
}

// Auto-initialize in development mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('Willing Tree Mock Service Available');
  console.log('Use initializeMocks() to start the mock server');
  console.log('Use logMockState() to inspect current data');
}
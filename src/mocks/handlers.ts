/**
 * MSW (Mock Service Worker) Request Handlers
 * Comprehensive mock API endpoints for testing
 */

import { http, HttpResponse, delay } from 'msw';
import type { User } from '../types';
import {
  mockUsers,
  mockInnermosts,
  mockWishes,
  mockWillingBoxes,
  mockWeeklyScores,
  mockPairingInvitations,
  mockAnalyticsData,
  getUserById,
  getInnermostById,
  getWillingBoxById,
  getUserInnermosts,
  getActiveWillingBox,
  getWeeklyScoresForInnermost,
} from './data';
import {
  createMockUser,
  createMockInnermost,
  createMockWant,
  createMockWillingBox,
  createMockWeeklyScore,
  createMockPairingInvitation,
  createMockWishList,
  createMockWillingList,
} from './fixtures';

// ============================================
// CONFIGURATION
// ============================================

const API_BASE = '/api';
const MOCK_DELAY = 100; // ms - simulate network latency
const ERROR_RATE = 0; // 0-1, set higher to test error handling

// Helper to simulate random errors
const maybeError = () => {
  if (Math.random() < ERROR_RATE) {
    throw new Error('Simulated network error');
  }
};

// Helper to get auth token from headers
const getAuthToken = (request: Request): string | null => {
  const auth = request.headers.get('Authorization');
  return auth ? auth.replace('Bearer ', '') : null;
};

// Helper to validate authentication
const requireAuth = (request: Request): User => {
  const token = getAuthToken(request);
  if (!token) {
    throw new HttpResponse('Unauthorized', { status: 401 });
  }
  // In real app, validate JWT token
  // For mock, just return first premium user
  return mockUsers[0];
};

// ============================================
// AUTHENTICATION HANDLERS
// ============================================

export const authHandlers = [
  // Sign up
  http.post(`${API_BASE}/auth/signup`, async ({ request }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const body = await request.json() as any;
    const { email, password, displayName, age, gender } = body;

    // Check if email already exists
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      return HttpResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Create new user
    const newUser = createMockUser({
      email,
      displayName,
      age,
      gender,
      subscriptionStatus: 'free',
      emailVerified: false,
    });

    return HttpResponse.json({
      user: newUser,
      token: `mock-jwt-${newUser.id}`,
    });
  }),

  // Sign in
  http.post(`${API_BASE}/auth/signin`, async ({ request }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const body = await request.json() as any;
    const { email, password } = body;

    // Find user by email
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      return HttpResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    user.lastLogin = new Date();

    return HttpResponse.json({
      user,
      token: `mock-jwt-${user.id}`,
    });
  }),

  // Sign out
  http.post(`${API_BASE}/auth/signout`, async () => {
    await delay(MOCK_DELAY);
    return HttpResponse.json({ success: true });
  }),

  // Get current user
  http.get(`${API_BASE}/auth/me`, async ({ request }) => {
    await delay(MOCK_DELAY);
    maybeError();

    try {
      const user = requireAuth(request);
      return HttpResponse.json(user);
    } catch (error) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }),

  // Reset password
  http.post(`${API_BASE}/auth/reset-password`, async ({ request }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const body = await request.json() as any;
    const { email } = body;

    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      // Don't reveal if email exists
      return HttpResponse.json({ success: true });
    }

    return HttpResponse.json({
      success: true,
      message: 'Password reset email sent',
    });
  }),

  // Verify email
  http.post(`${API_BASE}/auth/verify-email`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const user = requireAuth(request);
    user.emailVerified = true;

    return HttpResponse.json({
      success: true,
      user,
    });
  }),

  // Enable 2FA
  http.post(`${API_BASE}/auth/enable-2fa`, async ({ request }) => {
    await delay(MOCK_DELAY);

    const user = requireAuth(request);
    user.twoFactorEnabled = true;

    return HttpResponse.json({
      success: true,
      user,
      qrCode: 'data:image/png;base64,mock-qr-code',
    });
  }),
];

// ============================================
// USER HANDLERS
// ============================================

export const userHandlers = [
  // Get user profile
  http.get(`${API_BASE}/users/:userId`, async ({ params }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const { userId } = params;
    const user = getUserById(userId as string);

    if (!user) {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(user);
  }),

  // Update user profile
  http.patch(`${API_BASE}/users/:userId`, async ({ request, params }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const { userId } = params;
    const updates = await request.json() as Partial<User>;

    const user = getUserById(userId as string);
    if (!user) {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Apply updates
    Object.assign(user, updates);

    return HttpResponse.json(user);
  }),

  // Get user's innermosts
  http.get(`${API_BASE}/users/:userId/innermosts`, async ({ params }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const { userId } = params;
    const innermosts = getUserInnermosts(userId as string);

    return HttpResponse.json(innermosts);
  }),

  // Update subscription
  http.post(`${API_BASE}/users/:userId/subscription`, async ({ request, params }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const { userId } = params;
    const body = await request.json() as any;
    const { plan } = body;

    const user = getUserById(userId as string);
    if (!user) {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check limits for free plan
    if (plan === 'free' && user.activeInnermosts.length > 1) {
      return HttpResponse.json(
        { error: 'Free plan limited to 1 innermost relationship' },
        { status: 400 }
      );
    }

    user.subscriptionStatus = plan;
    if (plan === 'premium') {
      user.subscriptionEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }

    return HttpResponse.json({
      success: true,
      user,
    });
  }),
];

// ============================================
// INNERMOST HANDLERS
// ============================================

export const innermostHandlers = [
  // Create innermost
  http.post(`${API_BASE}/innermosts`, async ({ request }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const user = requireAuth(request);
    const body = await request.json() as any;
    const { partnerEmail, inviteMessage } = body;

    // Check subscription limits
    if (user.subscriptionStatus === 'free' && user.activeInnermosts.length >= 1) {
      return HttpResponse.json(
        { error: 'Free users limited to 1 innermost relationship' },
        { status: 403 }
      );
    }

    if (user.subscriptionStatus === 'premium' && user.activeInnermosts.length >= 5) {
      return HttpResponse.json(
        { error: 'Premium users limited to 5 innermost relationships' },
        { status: 403 }
      );
    }

    // Create new innermost
    const innermost = createMockInnermost({
      partnerA: user.id,
      partnerAName: user.displayName,
      partnerAEmail: user.email,
      partnerBEmail: partnerEmail,
      status: 'pending',
      pairingCode: `TREE${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      inviteMessage,
    });

    // Create invitation
    const invitation = createMockPairingInvitation({
      fromUserId: user.id,
      fromUserName: user.displayName,
      toEmail: partnerEmail,
      status: 'pending',
    });

    return HttpResponse.json({
      innermost,
      invitation,
    });
  }),

  // Get innermost details
  http.get(`${API_BASE}/innermosts/:innermostId`, async ({ params, request }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const user = requireAuth(request);
    const { innermostId } = params;
    const innermost = getInnermostById(innermostId as string);

    if (!innermost) {
      return HttpResponse.json(
        { error: 'Innermost not found' },
        { status: 404 }
      );
    }

    // Check if user is part of this innermost
    if (innermost.partnerA !== user.id && innermost.partnerB !== user.id) {
      return HttpResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return HttpResponse.json(innermost);
  }),

  // Accept innermost invitation
  http.post(`${API_BASE}/innermosts/:innermostId/accept`, async ({ params, request }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const user = requireAuth(request);
    const { innermostId } = params;
    const innermost = getInnermostById(innermostId as string);

    if (!innermost) {
      return HttpResponse.json(
        { error: 'Innermost not found' },
        { status: 404 }
      );
    }

    innermost.status = 'active';
    innermost.partnerB = user.id;
    innermost.partnerBName = user.displayName;

    return HttpResponse.json(innermost);
  }),

  // Pause innermost
  http.post(`${API_BASE}/innermosts/:innermostId/pause`, async ({ params, request }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const user = requireAuth(request);
    const { innermostId } = params;
    const innermost = getInnermostById(innermostId as string);

    if (!innermost) {
      return HttpResponse.json(
        { error: 'Innermost not found' },
        { status: 404 }
      );
    }

    innermost.status = 'paused';

    return HttpResponse.json(innermost);
  }),
];

// ============================================
// WILLING BOX HANDLERS
// ============================================

export const willingBoxHandlers = [
  // Get willing box
  http.get(`${API_BASE}/willing-boxes/:boxId`, async ({ params, request }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const user = requireAuth(request);
    const { boxId } = params;
    const willingBox = getWillingBoxById(boxId as string);

    if (!willingBox) {
      return HttpResponse.json(
        { error: 'Willing box not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (willingBox.partnerA !== user.id && willingBox.partnerB !== user.id) {
      return HttpResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return HttpResponse.json(willingBox);
  }),

  // Get active willing box for innermost
  http.get(`${API_BASE}/innermosts/:innermostId/willing-box`, async ({ params, request }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const user = requireAuth(request);
    const { innermostId } = params;
    const willingBox = getActiveWillingBox(innermostId as string);

    if (!willingBox) {
      // Create new willing box
      const innermost = getInnermostById(innermostId as string);
      if (!innermost) {
        return HttpResponse.json(
          { error: 'Innermost not found' },
          { status: 404 }
        );
      }

      const newBox = createMockWillingBox({
        innermostId: innermost.id,
        partnerA: innermost.partnerA,
        partnerB: innermost.partnerB,
        weekNumber: innermost.currentWeek,
        status: 'planting_trees',
      });

      return HttpResponse.json(newBox);
    }

    return HttpResponse.json(willingBox);
  }),

  // Create/Update wishes
  http.post(`${API_BASE}/willing-boxes/:boxId/wishes`, async ({ params, request }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const user = requireAuth(request);
    const { boxId } = params;
    const body = await request.json() as any;
    const { wishes } = body;

    const willingBox = getWillingBoxById(boxId as string);
    if (!willingBox) {
      return HttpResponse.json(
        { error: 'Willing box not found' },
        { status: 404 }
      );
    }

    // Check if box is locked
    if (willingBox.isLocked) {
      return HttpResponse.json(
        { error: 'Willing box is locked' },
        { status: 400 }
      );
    }

    // Update wishes based on user
    const wishList = wishes.map((w: any, index: number) =>
      createMockWant({
        ...w,
        order: index + 1,
        createdBy: user.id,
      })
    );

    if (willingBox.partnerA === user.id) {
      willingBox.partnerAWishList = wishList;
    } else if (willingBox.partnerB === user.id) {
      willingBox.partnerBWishList = wishList;
    }

    // Check if ready to move to selecting phase
    if (willingBox.partnerAWishList.length === 12 && willingBox.partnerBWishList.length === 12) {
      willingBox.status = 'selecting_willing';
    }

    return HttpResponse.json(willingBox);
  }),

  // Submit willing selections
  http.post(`${API_BASE}/willing-boxes/:boxId/willing`, async ({ params, request }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const user = requireAuth(request);
    const { boxId } = params;
    const body = await request.json() as any;
    const { willingItems } = body;

    const willingBox = getWillingBoxById(boxId as string);
    if (!willingBox) {
      return HttpResponse.json(
        { error: 'Willing box not found' },
        { status: 404 }
      );
    }

    // Check status
    if (willingBox.status !== 'selecting_willing') {
      return HttpResponse.json(
        { error: 'Not in willing selection phase' },
        { status: 400 }
      );
    }

    // Update willing list based on user
    if (willingBox.partnerA === user.id) {
      willingBox.partnerAWillingList = willingItems;
    } else if (willingBox.partnerB === user.id) {
      willingBox.partnerBWillingList = willingItems;
    }

    // Check if both partners have submitted
    if (willingBox.partnerAWillingList.length === 3 && willingBox.partnerBWillingList.length === 3) {
      willingBox.status = 'guessing';
      willingBox.isLocked = true;
      willingBox.lockedAt = new Date();
    }

    return HttpResponse.json(willingBox);
  }),

  // Submit guesses
  http.post(`${API_BASE}/willing-boxes/:boxId/guess`, async ({ params, request }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const user = requireAuth(request);
    const { boxId } = params;
    const body = await request.json() as any;
    const { guesses } = body;

    const willingBox = getWillingBoxById(boxId as string);
    if (!willingBox) {
      return HttpResponse.json(
        { error: 'Willing box not found' },
        { status: 404 }
      );
    }

    // Check status
    if (willingBox.status !== 'guessing') {
      return HttpResponse.json(
        { error: 'Not in guessing phase' },
        { status: 400 }
      );
    }

    // Create weekly score
    const score = createMockWeeklyScore({
      innermostId: willingBox.innermostId,
      weekNumber: willingBox.weekNumber,
      partnerA: willingBox.partnerA,
      partnerB: willingBox.partnerB,
      partnerAGuesses: user.id === willingBox.partnerA ? guesses : [],
      partnerBGuesses: user.id === willingBox.partnerB ? guesses : [],
    });

    // Check if it's day 7 (reveal day)
    const daysSinceLocked = willingBox.lockedAt
      ? (Date.now() - new Date(willingBox.lockedAt).getTime()) / (1000 * 60 * 60 * 24)
      : 0;

    if (daysSinceLocked >= 7) {
      willingBox.status = 'revealed';
    }

    return HttpResponse.json({
      willingBox,
      score,
    });
  }),
];

// ============================================
// WEEKLY SCORE HANDLERS
// ============================================

export const scoreHandlers = [
  // Get scores for innermost
  http.get(`${API_BASE}/innermosts/:innermostId/scores`, async ({ params, request }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const user = requireAuth(request);
    const { innermostId } = params;
    const scores = getWeeklyScoresForInnermost(innermostId as string);

    return HttpResponse.json(scores);
  }),

  // Get specific week score
  http.get(`${API_BASE}/innermosts/:innermostId/scores/:week`, async ({ params, request }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const user = requireAuth(request);
    const { innermostId, week } = params;
    const scores = getWeeklyScoresForInnermost(innermostId as string);
    const weekScore = scores.find(s => s.weekNumber === parseInt(week as string));

    if (!weekScore) {
      return HttpResponse.json(
        { error: 'Score not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(weekScore);
  }),
];

// ============================================
// ANALYTICS HANDLERS
// ============================================

export const analyticsHandlers = [
  // Get user analytics
  http.get(`${API_BASE}/analytics/user/:userId`, async ({ params }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const { userId } = params;
    const user = getUserById(userId as string);

    if (!user) {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const innermosts = getUserInnermosts(userId as string);
    const scores = innermosts.flatMap(i =>
      getWeeklyScoresForInnermost(i.id)
    );

    const analytics = {
      totalGamesPlayed: scores.length,
      averageScore: scores.reduce((acc, s) => {
        const score = user.id === s.partnerA ? s.partnerAScore : s.partnerBScore;
        return acc + score;
      }, 0) / (scores.length || 1),
      winRate: scores.filter(s => {
        const userScore = user.id === s.partnerA ? s.partnerAScore : s.partnerBScore;
        const partnerScore = user.id === s.partnerA ? s.partnerBScore : s.partnerAScore;
        return userScore > partnerScore;
      }).length / (scores.length || 1),
      currentStreak: Math.floor(Math.random() * 10),
      longestStreak: Math.floor(Math.random() * 20),
    };

    return HttpResponse.json(analytics);
  }),

  // Get global analytics (admin only)
  http.get(`${API_BASE}/analytics/global`, async ({ request }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const user = requireAuth(request);

    // Check if user is admin (for demo, check if premium)
    if (user.subscriptionStatus !== 'premium') {
      return HttpResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return HttpResponse.json(mockAnalyticsData);
  }),
];

// ============================================
// INVITATION HANDLERS
// ============================================

export const invitationHandlers = [
  // Send invitation
  http.post(`${API_BASE}/invitations`, async ({ request }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const user = requireAuth(request);
    const body = await request.json() as any;
    const { email, message } = body;

    const invitation = createMockPairingInvitation({
      fromUserId: user.id,
      fromUserName: user.displayName,
      toEmail: email,
      status: 'pending',
    });

    return HttpResponse.json(invitation);
  }),

  // Get user's invitations
  http.get(`${API_BASE}/invitations`, async ({ request }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const user = requireAuth(request);
    const invitations = mockPairingInvitations.filter(
      inv => inv.fromUserId === user.id || inv.toEmail === user.email
    );

    return HttpResponse.json(invitations);
  }),

  // Accept invitation
  http.post(`${API_BASE}/invitations/:inviteId/accept`, async ({ params, request }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const user = requireAuth(request);
    const { inviteId } = params;
    const invitation = mockPairingInvitations.find(inv => inv.id === inviteId);

    if (!invitation) {
      return HttpResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    invitation.status = 'accepted';
    invitation.toUserId = user.id;

    return HttpResponse.json(invitation);
  }),

  // Decline invitation
  http.post(`${API_BASE}/invitations/:inviteId/decline`, async ({ params }) => {
    await delay(MOCK_DELAY);
    maybeError();

    const { inviteId } = params;
    const invitation = mockPairingInvitations.find(inv => inv.id === inviteId);

    if (!invitation) {
      return HttpResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    invitation.status = 'declined';

    return HttpResponse.json(invitation);
  }),
];

// ============================================
// COMBINED HANDLERS
// ============================================

export const handlers = [
  ...authHandlers,
  ...userHandlers,
  ...innermostHandlers,
  ...willingBoxHandlers,
  ...scoreHandlers,
  ...analyticsHandlers,
  ...invitationHandlers,
];

// ============================================
// MOCK SERVER SETUP
// ============================================

export const setupMockServer = () => {
  if (typeof window !== 'undefined') {
    // Browser environment
    return import('msw/browser').then(({ setupWorker }) => {
      const worker = setupWorker(...handlers);
      return worker.start({
        onUnhandledRequest: 'bypass', // Don't intercept unhandled requests
      });
    });
  } else {
    // Node environment (for tests)
    return import('msw/node').then(({ setupServer }) => {
      const server = setupServer(...handlers);
      server.listen({
        onUnhandledRequest: 'bypass',
      });
      return server;
    });
  }
};

// Export for testing
export default handlers;
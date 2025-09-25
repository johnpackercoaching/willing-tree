/**
 * Mock Data for Willing Tree Application
 * Comprehensive test data including edge cases and various scenarios
 */

import type { User, Innermost, Wish, WillingBox, WeeklyScore, PairingInvitation } from '../types';

// ============================================
// USERS - Various subscription types and states
// ============================================

export const mockUsers: User[] = [
  // Premium users with active relationships
  {
    id: 'user-premium-1',
    email: 'alice@example.com',
    displayName: 'Alice Johnson',
    age: 32,
    gender: 'female',
    activeInnermosts: ['innermost-1', 'innermost-2'],
    createdAt: new Date('2024-01-15'),
    subscriptionStatus: 'premium',
    subscriptionEndDate: new Date('2025-01-15'),
    lastLogin: new Date('2024-09-24'),
    emailVerified: true,
    twoFactorEnabled: true,
  },
  {
    id: 'user-premium-2',
    email: 'bob@example.com',
    displayName: 'Bob Smith',
    age: 35,
    gender: 'male',
    activeInnermosts: ['innermost-1'],
    createdAt: new Date('2024-01-20'),
    subscriptionStatus: 'premium',
    subscriptionEndDate: new Date('2025-01-20'),
    lastLogin: new Date('2024-09-23'),
    emailVerified: true,
    twoFactorEnabled: false,
  },

  // Free users with limited features
  {
    id: 'user-free-1',
    email: 'charlie@example.com',
    displayName: 'Charlie Davis',
    age: 28,
    gender: 'other',
    activeInnermosts: ['innermost-3'],
    createdAt: new Date('2024-03-10'),
    subscriptionStatus: 'free',
    lastLogin: new Date('2024-09-20'),
    emailVerified: true,
    twoFactorEnabled: false,
  },
  {
    id: 'user-free-2',
    email: 'diana@example.com',
    displayName: 'Diana Martinez',
    age: 30,
    gender: 'female',
    activeInnermosts: ['innermost-3'],
    createdAt: new Date('2024-03-15'),
    subscriptionStatus: 'free',
    lastLogin: new Date('2024-09-22'),
    emailVerified: false,
    twoFactorEnabled: false,
  },

  // Expired subscription user
  {
    id: 'user-expired-1',
    email: 'edward@example.com',
    displayName: 'Edward Wilson',
    age: 40,
    gender: 'male',
    activeInnermosts: [],
    createdAt: new Date('2023-06-01'),
    subscriptionStatus: 'expired',
    subscriptionEndDate: new Date('2024-06-01'),
    lastLogin: new Date('2024-09-15'),
    emailVerified: true,
    twoFactorEnabled: false,
  },

  // New user with no relationships
  {
    id: 'user-new-1',
    email: 'fiona@example.com',
    displayName: 'Fiona Green',
    age: 26,
    gender: 'female',
    activeInnermosts: [],
    createdAt: new Date('2024-09-24'),
    subscriptionStatus: 'free',
    lastLogin: new Date('2024-09-24'),
    emailVerified: false,
    twoFactorEnabled: false,
  },

  // Premium user at max capacity
  {
    id: 'user-max-capacity',
    email: 'george@example.com',
    displayName: 'George Harrison',
    age: 45,
    gender: 'male',
    activeInnermosts: ['innermost-2', 'innermost-4', 'innermost-5', 'innermost-6', 'innermost-7'],
    createdAt: new Date('2023-11-01'),
    subscriptionStatus: 'premium',
    subscriptionEndDate: new Date('2024-11-01'),
    lastLogin: new Date('2024-09-24'),
    emailVerified: true,
    twoFactorEnabled: true,
  },
];

// ============================================
// INNERMOSTS - Relationship profiles
// ============================================

export const mockInnermosts: Innermost[] = [
  // Active relationship between premium users
  {
    id: 'innermost-1',
    partnerA: 'user-premium-1',
    partnerB: 'user-premium-2',
    partnerAName: 'Alice Johnson',
    partnerBName: 'Bob Smith',
    partnerAEmail: 'alice@example.com',
    partnerBEmail: 'bob@example.com',
    currentWeek: 8,
    status: 'active',
    createdAt: new Date('2024-02-01'),
  },

  // New relationship in week 1
  {
    id: 'innermost-2',
    partnerA: 'user-premium-1',
    partnerB: 'user-max-capacity',
    partnerAName: 'Alice Johnson',
    partnerBName: 'George Harrison',
    partnerAEmail: 'alice@example.com',
    partnerBEmail: 'george@example.com',
    currentWeek: 1,
    status: 'active',
    createdAt: new Date('2024-09-20'),
  },

  // Free users relationship
  {
    id: 'innermost-3',
    partnerA: 'user-free-1',
    partnerB: 'user-free-2',
    partnerAName: 'Charlie Davis',
    partnerBName: 'Diana Martinez',
    partnerAEmail: 'charlie@example.com',
    partnerBEmail: 'diana@example.com',
    currentWeek: 4,
    status: 'active',
    createdAt: new Date('2024-08-01'),
  },

  // Paused relationship
  {
    id: 'innermost-4',
    partnerA: 'user-max-capacity',
    partnerB: 'user-expired-1',
    partnerAName: 'George Harrison',
    partnerBName: 'Edward Wilson',
    partnerAEmail: 'george@example.com',
    partnerBEmail: 'edward@example.com',
    currentWeek: 12,
    status: 'paused',
    createdAt: new Date('2024-06-01'),
  },

  // Pending invitation
  {
    id: 'innermost-5',
    partnerA: 'user-max-capacity',
    partnerB: 'user-new-1',
    partnerAName: 'George Harrison',
    partnerBName: 'Fiona Green',
    partnerAEmail: 'george@example.com',
    partnerBEmail: 'fiona@example.com',
    currentWeek: 0,
    status: 'pending',
    pairingCode: 'TREE2024',
    inviteMessage: 'Lets grow our willing tree together!',
    createdAt: new Date('2024-09-23'),
  },
];

// ============================================
// WISHES/WANTS - Various categories and priorities
// ============================================

export const mockWishes: Record<string, Wish[]> = {
  // Alice's wishes for Bob
  'alice-wishes': [
    { id: 'wish-a1', text: 'Call me during lunch breaks', category: 'communication', isMostWanted: true, order: 1, createdBy: 'user-premium-1' },
    { id: 'wish-a2', text: 'Share your daily highs and lows', category: 'communication', isMostWanted: false, order: 2, createdBy: 'user-premium-1' },
    { id: 'wish-a3', text: 'Give me a morning hug', category: 'affection', isMostWanted: false, order: 3, createdBy: 'user-premium-1' },
    { id: 'wish-a4', text: 'Leave sweet notes in unexpected places', category: 'affection', isMostWanted: false, order: 4, createdBy: 'user-premium-1' },
    { id: 'wish-a5', text: 'Cook dinner twice a week', category: 'household', isMostWanted: false, order: 5, createdBy: 'user-premium-1' },
    { id: 'wish-a6', text: 'Take out the trash without being asked', category: 'household', isMostWanted: false, order: 6, createdBy: 'user-premium-1' },
    { id: 'wish-a7', text: 'Plan a surprise date night monthly', category: 'time', isMostWanted: false, order: 7, createdBy: 'user-premium-1' },
    { id: 'wish-a8', text: 'Watch my favorite show with me', category: 'time', isMostWanted: false, order: 8, createdBy: 'user-premium-1' },
    { id: 'wish-a9', text: 'Exercise together on weekends', category: 'personal', isMostWanted: false, order: 9, createdBy: 'user-premium-1' },
    { id: 'wish-a10', text: 'Support my hobby projects', category: 'personal', isMostWanted: false, order: 10, createdBy: 'user-premium-1' },
    { id: 'wish-a11', text: 'Text me good morning daily', category: 'communication', isMostWanted: false, order: 11, createdBy: 'user-premium-1' },
    { id: 'wish-a12', text: 'Help with weekly meal prep', category: 'household', isMostWanted: false, order: 12, createdBy: 'user-premium-1' },
  ],

  // Bob's wishes for Alice
  'bob-wishes': [
    { id: 'wish-b1', text: 'Listen without interrupting', category: 'communication', isMostWanted: false, order: 1, createdBy: 'user-premium-2' },
    { id: 'wish-b2', text: 'Ask about my work projects', category: 'communication', isMostWanted: false, order: 2, createdBy: 'user-premium-2' },
    { id: 'wish-b3', text: 'Hold hands while watching TV', category: 'affection', isMostWanted: true, order: 3, createdBy: 'user-premium-2' },
    { id: 'wish-b4', text: 'Compliment me more often', category: 'affection', isMostWanted: false, order: 4, createdBy: 'user-premium-2' },
    { id: 'wish-b5', text: 'Keep the bedroom tidy', category: 'household', isMostWanted: false, order: 5, createdBy: 'user-premium-2' },
    { id: 'wish-b6', text: 'Share household budgeting tasks', category: 'household', isMostWanted: false, order: 6, createdBy: 'user-premium-2' },
    { id: 'wish-b7', text: 'Join me for morning coffee', category: 'time', isMostWanted: false, order: 7, createdBy: 'user-premium-2' },
    { id: 'wish-b8', text: 'Have tech-free evenings together', category: 'time', isMostWanted: false, order: 8, createdBy: 'user-premium-2' },
    { id: 'wish-b9', text: 'Try my favorite hobby with me', category: 'personal', isMostWanted: false, order: 9, createdBy: 'user-premium-2' },
    { id: 'wish-b10', text: 'Give me alone time when needed', category: 'personal', isMostWanted: false, order: 10, createdBy: 'user-premium-2' },
    { id: 'wish-b11', text: 'Celebrate small victories together', category: 'affection', isMostWanted: false, order: 11, createdBy: 'user-premium-2' },
    { id: 'wish-b12', text: 'Plan weekend adventures', category: 'time', isMostWanted: false, order: 12, createdBy: 'user-premium-2' },
  ],

  // Empty wishes list (edge case)
  'empty-wishes': [],

  // Minimal wishes list (edge case - only 3 items)
  'minimal-wishes': [
    { id: 'wish-min1', text: 'Be present', category: 'time', isMostWanted: true, order: 1, createdBy: 'user-free-1' },
    { id: 'wish-min2', text: 'Show appreciation', category: 'affection', isMostWanted: false, order: 2, createdBy: 'user-free-1' },
    { id: 'wish-min3', text: 'Communicate openly', category: 'communication', isMostWanted: false, order: 3, createdBy: 'user-free-1' },
  ],
};

// ============================================
// WILLING BOXES - Weekly game state
// ============================================

export const mockWillingBoxes: WillingBox[] = [
  // Week in progress - selecting willing phase
  {
    id: 'willingbox-1',
    innermostId: 'innermost-1',
    partnerA: 'user-premium-1',
    partnerB: 'user-premium-2',
    partnerAWishList: mockWishes['alice-wishes'],
    partnerBWishList: mockWishes['bob-wishes'],
    partnerAWillingList: [],
    partnerBWillingList: [],
    weekNumber: 8,
    status: 'selecting_willing',
    isLocked: false,
    createdAt: new Date('2024-09-22'),
  },

  // Week in guessing phase
  {
    id: 'willingbox-2',
    innermostId: 'innermost-1',
    partnerA: 'user-premium-1',
    partnerB: 'user-premium-2',
    partnerAWishList: mockWishes['alice-wishes'],
    partnerBWishList: mockWishes['bob-wishes'],
    partnerAWillingList: [
      { wishId: 'wish-b3', priority: 1, effortLevel: 'easy' },
      { wishId: 'wish-b7', priority: 2, effortLevel: 'moderate' },
      { wishId: 'wish-b10', priority: 3, effortLevel: 'easy' },
    ],
    partnerBWillingList: [
      { wishId: 'wish-a1', priority: 1, effortLevel: 'moderate' },
      { wishId: 'wish-a3', priority: 2, effortLevel: 'easy' },
      { wishId: 'wish-a7', priority: 3, effortLevel: 'challenging' },
    ],
    weekNumber: 7,
    status: 'guessing',
    isLocked: true,
    lockedAt: new Date('2024-09-15'),
    createdAt: new Date('2024-09-08'),
  },

  // Completed week - revealed
  {
    id: 'willingbox-3',
    innermostId: 'innermost-1',
    partnerA: 'user-premium-1',
    partnerB: 'user-premium-2',
    partnerAWishList: mockWishes['alice-wishes'],
    partnerBWishList: mockWishes['bob-wishes'],
    partnerAWillingList: [
      { wishId: 'wish-b1', priority: 1, effortLevel: 'moderate' },
      { wishId: 'wish-b5', priority: 2, effortLevel: 'easy' },
      { wishId: 'wish-b9', priority: 3, effortLevel: 'challenging' },
    ],
    partnerBWillingList: [
      { wishId: 'wish-a2', priority: 1, effortLevel: 'easy' },
      { wishId: 'wish-a6', priority: 2, effortLevel: 'moderate' },
      { wishId: 'wish-a11', priority: 3, effortLevel: 'easy' },
    ],
    weekNumber: 6,
    status: 'revealed',
    isLocked: true,
    lockedAt: new Date('2024-09-08'),
    createdAt: new Date('2024-09-01'),
  },

  // New week - planting trees phase
  {
    id: 'willingbox-4',
    innermostId: 'innermost-2',
    partnerA: 'user-premium-1',
    partnerB: 'user-max-capacity',
    partnerAWishList: [],
    partnerBWishList: [],
    partnerAWillingList: [],
    partnerBWillingList: [],
    weekNumber: 1,
    status: 'planting_trees',
    isLocked: false,
    createdAt: new Date('2024-09-20'),
  },

  // Empty state - no wishes yet
  {
    id: 'willingbox-empty',
    innermostId: 'innermost-3',
    partnerA: 'user-free-1',
    partnerB: 'user-free-2',
    partnerAWishList: [],
    partnerBWishList: [],
    partnerAWillingList: [],
    partnerBWillingList: [],
    weekNumber: 4,
    status: 'planting_trees',
    isLocked: false,
    createdAt: new Date('2024-09-22'),
  },
];

// ============================================
// WEEKLY SCORES - Game results
// ============================================

export const mockWeeklyScores: WeeklyScore[] = [
  // Perfect score week
  {
    id: 'score-1',
    innermostId: 'innermost-1',
    weekNumber: 6,
    partnerA: 'user-premium-1',
    partnerB: 'user-premium-2',
    partnerAGuesses: [
      { wantId: 'wish-b1', effort: 'moderate' },
      { wantId: 'wish-b5', effort: 'easy' },
      { wantId: 'wish-b9', effort: 'challenging' },
    ],
    partnerBGuesses: [
      { wantId: 'wish-a2', effort: 'easy' },
      { wantId: 'wish-a6', effort: 'moderate' },
      { wantId: 'wish-a11', effort: 'easy' },
    ],
    partnerAScore: 100, // Perfect guesses
    partnerBScore: 100, // Perfect guesses
    isComplete: true,
    completedAt: new Date('2024-09-08'),
  },

  // Partial score week
  {
    id: 'score-2',
    innermostId: 'innermost-1',
    weekNumber: 5,
    partnerA: 'user-premium-1',
    partnerB: 'user-premium-2',
    partnerAGuesses: [
      { wantId: 'wish-b3', effort: 'easy' }, // Correct
      { wantId: 'wish-b4', effort: 'moderate' }, // Wrong
      { wantId: 'wish-b8', effort: 'easy' }, // Wrong
    ],
    partnerBGuesses: [
      { wantId: 'wish-a1', effort: 'moderate' }, // Correct with most wanted bonus
      { wantId: 'wish-a5', effort: 'easy' }, // Wrong
      { wantId: 'wish-a9', effort: 'challenging' }, // Wrong
    ],
    partnerAScore: 40, // 1 correct guess, priority 1 = 40 points
    partnerBScore: 60, // 1 correct most wanted = 60 points
    isComplete: true,
    completedAt: new Date('2024-09-01'),
  },

  // Zero score week (all wrong)
  {
    id: 'score-3',
    innermostId: 'innermost-3',
    weekNumber: 3,
    partnerA: 'user-free-1',
    partnerB: 'user-free-2',
    partnerAGuesses: [
      { wantId: 'wish-min1', effort: 'easy' },
      { wantId: 'wish-min2', effort: 'moderate' },
      { wantId: 'wish-min3', effort: 'challenging' },
    ],
    partnerBGuesses: [],
    partnerAScore: 0,
    partnerBScore: 0,
    isComplete: true,
    completedAt: new Date('2024-08-25'),
  },

  // Incomplete week
  {
    id: 'score-4',
    innermostId: 'innermost-1',
    weekNumber: 7,
    partnerA: 'user-premium-1',
    partnerB: 'user-premium-2',
    partnerAGuesses: [],
    partnerBGuesses: [],
    partnerAScore: 0,
    partnerBScore: 0,
    isComplete: false,
  },
];

// ============================================
// PAIRING INVITATIONS
// ============================================

export const mockPairingInvitations: PairingInvitation[] = [
  // Pending invitation
  {
    id: 'invite-1',
    fromUserId: 'user-max-capacity',
    fromUserName: 'George Harrison',
    toEmail: 'fiona@example.com',
    status: 'pending',
    createdAt: new Date('2024-09-23'),
    expiresAt: new Date('2024-09-30'),
  },

  // Accepted invitation
  {
    id: 'invite-2',
    fromUserId: 'user-premium-1',
    fromUserName: 'Alice Johnson',
    toUserId: 'user-premium-2',
    toEmail: 'bob@example.com',
    status: 'accepted',
    createdAt: new Date('2024-02-01'),
    expiresAt: new Date('2024-02-08'),
  },

  // Expired invitation
  {
    id: 'invite-3',
    fromUserId: 'user-expired-1',
    fromUserName: 'Edward Wilson',
    toEmail: 'newuser@example.com',
    status: 'expired',
    createdAt: new Date('2024-08-01'),
    expiresAt: new Date('2024-08-08'),
  },

  // Declined invitation
  {
    id: 'invite-4',
    fromUserId: 'user-free-1',
    fromUserName: 'Charlie Davis',
    toEmail: 'declined@example.com',
    status: 'declined',
    createdAt: new Date('2024-07-15'),
    expiresAt: new Date('2024-07-22'),
  },
];

// ============================================
// ANALYTICS DATA
// ============================================

export const mockAnalyticsData = {
  userEngagement: {
    dailyActiveUsers: 1250,
    weeklyActiveUsers: 4500,
    monthlyActiveUsers: 12000,
    averageSessionDuration: 485, // seconds
    bounceRate: 0.35,
  },

  subscriptionMetrics: {
    totalUsers: 15000,
    premiumUsers: 3200,
    freeUsers: 11800,
    conversionRate: 0.21,
    churnRate: 0.08,
    averageRevenuePerUser: 4.99,
  },

  gameMetrics: {
    activeInnermosts: 6500,
    averageWeeklyScore: 65,
    completionRate: 0.78,
    averageWishesPerUser: 10.5,
    mostPopularCategory: 'affection',
    weeklyGamesPlayed: 4200,
  },

  performanceMetrics: {
    averageLoadTime: 1.2, // seconds
    errorRate: 0.002,
    apiResponseTime: 150, // ms
    cacheHitRate: 0.85,
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getCurrentUser = (): User => mockUsers[0];

export const getUserById = (id: string): User | undefined =>
  mockUsers.find(user => user.id === id);

export const getInnermostById = (id: string): Innermost | undefined =>
  mockInnermosts.find(innermost => innermost.id === id);

export const getWillingBoxById = (id: string): WillingBox | undefined =>
  mockWillingBoxes.find(box => box.id === id);

export const getUserInnermosts = (userId: string): Innermost[] =>
  mockInnermosts.filter(innermost =>
    innermost.partnerA === userId || innermost.partnerB === userId
  );

export const getActiveWillingBox = (innermostId: string): WillingBox | undefined =>
  mockWillingBoxes.find(box =>
    box.innermostId === innermostId && box.status !== 'revealed'
  );

export const getWeeklyScoresForInnermost = (innermostId: string): WeeklyScore[] =>
  mockWeeklyScores.filter(score => score.innermostId === innermostId);

// Test scenarios helper
export const testScenarios = {
  emptyState: {
    user: mockUsers.find(u => u.id === 'user-new-1')!,
    innermosts: [],
    willingBoxes: [],
    scores: [],
  },

  activeGame: {
    user: mockUsers[0],
    innermost: mockInnermosts[0],
    willingBox: mockWillingBoxes[0],
    scores: mockWeeklyScores.filter(s => s.innermostId === 'innermost-1'),
  },

  maxCapacity: {
    user: mockUsers.find(u => u.id === 'user-max-capacity')!,
    innermosts: getUserInnermosts('user-max-capacity'),
    willingBoxes: mockWillingBoxes,
    scores: mockWeeklyScores,
  },

  freeUserLimits: {
    user: mockUsers.find(u => u.id === 'user-free-1')!,
    innermost: mockInnermosts.find(i => i.id === 'innermost-3')!,
    willingBox: mockWillingBoxes.find(b => b.innermostId === 'innermost-3'),
    scores: mockWeeklyScores.filter(s => s.innermostId === 'innermost-3'),
  },
};
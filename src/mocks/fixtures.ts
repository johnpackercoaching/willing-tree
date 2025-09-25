/**
 * Factory Functions for Creating Mock Data
 * Provides flexible test data generation with sensible defaults
 */

import type { User, Innermost, Wish, WillingBox, WillingItem, WeeklyScore, WeeklyGuess, PairingInvitation } from '../types';

// ============================================
// USER FACTORY
// ============================================

export function createMockUser(overrides?: Partial<User>): User {
  const id = overrides?.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const defaultUser: User = {
    id,
    email: `${id}@example.com`,
    displayName: `Test User ${id.slice(-4)}`,
    age: 30 + Math.floor(Math.random() * 20),
    gender: (['male', 'female', 'other'] as const)[Math.floor(Math.random() * 3)],
    activeInnermosts: [],
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date within last year
    subscriptionStatus: 'free',
    lastLogin: new Date(),
    emailVerified: Math.random() > 0.3,
    twoFactorEnabled: false,
  };

  return {
    ...defaultUser,
    ...overrides,
  };
}

// ============================================
// INNERMOST FACTORY
// ============================================

export function createMockInnermost(overrides?: Partial<Innermost>): Innermost {
  const id = overrides?.id || `innermost-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const defaultInnermost: Innermost = {
    id,
    partnerA: overrides?.partnerA || `user-a-${id.slice(-4)}`,
    partnerB: overrides?.partnerB || `user-b-${id.slice(-4)}`,
    partnerAName: overrides?.partnerAName || `Partner A`,
    partnerBName: overrides?.partnerBName || `Partner B`,
    partnerAEmail: overrides?.partnerAEmail || `partner-a-${id.slice(-4)}@example.com`,
    partnerBEmail: overrides?.partnerBEmail || `partner-b-${id.slice(-4)}@example.com`,
    currentWeek: Math.floor(Math.random() * 12) + 1,
    status: 'active',
    createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date within last 3 months
  };

  return {
    ...defaultInnermost,
    ...overrides,
  };
}

// ============================================
// WISH/WANT FACTORY
// ============================================

export function createMockWant(overrides?: Partial<Wish>): Wish {
  const categories: Wish['category'][] = ['communication', 'affection', 'household', 'time', 'personal'];
  const sampleWishes = [
    'Share daily gratitude',
    'Give more compliments',
    'Plan surprise dates',
    'Cook together weekly',
    'Exercise as a couple',
    'Have tech-free dinners',
    'Leave love notes',
    'Share household chores equally',
    'Listen without interrupting',
    'Support personal goals',
    'Create weekly rituals',
    'Express appreciation daily',
  ];

  const id = overrides?.id || `wish-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const defaultWish: Wish = {
    id,
    text: overrides?.text || sampleWishes[Math.floor(Math.random() * sampleWishes.length)],
    category: overrides?.category || categories[Math.floor(Math.random() * categories.length)],
    isMostWanted: overrides?.isMostWanted ?? false,
    order: overrides?.order ?? Math.floor(Math.random() * 12) + 1,
    createdBy: overrides?.createdBy || `user-${id.slice(-4)}`,
  };

  return {
    ...defaultWish,
    ...overrides,
  };
}

// Batch create wishes with one guaranteed mostWanted
export function createMockWishList(count: number = 12, createdBy: string): Wish[] {
  const wishes: Wish[] = [];
  const mostWantedIndex = Math.floor(Math.random() * Math.min(count, 12));

  for (let i = 0; i < count && i < 12; i++) {
    wishes.push(createMockWant({
      order: i + 1,
      isMostWanted: i === mostWantedIndex,
      createdBy,
    }));
  }

  return wishes;
}

// ============================================
// WILLING ITEM FACTORY
// ============================================

export function createMockWillingItem(overrides?: Partial<WillingItem>): WillingItem {
  const effortLevels: Array<'easy' | 'moderate' | 'challenging'> = ['easy', 'moderate', 'challenging'];

  const defaultWillingItem: WillingItem = {
    wishId: overrides?.wishId || `wish-${Math.random().toString(36).substr(2, 9)}`,
    priority: overrides?.priority ?? Math.floor(Math.random() * 3) + 1,
    effortLevel: overrides?.effortLevel || effortLevels[Math.floor(Math.random() * 3)],
  };

  return {
    ...defaultWillingItem,
    ...overrides,
  };
}

// Create a set of 3 willing items with proper priorities
export function createMockWillingList(wishIds: string[]): WillingItem[] {
  const selectedWishes = wishIds.slice(0, 3);
  const effortLevels: Array<'easy' | 'moderate' | 'challenging'> = ['easy', 'moderate', 'challenging'];

  return selectedWishes.map((wishId, index) => ({
    wishId,
    priority: index + 1,
    effortLevel: effortLevels[Math.floor(Math.random() * 3)],
  }));
}

// ============================================
// WILLING BOX FACTORY
// ============================================

export function createMockWillingBox(overrides?: Partial<WillingBox>): WillingBox {
  const id = overrides?.id || `willingbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const innermostId = overrides?.innermostId || `innermost-${id.slice(-4)}`;
  const partnerA = overrides?.partnerA || `user-a-${id.slice(-4)}`;
  const partnerB = overrides?.partnerB || `user-b-${id.slice(-4)}`;

  const statuses: WillingBox['status'][] = ['planting_trees', 'selecting_willing', 'guessing', 'revealed'];
  const status = overrides?.status || statuses[Math.floor(Math.random() * statuses.length)];

  // Create wishes based on status
  const partnerAWishList = status !== 'planting_trees'
    ? (overrides?.partnerAWishList || createMockWishList(12, partnerA))
    : [];

  const partnerBWishList = status !== 'planting_trees'
    ? (overrides?.partnerBWishList || createMockWishList(12, partnerB))
    : [];

  // Create willing lists based on status
  const shouldHaveWillingLists = status === 'guessing' || status === 'revealed';
  const partnerAWillingList = shouldHaveWillingLists
    ? (overrides?.partnerAWillingList || createMockWillingList(partnerBWishList.map(w => w.id)))
    : [];

  const partnerBWillingList = shouldHaveWillingLists
    ? (overrides?.partnerBWillingList || createMockWillingList(partnerAWishList.map(w => w.id)))
    : [];

  const defaultWillingBox: WillingBox = {
    id,
    innermostId,
    partnerA,
    partnerB,
    partnerAWishList,
    partnerBWishList,
    partnerAWillingList,
    partnerBWillingList,
    weekNumber: overrides?.weekNumber ?? Math.floor(Math.random() * 12) + 1,
    status,
    isLocked: status === 'guessing' || status === 'revealed',
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
  };

  if (defaultWillingBox.isLocked) {
    defaultWillingBox.lockedAt = new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000);
  }

  return {
    ...defaultWillingBox,
    ...overrides,
  };
}

// ============================================
// WEEKLY SCORE FACTORY
// ============================================

export function createMockWeeklyScore(overrides?: Partial<WeeklyScore>): WeeklyScore {
  const id = overrides?.id || `score-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const innermostId = overrides?.innermostId || `innermost-${id.slice(-4)}`;

  // Generate random guesses
  const generateGuesses = (count: number): WeeklyGuess[] => {
    const guesses: WeeklyGuess[] = [];
    for (let i = 0; i < count; i++) {
      guesses.push({
        wantId: `wish-${Math.random().toString(36).substr(2, 9)}`,
        effort: ['easy', 'moderate', 'challenging'][Math.floor(Math.random() * 3)],
      });
    }
    return guesses;
  };

  const partnerAGuesses = overrides?.partnerAGuesses || generateGuesses(3);
  const partnerBGuesses = overrides?.partnerBGuesses || generateGuesses(3);

  // Calculate realistic scores (0-100)
  const calculateScore = (guesses: WeeklyGuess[]): number => {
    if (guesses.length === 0) return 0;
    // Random score weighted towards middle range
    const base = Math.random() * 100;
    const weighted = base * 0.7 + 30; // Bias towards 30-100 range
    return Math.min(100, Math.round(weighted));
  };

  const defaultScore: WeeklyScore = {
    id,
    innermostId,
    weekNumber: overrides?.weekNumber ?? Math.floor(Math.random() * 12) + 1,
    partnerA: overrides?.partnerA || `user-a-${id.slice(-4)}`,
    partnerB: overrides?.partnerB || `user-b-${id.slice(-4)}`,
    partnerAGuesses,
    partnerBGuesses,
    partnerAScore: overrides?.partnerAScore ?? calculateScore(partnerAGuesses),
    partnerBScore: overrides?.partnerBScore ?? calculateScore(partnerBGuesses),
    isComplete: overrides?.isComplete ?? Math.random() > 0.2,
  };

  if (defaultScore.isComplete) {
    defaultScore.completedAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
  }

  return {
    ...defaultScore,
    ...overrides,
  };
}

// ============================================
// PAIRING INVITATION FACTORY
// ============================================

export function createMockPairingInvitation(overrides?: Partial<PairingInvitation>): PairingInvitation {
  const id = overrides?.id || `invite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const fromUserId = overrides?.fromUserId || `user-from-${id.slice(-4)}`;
  const statuses: PairingInvitation['status'][] = ['pending', 'accepted', 'declined', 'expired'];

  const createdAt = overrides?.createdAt || new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
  const expiresAt = overrides?.expiresAt || new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);

  const defaultInvitation: PairingInvitation = {
    id,
    fromUserId,
    fromUserName: overrides?.fromUserName || `User ${fromUserId.slice(-4)}`,
    toEmail: overrides?.toEmail || `invited-${id.slice(-4)}@example.com`,
    status: overrides?.status || statuses[Math.floor(Math.random() * statuses.length)],
    createdAt,
    expiresAt,
  };

  if (defaultInvitation.status === 'accepted' && !overrides?.toUserId) {
    defaultInvitation.toUserId = `user-to-${id.slice(-4)}`;
  }

  return {
    ...defaultInvitation,
    ...overrides,
  };
}

// ============================================
// SCENARIO BUILDERS
// ============================================

export const scenarioBuilders = {
  // Create a complete game scenario with all related data
  createCompleteGameScenario(userId: string = 'test-user') {
    const user = createMockUser({ id: userId, subscriptionStatus: 'premium' });
    const partner = createMockUser({ id: `${userId}-partner` });

    const innermost = createMockInnermost({
      partnerA: user.id,
      partnerB: partner.id,
      partnerAName: user.displayName,
      partnerBName: partner.displayName,
      partnerAEmail: user.email,
      partnerBEmail: partner.email,
    });

    const willingBox = createMockWillingBox({
      innermostId: innermost.id,
      partnerA: user.id,
      partnerB: partner.id,
      status: 'revealed',
    });

    const weeklyScore = createMockWeeklyScore({
      innermostId: innermost.id,
      partnerA: user.id,
      partnerB: partner.id,
      weekNumber: willingBox.weekNumber,
      isComplete: true,
    });

    return {
      user,
      partner,
      innermost,
      willingBox,
      weeklyScore,
    };
  },

  // Create new user scenario
  createNewUserScenario() {
    const user = createMockUser({
      activeInnermosts: [],
      subscriptionStatus: 'free',
      emailVerified: false,
      createdAt: new Date(),
    });

    return {
      user,
      invitations: [
        createMockPairingInvitation({
          fromUserId: user.id,
          fromUserName: user.displayName,
          status: 'pending',
        }),
      ],
    };
  },

  // Create max capacity scenario
  createMaxCapacityScenario() {
    const user = createMockUser({
      subscriptionStatus: 'premium',
    });

    const innermosts = Array.from({ length: 5 }, (_, i) =>
      createMockInnermost({
        partnerA: user.id,
        partnerAName: user.displayName,
        partnerAEmail: user.email,
        currentWeek: i + 1,
      })
    );

    user.activeInnermosts = innermosts.map(i => i.id);

    const willingBoxes = innermosts.map(innermost =>
      createMockWillingBox({
        innermostId: innermost.id,
        partnerA: user.id,
        weekNumber: innermost.currentWeek,
      })
    );

    return {
      user,
      innermosts,
      willingBoxes,
    };
  },

  // Create free user with limits scenario
  createFreeUserLimitsScenario() {
    const user = createMockUser({
      subscriptionStatus: 'free',
    });

    const innermost = createMockInnermost({
      partnerA: user.id,
      partnerAName: user.displayName,
      partnerAEmail: user.email,
    });

    user.activeInnermosts = [innermost.id];

    return {
      user,
      innermost,
      hasReachedLimit: true,
    };
  },
};
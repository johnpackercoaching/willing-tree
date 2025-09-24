import { renderHook } from '@testing-library/react';
import { usePremiumFeature, PremiumFeatures, useIsPremium } from './usePremiumFeature';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('../stores/authStore');
jest.mock('react-hot-toast');
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

describe('usePremiumFeature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Free User', () => {
    beforeEach(() => {
      (useAuthStore as jest.Mock).mockReturnValue({
        user: {
          id: '123',
          subscriptionStatus: 'free',
          activeInnermosts: [],
        },
      });
    });

    it('should not allow access to premium-only features', () => {
      const { result } = renderHook(() =>
        usePremiumFeature(PremiumFeatures.ANALYTICS_DASHBOARD)
      );

      expect(result.current.isAvailable).toBe(false);
      expect(result.current.requiresUpgrade).toBe(true);
      expect(result.current.featureName).toBe('Analytics Dashboard');
    });

    it('should allow access to features within free limits', () => {
      const { result } = renderHook(() =>
        usePremiumFeature(PremiumFeatures.MULTIPLE_INNERMOSTS, {
          currentUsage: 0,
        })
      );

      expect(result.current.isAvailable).toBe(true);
      expect(result.current.requiresUpgrade).toBe(false);
      expect(result.current.freeLimit).toBe(1);
      expect(result.current.premiumLimit).toBe(3);
    });

    it('should require upgrade when free limit is reached', () => {
      const { result } = renderHook(() =>
        usePremiumFeature(PremiumFeatures.MULTIPLE_INNERMOSTS, {
          currentUsage: 1,
        })
      );

      expect(result.current.isAvailable).toBe(false);
      expect(result.current.requiresUpgrade).toBe(true);
    });

    it('should show upgrade prompt', () => {
      const { result } = renderHook(() =>
        usePremiumFeature(PremiumFeatures.DATA_EXPORT)
      );

      result.current.showUpgradePrompt();

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Premium Feature'),
        expect.any(Object)
      );
    });
  });

  describe('Premium User', () => {
    beforeEach(() => {
      (useAuthStore as jest.Mock).mockReturnValue({
        user: {
          id: '123',
          subscriptionStatus: 'premium',
          activeInnermosts: ['inn1', 'inn2'],
        },
      });
    });

    it('should allow access to all features', () => {
      const { result } = renderHook(() =>
        usePremiumFeature(PremiumFeatures.ANALYTICS_DASHBOARD)
      );

      expect(result.current.isAvailable).toBe(true);
      expect(result.current.requiresUpgrade).toBe(false);
    });

    it('should not require upgrade even at premium limits', () => {
      const { result } = renderHook(() =>
        usePremiumFeature(PremiumFeatures.MULTIPLE_INNERMOSTS, {
          currentUsage: 2,
        })
      );

      expect(result.current.isAvailable).toBe(true);
      expect(result.current.requiresUpgrade).toBe(false);
    });
  });

  describe('Expired User', () => {
    beforeEach(() => {
      (useAuthStore as jest.Mock).mockReturnValue({
        user: {
          id: '123',
          subscriptionStatus: 'expired',
          activeInnermosts: [],
        },
      });
    });

    it('should treat expired users as free users', () => {
      const { result } = renderHook(() =>
        usePremiumFeature(PremiumFeatures.ANALYTICS_DASHBOARD)
      );

      expect(result.current.isAvailable).toBe(false);
      expect(result.current.requiresUpgrade).toBe(true);
    });

    it('should show renewal prompt', () => {
      const { result } = renderHook(() =>
        usePremiumFeature(PremiumFeatures.DATA_EXPORT)
      );

      result.current.showUpgradePrompt();

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Subscription Expired'),
        expect.any(Object)
      );
    });
  });

  describe('Custom Options', () => {
    beforeEach(() => {
      (useAuthStore as jest.Mock).mockReturnValue({
        user: {
          id: '123',
          subscriptionStatus: 'free',
          activeInnermosts: [],
        },
      });
    });

    it('should use custom message in upgrade prompt', () => {
      const customMessage = 'Get analytics to understand your relationships better!';
      const { result } = renderHook(() =>
        usePremiumFeature(PremiumFeatures.ANALYTICS_DASHBOARD, {
          customMessage,
        })
      );

      result.current.showUpgradePrompt();

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining(customMessage),
        expect.any(Object)
      );
    });

    it('should not log when silentCheck is true', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const { result } = renderHook(() =>
        usePremiumFeature(PremiumFeatures.DATA_EXPORT, {
          silentCheck: true,
        })
      );

      result.current.showUpgradePrompt();

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});

describe('useIsPremium', () => {
  it('should return premium status for premium users', () => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    (useAuthStore as jest.Mock).mockReturnValue({
      user: {
        id: '123',
        subscriptionStatus: 'premium',
        subscriptionEndDate: endDate,
      },
    });

    const { result } = renderHook(() => useIsPremium());

    expect(result.current.isPremium).toBe(true);
    expect(result.current.isExpired).toBe(false);
    expect(result.current.daysRemaining).toBeGreaterThanOrEqual(29);
    expect(result.current.daysRemaining).toBeLessThanOrEqual(30);
  });

  it('should return expired status for expired users', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      user: {
        id: '123',
        subscriptionStatus: 'expired',
      },
    });

    const { result } = renderHook(() => useIsPremium());

    expect(result.current.isPremium).toBe(false);
    expect(result.current.isExpired).toBe(true);
    expect(result.current.daysRemaining).toBeUndefined();
  });

  it('should calculate days remaining correctly', () => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7); // 7 days from now

    (useAuthStore as jest.Mock).mockReturnValue({
      user: {
        id: '123',
        subscriptionStatus: 'premium',
        subscriptionEndDate: endDate,
      },
    });

    const { result } = renderHook(() => useIsPremium());

    expect(result.current.daysRemaining).toBe(7);
  });

  it('should return 0 days for expired subscriptions', () => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1); // Yesterday

    (useAuthStore as jest.Mock).mockReturnValue({
      user: {
        id: '123',
        subscriptionStatus: 'premium',
        subscriptionEndDate: endDate,
      },
    });

    const { result } = renderHook(() => useIsPremium());

    expect(result.current.daysRemaining).toBe(0);
  });
});
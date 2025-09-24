import { useCallback, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Premium feature flags
export enum PremiumFeatures {
  MULTIPLE_INNERMOSTS = 'MULTIPLE_INNERMOSTS',
  ANALYTICS_DASHBOARD = 'ANALYTICS_DASHBOARD',
  DATA_EXPORT = 'DATA_EXPORT',
  CUSTOM_CATEGORIES = 'CUSTOM_CATEGORIES',
  EXTENDED_HISTORY = 'EXTENDED_HISTORY',
}

// Feature configuration
const FEATURE_CONFIG: Record<PremiumFeatures, {
  displayName: string;
  description: string;
  freeLimit?: number;
  premiumLimit?: number;
}> = {
  [PremiumFeatures.MULTIPLE_INNERMOSTS]: {
    displayName: 'Multiple Innermosts',
    description: 'Create up to 3 innermost partnerships instead of just 1',
    freeLimit: 1,
    premiumLimit: 3,
  },
  [PremiumFeatures.ANALYTICS_DASHBOARD]: {
    displayName: 'Analytics Dashboard',
    description: 'Access detailed insights and relationship analytics',
  },
  [PremiumFeatures.DATA_EXPORT]: {
    displayName: 'Data Export',
    description: 'Export your data in various formats',
  },
  [PremiumFeatures.CUSTOM_CATEGORIES]: {
    displayName: 'Custom Categories',
    description: 'Create custom wish categories beyond the defaults',
  },
  [PremiumFeatures.EXTENDED_HISTORY]: {
    displayName: 'Extended History',
    description: 'Access your complete history beyond the last 4 weeks',
  },
};

export interface PremiumFeature {
  isAvailable: boolean;
  requiresUpgrade: boolean;
  featureName: string;
  showUpgradePrompt: () => void;
  freeLimit?: number;
  premiumLimit?: number;
  currentUsage?: number;
}

interface UsePremiumFeatureOptions {
  currentUsage?: number;
  silentCheck?: boolean; // Don't show toast on check
  customMessage?: string; // Custom upgrade prompt message
}

export function usePremiumFeature(
  feature: PremiumFeatures,
  options?: UsePremiumFeatureOptions
): PremiumFeature {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const config = FEATURE_CONFIG[feature];
  const isPremium = user?.subscriptionStatus === 'premium';
  const isExpired = user?.subscriptionStatus === 'expired';

  // Determine if feature is available
  const isAvailable = useMemo(() => {
    // No user means no features
    if (!user) return false;

    // Premium users get everything
    if (isPremium) return true;

    // For features with limits, check if free tier has access
    if (config.freeLimit !== undefined && config.freeLimit > 0) {
      // If we have usage data, check against free limit
      if (options?.currentUsage !== undefined) {
        return options.currentUsage < config.freeLimit;
      }
      // Otherwise, feature is technically available but might be limited
      return true;
    }

    // Feature is premium-only
    return false;
  }, [user, isPremium, config.freeLimit, options?.currentUsage]);

  // Determine if upgrade is required
  const requiresUpgrade = useMemo(() => {
    // No user or already premium means no upgrade needed
    if (!user || isPremium) return false;

    // For features with limits, check if free limit is exceeded
    if (config.freeLimit !== undefined && options?.currentUsage !== undefined) {
      return options.currentUsage >= config.freeLimit;
    }

    // Feature is premium-only
    return config.freeLimit === undefined || config.freeLimit === 0;
  }, [user, isPremium, config.freeLimit, options?.currentUsage]);

  // Show upgrade prompt
  const showUpgradePrompt = useCallback(() => {
    const message = options?.customMessage ||
      `${config.displayName} is a premium feature. ${config.description}`;

    // Show toast with simple message and action
    const toastId = toast.error(
      isExpired
        ? `Subscription Expired: ${message}`
        : `Premium Feature: ${message}`,
      {
        duration: 6000,
        position: 'top-center',
        style: {
          minWidth: '320px',
        },
        icon: '🔒',
      }
    );

    // Add a follow-up toast with action button
    setTimeout(() => {
      toast.success(
        `Click here to ${isExpired ? 'renew subscription' : 'upgrade to premium'}`,
        {
          duration: 5000,
          position: 'top-center',
          style: {
            background: 'linear-gradient(to right, #9333ea, #ec4899)',
            color: 'white',
            cursor: 'pointer',
          },
          icon: '✨',
        }
      );
    }, 100);

    // Track upgrade prompt shown (you could send this to analytics)
    if (!options?.silentCheck) {
      console.log(`Premium upgrade prompt shown for feature: ${feature}`);
    }
  }, [
    feature,
    config,
    navigate,
    options?.customMessage,
    options?.silentCheck,
    isExpired,
  ]);

  return {
    isAvailable,
    requiresUpgrade,
    featureName: config.displayName,
    showUpgradePrompt,
    freeLimit: config.freeLimit,
    premiumLimit: config.premiumLimit,
    currentUsage: options?.currentUsage,
  };
}

// Convenience hook for checking multiple features
export function usePremiumFeatures(
  features: PremiumFeatures[]
): Record<PremiumFeatures, PremiumFeature> {
  const result: Partial<Record<PremiumFeatures, PremiumFeature>> = {};

  for (const feature of features) {
    result[feature] = usePremiumFeature(feature);
  }

  return result as Record<PremiumFeatures, PremiumFeature>;
}

// Hook to check if user is premium
export function useIsPremium(): {
  isPremium: boolean;
  isExpired: boolean;
  subscriptionEndDate?: Date;
  daysRemaining?: number;
} {
  const { user } = useAuthStore();

  const isPremium = user?.subscriptionStatus === 'premium';
  const isExpired = user?.subscriptionStatus === 'expired';
  const subscriptionEndDate = user?.subscriptionEndDate;

  const daysRemaining = useMemo(() => {
    if (!isPremium || !subscriptionEndDate) return undefined;

    const now = new Date();
    const endDate = subscriptionEndDate instanceof Date
      ? subscriptionEndDate
      : new Date(subscriptionEndDate);

    const diffMs = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }, [isPremium, subscriptionEndDate]);

  return {
    isPremium,
    isExpired,
    subscriptionEndDate,
    daysRemaining,
  };
}
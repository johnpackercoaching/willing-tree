# Premium Feature Hooks

## Overview

The `usePremiumFeature` hook provides a centralized way to manage premium feature access across the application. It handles:
- Feature availability checks
- Upgrade prompts with toast notifications
- Feature limits for free vs premium tiers
- Navigation to upgrade page

## Basic Usage

```typescript
import { usePremiumFeature, PremiumFeatures } from '../hooks/usePremiumFeature';

function MyComponent() {
  const analyticsFeature = usePremiumFeature(PremiumFeatures.ANALYTICS_DASHBOARD);

  const handleViewAnalytics = () => {
    if (!analyticsFeature.isAvailable) {
      analyticsFeature.showUpgradePrompt();
      return;
    }
    // Proceed with premium feature
  };

  return (
    <button onClick={handleViewAnalytics}>
      {analyticsFeature.isAvailable ? 'View Analytics' : 'Premium Only'}
    </button>
  );
}
```

## Available Features

| Feature | Description | Free Limit | Premium Limit |
|---------|-------------|------------|---------------|
| `MULTIPLE_INNERMOSTS` | Create multiple partnerships | 1 | 3 |
| `ANALYTICS_DASHBOARD` | Access detailed insights | ❌ | ✅ |
| `DATA_EXPORT` | Export data in various formats | ❌ | ✅ |
| `CUSTOM_CATEGORIES` | Create custom wish categories | ❌ | ✅ |
| `EXTENDED_HISTORY` | Access complete history | ❌ | ✅ |

## Hook Options

```typescript
usePremiumFeature(feature: PremiumFeatures, options?: {
  currentUsage?: number;    // Current usage count (for limited features)
  silentCheck?: boolean;     // Don't auto-show toast
  customMessage?: string;    // Custom upgrade prompt message
})
```

## Return Value

```typescript
interface PremiumFeature {
  isAvailable: boolean;       // Can user access this feature?
  requiresUpgrade: boolean;   // Does user need to upgrade?
  featureName: string;         // Display name of feature
  showUpgradePrompt: () => void; // Show upgrade toast
  freeLimit?: number;          // Free tier limit
  premiumLimit?: number;       // Premium tier limit
  currentUsage?: number;       // Current usage (if provided)
}
```

## Advanced Examples

### Feature with Usage Limits

```typescript
function InnermostList() {
  const { user } = useAuthStore();
  const currentCount = user?.activeInnermosts?.length || 0;

  const multipleInnermosts = usePremiumFeature(
    PremiumFeatures.MULTIPLE_INNERMOSTS,
    {
      currentUsage: currentCount,
      customMessage: `You have ${currentCount} of ${multipleInnermosts.freeLimit} free innermosts.`
    }
  );

  const canCreateMore = !multipleInnermosts.requiresUpgrade;

  return (
    <div>
      <p>Innermosts: {currentCount} / {
        multipleInnermosts.isAvailable
          ? multipleInnermosts.premiumLimit
          : multipleInnermosts.freeLimit
      }</p>
      <button
        onClick={() => canCreateMore ? createInnermost() : multipleInnermosts.showUpgradePrompt()}
        disabled={!canCreateMore && !multipleInnermosts.isAvailable}
      >
        Create New Innermost
      </button>
    </div>
  );
}
```

### Silent Check (No Auto Toast)

```typescript
function DataExportButton() {
  const dataExport = usePremiumFeature(PremiumFeatures.DATA_EXPORT, {
    silentCheck: true  // Won't show toast automatically
  });

  if (!dataExport.isAvailable) {
    // Show custom UI instead of toast
    return (
      <div className="premium-badge" onClick={dataExport.showUpgradePrompt}>
        <span>Premium Feature</span>
        <span>Click to learn more</span>
      </div>
    );
  }

  return <button onClick={exportData}>Export Data</button>;
}
```

### Check Multiple Features

```typescript
import { usePremiumFeatures } from '../hooks/usePremiumFeature';

function FeatureList() {
  const features = usePremiumFeatures([
    PremiumFeatures.ANALYTICS_DASHBOARD,
    PremiumFeatures.DATA_EXPORT,
    PremiumFeatures.CUSTOM_CATEGORIES
  ]);

  return (
    <ul>
      {Object.entries(features).map(([key, feature]) => (
        <li key={key}>
          {feature.featureName}: {feature.isAvailable ? '✅' : '❌'}
        </li>
      ))}
    </ul>
  );
}
```

### Check Premium Status

```typescript
import { useIsPremium } from '../hooks/usePremiumFeature';

function SubscriptionStatus() {
  const { isPremium, isExpired, daysRemaining } = useIsPremium();

  if (isPremium) {
    return <div>Premium member - {daysRemaining} days remaining</div>;
  }

  if (isExpired) {
    return <div>Your subscription has expired</div>;
  }

  return <div>Free tier</div>;
}
```

## Integration Points

The hook integrates with:

1. **useAuthStore**: Reads user subscription status
2. **react-hot-toast**: Shows upgrade prompts
3. **react-router-dom**: Navigates to upgrade page

## Adding New Premium Features

1. Add the feature to the `PremiumFeatures` enum
2. Add configuration in `FEATURE_CONFIG`
3. Use the hook in your components

```typescript
// In usePremiumFeature.ts
export enum PremiumFeatures {
  // ... existing features
  NEW_FEATURE = 'NEW_FEATURE',
}

const FEATURE_CONFIG = {
  // ... existing config
  [PremiumFeatures.NEW_FEATURE]: {
    displayName: 'New Feature Name',
    description: 'What this feature does',
    freeLimit: 0,     // Optional: 0 means premium-only
    premiumLimit: 10, // Optional: premium tier limit
  },
};
```

## Best Practices

1. **Always check availability before showing premium features**
   ```typescript
   if (feature.isAvailable) {
     // Show feature
   } else {
     // Show locked/premium badge
   }
   ```

2. **Provide context in upgrade prompts**
   ```typescript
   usePremiumFeature(feature, {
     customMessage: 'Unlock this feature to do X, Y, and Z'
   })
   ```

3. **Handle edge cases**
   - User not logged in
   - Subscription expired
   - Feature at limit

4. **Use silent checks for passive UI updates**
   - Don't spam users with upgrade prompts
   - Use `silentCheck: true` for background checks

5. **Cache feature checks when possible**
   - The hook already memoizes results
   - Avoid unnecessary re-renders
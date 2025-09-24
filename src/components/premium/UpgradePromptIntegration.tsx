import { useState } from 'react';
import { UpgradePrompt } from './UpgradePrompt';
import { usePremiumFeature, PremiumFeatures } from '../../hooks/usePremiumFeature';

/**
 * Example integration showing how to use UpgradePrompt with the premium feature hook
 * This demonstrates best practices for integrating the component into the app
 */

// Example 1: Feature-gated component that shows upgrade prompt when needed
export const AnalyticsDashboard = () => {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const analytics = usePremiumFeature(PremiumFeatures.ANALYTICS_DASHBOARD);

  // Check if user has access
  if (!analytics.isAvailable || analytics.requiresUpgrade) {
    return (
      <UpgradePrompt
        feature="Analytics Dashboard"
        description="Unlock powerful insights and trends about your relationships. Track progress, identify patterns, and make data-driven decisions."
        benefits={[
          'Weekly and monthly trend analysis',
          'Relationship health metrics',
          'Custom date range reports',
          'Export data to CSV',
          'Predictive insights',
          'Comparison charts'
        ]}
        showModal={false}
      />
    );
  }

  // Premium content here
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Analytics Dashboard</h2>
      {/* Your analytics content */}
    </div>
  );
};

// Example 2: Action that triggers modal when premium is required
export const CreateInnermostButton = () => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const innermosts = usePremiumFeature(
    PremiumFeatures.MULTIPLE_INNERMOSTS,
    { currentUsage: 1 } // Example: user already has 1 innermost
  );

  const handleCreateClick = () => {
    if (innermosts.requiresUpgrade) {
      setShowUpgradeModal(true);
    } else {
      // Proceed with creation
      console.log('Creating new innermost...');
    }
  };

  return (
    <>
      <button
        onClick={handleCreateClick}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
      >
        Create New Innermost
      </button>

      {showUpgradeModal && (
        <UpgradePrompt
          feature="Multiple Innermosts"
          description="You've reached the free plan limit of 1 Innermost. Upgrade to Premium to create up to 3 Innermosts and nurture multiple meaningful relationships."
          benefits={[
            'Create up to 3 Innermosts',
            'Switch between relationships easily',
            'Compare relationship progress',
            'Bulk actions and management',
            'Priority support for all Innermosts'
          ]}
          showModal={true}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </>
  );
};

// Example 3: Inline prompt for feature preview
export const DataExportSection = () => {
  const exportFeature = usePremiumFeature(PremiumFeatures.DATA_EXPORT);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Export Your Data</h3>

      {exportFeature.requiresUpgrade ? (
        <UpgradePrompt
          feature="Data Export"
          description="Take control of your data. Export all your Innermost information in various formats for backup, analysis, or migration."
          benefits={[
            'Export to CSV, JSON, or PDF',
            'Include all historical data',
            'Automated weekly backups',
            'API access for integrations'
          ]}
          showModal={false}
        />
      ) : (
        <div className="p-4 border rounded-lg">
          <button className="px-4 py-2 bg-primary-600 text-white rounded">
            Export Data
          </button>
        </div>
      )}
    </div>
  );
};

// Example 4: Conditional rendering with custom benefits
export const CustomCategoriesFeature = () => {
  const [showModal, setShowModal] = useState(false);
  const categories = usePremiumFeature(PremiumFeatures.CUSTOM_CATEGORIES);

  // Define custom benefits specific to this feature
  const customBenefits = [
    'Create unlimited custom categories',
    'Organize wants by priority',
    'Set category-specific reminders',
    'Share category templates',
    'Import/export category sets',
    'Advanced filtering and search'
  ];

  if (categories.requiresUpgrade) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">Custom Categories</h4>
          <button
            onClick={() => setShowModal(true)}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Unlock Feature
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Create personalized categories beyond the defaults
        </p>

        {showModal && (
          <UpgradePrompt
            feature="Custom Categories"
            description="Personalize your Innermost experience with custom want categories tailored to your unique relationships."
            benefits={customBenefits}
            showModal={true}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    );
  }

  // Premium feature content
  return (
    <div className="p-4">
      <h4 className="font-semibold mb-4">Your Custom Categories</h4>
      {/* Category management UI */}
    </div>
  );
};

// Example 5: Usage limit indicator with upgrade prompt
export const UsageLimitIndicator = () => {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const innermosts = usePremiumFeature(
    PremiumFeatures.MULTIPLE_INNERMOSTS,
    { currentUsage: 1 }
  );

  const usagePercentage = innermosts.freeLimit
    ? (innermosts.currentUsage! / innermosts.freeLimit) * 100
    : 0;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Innermost Usage</span>
        <span className="text-sm text-gray-500">
          {innermosts.currentUsage}/{innermosts.isPremium ? innermosts.premiumLimit : innermosts.freeLimit}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            usagePercentage >= 100 ? 'bg-red-500' : 'bg-primary-600'
          }`}
          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
        />
      </div>

      {innermosts.requiresUpgrade && (
        <button
          onClick={() => setShowUpgrade(true)}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Upgrade to increase limit →
        </button>
      )}

      {showUpgrade && (
        <UpgradePrompt
          feature="Increased Innermost Limit"
          description={`You're using ${innermosts.currentUsage} of ${innermosts.freeLimit} Innermosts on the free plan. Upgrade to create up to ${innermosts.premiumLimit} Innermosts.`}
          showModal={true}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
};
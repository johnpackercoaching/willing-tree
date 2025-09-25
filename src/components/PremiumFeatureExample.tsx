import React from 'react';
import { usePremiumFeature, PremiumFeatures, useIsPremium } from '../hooks/usePremiumFeature';
import { useAuthStore } from '../stores/authStore';

// Example component demonstrating how to use the usePremiumFeature hook
export function PremiumFeatureExample() {
  const { user } = useAuthStore();
  const { isPremium, daysRemaining } = useIsPremium();

  // Example 1: Check for analytics dashboard access
  const analyticsFeature = usePremiumFeature(PremiumFeatures.ANALYTICS_DASHBOARD);

  // Example 2: Check for multiple innermosts with current usage
  const currentInnermostCount = user?.activeInnermosts?.length || 0;
  const multipleInnermostsFeature = usePremiumFeature(
    PremiumFeatures.MULTIPLE_INNERMOSTS,
    {
      currentUsage: currentInnermostCount,
      customMessage: `You've reached the limit of ${multipleInnermostsFeature.freeLimit} innermost. Upgrade to create up to ${multipleInnermostsFeature.premiumLimit}!`,
    }
  );

  // Example 3: Check for data export feature
  const dataExportFeature = usePremiumFeature(PremiumFeatures.DATA_EXPORT, {
    silentCheck: true, // Don't auto-show toast when checking
  });

  const handleAnalyticsClick = () => {
    if (!analyticsFeature.isAvailable) {
      analyticsFeature.showUpgradePrompt();
      return;
    }
    // Navigate to analytics dashboard
    console.log('Navigating to analytics dashboard...');
  };

  const handleCreateInnermost = () => {
    if (multipleInnermostsFeature.requiresUpgrade) {
      multipleInnermostsFeature.showUpgradePrompt();
      return;
    }
    // Create new innermost
    console.log('Creating new innermost...');
  };

  const handleExportData = () => {
    if (!dataExportFeature.isAvailable) {
      dataExportFeature.showUpgradePrompt();
      return;
    }
    // Export data
    console.log('Exporting data...');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Premium Features Demo</h2>

      {/* Subscription Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Your Subscription</h3>
        <p>Status: {user?.subscriptionStatus || 'Not logged in'}</p>
        {isPremium && daysRemaining !== undefined && (
          <p className="text-sm text-gray-600">
            {daysRemaining} days remaining
          </p>
        )}
      </div>

      {/* Feature Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Analytics Dashboard */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Analytics Dashboard</h3>
          <p className="text-sm text-gray-600 mb-3">
            View detailed insights about your relationships
          </p>
          <button
            onClick={handleAnalyticsClick}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              analyticsFeature.isAvailable
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {analyticsFeature.isAvailable ? 'View Analytics' : 'Premium Only'}
          </button>
        </div>

        {/* Multiple Innermosts */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Multiple Innermosts</h3>
          <p className="text-sm text-gray-600 mb-2">
            Current: {currentInnermostCount} / {
              isPremium
                ? multipleInnermostsFeature.premiumLimit
                : multipleInnermostsFeature.freeLimit
            }
          </p>
          <button
            onClick={handleCreateInnermost}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              !multipleInnermostsFeature.requiresUpgrade
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {!multipleInnermostsFeature.requiresUpgrade
              ? 'Create Innermost'
              : 'Upgrade Required'}
          </button>
        </div>

        {/* Data Export */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Data Export</h3>
          <p className="text-sm text-gray-600 mb-3">
            Export your data in CSV or JSON format
          </p>
          <button
            onClick={handleExportData}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              dataExportFeature.isAvailable
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {dataExportFeature.isAvailable ? 'Export Data' : 'Premium Only'}
          </button>
        </div>
      </div>

      {/* Feature Status Table */}
      <div className="mt-8">
        <h3 className="font-semibold mb-3">All Premium Features</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Feature</th>
                <th className="border p-2 text-center">Free Tier</th>
                <th className="border p-2 text-center">Premium</th>
                <th className="border p-2 text-center">Your Access</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">Multiple Innermosts</td>
                <td className="border p-2 text-center">1</td>
                <td className="border p-2 text-center">3</td>
                <td className="border p-2 text-center">
                  {multipleInnermostsFeature.isAvailable ? '✅' : '❌'}
                </td>
              </tr>
              <tr>
                <td className="border p-2">Analytics Dashboard</td>
                <td className="border p-2 text-center">❌</td>
                <td className="border p-2 text-center">✅</td>
                <td className="border p-2 text-center">
                  {analyticsFeature.isAvailable ? '✅' : '❌'}
                </td>
              </tr>
              <tr>
                <td className="border p-2">Data Export</td>
                <td className="border p-2 text-center">❌</td>
                <td className="border p-2 text-center">✅</td>
                <td className="border p-2 text-center">
                  {dataExportFeature.isAvailable ? '✅' : '❌'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
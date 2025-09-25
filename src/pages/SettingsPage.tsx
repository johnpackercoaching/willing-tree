import { FC, useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { SubscriptionService } from '../services/subscriptionService';
import { FirestoreService } from '../services/firestoreService';
import { toast } from 'react-hot-toast';
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Smartphone,
  CreditCard,
  Download,
  Trash2,
  AlertTriangle,
  Crown,
  Lock,
  BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { usePremiumFeature, PremiumFeatures } from '../hooks/usePremiumFeature';
import { useNavigate } from 'react-router-dom';

interface AppSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReminders: boolean;
  scoreNotifications: boolean;
}

export const SettingsPage: FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const dataExportFeature = usePremiumFeature(PremiumFeatures.DATA_EXPORT);
  const [settings, setSettings] = useState<AppSettings>({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReminders: true,
    scoreNotifications: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [billingInfo, setBillingInfo] = useState<any>(null);
  const [loadingBilling, setLoadingBilling] = useState(false);

  useEffect(() => {
    loadSettings();
    if (user) {
      loadBillingInfo();
    }
  }, [user]);

  const loadSettings = async () => {
    // In a real app, you'd load user settings from Firebase
    // For now, using localStorage as a simple storage
    const saved = localStorage.getItem(`settings_${user?.id}`);
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error loading settings:', error);
        }
      }
    }
  };

  const loadBillingInfo = async () => {
    if (!user) return;
    
    try {
      setLoadingBilling(true);
      const info = await SubscriptionService.getBillingInfo(user);
      setBillingInfo(info);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error loading billing info:', error);
      }
    } finally {
      setLoadingBilling(false);
    }
  };

  const updateSetting = async (key: keyof AppSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      setIsSaving(true);
      // Save to localStorage (in real app, save to Firebase)
      localStorage.setItem(`settings_${user?.id}`, JSON.stringify(newSettings));
      
      // Here you would typically also update notification preferences on the backend
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error saving setting:', error);
      }
      toast.error('Failed to save setting');
      // Revert on error
      setSettings(settings);
    } finally {
      setIsSaving(false);
    }
  };

  const exportData = async () => {
    if (!user) return;

    // Check if user has premium access
    if (dataExportFeature.requiresUpgrade) {
      dataExportFeature.showUpgradePrompt();
      return;
    }

    try {
      toast.success('Data export started. This may take a few minutes.');

      // In a real implementation, you'd call a backend endpoint to generate
      // a comprehensive data export including all user data, innermosts, etc.

      // For demo, we'll create a simple JSON export
      const exportData = {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          age: user.age,
          gender: user.gender,
          createdAt: user.createdAt,
          subscriptionStatus: user.subscriptionStatus
        },
        exportedAt: new Date().toISOString(),
        note: 'This is a demo export. In production, this would include all your Innermost data, scores, and preferences.'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `willing-box-data-${user.id}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully!');

    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error exporting data:', error);
      }
      toast.error('Failed to export data');
    }
  };

  const cancelSubscription = async () => {
    if (!user) return;
    
    try {
      await SubscriptionService.cancelSubscription(user);
      toast.success('Subscription cancelled successfully');
      loadBillingInfo(); // Refresh billing info
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error cancelling subscription:', error);
      }
      toast.error('Failed to cancel subscription');
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    
    // This is a serious action - in a real app you'd have multiple confirmation steps
    toast.error('Account deletion not implemented in demo. Contact support for assistance.');
    setShowDeleteConfirm(false);
  };

  if (!user) {
    return (
      <div className="p-4">
        <div className="text-center py-12">
          <p className="text-gray-600">Please log in to access settings.</p>
        </div>
      </div>
    );
  }

  const isPremium = SubscriptionService.canAccessPremiumFeatures(user);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <SettingsIcon className="w-8 h-8 text-green-600" />
          Settings
        </h1>
        <p className="text-gray-600">Manage your preferences and account settings</p>
      </div>

      {/* Notifications */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-green-600" />
          Notifications
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive updates and reminders via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
                className="sr-only"
                disabled={isSaving}
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${settings.emailNotifications ? 'bg-green-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${settings.emailNotifications ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Push Notifications</p>
              <p className="text-sm text-gray-600">Get notified on your device</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.pushNotifications}
                onChange={(e) => updateSetting('pushNotifications', e.target.checked)}
                className="sr-only"
                disabled={isSaving}
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${settings.pushNotifications ? 'bg-green-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${settings.pushNotifications ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Weekly Reminders</p>
              <p className="text-sm text-gray-600">Reminders to complete your weekly activities</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.weeklyReminders}
                onChange={(e) => updateSetting('weeklyReminders', e.target.checked)}
                className="sr-only"
                disabled={isSaving}
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${settings.weeklyReminders ? 'bg-green-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${settings.weeklyReminders ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Score Notifications</p>
              <p className="text-sm text-gray-600">Get notified when scores are updated</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.scoreNotifications}
                onChange={(e) => updateSetting('scoreNotifications', e.target.checked)}
                className="sr-only"
                disabled={isSaving}
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${settings.scoreNotifications ? 'bg-green-600' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${settings.scoreNotifications ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-600" />
          Privacy & Security
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <p className="font-medium text-gray-900">End-to-End Privacy</p>
              <p className="text-sm text-gray-600">Your willing selections are never shared with your partner</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <p className="font-medium text-gray-900">Secure Data Storage</p>
              <p className="text-sm text-gray-600">All data is encrypted and stored securely in the cloud</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <p className="font-medium text-gray-900">No Data Selling</p>
              <p className="text-sm text-gray-600">We never sell or share your personal data with third parties</p>
            </div>
          </div>
        </div>
      </div>

      {/* App Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-purple-600" />
          App Settings
        </h3>
        
        <div className="space-y-3">
          {/* Data Export - Premium Feature */}
          {dataExportFeature.requiresUpgrade ? (
            <div className="relative">
              <button
                onClick={() => {
                  dataExportFeature.showUpgradePrompt();
                  setTimeout(() => navigate('/subscription'), 3000);
                }}
                className="w-full flex items-center gap-3 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Lock className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium text-gray-500 flex items-center gap-2">
                    Export My Data
                    <Crown className="w-4 h-4 text-purple-600" />
                    <span className="text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-0.5 rounded-full">Premium</span>
                  </p>
                  <p className="text-sm text-gray-400">Download all your data in JSON format - Upgrade to access</p>
                </div>
              </button>
            </div>
          ) : (
            <button
              onClick={exportData}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
            >
              <Download className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
              <div className="flex-1">
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  Export My Data
                  <Crown className="w-4 h-4 text-purple-600" />
                </p>
                <p className="text-sm text-gray-600">Download all your data in JSON format</p>
              </div>
            </button>
          )}
          
          <div className="border-t border-gray-200 my-4"></div>

          {/* Analytics Dashboard Link */}
          <button
            onClick={() => navigate('/analytics')}
            className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors group"
          >
            <BarChart3 className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
            <div className="flex-1">
              <p className="font-medium text-gray-900 flex items-center gap-2">
                Analytics Dashboard
                <Crown className="w-4 h-4 text-purple-600" />
                <span className="text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-0.5 rounded-full">Premium</span>
              </p>
              <p className="text-sm text-gray-600">View relationship insights and trends</p>
            </div>
          </button>

          <div className="border-t border-gray-200 my-4"></div>

          <div className="text-sm text-gray-500">
            <p>App Version: 1.0.0</p>
            <p>Last Updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Subscription Management */}
      {isPremium && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            Subscription Management
          </h3>
          
          {loadingBilling ? (
            <div className="text-gray-600">Loading billing information...</div>
          ) : (
            <div className="space-y-4">
              {billingInfo && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="font-medium text-green-900">Premium Active</p>
                  <p className="text-sm text-green-700">
                    Status: {billingInfo.status}
                    {billingInfo.currentPeriodEnd && (
                      <> • Next billing: {billingInfo.currentPeriodEnd.toLocaleDateString()}</>
                    )}
                  </p>
                </div>
              )}
              
              <button
                onClick={cancelSubscription}
                className="text-red-600 hover:text-red-700 text-sm underline"
              >
                Cancel Subscription
              </button>
            </div>
          )}
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-white border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Danger Zone
        </h3>
        
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-900 mb-2">Delete Account</h4>
            <p className="text-sm text-red-700 mb-3">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-red-900">
                  Are you absolutely sure? This will permanently delete everything.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={deleteAccount}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                  >
                    Yes, Delete Everything
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Questions? Contact us at support@willingbox.com</p>
      </div>
    </div>
  );
};
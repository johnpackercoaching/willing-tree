import { FC, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../stores/authStore';
import { FirestoreService } from '../services/firestoreService';
import { SubscriptionService } from '../services/subscriptionService';
import type { User } from '../types/index';
import { toast } from 'react-hot-toast';
import { User as UserIcon, Mail, Calendar, Users, Crown, Edit2, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileFormData {
  displayName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
}

export const ProfilePage: FC = () => {
  const { user, setUser, logout } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [billingInfo, setBillingInfo] = useState<any>(null);
  const [loadingBilling, setLoadingBilling] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<ProfileFormData>({
    defaultValues: {
      displayName: user?.displayName || '',
      age: user?.age || 18,
      gender: user?.gender || 'other'
    }
  });

  useEffect(() => {
    if (user) {
      reset({
        displayName: user.displayName,
        age: user.age,
        gender: user.gender
      });
      loadBillingInfo();
    }
  }, [user, reset]);

  const loadBillingInfo = async () => {
    if (!user) return;
    
    try {
      setLoadingBilling(true);
      const info = await SubscriptionService.getBillingInfo(user);
      setBillingInfo(info);
    } catch (error) {
      console.error('Error loading billing info:', error);
    } finally {
      setLoadingBilling(false);
    }
  };

  const onSave = async (data: ProfileFormData) => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      // Update user profile in Firestore
      await FirestoreService.updateUserProfile(user.id, {
        displayName: data.displayName,
        age: data.age,
        gender: data.gender
      });
      
      // Update local user state
      const updatedUser: User = {
        ...user,
        displayName: data.displayName,
        age: data.age,
        gender: data.gender
      };
      
      setUser(updatedUser);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    reset({
      displayName: user?.displayName || '',
      age: user?.age || 18,
      gender: user?.gender || 'other'
    });
    setIsEditing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  if (!user) {
    return (
      <div className="p-4">
        <div className="text-center py-12">
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  const currentPlan = SubscriptionService.getUserPlan(user);
  const isPremium = SubscriptionService.canAccessPremiumFeatures(user);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your personal information and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user.displayName}</h2>
              <p className="text-gray-600 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
              <p className="text-sm text-gray-500">Member since {user.createdAt.toLocaleDateString()}</p>
            </div>
          </div>
          
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-green-600 hover:text-green-700 flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              {isEditing ? (
                <input
                  {...register('displayName', {
                    required: 'Name is required',
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              ) : (
                <p className="py-2 text-gray-900">{user.displayName}</p>
              )}
              {errors.displayName && (
                <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              {isEditing ? (
                <input
                  {...register('age', {
                    required: 'Age is required',
                    min: { value: 18, message: 'Must be 18 or older' },
                    max: { value: 120, message: 'Please enter a valid age' },
                    valueAsNumber: true
                  })}
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              ) : (
                <p className="py-2 text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {user.age} years old
                </p>
              )}
              {errors.age && (
                <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              {isEditing ? (
                <select
                  {...register('gender', { required: 'Please select your gender' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p className="py-2 text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  {user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}
                </p>
              )}
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <p className="py-2 text-gray-500 text-sm">
                {user.email}
                <br />
                <span className="text-xs">Contact support to change email</span>
              </p>
            </div>
          </div>
          
          {isEditing && (
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={!isDirty || isSaving}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Subscription Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isPremium ? (
              <Crown className="w-6 h-6 text-yellow-600" />
            ) : (
              <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {currentPlan.name} Plan
              </h3>
              <p className="text-gray-600 text-sm">{currentPlan.description}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {SubscriptionService.formatPrice(currentPlan)}
            </p>
            {isPremium && user.subscriptionEndDate && (
              <p className="text-sm text-gray-600">
                Renews {user.subscriptionEndDate.toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          {currentPlan.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              {feature}
            </div>
          ))}
        </div>
        
        {loadingBilling ? (
          <div className="text-sm text-gray-600">Loading billing info...</div>
        ) : billingInfo && (
          <div className="text-sm text-gray-600">
            Status: {billingInfo.status}
            {billingInfo.currentPeriodEnd && (
              <span> • Next billing: {billingInfo.currentPeriodEnd.toLocaleDateString()}</span>
            )}
          </div>
        )}
        
        <div className="flex gap-3 mt-4">
          {!isPremium && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={async () => {
                try {
                  await SubscriptionService.redirectToCheckout(user, 'premium');
                } catch (error) {
                  console.error('Checkout error:', error);
                  toast.error(error instanceof Error ? error.message : 'Unable to process payment. Please try again.');
                }
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-md font-medium transition-all"
            >
              Upgrade to Premium
            </motion.button>
          )}
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
        
        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            Sign Out
          </button>
          
          <div className="text-sm text-gray-500 px-4">
            Need help? Contact us at support@willingbox.com
          </div>
        </div>
      </div>
    </div>
  );
};
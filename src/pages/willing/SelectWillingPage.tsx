import { FC, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { FirestoreService } from '../../services/firestoreService';
import type { Want, WillingBox, Innermost } from '../../types/index';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Heart, Star, Check, Eye, EyeOff, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_LABELS = {
  communication: { label: 'Communication', icon: '💬' },
  affection: { label: 'Affection & Romance', icon: '💕' },
  time: { label: 'Quality Time', icon: '⏰' },
  household: { label: 'Home & Lifestyle', icon: '🏠' },
  personal: { label: 'Personal Support', icon: '🌟' }
} as const;

export const SelectWillingPage: FC = () => {
  const { innermostId } = useParams<{ innermostId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [innermost, setInnermost] = useState<Innermost | null>(null);
  const [willingBox, setWillingBox] = useState<WillingBox | null>(null);
  const [wants, setWants] = useState<Want[]>([]);
  const [selectedWillingIds, setSelectedWillingIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPrivacyReminder, setShowPrivacyReminder] = useState(true);

  useEffect(() => {
    if (!innermostId || !user) {
      navigate('/innermosts');
      return;
    }
    loadData();
  }, [innermostId, user]);

  const loadData = async () => {
    if (!innermostId || !user) return;

    try {
      setIsLoading(true);

      // Load innermost
      const innermosts = await FirestoreService.getUserInnermosts(user.id);
      const currentInnermost = innermosts.find(i => i.id === innermostId);

      if (!currentInnermost) {
        toast.error('Innermost not found');
        navigate('/innermosts');
        return;
      }

      setInnermost(currentInnermost);

      // Load willing box with partner's wishes
      const currentWillingBox = await FirestoreService.getWillingBox(innermostId);
      if (!currentWillingBox) {
        toast.error('No willing box found. Please create your wants list first.');
        navigate(`/innermosts/${innermostId}/wants`);
        return;
      }

      // Determine which partner we are and get the OTHER partner's wish list
      const isPartnerA = user.id === currentInnermost.partnerA;

      // Get partner's wish list - we select from our partner's wishes
      let partnerWishes: Want[] = [];

      // Try new format first
      if (isPartnerA && currentWillingBox.partnerBWishList) {
        partnerWishes = currentWillingBox.partnerBWishList;
      } else if (!isPartnerA && currentWillingBox.partnerAWishList) {
        partnerWishes = currentWillingBox.partnerAWishList;
      }
      // Fall back to legacy format
      else if (isPartnerA && currentWillingBox.partnerBWishlist) {
        partnerWishes = currentWillingBox.partnerBWishlist;
      } else if (!isPartnerA && currentWillingBox.partnerAWishlist) {
        partnerWishes = currentWillingBox.partnerAWishlist;
      }
      // Fall back to wants array (old format)
      else if (currentWillingBox.wants) {
        partnerWishes = currentWillingBox.wants;
      }

      if (!partnerWishes || partnerWishes.length === 0) {
        toast.error('Your partner has not created their wish list yet.');
        navigate(`/innermosts/${innermostId}`);
        return;
      }

      setWillingBox(currentWillingBox);
      setWants(partnerWishes);

      // Load existing willing selections for current user
      let existingWilling = null;

      // Try new format first
      if (isPartnerA && currentWillingBox.partnerAWillingList) {
        existingWilling = currentWillingBox.partnerAWillingList;
      } else if (!isPartnerA && currentWillingBox.partnerBWillingList) {
        existingWilling = currentWillingBox.partnerBWillingList;
      }
      // Fall back to legacy format
      else if (isPartnerA && currentWillingBox.partnerAWilling) {
        existingWilling = currentWillingBox.partnerAWilling;
      } else if (!isPartnerA && currentWillingBox.partnerBWilling) {
        existingWilling = currentWillingBox.partnerBWilling;
      }

      if (existingWilling) {
        // Handle both new format (wishId) and legacy format (wantId)
        setSelectedWillingIds(existingWilling.map(w => w.wishId || w.wantId || '').filter(id => id));
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load willing selection');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWillingSelection = (wantId: string) => {
    setSelectedWillingIds(prev => {
      if (prev.includes(wantId)) {
        return prev.filter(id => id !== wantId);
      } else {
        return [...prev, wantId];
      }
    });
  };

  const saveWillingSelections = async () => {
    if (!willingBox || !user || !innermost) return;

    if (selectedWillingIds.length === 0) {
      toast.error('Please select at least one item you\'re willing to work on');
      return;
    }

    try {
      setIsSaving(true);

      const isPartnerA = user.id === innermost.partnerA;

      // Create willing items with both new and legacy field names for compatibility
      const willingItems = selectedWillingIds.map((wishId, index) => ({
        wishId,  // New format
        wantId: wishId,  // Legacy format
        priority: index + 1,  // New format: 1-3 ranking
        effort: '',  // Legacy format
        effortLevel: undefined  // Optional new format field
      }));

      // Update with both new and legacy field names for compatibility
      const updatedWillingBox = {
        ...willingBox,
        // New format fields
        [isPartnerA ? 'partnerAWillingList' : 'partnerBWillingList']: willingItems,
        // Legacy format fields
        [isPartnerA ? 'partnerAWilling' : 'partnerBWilling']: willingItems
      };

      await FirestoreService.saveWillingBox(updatedWillingBox);

      toast.success('Your willing selections have been saved!');
      navigate(`/innermosts/${innermostId}`);

    } catch (error) {
      console.error('Error saving willing selections:', error);
      toast.error('Failed to save willing selections');
    } finally {
      setIsSaving(false);
    }
  };

  const getWantsByCategory = () => {
    const categorized: Record<string, Want[]> = {};
    wants.forEach(want => {
      // Handle cases where category might be undefined
      const category = want.category || 'personal';
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(want);
    });
    return categorized;
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/2"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!wants || wants.length === 0) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">No Partner Wishes Found</h1>
        <p className="text-gray-600 mb-6">
          Your partner needs to create their wish list before you can select what you're willing to work on.
        </p>
        <button
          onClick={() => navigate(`/innermosts/${innermostId}`)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
        >
          Back to Innermost
        </button>
      </div>
    );
  }

  const categorizedWants = getWantsByCategory();
  const selectedCount = selectedWillingIds.length;
  const totalWants = wants.length;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/innermosts/${innermostId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Innermost
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Heart className="w-8 h-8 text-red-500" />
          Select What You're Willing to Work On
        </h1>
        <p className="text-gray-600">
          Choose which of your partner's wants you're willing to put effort into.
          Your selections are completely private - your partner will never see what you didn't choose.
        </p>
      </div>

      {/* Privacy Reminder */}
      <AnimatePresence>
        {showPrivacyReminder && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-green-900 font-semibold mb-1">Privacy Protected</h3>
                <p className="text-green-800 text-sm mb-3">
                  Your partner will only see what you choose to work on. Items you don't select remain completely hidden, 
                  preserving your autonomy and preventing any pressure or judgment.
                </p>
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-green-600" />
                  <span className="text-green-800 text-sm font-medium">
                    Unselected items = Invisible to partner
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowPrivacyReminder(false)}
                className="text-green-600 hover:text-green-800"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedCount} of {totalWants} Selected
              </h3>
              <p className="text-sm text-gray-600">
                Choose what feels authentic to work on right now
              </p>
            </div>
          </div>
          
          {selectedCount > 0 && (
            <button
              onClick={saveWillingSelections}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Check className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Selections'}
            </button>
          )}
        </div>
        
        {selectedCount > 0 && (
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(selectedCount / totalWants) * 100}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Wants by Category */}
      <div className="space-y-8">
        {Object.entries(categorizedWants).map(([categoryId, categoryWants]) => {
          const categoryInfo = CATEGORY_LABELS[categoryId as keyof typeof CATEGORY_LABELS] ||
            { label: 'Personal Support', icon: '🌟' }; // Default fallback
          const selectedInCategory = categoryWants.filter(w => selectedWillingIds.includes(w.id)).length;
          
          return (
            <div key={categoryId} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{categoryInfo.icon}</span>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {categoryInfo.label}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedInCategory} of {categoryWants.length} selected
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {categoryWants
                  .sort((a, b) => {
                    // Sort Most Wanted items first
                    if (a.isMostWanted && !b.isMostWanted) return -1;
                    if (!a.isMostWanted && b.isMostWanted) return 1;
                    return a.order - b.order;
                  })
                  .map((want) => {
                    const isSelected = selectedWillingIds.includes(want.id);
                    
                    return (
                      <motion.div
                        key={want.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleWillingSelection(want.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                            isSelected 
                              ? 'bg-green-600 border-green-600'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start gap-2 mb-1">
                              {want.isMostWanted && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-600 fill-current" />
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
                                    Most Wanted • 2x Points
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <p className={`text-gray-900 font-medium mb-1 ${
                              want.isMostWanted ? 'text-base' : 'text-sm'
                            }`}>
                              {want.text}
                            </p>
                            
                            {isSelected && (
                              <div className="flex items-center gap-2 mt-2">
                                <Eye className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-700 font-medium">
                                  Your partner will see your effort on this
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Save Button */}
      {selectedCount > 0 && (
        <div className="sticky bottom-4 mt-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">
                  {selectedCount} items selected
                </p>
                <p className="text-sm text-gray-600">
                  Ready to commit to working on these together?
                </p>
              </div>
              
              <button
                onClick={saveWillingSelections}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition-colors font-semibold"
              >
                <Check className="w-5 h-5" />
                {isSaving ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
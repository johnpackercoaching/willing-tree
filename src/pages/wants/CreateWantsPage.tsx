import { FC, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { FirestoreService } from '../../services/firestoreService';
import type { Want, Innermost } from '../../types/index';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Star, ArrowLeft, ArrowRight, Check, Crown, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePremiumFeature, PremiumFeatures } from '../../hooks/usePremiumFeature';
import { UpgradePrompt } from '../../components/premium/UpgradePrompt';

const WANT_CATEGORIES = [
  { id: 'communication', label: 'Communication', icon: '💬', description: 'How you want to connect and talk' },
  { id: 'affection', label: 'Affection & Romance', icon: '💕', description: 'Physical and emotional intimacy' },
  { id: 'time', label: 'Quality Time', icon: '⏰', description: 'How you want to spend time together' },
  { id: 'household', label: 'Home & Lifestyle', icon: '🏠', description: 'Daily life and household matters' },
  { id: 'personal', label: 'Personal Support', icon: '🌟', description: 'Individual growth and support needs' }
] as const;

interface WantFormData {
  text: string;
  category: typeof WANT_CATEGORIES[number]['id'];
  isMostWanted: boolean;
}

export const CreateWantsPage: FC = () => {
  const { innermostId } = useParams<{ innermostId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const premiumFeature = usePremiumFeature(PremiumFeatures.CUSTOM_CATEGORIES);

  const [innermost, setInnermost] = useState<Innermost | null>(null);
  const [wants, setWants] = useState<Want[]>([]);
  const [currentWant, setCurrentWant] = useState<WantFormData>({
    text: '',
    category: 'communication',
    isMostWanted: false
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<typeof WANT_CATEGORIES[number]['id'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const maxWants = 20;
  const maxMostWanted = 3;
  const mostWantedCount = wants.filter(w => w.isMostWanted).length;

  // Free users get first 3 categories, premium users get all 5
  const FREE_CATEGORY_LIMIT = 3;
  const availableCategories = premiumFeature.isAvailable || !premiumFeature.requiresUpgrade
    ? WANT_CATEGORIES
    : WANT_CATEGORIES.slice(0, FREE_CATEGORY_LIMIT);
  const lockedCategories = premiumFeature.requiresUpgrade
    ? WANT_CATEGORIES.slice(FREE_CATEGORY_LIMIT)
    : [];

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
      const innermosts = await FirestoreService.getUserInnermosts(user.id);
      const currentInnermost = innermosts.find(i => i.id === innermostId);

      if (!currentInnermost) {
        toast.error('Innermost not found');
        navigate('/innermosts');
        return;
      }

      setInnermost(currentInnermost);

      // Try to load existing willing box to get wants
      const willingBox = await FirestoreService.getWillingBox(innermostId);
      if (willingBox) {
        setWants(willingBox.wants || []);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load wants');
    } finally {
      setIsLoading(false);
    }
  };

  const addWant = () => {
    if (!currentWant.text.trim()) {
      toast.error('Please enter what you want');
      return;
    }

    if (wants.length >= maxWants) {
      toast.error(`Maximum ${maxWants} wants allowed`);
      return;
    }

    if (currentWant.isMostWanted && mostWantedCount >= maxMostWanted) {
      toast.error(`Maximum ${maxMostWanted} Most Wanted items allowed`);
      return;
    }

    const newWant: Want = {
      id: Date.now().toString(),
      text: currentWant.text.trim(),
      category: currentWant.category,
      isMostWanted: currentWant.isMostWanted,
      order: wants.length,
      createdBy: user!.id
    };

    setWants(prev => [...prev, newWant]);
    setCurrentWant({ text: '', category: selectedCategory || 'communication', isMostWanted: false });
  };

  const removeWant = (wantId: string) => {
    setWants(prev => prev.filter(w => w.id !== wantId).map((w, index) => ({ ...w, order: index })));
  };

  const toggleMostWanted = (wantId: string) => {
    const want = wants.find(w => w.id === wantId);
    if (!want) return;

    if (!want.isMostWanted && mostWantedCount >= maxMostWanted) {
      toast.error(`Maximum ${maxMostWanted} Most Wanted items allowed`);
      return;
    }

    setWants(prev => prev.map(w =>
      w.id === wantId ? { ...w, isMostWanted: !w.isMostWanted } : w
    ));
  };

  const saveWants = async () => {
    if (!innermostId || !user) return;

    if (wants.length === 0) {
      toast.error('Please add at least one want before continuing');
      return;
    }

    try {
      setIsSaving(true);

      // Get existing willing box or create new one
      let willingBox = await FirestoreService.getWillingBox(innermostId);

      if (!willingBox) {
        willingBox = {
          id: innermostId,
          innermostId,
          partnerA: innermost!.partnerA,
          partnerB: innermost!.partnerB,
          wants,
          partnerAWilling: [],
          partnerBWilling: [],
          isLocked: false
        };
      } else {
        willingBox.wants = wants;
      }

      await FirestoreService.saveWillingBox(willingBox);
      toast.success('Your wants have been saved!');
      navigate(`/innermosts/${innermostId}/willing`);

    } catch (error) {
      console.error('Error saving wants:', error);
      toast.error('Failed to save wants');
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryWants = (categoryId: typeof WANT_CATEGORIES[number]['id']) => {
    return wants.filter(w => w.category === categoryId);
  };

  const handleCategoryClick = (categoryId: typeof WANT_CATEGORIES[number]['id']) => {
    const categoryIndex = WANT_CATEGORIES.findIndex(c => c.id === categoryId);
    const isPremiumCategory = categoryIndex >= FREE_CATEGORY_LIMIT;

    // Check if this is a locked premium category
    if (isPremiumCategory && premiumFeature.requiresUpgrade) {
      setShowUpgradePrompt(true);
      return;
    }

    // Otherwise, select/deselect the category
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
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

  // Show upgrade prompt modal
  if (showUpgradePrompt) {
    return (
      <>
        <UpgradePrompt
          feature="Custom Categories"
          description="Unlock all 5 want categories to create a more personalized and comprehensive relationship experience."
          benefits={[
            'Access all 5 want categories',
            'Create up to 20 custom wants',
            'Better relationship insights',
            'More personalized experience',
            'Unlock analytics dashboard',
            'Export your data anytime'
          ]}
          showModal={true}
          onClose={() => setShowUpgradePrompt(false)}
        />
      </>
    );
  }

  // Step 1: Category Selection
  if (currentStep === 1) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/innermosts')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Innermosts
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Wants List</h1>
          <p className="text-gray-600">
            Choose categories that matter to you in this relationship. You can add up to {maxWants} wants total,
            with up to {maxMostWanted} marked as "Most Wanted" for extra scoring.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Available Categories */}
          {availableCategories.map((category) => {
            const categoryWants = getCategoryWants(category.id);
            const isSelected = selectedCategory === category.id;
            const categoryIndex = WANT_CATEGORIES.indexOf(category);
            const isPremiumCategory = categoryIndex >= FREE_CATEGORY_LIMIT;

            return (
              <motion.div
                key={category.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 border-2 rounded-lg cursor-pointer transition-all relative ${
                  isSelected
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleCategoryClick(category.id)}
              >
                {/* Premium indicator for categories beyond free limit */}
                {isPremiumCategory && premiumFeature.isAvailable && (
                  <div className="absolute top-3 right-3">
                    <Crown className="w-5 h-5 text-yellow-500" />
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="text-3xl">{category.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {category.label}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {category.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {categoryWants.length} wants added
                      </span>
                      {categoryWants.filter(w => w.isMostWanted).length > 0 && (
                        <div className="flex items-center gap-1 text-yellow-600">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm">
                            {categoryWants.filter(w => w.isMostWanted).length}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Locked Categories for Free Users */}
          {lockedCategories.map((category) => (
            <motion.div
              key={category.id}
              whileHover={{ scale: 1.02 }}
              className="p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer transition-all bg-gray-50 relative overflow-hidden"
              onClick={() => setShowUpgradePrompt(true)}
            >
              {/* Lock overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100/50 to-gray-200/50 backdrop-blur-[1px]" />

              {/* Lock icon */}
              <div className="absolute top-3 right-3 z-10">
                <div className="bg-yellow-100 p-2 rounded-full">
                  <Lock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>

              <div className="flex items-start gap-4 relative z-10">
                <div className="text-3xl opacity-60">{category.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-700 mb-1 flex items-center gap-2">
                    {category.label}
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
                      Premium
                    </span>
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">
                    {category.description}
                  </p>
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Crown className="w-4 h-4" />
                    <span className="text-sm font-medium">Upgrade to unlock</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Premium Upsell Card for Free Users */}
          {lockedCategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="md:col-span-2"
            >
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="bg-yellow-100 p-3 rounded-full">
                      <Crown className="w-8 h-8 text-yellow-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      Unlock More Categories with Premium
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Get access to all {WANT_CATEGORIES.length} categories and create more personalized wants for your relationship.
                    </p>
                    <button
                      onClick={() => setShowUpgradePrompt(true)}
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2"
                    >
                      <Crown className="w-4 h-4" />
                      Upgrade to Premium
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {wants.length}/{maxWants} wants • {mostWantedCount}/{maxMostWanted} Most Wanted
          </div>

          <div className="flex gap-3">
            {selectedCategory && (
              <button
                onClick={() => setCurrentStep(2)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                Add Wants to {WANT_CATEGORIES.find(c => c.id === selectedCategory)?.label}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {wants.length > 0 && (
              <button
                onClick={saveWants}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:bg-gray-400"
              >
                <Check className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Continue to Willing List'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Add Wants to Selected Category
  const currentCategoryData = WANT_CATEGORIES.find(c => c.id === selectedCategory)!;
  const categoryWants = getCategoryWants(selectedCategory!);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => setCurrentStep(1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Categories
        </button>

        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{currentCategoryData.icon}</span>
          <h1 className="text-2xl font-bold text-gray-900">{currentCategoryData.label}</h1>
        </div>
        <p className="text-gray-600">{currentCategoryData.description}</p>
      </div>

      {/* Add Want Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What do you want in this area?
            </label>
            <textarea
              value={currentWant.text}
              onChange={(e) => setCurrentWant(prev => ({ ...prev, text: e.target.value, category: selectedCategory! }))}
              placeholder={`Example: "I want us to have deeper conversations about our day"`}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={currentWant.isMostWanted}
                onChange={(e) => setCurrentWant(prev => ({ ...prev, isMostWanted: e.target.checked }))}
                disabled={!currentWant.isMostWanted && mostWantedCount >= maxMostWanted}
                className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
              />
              <Star className={`w-4 h-4 ${currentWant.isMostWanted ? 'text-yellow-600 fill-current' : 'text-gray-400'}`} />
              <span className="text-sm font-medium">
                Most Wanted (2x points!)
              </span>
            </label>

            <span className="text-xs text-gray-500">
              {mostWantedCount}/{maxMostWanted} used
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-500">
            {wants.length}/{maxWants} total wants
          </span>

          <button
            onClick={addWant}
            disabled={!currentWant.text.trim() || wants.length >= maxWants}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Want
          </button>
        </div>
      </div>

      {/* Category Wants List */}
      {categoryWants.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Your {currentCategoryData.label} Wants ({categoryWants.length})
          </h3>

          <div className="space-y-2">
            <AnimatePresence>
              {categoryWants.map((want) => (
                <motion.div
                  key={want.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start gap-3"
                >
                  <button
                    onClick={() => toggleMostWanted(want.id)}
                    className="mt-0.5 flex-shrink-0"
                  >
                    <Star className={`w-4 h-4 ${
                      want.isMostWanted
                        ? 'text-yellow-600 fill-current'
                        : 'text-gray-400 hover:text-yellow-400'
                    }`} />
                  </button>

                  <div className="flex-1">
                    <p className="text-gray-900">{want.text}</p>
                    {want.isMostWanted && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Most Wanted • 2x Points
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => removeWant(want.id)}
                    className="text-gray-400 hover:text-red-600 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(1)}
          className="text-gray-600 hover:text-gray-900 px-4 py-2 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Choose Another Category
        </button>

        {wants.length > 0 && (
          <button
            onClick={saveWants}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Check className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Continue to Willing List'}
          </button>
        )}
      </div>
    </div>
  );
};
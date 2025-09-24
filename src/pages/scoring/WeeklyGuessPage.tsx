import { FC, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { FirestoreService } from '../../services/firestoreService';
import { ScoringEngine } from '../../core/scoring';
import type { Want, WillingBox, Innermost, WeeklyScore } from '../../types/index';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Star, Trophy, Clock, CheckCircle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePremiumFeature, PremiumFeatures } from '../../hooks/usePremiumFeature';
import { UpgradePrompt } from '../../components/premium/UpgradePrompt';

interface GuessData {
  [wantId: string]: string;
}

export const WeeklyGuessPage: FC = () => {
  const { innermostId, weekNumber } = useParams<{ innermostId: string; weekNumber: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [innermost, setInnermost] = useState<Innermost | null>(null);
  const [willingBox, setWillingBox] = useState<WillingBox | null>(null);
  const [guesses, setGuesses] = useState<GuessData>({});
  const [weeklyScore, setWeeklyScore] = useState<WeeklyScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const currentWeekNum = weekNumber ? parseInt(weekNumber) : 1;

  // Check premium feature access
  const extendedHistory = usePremiumFeature(PremiumFeatures.EXTENDED_HISTORY);

  // Get current week number (same logic as in services)
  const getCurrentWeekNumber = (): number => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.floor(diff / oneWeek) + 1;
  };

  const actualCurrentWeek = getCurrentWeekNumber();
  const isViewingPastWeek = currentWeekNum < actualCurrentWeek;

  useEffect(() => {
    if (!innermostId || !user) {
      navigate('/innermosts');
      return;
    }

    // Check if free user is trying to access historical data
    if (isViewingPastWeek && !extendedHistory.isAvailable) {
      setShowUpgradePrompt(true);
      // Don't load data for past weeks if user doesn't have access
      setIsLoading(false);
      return;
    }

    loadData();
  }, [innermostId, user, weekNumber, isViewingPastWeek, extendedHistory.isAvailable]);

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
      
      // Load willing box
      const currentWillingBox = await FirestoreService.getWillingBox(innermostId);
      if (!currentWillingBox) {
        toast.error('No willing box found');
        navigate(`/innermosts/${innermostId}`);
        return;
      }
      
      setWillingBox(currentWillingBox);
      
      // Check if weekly score already exists
      const weeklyScores = await FirestoreService.getWeeklyScores(innermostId);
      const existingScore = weeklyScores.find(s => s.weekNumber === currentWeekNum);
      
      if (existingScore) {
        setWeeklyScore(existingScore);
        setShowResults(true);
        
        // Load existing guesses
        const isPartnerA = user.id === currentInnermost.partnerA;
        const userGuesses = isPartnerA ? existingScore.partnerAGuesses : existingScore.partnerBGuesses;
        
        if (userGuesses) {
          const guessData: GuessData = {};
          userGuesses.forEach(guess => {
            // Use wantId (or wishId if wantId doesn't exist) and effort fields
            const id = guess.wantId || (guess as any).wishId;
            if (id) {
              guessData[id] = guess.effort || '';
            }
          });
          setGuesses(guessData);
        }
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load weekly game');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuessChange = (wantId: string, effort: string) => {
    setGuesses(prev => ({
      ...prev,
      [wantId]: effort
    }));
  };

  const submitGuesses = async () => {
    if (!willingBox || !user || !innermost) return;
    
    // Validate all guesses are made
    const partnerWilling = getPartnerWillingItems();
    const missingGuesses = partnerWilling.filter(item => {
      const itemId = item.wantId || (item as any).wishId;
      return !itemId || !guesses[itemId] || guesses[itemId].trim() === '';
    });
    
    if (missingGuesses.length > 0) {
      toast.error(`Please make guesses for all ${partnerWilling.length} items`);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const isPartnerA = user.id === innermost.partnerA;
      
      // Convert guesses to the required format
      const userGuesses = Object.entries(guesses)
        .filter(([_, effort]) => effort && effort.trim()) // Filter out empty efforts
        .map(([wantId, effort]) => ({
          wantId,
          effort: effort.trim()
        }));
      
      // Check if weekly score already exists
      const existingScore = weeklyScore;
      if (!existingScore) {
        // Create new weekly score
        const newWeeklyScore: WeeklyScore = {
          id: `${innermostId}_week_${currentWeekNum}`,
          innermostId,
          weekNumber: currentWeekNum,
          partnerA: innermost.partnerA,
          partnerB: innermost.partnerB,
          partnerAGuesses: isPartnerA ? userGuesses : [],
          partnerBGuesses: isPartnerA ? [] : userGuesses,
          partnerAScore: 0,
          partnerBScore: 0,
          isComplete: false
        };
        
        await FirestoreService.saveWeeklyScore(newWeeklyScore);
        setWeeklyScore(newWeeklyScore);
      } else {
        // Update existing score with user's guesses
        const updatedScore: WeeklyScore = {
          ...existingScore,
          [isPartnerA ? 'partnerAGuesses' : 'partnerBGuesses']: userGuesses
        };
        
        await FirestoreService.saveWeeklyScore(updatedScore);
        setWeeklyScore(updatedScore);
      }
      
      toast.success('Your guesses have been submitted!');
      setShowResults(true);
      
    } catch (error) {
      console.error('Error submitting guesses:', error);
      toast.error('Failed to submit guesses');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPartnerWillingItems = () => {
    if (!willingBox || !innermost || !user) return [];

    const isPartnerA = user.id === innermost.partnerA;
    // Get the OTHER partner's willing items (what we need to guess about)
    // Use new field names first, fallback to legacy field names
    const partnerWilling = isPartnerA
      ? (willingBox.partnerBWillingList || willingBox.partnerBWilling)
      : (willingBox.partnerAWillingList || willingBox.partnerAWilling);

    return partnerWilling || [];
  };

  const getWantById = (wantId: string): Want | undefined => {
    // Try to find in wants array first (legacy)
    if (willingBox?.wants) {
      return willingBox.wants.find(w => w.id === wantId);
    }
    // Otherwise check in the wish lists
    const allWishes = [
      ...(willingBox?.partnerAWishList || willingBox?.partnerAWishlist || []),
      ...(willingBox?.partnerBWishList || willingBox?.partnerBWishlist || [])
    ];
    return allWishes.find(w => w.id === wantId);
  };

  const calculateScores = () => {
    if (!weeklyScore || !willingBox) return null;
    
    // Get all wishes/wants for scoring calculation
    const allWishes = willingBox.wants || [
      ...(willingBox.partnerAWishList || willingBox.partnerAWishlist || []),
      ...(willingBox.partnerBWishList || willingBox.partnerBWishlist || [])
    ];

    return ScoringEngine.calculateWeeklyScores(
      weeklyScore,
      allWishes,
      willingBox.partnerAWillingList || willingBox.partnerAWilling || [],
      willingBox.partnerBWillingList || willingBox.partnerBWilling || []
    );
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

  // Show upgrade prompt if free user is trying to access past weeks
  if (showUpgradePrompt && isViewingPastWeek) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/innermosts/${innermostId}/weekly-guess/${actualCurrentWeek}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Current Week
          </button>
        </div>

        <UpgradePrompt
          feature="Extended History"
          description="Access your complete scoring history and track your relationship progress over time. Free users can only view the current week."
          benefits={[
            'View all past weekly scores',
            'Track long-term relationship trends',
            'Compare performance across weeks',
            'Export historical data',
            'Analyze patterns in your guessing accuracy',
            'See improvement over time'
          ]}
          showModal={false}
        />

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate(`/innermosts/${innermostId}/weekly-guess/${actualCurrentWeek}`)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Go to Current Week (Week {actualCurrentWeek})
          </button>
        </div>
      </div>
    );
  }

  if (showResults && weeklyScore) {
    const scores = calculateScores();
    const isPartnerA = user?.id === innermost?.partnerA;
    const userScore = isPartnerA ? scores?.partnerAScore || 0 : scores?.partnerBScore || 0;
    const partnerScore = isPartnerA ? scores?.partnerBScore || 0 : scores?.partnerAScore || 0;

    return (
      <div className="p-4 max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/innermosts/${innermostId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Innermost
          </button>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Week {currentWeekNum} Results
              {isViewingPastWeek && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (Historical)
                </span>
              )}
            </h1>
            <p className="text-gray-600">Here's how you both did this week!</p>
          </div>

          {/* Week navigation for premium users viewing past weeks */}
          {extendedHistory.isAvailable && isViewingPastWeek && (
            <div className="flex items-center justify-center gap-4 mt-4">
              {currentWeekNum > 1 && (
                <button
                  onClick={() => navigate(`/innermosts/${innermostId}/weekly-guess/${currentWeekNum - 1}`)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← Week {currentWeekNum - 1}
                </button>
              )}
              {currentWeekNum < actualCurrentWeek && (
                <button
                  onClick={() => navigate(`/innermosts/${innermostId}/weekly-guess/${currentWeekNum + 1}`)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Week {currentWeekNum + 1} →
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Trophy className="w-10 h-10 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Your Score</p>
              <p className="text-3xl font-bold text-green-600">{userScore}</p>
            </div>
            
            <div className="text-center text-gray-400">
              <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center mb-2">
                <span className="text-lg font-bold">VS</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Trophy className="w-10 h-10 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Partner Score</p>
              <p className="text-3xl font-bold text-green-600">{partnerScore}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Guesses</h3>
          {getPartnerWillingItems().map(item => {
            // Get the ID (could be wantId or wishId)
            const itemId = item.wantId || (item as any).wishId;
            if (!itemId) return null;
            const want = getWantById(itemId);
            if (!want) return null;

            const userGuess = itemId ? (guesses[itemId] || '') : '';
            // Get the effort level (could be effort or effortLevel)
            const actualEffort = item.effort || (item as any).effortLevel || '';
            
            return (
              <div key={itemId} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  {want.isMostWanted && (
                    <Star className="w-5 h-5 text-yellow-600 fill-current mt-0.5" />
                  )}
                  <p className="font-medium text-gray-900 flex-1">{want.text}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 font-medium">Your Guess:</p>
                    <p className="text-gray-900">{userGuess || 'No guess'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-medium">Actual Effort:</p>
                    <p className="text-gray-900">{actualEffort || 'Not completed'}</p>
                  </div>
                </div>
                
                {userGuess === actualEffort && (
                  <div className="flex items-center gap-2 mt-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Perfect match! +{want.isMostWanted ? 2 : 1} point</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const partnerWilling = getPartnerWillingItems();
  const totalGuesses = partnerWilling.length;
  const madeGuesses = Object.keys(guesses).filter(wantId => guesses[wantId]?.trim()).length;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/innermosts/${innermostId}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Innermost
        </button>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-6 h-6 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Week {currentWeekNum} Guessing Game
              {isViewingPastWeek && extendedHistory.isAvailable && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (Historical)
                </span>
              )}
            </h1>
          </div>
          <p className="text-gray-600">
            {isViewingPastWeek
              ? "Review how your partner put effort into the items they selected."
              : "Guess how your partner put effort into the items they selected. Correct guesses earn you points!"
            }
          </p>

          {/* Show lock indicator for past weeks if not premium */}
          {!extendedHistory.isAvailable && currentWeekNum !== actualCurrentWeek && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-3">
              <Lock className="w-5 h-5 text-yellow-600" />
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-yellow-900">
                  Historical weeks are locked
                </p>
                <p className="text-xs text-yellow-700">
                  Upgrade to premium to view past weekly scores
                </p>
              </div>
              <button
                onClick={() => extendedHistory.showUpgradePrompt()}
                className="text-yellow-600 hover:text-yellow-700 text-sm font-medium"
              >
                Upgrade
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-green-900 font-semibold">Scoring Rules</h3>
            <p className="text-green-800 text-sm">
              1 point for correct guesses • 2 points for Most Wanted items
            </p>
          </div>
          <div className="text-right">
            <p className="text-green-900 font-semibold">{madeGuesses}/{totalGuesses}</p>
            <p className="text-green-800 text-sm">Guesses made</p>
          </div>
        </div>
      </div>

      {partnerWilling.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Items to Guess
          </h3>
          <p className="text-gray-600">
            Your partner hasn't selected any willing items yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {partnerWilling.map((item, index) => {
            const itemId = item.wantId || (item as any).wishId;
            if (!itemId) return null;
            const want = getWantById(itemId);
            if (!want) return null;
            
            return (
              <motion.div
                key={itemId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start gap-3 mb-4">
                  {want.isMostWanted && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-600 fill-current" />
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
                        2x Points
                      </span>
                    </div>
                  )}
                </div>
                
                <p className="font-medium text-gray-900 mb-4">{want.text}</p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How do you think your partner put effort into this?
                  </label>
                  <textarea
                    value={guesses[itemId] || ''}
                    onChange={(e) => handleGuessChange(itemId, e.target.value)}
                    placeholder="Describe the specific effort you think they made..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {partnerWilling.length > 0 && (
        <div className="sticky bottom-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">
                  {madeGuesses}/{totalGuesses} guesses complete
                </p>
                <p className="text-sm text-gray-600">
                  Make your best guesses to earn points!
                </p>
              </div>
              
              <button
                onClick={submitGuesses}
                disabled={madeGuesses !== totalGuesses || isSubmitting}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors font-semibold"
              >
                <Trophy className="w-5 h-5" />
                {isSubmitting ? 'Submitting...' : 'Submit Guesses'}
              </button>
            </div>
            
            {madeGuesses > 0 && (
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(madeGuesses / totalGuesses) * 100}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
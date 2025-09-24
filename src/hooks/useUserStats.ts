import { useMemo } from 'react';
import { useInnermostStore } from '../stores/innermostStore';

/**
 * Hook to calculate user statistics from innermost data
 */
export const useUserStats = () => {
  const { innermosts, weeklyScores, willingBoxes } = useInnermostStore();

  const stats = useMemo(() => {
    // Count active relationships
    const activeInnermosts = innermosts.filter(i => i.status === 'active');
    const pendingInnermosts = innermosts.filter(i => i.status === 'pending');

    // Calculate total leaves grown (completed weeks)
    let totalLeavesGrown = 0;
    let totalScore = 0;
    let currentWeekActivities = 0;

    // Calculate stats from weekly scores
    Object.values(weeklyScores).forEach(scores => {
      scores.forEach(score => {
        if (score.isComplete) {
          totalLeavesGrown++;
          totalScore += score.partnerAScore + score.partnerBScore;
        }
      });
    });

    // Check current week activities
    Object.entries(willingBoxes).forEach(([innermostId, box]) => {
      const innermost = innermosts.find(i => i.id === innermostId);
      if (innermost?.status === 'active') {
        // Check if there's action needed this week
        if (box.status === 'planting_trees' &&
            (!box.partnerAWishList?.length || !box.partnerBWishList?.length)) {
          currentWeekActivities++;
        } else if (box.status === 'selecting_willing' &&
            (!box.partnerAWillingList?.length || !box.partnerBWillingList?.length)) {
          currentWeekActivities++;
        } else if (box.status === 'guessing') {
          // Check if guessing is needed for this week
          const currentWeekScore = weeklyScores[innermostId]?.find(
            s => s.weekNumber === box.weekNumber
          );
          if (!currentWeekScore?.isComplete) {
            currentWeekActivities++;
          }
        }
      }
    });

    // Calculate tree growth percentage (based on weeks completed)
    const maxWeeksPerTree = 12; // Assuming 12 week cycles
    const averageGrowth = activeInnermosts.length > 0
      ? Math.round((totalLeavesGrown / (activeInnermosts.length * maxWeeksPerTree)) * 100)
      : 0;

    return {
      totalTrees: innermosts.length,
      activeTrees: activeInnermosts.length,
      pendingTrees: pendingInnermosts.length,
      totalLeavesGrown,
      totalScore,
      averageTreeGrowth: averageGrowth,
      currentWeekActivities,
      needsAction: currentWeekActivities > 0,
    };
  }, [innermosts, weeklyScores, willingBoxes]);

  return stats;
};
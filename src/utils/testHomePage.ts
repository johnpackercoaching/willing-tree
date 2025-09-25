/**
 * Test utility for HomePage data fetching
 * This can be imported in the browser console to test data loading
 */

import { useInnermostStore } from '../stores/innermostStore';
import { useAuthStore } from '../stores/authStore';

export const testHomePage = () => {
  const authState = useAuthStore.getState();
  const innermostState = useInnermostStore.getState();

  console.log('=== HomePage Data Test ===');
  console.log('Auth State:', {
    user: authState.user,
    isInitialized: authState.isInitialized,
    error: authState.error
  });

  console.log('Innermost Store:', {
    innermosts: innermostState.innermosts,
    pendingInvitations: innermostState.pendingInvitations,
    willingBoxes: innermostState.willingBoxes,
    weeklyScores: innermostState.weeklyScores,
    isLoading: innermostState.isLoading,
    error: innermostState.error
  });

  // Check if data is being fetched
  if (authState.user) {
    console.log('User is logged in:', authState.user.email);
    console.log('Number of innermosts:', innermostState.innermosts.length);

    if (innermostState.innermosts.length > 0) {
      console.log('Innermosts details:');
      innermostState.innermosts.forEach((innermost, index) => {
        console.log(`  ${index + 1}. ${innermost.partnerBEmail || innermost.partnerAEmail} - Status: ${innermost.status}`);

        const willingBox = innermostState.willingBoxes[innermost.id];
        if (willingBox) {
          console.log(`     - Willing Box: Week ${willingBox.weekNumber}, Status: ${willingBox.status}`);
        }

        const scores = innermostState.weeklyScores[innermost.id];
        if (scores && scores.length > 0) {
          console.log(`     - Scores: ${scores.length} weeks completed`);
        }
      });
    }
  } else {
    console.log('No user logged in');
  }

  return {
    authState,
    innermostState
  };
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testHomePage = testHomePage;
}
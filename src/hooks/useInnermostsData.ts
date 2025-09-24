import { useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  QuerySnapshot
} from 'firebase/firestore';
import { getFirebaseDb } from '../config/firebase';
import { useAuthStore } from '../stores/authStore';
import { useInnermostStore } from '../stores/innermostStore';
import type { Innermost, WillingBox, WeeklyScore, PairingInvitation } from '../types';

/**
 * Custom hook to fetch and listen to real-time Innermost data from Firestore
 */
export const useInnermostsData = () => {
  const { user } = useAuthStore();
  const {
    setInnermosts,
    setLoading,
    setError,
    setPendingInvitations,
    setWillingBox,
    setWeeklyScores,
    innermosts,
    isLoading,
    error
  } = useInnermostStore();

  // Fetch and listen to innermosts
  useEffect(() => {
    if (!user?.id) {
      console.log('[useInnermostsData] No user ID found, clearing data');
      setInnermosts([]);
      setPendingInvitations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Create queries for innermosts where user is either partnerA or partnerB
    console.log('[useInnermostsData] Setting up queries for user:', user.id);
    const innermostsRef = collection(getFirebaseDb(), 'innermosts');

    // Note: These queries require composite indexes in Firestore.
    // If indexes are not deployed, we'll fall back to simpler queries.
    const qA = query(
      innermostsRef,
      where('partnerA', '==', user.id),
      orderBy('createdAt', 'desc')
    );
    const qB = query(
      innermostsRef,
      where('partnerB', '==', user.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribes: (() => void)[] = [];

    // Listen to innermosts where user is partnerA
    const unsubA = onSnapshot(
      qA,
      (snapshot) => {
        console.log(`[useInnermostsData] Received ${snapshot.size} innermosts where user is partnerA`);
        handleInnermostsSnapshot(snapshot, 'A');
      },
      (error) => {
        console.error('Error fetching innermosts (partnerA):', error);

        // Check if this is an index error
        if (error.code === 'failed-precondition' && error.message?.includes('index')) {
          console.warn('[useInnermostsData] Index not available, trying without orderBy');
          // Fallback to query without orderBy
          const fallbackQueryA = query(
            innermostsRef,
            where('partnerA', '==', user.id)
          );
          const fallbackUnsubA = onSnapshot(
            fallbackQueryA,
            (snapshot) => {
              console.log(`[useInnermostsData] Fallback: Received ${snapshot.size} innermosts where user is partnerA`);
              handleInnermostsSnapshot(snapshot, 'A');
            },
            (fallbackError) => {
              console.error('Fallback query also failed (partnerA):', fallbackError);
              setError(`Unable to load your relationships. Please try refreshing the page. Error: ${fallbackError.message}`);
              setLoading(false);
            }
          );
          // Replace the original unsubscribe with the fallback one
          unsubscribes[unsubscribes.indexOf(unsubA)] = fallbackUnsubA;
        } else {
          setError(`Failed to load relationships where you are partner A. ${error.message || 'Please try refreshing the page.'}`);
          setLoading(false);
        }
      }
    );
    unsubscribes.push(unsubA);

    // Listen to innermosts where user is partnerB
    const unsubB = onSnapshot(
      qB,
      (snapshot) => {
        console.log(`[useInnermostsData] Received ${snapshot.size} innermosts where user is partnerB`);
        handleInnermostsSnapshot(snapshot, 'B');
      },
      (error) => {
        console.error('Error fetching innermosts (partnerB):', error);

        // Check if this is an index error
        if (error.code === 'failed-precondition' && error.message?.includes('index')) {
          console.warn('[useInnermostsData] Index not available, trying without orderBy');
          // Fallback to query without orderBy
          const fallbackQueryB = query(
            innermostsRef,
            where('partnerB', '==', user.id)
          );
          const fallbackUnsubB = onSnapshot(
            fallbackQueryB,
            (snapshot) => {
              console.log(`[useInnermostsData] Fallback: Received ${snapshot.size} innermosts where user is partnerB`);
              handleInnermostsSnapshot(snapshot, 'B');
            },
            (fallbackError) => {
              console.error('Fallback query also failed (partnerB):', fallbackError);
              setError(`Unable to load your relationships. Please try refreshing the page. Error: ${fallbackError.message}`);
              setLoading(false);
            }
          );
          // Replace the original unsubscribe with the fallback one
          unsubscribes[unsubscribes.indexOf(unsubB)] = fallbackUnsubB;
        } else {
          setError(`Failed to load relationships where you are partner B. ${error.message || 'Please try refreshing the page.'}`);
          setLoading(false);
        }
      }
    );
    unsubscribes.push(unsubB);

    // Listen to pending invitations
    const invitationsRef = collection(getFirebaseDb(), 'pairingInvitations');
    const invitationsQuery = query(
      invitationsRef,
      where('toEmail', '==', user.email?.toLowerCase()),
      where('status', '==', 'pending')
    );

    const unsubInvitations = onSnapshot(
      invitationsQuery,
      (snapshot) => {
        console.log(`[useInnermostsData] Received ${snapshot.size} pending invitations`);
        const invitations: PairingInvitation[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          try {
            invitations.push({
              id: doc.id,
              fromUserId: data.fromUserId,
              fromUserName: data.fromUserName,
              toEmail: data.toEmail,
              status: data.status,
              createdAt: data.createdAt?.toDate() || new Date(),
              expiresAt: data.expiresAt?.toDate() || new Date(),
            } as PairingInvitation);
          } catch (err) {
            console.error(`[useInnermostsData] Error processing invitation ${doc.id}:`, err);
          }
        });
        setPendingInvitations(invitations);
      },
      (error) => {
        console.error('Error fetching invitations:', error);
        // Don't set a user-facing error for invitations, as they're not critical
        // Just log the error and continue
        setPendingInvitations([]);
      }
    );
    unsubscribes.push(unsubInvitations);

    let innermostsFromA: Innermost[] = [];
    let innermostsFromB: Innermost[] = [];

    function handleInnermostsSnapshot(snapshot: QuerySnapshot, source: 'A' | 'B') {
      const newInnermosts: Innermost[] = [];

      // Handle empty results gracefully
      if (snapshot.empty) {
        console.log(`[useInnermostsData] No innermosts found for source ${source}`);
      }

      snapshot.forEach((doc) => {
        const data = doc.data();
        try {
          newInnermosts.push({
            id: doc.id,
            partnerA: data.partnerA,
            partnerB: data.partnerB,
            partnerAName: data.partnerAName,
            partnerBName: data.partnerBName,
            partnerAEmail: data.partnerAEmail,
            partnerBEmail: data.partnerBEmail,
            currentWeek: data.currentWeek || 0,
            status: data.status,
            pairingCode: data.pairingCode,
            inviteMessage: data.inviteMessage,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Innermost);
        } catch (err) {
          console.error(`[useInnermostsData] Error processing innermost document ${doc.id}:`, err);
        }
      });

      if (source === 'A') {
        innermostsFromA = newInnermosts;
      } else {
        innermostsFromB = newInnermosts;
      }

      // Combine and deduplicate innermosts
      const allInnermosts = [...innermostsFromA, ...innermostsFromB];
      const uniqueInnermosts = Array.from(
        new Map(allInnermosts.map(item => [item.id, item])).values()
      );

      // Sort by createdAt if we didn't get ordered results from the query
      uniqueInnermosts.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });

      console.log(`[useInnermostsData] Total unique innermosts: ${uniqueInnermosts.length}`);
      setInnermosts(uniqueInnermosts);
      setLoading(false);

      // Clear any previous errors on successful load
      if (uniqueInnermosts.length > 0 || (innermostsFromA.length === 0 && innermostsFromB.length === 0)) {
        setError(null);
      }
    }

    // Cleanup function
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user?.id, user?.email]);

  // Fetch willing boxes and scores for active innermosts
  useEffect(() => {
    if (!user?.id) {
      console.log('[useInnermostsData] No user ID, skipping willing box and scores fetch');
      return;
    }

    if (innermosts.length === 0) {
      console.log('[useInnermostsData] No innermosts found, user may be new or have no relationships yet');
      return;
    }

    const unsubscribes: (() => void)[] = [];

    // For each active innermost, listen to its willing box and scores
    innermosts
      .filter(innermost => innermost.status === 'active')
      .forEach(innermost => {
        // Listen to willing box
        console.log('[useInnermostsData] Setting up willing box listener for:', innermost.id);
        const willingBoxRef = collection(getFirebaseDb(), 'willingBoxes');
        const willingBoxQuery = query(
          willingBoxRef,
          where('innermostId', '==', innermost.id)
        );

        const unsubWillingBox = onSnapshot(
          willingBoxQuery,
          (snapshot) => {
            if (!snapshot.empty) {
              const doc = snapshot.docs[0];
              const data = doc.data();
              try {
                const willingBox: WillingBox = {
                  id: doc.id,
                  innermostId: data.innermostId,
                  partnerA: data.partnerA,
                  partnerB: data.partnerB,
                  partnerAWishList: data.partnerAWishList || [],
                  partnerBWishList: data.partnerBWishList || [],
                  partnerAWillingList: data.partnerAWillingList || [],
                  partnerBWillingList: data.partnerBWillingList || [],
                  weekNumber: data.weekNumber || 1,
                  status: data.status || 'planting_trees',
                  isLocked: data.isLocked || false,
                  lockedAt: data.lockedAt?.toDate(),
                  createdAt: data.createdAt?.toDate() || new Date(),
                };
                setWillingBox(innermost.id, willingBox);
                console.log(`[useInnermostsData] Loaded willing box for innermost ${innermost.id}`);
              } catch (err) {
                console.error(`[useInnermostsData] Error processing willing box for ${innermost.id}:`, err);
              }
            } else {
              console.log(`[useInnermostsData] No willing box found for innermost ${innermost.id}`);
            }
          },
          (error) => {
            console.error(`[useInnermostsData] Error fetching willing box for ${innermost.id}:`, error);
            // Don't show user-facing error for willing box as it's optional data
          }
        );
        unsubscribes.push(unsubWillingBox);

        // Listen to weekly scores
        const scoresRef = collection(getFirebaseDb(), 'weeklyScores');
        const scoresQuery = query(
          scoresRef,
          where('innermostId', '==', innermost.id),
          orderBy('weekNumber', 'asc')
        );

        const unsubScores = onSnapshot(
          scoresQuery,
          (snapshot) => {
            const scores: WeeklyScore[] = [];
            if (snapshot.empty) {
              console.log(`[useInnermostsData] No weekly scores found for innermost ${innermost.id}`);
            }
            snapshot.forEach((doc) => {
              const data = doc.data();
              try {
                scores.push({
                  id: doc.id,
                  innermostId: data.innermostId,
                  weekNumber: data.weekNumber,
                  partnerA: data.partnerA,
                  partnerB: data.partnerB,
                  partnerAGuesses: data.partnerAGuesses || [],
                  partnerBGuesses: data.partnerBGuesses || [],
                  partnerAScore: data.partnerAScore || 0,
                  partnerBScore: data.partnerBScore || 0,
                  isComplete: data.isComplete || false,
                  completedAt: data.completedAt?.toDate(),
                } as WeeklyScore);
              } catch (err) {
                console.error(`[useInnermostsData] Error processing weekly score ${doc.id}:`, err);
              }
            });
            setWeeklyScores(innermost.id, scores);
            console.log(`[useInnermostsData] Loaded ${scores.length} weekly scores for innermost ${innermost.id}`);
          },
          (error) => {
            console.error(`[useInnermostsData] Error fetching scores for ${innermost.id}:`, error);
            // Check if this is an index error for the orderBy clause
            if (error.code === 'failed-precondition' && error.message?.includes('index')) {
              console.warn('[useInnermostsData] Index not available for weekly scores, trying without orderBy');
              // Fallback to query without orderBy
              const fallbackScoresQuery = query(
                scoresRef,
                where('innermostId', '==', innermost.id)
              );
              const fallbackUnsubScores = onSnapshot(
                fallbackScoresQuery,
                (snapshot) => {
                  const scores: WeeklyScore[] = [];
                  snapshot.forEach((doc) => {
                    const data = doc.data();
                    try {
                      scores.push({
                        id: doc.id,
                        innermostId: data.innermostId,
                        weekNumber: data.weekNumber,
                        partnerA: data.partnerA,
                        partnerB: data.partnerB,
                        partnerAGuesses: data.partnerAGuesses || [],
                        partnerBGuesses: data.partnerBGuesses || [],
                        partnerAScore: data.partnerAScore || 0,
                        partnerBScore: data.partnerBScore || 0,
                        isComplete: data.isComplete || false,
                        completedAt: data.completedAt?.toDate(),
                      } as WeeklyScore);
                    } catch (err) {
                      console.error(`[useInnermostsData] Error processing weekly score ${doc.id}:`, err);
                    }
                  });
                  // Sort scores by weekNumber manually
                  scores.sort((a, b) => a.weekNumber - b.weekNumber);
                  setWeeklyScores(innermost.id, scores);
                  console.log(`[useInnermostsData] Fallback: Loaded ${scores.length} weekly scores for innermost ${innermost.id}`);
                },
                (fallbackError) => {
                  console.error(`[useInnermostsData] Fallback query also failed for scores:`, fallbackError);
                  // Don't show user-facing error for scores as they're optional data
                  setWeeklyScores(innermost.id, []);
                }
              );
              // Replace the original unsubscribe with the fallback one
              unsubscribes[unsubscribes.indexOf(unsubScores)] = fallbackUnsubScores;
            } else {
              // Don't show user-facing error for scores as they're optional data
              setWeeklyScores(innermost.id, []);
            }
          }
        );
        unsubscribes.push(unsubScores);
      });

    // Cleanup function
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [innermosts, user?.id]);

  return {
    innermosts,
    isLoading,
    error,
  };
};
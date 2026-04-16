import { useUserStore } from '@/store/useUserStore';
import { getActiveFirebase } from '@/lib/firebaseManager';
import { useMemo } from 'react';

/**
 * useActiveFirestore - Returns the appropriate Firestore instance based on user tier.
 * Logins always happen on the Master Firebase, but data routes dynamically.
 */
export function useActiveFirestore() {
  const tier = useUserStore(state => state.tier);
  const customConfig = useUserStore(state => state.customFirebaseConfig);
  
  // Memoize the DB instance based on tier/config to prevent redundant logic
  const { db } = useMemo(() => {
    return getActiveFirebase();
  }, [tier, customConfig]);

  return db;
}

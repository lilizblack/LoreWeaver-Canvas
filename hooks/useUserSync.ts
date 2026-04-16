"use client";

/**
 * useUserSync.ts
 *
 * Called once after the user logs in.
 * Fetches their user document from Master Firestore and restores:
 *   - tier (spark / pro / byoh)
 *   - customFirebaseConfig (decrypted from encryptedByohConfig)
 *
 * This allows BYOH users to roam across devices without re-entering their config.
 *
 * RULE: Auth is always on Master Firebase. This hook only reads from Master.
 */

import { useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db as masterDb } from '@/lib/firebase';
import { decryptConfig } from '@/lib/configCrypto';
import { useUserStore } from '@/store/useUserStore';
import { useAuth } from './useAuth';

export function useUserSync() {
  const { user, loading } = useAuth();
  const { tier, setTier, setCustomFirebaseConfig } = useUserStore();

  useEffect(() => {
    if (loading || !user) return;

    let cancelled = false;

    async function syncFromMaster() {
      try {
        const userDocRef = doc(masterDb, 'users', user!.uid);
        const snap = await getDoc(userDocRef);

        if (!snap.exists() || cancelled) return;

        const data = snap.data();

        // 1. Restore tier (always trust Firestore over localStorage on login)
        if (data.tier && data.tier !== tier) {
          setTier(data.tier);
        }

        // 2. Restore BYOH config if stored and tier is byoh
        if (data.tier === 'byoh' && data.encryptedByohConfig) {
          const config = await decryptConfig(data.encryptedByohConfig, user!.uid);
          if (config && !cancelled) {
            setCustomFirebaseConfig(config as any);
            console.log('[UserSync] BYOH config restored from Master Firestore.');
          }
        }
      } catch (e) {
        console.warn('[UserSync] Could not sync user settings from Master:', e);
      }
    }

    syncFromMaster();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, loading]);
}

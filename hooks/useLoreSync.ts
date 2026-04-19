"use client";

import { useEffect, useCallback, useRef, useState } from 'react';
import { 
  doc, 
  onSnapshot, 
  setDoc,
  Firestore
} from 'firebase/firestore';
import { getActiveFirebase } from '@/lib/firebaseManager';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useWorldStore } from '@/store/useWorldStore';
import { useUserStore } from '@/store/useUserStore';
import { useAuth } from './useAuth';

export type SyncStatus = 'saved' | 'saving' | 'unsaved' | 'error';

/**
 * useLoreSync - The "Sync Engine" for Lore Weaver
 * Implements a 2-second debounced snapshot approach.
 * Hierarchy: users/{uid}/projects/{projectId}
 * Now supports Dynamic Routing (BYOH).
 */
export function useLoreSync(projectId: string = 'default-project') {
  const { user } = useAuth();
  const tier = useUserStore(state => state.tier);
  const customConfig = useUserStore(state => state.customFirebaseConfig);
  
  const {
    nodes, edges, links,
    mainNodes, mainEdges,
    loreNodes, loreEdges,
  } = useCanvasStore();
  
  const world = useWorldStore();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('saved');
  const [retryTick, setRetryTick] = useState(0);

  const isInitialLoadFinished = useRef(false);
  const hasReceivedData = useRef(false);
  const lastProjectHash = useRef<string>('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tracks the active firestore instance actually used by the listeners/saves
  const activeDbRef = useRef<Firestore | null>(null);

  const getStateHash = (data: any) => {
    if (!data) return '';
    // Strip metadata that shouldn't trigger a sync
    const { updatedAt, exportedAt, version, ...rest } = data;
    
    // Stable stringify by sorting keys
    const sortKeys = (obj: any): any => {
      if (Array.isArray(obj)) return obj.map(sortKeys);
      if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj)
          .sort()
          .reduce((res: any, key) => {
            res[key] = sortKeys(obj[key]);
            return res;
          }, {});
      }
      return obj;
    };
    
    return JSON.stringify(sortKeys(rest));
  };

  // Clean data for Firestore (remove undefineds)
  const cleanData = useCallback((obj: any): any => {
    if (Array.isArray(obj)) return obj.map(cleanData);
    if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj)
        .sort() // Stable key order
        .filter((k) => obj[k] !== undefined)
        .reduce((res: any, k) => {
          res[k] = cleanData(obj[k]);
          return res;
        }, {});
    }
    return obj;
  }, []);
  
  const toObj = (val: any) => {
    if (Array.isArray(val)) {
      return Object.fromEntries(val.filter((x: any) => x && x.id).map((x: any) => [x.id, x]));
    }
    return val || {};
  };

  // ── Remote-to-local sync ───────────────────────────────────────────────────
  useEffect(() => {
    // Reset state flags when the project target changes (Tier / Config change)
    isInitialLoadFinished.current = false;
    hasReceivedData.current = false; 
    lastProjectHash.current = '';
    
    if (!user || !projectId) return;

    // Dynamically get the DB based on currently selected Tier/Config
    const { db } = getActiveFirebase();
    activeDbRef.current = db;

    const isBYOH = tier === 'byoh' && !!customConfig;
    console.log(`[SyncEngine] Initializing project: ${projectId} (${isBYOH ? 'BYOH' : 'Master'})`);

    const projectDocRef = doc(db, 'users', user.uid, 'projects', projectId);

    const unsubscribe = onSnapshot(projectDocRef, (snap) => {
      const isFromServer = !snap.metadata.fromCache;
      const exists = snap.exists();
      
      // Don't swallow our own writes (saves)
      if (snap.metadata.hasPendingWrites) return;

      if (exists) {
        const data = snap.data();
        const hash = getStateHash(data);
        
        if (hash !== lastProjectHash.current) {
          console.log(`[SyncEngine] Applying remote data update (${isFromServer ? 'server' : 'cache'})`);
          lastProjectHash.current = hash;
          
          // 1. Update Canvas State
          const canvasState = data.canvasState || {};
          const currentMode = useCanvasStore.getState().canvasMode;
          
          const canvasUpdates: any = {
            mainNodes: canvasState.mainNodes || data.nodes || [],
            mainEdges: canvasState.mainEdges || data.edges || [],
            loreNodes: canvasState.loreNodes || [],
            loreEdges: canvasState.loreEdges || [],
            links: (data.links || []).filter((l: any) => l && l.sourceId),
          };

          // Re-inflate active view
          if (currentMode === 'main') {
            canvasUpdates.nodes = canvasUpdates.mainNodes;
            canvasUpdates.edges = canvasUpdates.mainEdges;
          } else {
            canvasUpdates.nodes = canvasUpdates.loreNodes;
            canvasUpdates.edges = canvasUpdates.loreEdges;
          }

          useCanvasStore.setState(canvasUpdates);

          // 2. Update World/Lore Data - Use built-in setState for more reliable atomic update
          const worldUpdates: any = {};
          if (data.characters !== undefined) worldUpdates.characters = toObj(data.characters);
          if (data.chapters !== undefined)   worldUpdates.chapters = toObj(data.chapters);
          if (data.notes !== undefined)      worldUpdates.notes = toObj(data.notes);
          if (data.items !== undefined)      worldUpdates.items = toObj(data.items);
          if (data.places !== undefined)     worldUpdates.places = toObj(data.places);
          if (data.events !== undefined)     worldUpdates.events = toObj(data.events);
          if (data.concepts !== undefined)   worldUpdates.concepts = toObj(data.concepts);
          
          if (Object.keys(worldUpdates).length > 0) {
            useWorldStore.setState(worldUpdates);
          }
          
          hasReceivedData.current = true;
          setSyncStatus('saved');
        }
        
        // HYDRATION RULE: If data exists (server OR cache), we are safe to enable saves
        if (!isInitialLoadFinished.current) {
          isInitialLoadFinished.current = true;
          console.log(`[SyncEngine] Hydrated from ${isFromServer ? 'server' : 'cache'}.`);
        }
      } else {
        // Document doesn't exist yet
        lastProjectHash.current = '';
        if (isFromServer) {
          isInitialLoadFinished.current = true;
          hasReceivedData.current = true; // For new projects
          console.log('[SyncEngine] New project confirmed by server.');
        } else {
          console.log('[SyncEngine] Cache is empty, waiting for server confirmation...');
        }
      }
    }, (err) => {
      console.error('[SyncEngine] Listener failure:', err);
      // Wait a bit before giving up to allow offline work
      setTimeout(() => {
        if (!isInitialLoadFinished.current) {
          isInitialLoadFinished.current = true;
          setSyncStatus('error');
        }
      }, 5000);
    });

    return () => unsubscribe();
  }, [user, projectId, tier, customConfig]);

  // ── Local-to-remote auto-save (2-second debounce) ─────────────────────────
  useEffect(() => {
    // 1. Core Logic Gates
    if (!user || !projectId || !isInitialLoadFinished.current) return;

    // ── Pre-Save Calculations ──
    const totalLoreCount = 
      Object.keys(world.characters).length + 
      Object.keys(world.chapters).length + 
      Object.keys(world.notes).length + 
      Object.keys(world.places).length + 
      Object.keys(world.events).length + 
      Object.keys(world.concepts).length + 
      Object.keys(world.items).length;

    const totalCanvasCount = (mainNodes.length + loreNodes.length);

    // ── Safety Guard: Prevent Absolute Wipeout ───────────────────────────────
    
    // 2. Hydration Check: Never save an empty state if we haven't confirmed server status
    if (!hasReceivedData.current && totalLoreCount === 0 && totalCanvasCount === 0) {
      console.warn('[SyncEngine] Save deferred: Waiting for server data confirmation.');
      return;
    }

    // 3. The "Suspicious Clear" Guard: If everything is missing but we HAD data before, block it.
    const isSuspiciousClear = lastProjectHash.current !== '' && 
                             lastProjectHash.current !== '{}' && 
                             totalLoreCount === 0 && 
                             totalCanvasCount === 0;

    if (isSuspiciousClear) {
      console.error('[SyncEngine] CORE PROTECTION: Blocked auto-save of empty state over existing cloud data.');
      setSyncStatus('error');
      // Force a re-fetch to recover? 
      setRetryTick(t => t + 1);
      return;
    }

    const projectPayload = cleanData({
      canvasState: {
        mainNodes, mainEdges,
        loreNodes, loreEdges,
      },
      links,
      characters: world.characters,
      chapters: world.chapters,
      notes: world.notes,
      items: world.items,
      places: world.places,
      events: world.events,
      concepts: world.concepts,
      updatedAt: Date.now()
    });

    const currentHash = getStateHash(projectPayload);
    if (currentHash === lastProjectHash.current) return;

    setSyncStatus('unsaved');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      // Re-check gate before executing async save
      if (!activeDbRef.current || !isInitialLoadFinished.current) return;

      setSyncStatus('saving');
      try {
        const projectDocRef = doc(activeDbRef.current, 'users', user.uid, 'projects', projectId);
        await setDoc(projectDocRef, projectPayload, { merge: true });
        
        lastProjectHash.current = currentHash;
        setSyncStatus('saved');
        console.log('[SyncEngine] Pushed to cloud.');
      } catch (err: any) {
        console.error('[SyncEngine] Save error:', err);
        setSyncStatus('error');
        // If it's a permission error, don't retry immediately
        if (err.code !== 'permission-denied') {
          setTimeout(() => setRetryTick(t => t + 1), 5000);
        }
      }
    }, 2000);

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [
    user, projectId, mainNodes, mainEdges, loreNodes, loreEdges, links, 
    world.characters, world.chapters, world.notes, world.items, world.places, world.events, world.concepts,
    retryTick, cleanData
  ]);

  // ── Manual Utilities ───────────────────────────────────────────────────────
  const exportBackup = useCallback(() => {
    try {
      const payload = {
        canvasState: { mainNodes, mainEdges, loreNodes, loreEdges },
        links,
        world: {
          characters: world.characters,
          chapters: world.chapters,
          notes: world.notes,
          items: world.items,
          places: world.places,
          events: world.events,
          concepts: world.concepts,
        },
        exportedAt: new Date().toISOString(),
        version: "2.0"
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `loreweaver-backup-${projectId}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[SyncEngine] Export failed:', err);
      alert('Export failed.');
    }
  }, [projectId, mainNodes, mainEdges, loreNodes, loreEdges, links, 
      world.characters, world.chapters, world.notes, world.items, world.places, world.events, world.concepts]);

  const importBackup = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      let data = JSON.parse(text);
      
      if (Array.isArray(data) && data.length > 0) data = data[0];

      const hasCanvas = data?.canvasState || data?.nodes;
      const hasWorld = data?.world || data?.characters || data?.chapters;

      if (!data || (!hasCanvas && !hasWorld)) {
        throw new Error("Invalid backup format.");
      }

      console.log('[SyncEngine] Manual Import Initiated');

      const state = data.canvasState || {};
      const currentMode = useCanvasStore.getState().canvasMode;
      
      useCanvasStore.setState({
        mainNodes: state.mainNodes || data.nodes || [],
        mainEdges: state.mainEdges || data.edges || [],
        loreNodes: state.loreNodes || [],
        loreEdges: state.loreEdges || [],
        links: data.links || [],
        nodes: currentMode === 'main' 
          ? (state.mainNodes || data.nodes || []) 
          : (state.loreNodes || []),
        edges: currentMode === 'main' 
          ? (state.mainEdges || data.edges || []) 
          : (state.loreEdges || []),
      });

      const w = data.world || data;
      const worldStore = useWorldStore.getState();
      
      const worldUpdates: any = {};
      if (w.characters) worldUpdates.characters = toObj(w.characters);
      if (w.chapters)   worldUpdates.chapters = toObj(w.chapters);
      if (w.notes)      worldUpdates.notes = toObj(w.notes);
      if (w.items)      worldUpdates.items = toObj(w.items);
      if (w.places)     worldUpdates.places = toObj(w.places);
      if (w.events)     worldUpdates.events = toObj(w.events);
      if (w.concepts)   worldUpdates.concepts = toObj(w.concepts);

      if (Object.keys(worldUpdates).length > 0) {
        useWorldStore.setState(worldUpdates);
      }

      lastProjectHash.current = '';
      setRetryTick(t => t + 1);
      
      return true;
    } catch (err: any) {
      console.error('[SyncEngine] Import failed:', err);
      throw err;
    }
  }, []);

  const syncToFirestore = useCallback(() => {
    setRetryTick(t => t+1);
  }, []);

  return { syncStatus, exportBackup, importBackup, syncToFirestore };
}

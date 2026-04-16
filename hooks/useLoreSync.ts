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
  const lastProjectHash = useRef<string>('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tracks the active firestore instance actually used by the listeners/saves
  const activeDbRef = useRef<Firestore | null>(null);

  const getStateHash = (data: any) => {
    // Strip metadata that shouldn't trigger a sync (like updatedAt)
    const { updatedAt, exportedAt, version, ...rest } = data || {};
    return JSON.stringify(rest);
  };

  // Clean data for Firestore (remove undefineds)
  const cleanData = useCallback((obj: any): any => {
    if (Array.isArray(obj)) return obj.map(cleanData);
    if (obj !== null && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, cleanData(v)])
      );
    }
    return obj;
  }, []);

  // ── Remote-to-local sync ───────────────────────────────────────────────────
  useEffect(() => {
    // Reset state flags when the project target changes (Tier / Config change)
    isInitialLoadFinished.current = false;
    lastProjectHash.current = '';
    
    if (!user || !projectId) return;

    // Dynamically get the DB based on currently selected Tier/Config
    const { db } = getActiveFirebase();
    activeDbRef.current = db;

    const isBYOH = tier === 'byoh' && !!customConfig;
    console.log(`[SyncEngine] Initializing for project: ${projectId}`);
    console.log(`[SyncEngine] Database: ${isBYOH ? 'User BYOH' : 'Lore Weaver Master'}`);

    const projectDocRef = doc(db, 'users', user.uid, 'projects', projectId);

    const unsubscribe = onSnapshot(projectDocRef, (snap) => {
      // Don't swallow our own writes
      if (snap.metadata.hasPendingWrites) return;

      if (snap.exists()) {
        const data = snap.data();
        const hash = getStateHash(data);
        
        console.log(`[SyncEngine] Received snapshot for project ${projectId}. Hash matches? ${hash === lastProjectHash.current}`);

        if (hash !== lastProjectHash.current) {
          console.log('[SyncEngine] Applying remote update...', { 
            nodes: (data.canvasState?.mainNodes || data.nodes || []).length,
            chapters: Object.keys(data.chapters || {}).length 
          });
          lastProjectHash.current = hash;
          
          // Canvas State
          const state = data.canvasState || {};
          const currentMode = useCanvasStore.getState().canvasMode;
          
          const targetNodes = currentMode === 'main' ? (state.mainNodes || data.nodes || []) : (state.loreNodes || []);
          const targetEdges = currentMode === 'main' ? (state.mainEdges || data.edges || []) : (state.loreEdges || []);

          useCanvasStore.setState({
            mainNodes: state.mainNodes || data.nodes || [],
            mainEdges: state.mainEdges || data.edges || [],
            loreNodes: state.loreNodes || [],
            loreEdges: state.loreEdges || [],
            links: (data.links || []).filter((l: any) => l && l.sourceId),
            // Re-inflate active view
            nodes: targetNodes,
            edges: targetEdges,
          });

          // Sync World Data
          const toObj = (val: any) => {
            if (Array.isArray(val)) {
              return Object.fromEntries(val.filter(x => x && x.id).map(x => [x.id, x]));
            }
            return val || {};
          };

          if (data.characters) useWorldStore.getState().setCharacters(toObj(data.characters));
          if (data.chapters)   useWorldStore.getState().setChapters(toObj(data.chapters));
          if (data.notes)      useWorldStore.getState().setNotes(toObj(data.notes));
          if (data.items)      useWorldStore.getState().setItems(toObj(data.items));
          if (data.places)     useWorldStore.getState().setPlaces(toObj(data.places));
          if (data.events)     useWorldStore.getState().setEvents(toObj(data.events));
          if (data.concepts)   useWorldStore.getState().setConcepts(toObj(data.concepts));

          setSyncStatus('saved');
        }
      } else {
        console.log('[SyncEngine] Project document not found on this DB.');
        lastProjectHash.current = '';
      }

      if (!isInitialLoadFinished.current) {
        isInitialLoadFinished.current = true;
        console.log('[SyncEngine] Initial load finished');
      }
    }, (err) => {
      console.error('[SyncEngine] Listener error:', err);
      isInitialLoadFinished.current = true;
      setSyncStatus('error');
    });

    return () => unsubscribe();
  }, [user, projectId, tier, customConfig]);

  // ── Local-to-remote auto-save (2-second debounce) ─────────────────────────
  useEffect(() => {
    if (!user || !projectId || !isInitialLoadFinished.current) return;

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
      if (!activeDbRef.current) return;

      setSyncStatus('saving');
      try {
        const projectDocRef = doc(activeDbRef.current, 'users', user.uid, 'projects', projectId);
        await setDoc(projectDocRef, projectPayload, { merge: true });
        
        lastProjectHash.current = currentHash;
        setSyncStatus('saved');
        console.log('[SyncEngine] Snapshot pushed to Firestore');
      } catch (err) {
        console.error('[SyncEngine] Auto-save failed:', err);
        setSyncStatus('error');
        // Exponential backoff or simple retry tick
        setTimeout(() => setRetryTick(t => t + 1), 5000);
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
      alert('Export failed. Check console for details.');
    }
  }, [projectId, mainNodes, mainEdges, loreNodes, loreEdges, links, 
      world.characters, world.chapters, world.notes, world.items, world.places, world.events, world.concepts]);

  const importBackup = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      let data = JSON.parse(text);
      
      // If it's an array, the user might have exported a collection instead of a doc
      if (Array.isArray(data) && data.length > 0) {
        console.log('[SyncEngine] Detected array format, using first element.');
        data = data[0];
      }

      const hasCanvas = data?.canvasState || data?.nodes;
      const hasWorld = data?.world || data?.characters || data?.chapters;

      if (!data || (!hasCanvas && !hasWorld)) {
        console.error('[SyncEngine] Validation failed. Parsed data details:', {
          type: typeof data,
          isArray: Array.isArray(data),
          keys: data ? Object.keys(data) : 'null',
          contentPreview: typeof data === 'string' ? data.slice(0, 100) : 'not a string'
        });
        throw new Error("Invalid backup file format. This file does not appear to be a Lore Weaver project backup. Please check the console for data details.");
      }

      console.log('[SyncEngine] Importing backup...', data);

      const state = data.canvasState || {};
      const currentMode = useCanvasStore.getState().canvasMode;
      
      // Update local store - this triggers the save effect via dependencies
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
      const toObj = (val: any) => {
        if (Array.isArray(val)) {
          return Object.fromEntries(val.filter(x => x && x.id).map(x => [x.id, x]));
        }
        return val || {};
      };

      if (w.characters) world.setCharacters(toObj(w.characters));
      if (w.chapters)   world.setChapters(toObj(w.chapters));
      if (w.notes)      world.setNotes(toObj(w.notes));
      if (w.items)      world.setItems(toObj(w.items));
      if (w.places)     world.setPlaces(toObj(w.places));
      if (w.events)     world.setEvents(toObj(w.events));
      if (w.concepts)   world.setConcepts(toObj(w.concepts));

      // Reset the local hash to ensure the save effect sees this as a change
      lastProjectHash.current = '';
      setRetryTick(t => t + 1);
      
      return true;
    } catch (err: any) {
      console.error('[SyncEngine] Import failed:', err);
      throw err;
    }
  }, [world.setCharacters, world.setChapters, world.setNotes, world.setItems, world.setPlaces, world.setEvents, world.setConcepts]);

  const syncToFirestore = useCallback(() => {
    setRetryTick(t => t+1);
  }, []);

  return { syncStatus, exportBackup, importBackup, syncToFirestore };
}

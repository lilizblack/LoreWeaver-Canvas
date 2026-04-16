"use client";

import { useEffect, useCallback, useRef, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useWorldStore } from '@/store/useWorldStore';

export type SyncStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export function useFirestoreSync(boardId: string) {
  const {
    setNodes, setEdges, setLinks,
    nodes, edges,
    mainNodes, mainEdges,
    loreNodes, loreEdges,
    links,
    canvasMode
  } = useCanvasStore();
  const { setCharacters, characters } = useWorldStore();
  const chaptersLib = useWorldStore((s) => s.chapters);
  const notesLib    = useWorldStore((s) => s.notes);
  const setChaptersLib = useWorldStore((s) => s.setChapters);
  const setNotesLib    = useWorldStore((s) => s.setNotes);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('saved');
  const [retryTick, setRetryTick] = useState(0);

  const isTypingRef = useRef(false);
  const isInitialLoadFinished = useRef(false);
  const lastSyncedHash = useRef<string>('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onFocusIn  = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.tagName === 'SELECT' || el?.isContentEditable) {
        isTypingRef.current = true;
      }
    };
    const onFocusOut = () => { setTimeout(() => { isTypingRef.current = false; }, 300); };
    document.addEventListener('focusin',  onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin',  onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  // Reset refs when switching boards
  useEffect(() => {
    isInitialLoadFinished.current = false;
    lastSyncedHash.current = '';
    setSyncStatus('saved');
  }, [boardId]);

  const getStateHash = useCallback((mn: any[], me: any[], ln: any[], le: any[], c: any, li: any[], ch: any = {}, nt: any = {}) => {
    return JSON.stringify({ mn, me, ln, le, c, li, ch, nt });
  }, []);

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

  // Warn on page close if unsaved changes + flush-save on tab hide
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (syncStatus === 'unsaved' || syncStatus === 'saving' || syncStatus === 'error') {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    // When the tab becomes hidden (tab switch, minimize, navigation), flush
    // the pending debounced save immediately so we never lose the last edits.
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && syncStatus === 'unsaved') {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        const s = useCanvasStore.getState();
        const w = useWorldStore.getState();
        const payload = cleanData({
          mainNodes: s.mainNodes, mainEdges: s.mainEdges,
          loreNodes: s.loreNodes, loreEdges: s.loreEdges,
          characters: w.characters,
          chapters: w.chapters,
          notes: w.notes,
          links: s.links,
          updatedAt: Date.now(),
        });
        setDoc(doc(db, 'projects', boardId), payload, { merge: true }).catch(err =>
          console.error('[Sync] Hidden-flush failed:', err)
        );
      }
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [syncStatus, boardId, cleanData]);

  // ── Remote-to-local sync ───────────────────────────────────────────────────
  useEffect(() => {
    if (!boardId) return;
    const boardDoc = doc(db, 'projects', boardId);

    const unsubscribe = onSnapshot(boardDoc, (snapshot) => {
      if (snapshot.metadata.hasPendingWrites || isTypingRef.current) return;

      const currentStore = useCanvasStore.getState();
      const worldState = useWorldStore.getState();
      const localChars = worldState.characters;
      const localHash = getStateHash(
        currentStore.mainNodes, currentStore.mainEdges,
        currentStore.loreNodes, currentStore.loreEdges,
        localChars, currentStore.links,
        worldState.chapters, worldState.notes,
      );

      if (localHash !== lastSyncedHash.current && isInitialLoadFinished.current) return;

      if (snapshot.exists()) {
        const data = snapshot.data();

        const rMainNodes = data.mainNodes || data.nodes || [];
        const rMainEdges = data.mainEdges || data.edges || [];
        const rLoreNodes = data.loreNodes || [];
        const rLoreEdges = data.loreEdges || [];
        const rChars     = data.characters || {};
        const rLinks     = data.links || [];
        const rChapters  = data.chapters || {};
        const rNotes     = data.notes || {};

        const remoteHash = getStateHash(rMainNodes, rMainEdges, rLoreNodes, rLoreEdges, rChars, rLinks, rChapters, rNotes);

        if (remoteHash !== localHash && remoteHash !== lastSyncedHash.current) {
          console.log('[Sync] Remote update detected, applying...');
          lastSyncedHash.current = remoteHash;

          useCanvasStore.setState({
            mainNodes: rMainNodes,
            mainEdges: rMainEdges,
            loreNodes: rLoreNodes,
            loreEdges: rLoreEdges,
            links: rLinks,
          });

          if (canvasMode === 'main') {
            setNodes(rMainNodes);
            setEdges(rMainEdges);
          } else {
            setNodes(rLoreNodes);
            setEdges(rLoreEdges);
          }

          setCharacters(rChars);
          setLinks(rLinks);
          setChaptersLib(rChapters);
          setNotesLib(rNotes);
          setSyncStatus('saved');
        }
      }

      if (!isInitialLoadFinished.current) {
        console.log('[Sync] Initial load complete.');
        isInitialLoadFinished.current = true;
      }
    }, (err) => {
      console.error('[Sync] Firestore error:', err);
      isInitialLoadFinished.current = true;
      setSyncStatus('error');
    });

    return () => unsubscribe();
  }, [boardId, canvasMode, setNodes, setEdges, setLinks, setCharacters, setChaptersLib, setNotesLib, getStateHash]);

  // ── Local-to-remote sync ───────────────────────────────────────────────────
  useEffect(() => {
    if (!boardId || !isInitialLoadFinished.current) return;

    const currentHash = getStateHash(mainNodes, mainEdges, loreNodes, loreEdges, characters, links, chaptersLib, notesLib);
    if (currentHash === lastSyncedHash.current) return;

    setSyncStatus('unsaved');

    // Local backup — survives crashes, hot-reloads, Firestore outages.
    // Keyed per project so boards don't collide.
    try {
      localStorage.setItem(`loreweaver-backup-${boardId}`, JSON.stringify({
        mainNodes, mainEdges, loreNodes, loreEdges,
        characters, links,
        chapters: chaptersLib, notes: notesLib,
        savedAt: Date.now(),
      }));
    } catch { /* quota exceeded — ignore */ }

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      const boardDoc = doc(db, 'projects', boardId);
      console.log('[Sync] Pushing to Firestore...');
      setSyncStatus('saving');

      try {
        const payload = cleanData({
          mainNodes, mainEdges,
          loreNodes, loreEdges,
          characters,
          chapters: chaptersLib,
          notes: notesLib,
          links,
          updatedAt: Date.now()
        });
        await setDoc(boardDoc, payload, { merge: true });
        // Only mark as synced AFTER write succeeds
        lastSyncedHash.current = currentHash;
        setSyncStatus('saved');
        console.log('[Sync] Push successful.');
      } catch (err) {
        console.error('[Sync] Push failed:', err);
        setSyncStatus('error');
        // Schedule retry in 5s
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(() => setRetryTick(t => t + 1), 5000);
      }
    }, 1500);

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [boardId, mainNodes, mainEdges, loreNodes, loreEdges, characters, links, chaptersLib, notesLib, getStateHash, cleanData, retryTick]);

  // ── Manual export: download a full snapshot to the user's computer ────
  const exportBackup = useCallback(() => {
    const payload = {
      version: 1,
      boardId,
      exportedAt: new Date().toISOString(),
      mainNodes, mainEdges,
      loreNodes, loreEdges,
      characters,
      chapters: chaptersLib,
      notes: notesLib,
      links,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `loreweaver-backup-${boardId}-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [boardId, mainNodes, mainEdges, loreNodes, loreEdges, characters, chaptersLib, notesLib, links]);

  // ── Manual import: restore from a previously exported JSON file ────────
  const importBackup = useCallback(async (file: File) => {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object') throw new Error('Invalid backup file');
    const rMainNodes = data.mainNodes || data.nodes || [];
    const rMainEdges = data.mainEdges || data.edges || [];
    const rLoreNodes = data.loreNodes || [];
    const rLoreEdges = data.loreEdges || [];
    const rChars     = data.characters || {};
    const rLinks     = data.links || [];
    const rChapters  = data.chapters || {};
    const rNotes     = data.notes || {};

    useCanvasStore.setState({
      mainNodes: rMainNodes, mainEdges: rMainEdges,
      loreNodes: rLoreNodes, loreEdges: rLoreEdges,
      links: rLinks,
      nodes: canvasMode === 'main' ? rMainNodes : rLoreNodes,
      edges: canvasMode === 'main' ? rMainEdges : rLoreEdges,
    });
    useWorldStore.getState().setCharacters(rChars);
    useWorldStore.getState().setChapters(rChapters);
    useWorldStore.getState().setNotes(rNotes);

    // Push the restored state to Firestore so it's safe in the cloud too
    try {
      setSyncStatus('saving');
      const payload = cleanData({
        mainNodes: rMainNodes, mainEdges: rMainEdges,
        loreNodes: rLoreNodes, loreEdges: rLoreEdges,
        characters: rChars,
        chapters: rChapters,
        notes: rNotes,
        links: rLinks,
        updatedAt: Date.now(),
      });
      await setDoc(doc(db, 'projects', boardId), payload, { merge: true });
      lastSyncedHash.current = getStateHash(rMainNodes, rMainEdges, rLoreNodes, rLoreEdges, rChars, rLinks, rChapters, rNotes);
      setSyncStatus('saved');
    } catch (err) {
      console.error('[Sync] Import push failed:', err);
      setSyncStatus('error');
    }
  }, [boardId, canvasMode, cleanData, getStateHash]);

  const syncToFirestore = useCallback(async () => {
    const boardDoc = doc(db, 'projects', boardId);
    setSyncStatus('saving');
    try {
      const payload = cleanData({
        mainNodes, mainEdges,
        loreNodes, loreEdges,
        characters,
        chapters: chaptersLib,
        notes: notesLib,
        links,
        updatedAt: Date.now()
      });
      await setDoc(boardDoc, payload, { merge: true });
      lastSyncedHash.current = getStateHash(mainNodes, mainEdges, loreNodes, loreEdges, characters, links, chaptersLib, notesLib);
      setSyncStatus('saved');
    } catch (err) {
      console.error('[Sync] Manual save failed:', err);
      setSyncStatus('error');
    }
  }, [boardId, mainNodes, mainEdges, loreNodes, loreEdges, characters, chaptersLib, notesLib, links, cleanData, getStateHash]);

  return { syncToFirestore, syncStatus, exportBackup, importBackup, markLocalChange: () => {} };
}

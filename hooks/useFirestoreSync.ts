"use client";

import { useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  collection, 
  query, 
  where,
  getDocs
} from 'firebase/firestore';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useWorldStore } from '@/store/useWorldStore';
import { Node, Edge } from 'reactflow';

export function useFirestoreSync(boardId: string) {
  const { setNodes, setEdges, nodes, edges } = useCanvasStore();
  const { setCharacters, characters } = useWorldStore();

  // Load and Sync Canvas Elements
  useEffect(() => {
    if (!boardId) return;

    const boardDoc = doc(db, 'projects', boardId);
    
    const unsubscribe = onSnapshot(boardDoc, (snapshot) => {
      // CRITICAL: ignore updates that originated from our own local writes
      // to prevent "jumping" or "echoing" during dragging
      if (snapshot.metadata.hasPendingWrites) return;

      if (snapshot.exists()) {
        const data = snapshot.data();
        
        // Deep equality check (simple version) to avoid unnecessary state resets
        if (data.nodes && JSON.stringify(data.nodes) !== JSON.stringify(nodes)) {
          setNodes(data.nodes);
        }
        if (data.edges && JSON.stringify(data.edges) !== JSON.stringify(edges)) {
          setEdges(data.edges);
        }
        if (data.characters && JSON.stringify(data.characters) !== JSON.stringify(characters)) {
          setCharacters(data.characters);
        }
      }
    });

    return () => unsubscribe();
  }, [boardId, setNodes, setEdges, setCharacters]);

  // Push updates to Firestore (should be debounced in production)
  const syncToFirestore = useCallback(async () => {
    if (!boardId) return;

    const boardDoc = doc(db, 'projects', boardId);
    await setDoc(boardDoc, {
      nodes,
      edges,
      characters,
      updatedAt: Date.now(),
    }, { merge: true });
  }, [boardId, nodes, edges, characters]);

  return { syncToFirestore };
}

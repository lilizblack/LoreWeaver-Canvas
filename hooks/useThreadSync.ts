"use client";

import { useEffect, useMemo } from 'react';
import { Edge, MarkerType } from 'reactflow';
import { useWorldStore } from '@/store/useWorldStore';
import { useCanvasStore } from '@/store/useCanvasStore';

/**
 * useThreadSync - Derives visual ReactFlow edges from character threads.
 * This runs in the background of the MainCanvas to keep relationships in sync.
 */
export function useThreadSync() {
  const characters = useWorldStore((state) => state.characters);
  const { nodes, setThreadEdges, hideThreads } = useCanvasStore();

  const derivedEdges = useMemo(() => {
    if (hideThreads) return [];

    const edges: Edge[] = [];
    const charList = Object.values(characters);
    const currentThreadEdges = useCanvasStore.getState().threadEdges;
    
    // For each character in the world
    charList.forEach((char) => {
      // Find the card node on the canvas representing this character
      const sourceNode = nodes.find(n => n.data?.characterId === char.id);
      if (!sourceNode) return;

      const threads = char.threads || [];

      threads.forEach((thread, index) => {
        // Find the target card node
        const targetNode = nodes.find(n => n.data?.characterId === thread.targetCharacterID);
        if (!targetNode) return;

        // Create a unique ID for this visual thread
        const edgeId = `thread-${char.id}-${thread.targetCharacterID}-${index}`;
        
        // Preserve selection state
        const wasSelected = currentThreadEdges.find(e => e.id === edgeId)?.selected;

        edges.push({
          id: edgeId,
          type: 'custom',
          source: sourceNode.id,
          target: targetNode.id,
          label: thread.relationType || '',
          animated: true,
          selected: wasSelected,
          style: { 
            stroke: thread.hexColor || '#ff00ff', 
            strokeWidth: wasSelected ? 4 : 3,
            opacity: wasSelected ? 1 : 0.7
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: thread.hexColor || '#ff00ff',
          },
          data: {
            type: 'thread',
            threadIndex: index,
            characterId: char.id,
            targetCharacterId: thread.targetCharacterID,
            controlPoint: thread.controlPoint
          }
        });
      });
    });

    return edges;
  }, [characters, nodes, hideThreads]);

  useEffect(() => {
    setThreadEdges(derivedEdges);
  }, [derivedEdges, setThreadEdges]);
}

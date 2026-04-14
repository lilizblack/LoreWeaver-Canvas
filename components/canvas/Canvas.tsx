"use client";

import React, { useCallback, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  Panel,
  ReactFlowProvider,
  Node,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useCanvasStore } from '@/store/useCanvasStore';
import { Sidebar } from './Sidebar';
import Link from 'next/link';
import { LogOut, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CharacterNode } from './nodes/CharacterNode';
import { NoteNode } from './nodes/NoteNode';
import { ChapterNode } from './nodes/ChapterNode';
import { TextCardNode } from './nodes/TextCardNode';
import { MediaNode } from './nodes/MediaNode';
import { GrimoirePanel } from './GrimoirePanel';

import { CharacterModal } from '../world/CharacterModal';
import { useWorldStore } from '@/store/useWorldStore';
import { useFirestoreSync } from '@/hooks/useFirestoreSync';

const nodeTypes = {
  character: CharacterNode,
  chapter: ChapterNode,
  note: NoteNode,
  lore: TextCardNode,
  media: MediaNode,
  image: MediaNode,
};

function CanvasInner({ projectId }: { projectId: string }) {
  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const onNodesChange = useCanvasStore((state) => state.onNodesChange);
  const onEdgesChange = useCanvasStore((state) => state.onEdgesChange);
  const onConnect = useCanvasStore((state) => state.onConnect);
  const addNode = useCanvasStore((state) => state.addNode);
  const setSelectedNodeId = useCanvasStore((state) => state.setSelectedNodeId);
  const hideThreads = useCanvasStore((state) => state.hideThreads);
  const setHideThreads = useCanvasStore((state) => state.setHideThreads);

  const filteredEdges = useMemo(() => {
    return hideThreads ? [] : edges;
  }, [edges, hideThreads]);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Initialize Firestore Sync
  const { syncToFirestore } = useFirestoreSync(projectId);

  // Sync to firestore with debounce to prevent excessive writes and flicker
  React.useEffect(() => {
    const timer = setTimeout(() => {
      syncToFirestore();
    }, 500); // Wait for 500ms of inactivity before syncing
    
    return () => clearTimeout(timer);
  }, [nodes, edges, syncToFirestore]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = { x: event.clientX - 200, y: event.clientY - 40 };
      const id = `${type}-${Date.now()}`;

      const newNode: Node = {
        id,
        type,
        position,
        data: { 
          label: `New ${type}`,
          ...(type === 'character' ? { 
            name: 'Anonymous',
            age: 'Unknown',
            appearance: '',
            personality: '',
            type: 'Protagonist',
            growth: ''
          } : {}),
          ...(type === 'chapter' ? {
            title: 'Chapter One',
            summary: 'Summary goes here...',
            beats: '',
            appearances: [],
            threads: ''
          } : {}),
          ...(type === 'note' ? {
            content: 'Important lore fragment...'
          } : {})
        },
      };

      addNode(newNode);
    },
    [addNode]
  );

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: any) => {
    if (node.type === 'character') {
      setEditingId(node.id);
      setIsModalOpen(true);
    }
  }, []);

  return (
    <div className="w-full h-screen bg-[#070709]">
      <ReactFlow
        nodes={nodes}
        edges={filteredEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeDoubleClick={onNodeDoubleClick}
        onSelectionChange={({ nodes }) => {
          setSelectedNodeId(nodes[0]?.id || null);
        }}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        className="canvas-grid"
      >
        <Background color="#27272a" gap={30} />
        <Controls showInteractive={false} className="!bg-zinc-900 !border-zinc-800 !fill-zinc-400" />
        <MiniMap 
          nodeColor="#6d28d9" 
          maskColor="rgba(0,0,0,0.5)" 
          className="!bg-zinc-900/80 !border-zinc-800" 
        />
        
        <Panel position="top-left">
          <Sidebar />
        </Panel>

        <Panel position="top-right" className="p-4 flex flex-col gap-3">
          <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-4 border-white/5 shadow-2xl">
            <button 
              onClick={() => setHideThreads(!hideThreads)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                hideThreads 
                  ? 'bg-zinc-800 text-zinc-500' 
                  : 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                {hideThreads ? 'Threads Hidden' : 'Threads Visible'}
              </span>
            </button>
            <div className="w-px h-6 bg-white/10" />
            <h2 className="text-xl font-serif text-zinc-200">World Canvas</h2>
            <div className="w-px h-6 bg-white/10" />
            <button 
              onClick={() => syncToFirestore()}
              className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-white/5"
            >
              Save State
            </button>
          </div>
        </Panel>
      </ReactFlow>

      <AnimatePresence>
        <GrimoirePanel />
      </AnimatePresence>
    </div>
  );
}

export function Canvas({ projectId }: { projectId: string }) {
  return (
    <ReactFlowProvider>
      <CanvasInner projectId={projectId} />
    </ReactFlowProvider>
  );
}

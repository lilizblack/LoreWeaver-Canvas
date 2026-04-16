"use client";

import React, { useCallback, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  Panel,
  ReactFlowProvider,
  Node,
  Edge,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useCanvasStore } from '@/store/useCanvasStore';
import { useThemeStore } from '@/store/useThemeStore';
import { Sidebar } from './Sidebar';
import { Users, Share2, Save, MapPin, Calendar, Heart, Check, AlertTriangle, Circle, Loader2, Eye, EyeOff, User, BookOpen, StickyNote, FileText, Image as ImageIcon, Scroll, Gem, Shapes, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CharacterNode } from './nodes/CharacterNode';
import { PlaceNode } from './nodes/PlaceNode';
import { NoteNode } from './nodes/NoteNode';
import { ChapterNode } from './nodes/ChapterNode';
import { EventNode } from './nodes/EventNode';
import { TextCardNode } from './nodes/TextCardNode';
import { MediaNode } from './nodes/MediaNode';
import { ShapeNode } from './nodes/ShapeNode';
import { ConceptNode } from './nodes/ConceptNode';
import { ItemNode } from './nodes/ItemNode';

import { GrimoirePanel } from './GrimoirePanel';
import { CharacterModal } from '../world/CharacterModal';
import { LibraryModal } from '../world/LibraryModal';
import { useWorldStore } from '@/store/useWorldStore';
import { useFirestoreSync } from '@/hooks/useFirestoreSync';
import { CustomEdge } from './CustomEdge';
import { getRelationshipColor } from '@/lib/relationshipTypes';
import { MarkerType } from 'reactflow';

const edgeTypes: any = {
  default: CustomEdge,
  custom: CustomEdge,
};

const nodeTypes: any = {
  character: CharacterNode,
  place: PlaceNode,
  chapter: ChapterNode,
  event: EventNode,
  note: NoteNode,
  lore: TextCardNode,
  media: MediaNode,
  image: MediaNode,
  shape: ShapeNode,
  concept: ConceptNode,
  item: ItemNode,
};

const REL_EDGE_PREFIX = 'rel-';

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
  const hiddenTypes = useCanvasStore((state) => state.hiddenTypes);
  const toggleHiddenType = useCanvasStore((state) => state.toggleHiddenType);
  const setHiddenTypes = useCanvasStore((state) => state.setHiddenTypes);
  const { canvasMode } = useCanvasStore();
  const [visibilityOpen, setVisibilityOpen] = React.useState(false);
  const { theme, fontSize } = useThemeStore();
  const { screenToFlowPosition } = useReactFlow();

  const filteredNodes = useMemo(() => {
    if (hiddenTypes.length === 0) return nodes;
    return nodes.filter(n => !hiddenTypes.includes(n.type || ''));
  }, [nodes, hiddenTypes]);

  const filteredEdges = useMemo(() => {
    if (hideThreads) return [];
    if (hiddenTypes.length === 0) return edges;
    // Hide any edge whose endpoints reference a hidden node
    const visibleIds = new Set(filteredNodes.map(n => n.id));
    return edges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));
  }, [edges, hideThreads, hiddenTypes, filteredNodes]);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [chaptersLibOpen, setChaptersLibOpen] = React.useState(false);
  const [notesLibOpen, setNotesLibOpen] = React.useState(false);
  const characters = useWorldStore((state) => state.characters);

  // Initialize Firestore Sync
  const { syncToFirestore, syncStatus, exportBackup, importBackup } = useFirestoreSync(projectId);
  const importInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = window.confirm(
      `Restore "${file.name}"?\n\nThis will REPLACE your current canvas with the contents of the backup file, then push the restored state to the cloud.\n\nTip: click Export first to back up your current state before restoring.`
    );
    if (!ok) { e.target.value = ''; return; }
    try {
      await importBackup(file);
      alert('Backup restored successfully.');
    } catch (err: any) {
      alert('Import failed: ' + (err?.message || err));
    } finally {
      e.target.value = '';
    }
  };

  // ── Auto-sync character relationships → colored relationship edges ───────
  // Relationships live on `character.relationships`. We derive readonly visual
  // "threads" for the Main canvas so users can see connections color-coded by
  // relationship type. These edges have IDs prefixed with `rel-` and are
  // regenerated from the source of truth (WorldStore characters) whenever
  // relationships change.
  const mainNodesForRel = useCanvasStore((state) => state.mainNodes);
  React.useEffect(() => {
    const charNodes = mainNodesForRel.filter(n => n.type === 'character');
    const nodeIdByCharId = new Map<string, string>();
    charNodes.forEach(n => {
      const cid = n.data?.characterId;
      if (cid) nodeIdByCharId.set(cid, n.id);
    });

    const desiredRelEdges: Edge[] = [];
    const seenPairs = new Set<string>();

    Object.values(characters).forEach((char: any) => {
      const sourceNodeId = nodeIdByCharId.get(char.id);
      if (!sourceNodeId) return;
      (char.relationships || []).forEach((rel: any) => {
        const targetNodeId = nodeIdByCharId.get(rel.characterId);
        if (!targetNodeId) return;
        // Stable deduped ID — single edge per pair (lex smaller id first)
        const [a, b] = [char.id, rel.characterId].sort();
        const pairKey = `${a}|${b}`;
        if (seenPairs.has(pairKey)) return;
        seenPairs.add(pairKey);

        // Use this character's perspective for the label if this is the lex-smaller side
        const isPrimary = char.id === a;
        const srcNode = isPrimary ? sourceNodeId : (nodeIdByCharId.get(b) as string);
        const tgtNode = isPrimary ? targetNodeId : (nodeIdByCharId.get(a) as string);

        const color = getRelationshipColor(rel.type);
        desiredRelEdges.push({
          id: `${REL_EDGE_PREFIX}${a}-${b}`,
          source: srcNode,
          target: tgtNode,
          type: 'custom',
          label: rel.type,
          data: { color, relationship: true, label: rel.type },
          style: { stroke: color, strokeWidth: 2.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color },
          zIndex: 0,
        });
      });
    });

    // Merge: keep user-created edges (non-rel), replace all rel edges
    const state = useCanvasStore.getState();
    const currentMain = state.mainEdges;
    const nonRel = currentMain.filter(e => !e.id.startsWith(REL_EDGE_PREFIX));
    const nextMain = [...nonRel, ...desiredRelEdges];

    // Shallow diff to avoid needless writes
    const sameLength = nextMain.length === currentMain.length;
    const sameContent = sameLength && nextMain.every((e, i) => {
      const c = currentMain[i];
      return c && c.id === e.id && c.source === e.source && c.target === e.target && c.label === e.label;
    });
    if (sameContent) return;

    const patch: any = { mainEdges: nextMain };
    if (state.canvasMode === 'main') patch.edges = nextMain;
    useCanvasStore.setState(patch);
  }, [characters, mainNodesForRel]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const rawExtra = event.dataTransfer.getData('application/nodedata');
      const extra = rawExtra ? JSON.parse(rawExtra) : {};

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const id = `${type}-${Date.now()}`;

      const newNode: Node = {
        id,
        type,
        position,
        style: (type === 'character' || type === 'place') ? undefined : {
          width:  (type === 'chapter' || type === 'event') ? 300 : type === 'note' ? 220 : type === 'shape' ? 120 : (type === 'concept' || type === 'item') ? 280 : 200,
          height: (type === 'chapter' || type === 'event') ? 280 : type === 'note' ? 140 : type === 'shape' ? 120 : (type === 'concept' || type === 'item') ? 220 : 160,
        },
        data: { 
          label: extra.label ?? `New ${type}`,
          ...extra,
          ...(type === 'character' ? {
            characterId: id,
            name: extra.label || 'Anonymous',
            imageUrl: '',
            sex: '',
            relationships: [],
          } : {}),
          ...(type === 'place' ? {
            name: extra.label || 'New Place',
            imageUrl: '',
            description: '',
            color: '#0891b2'
          } : {}),
          ...(type === 'chapter' || type === 'event' ? {
            title: extra.label || (type === 'chapter' ? 'New Chapter' : 'New Event'),
            noteColor: type === 'chapter' ? '#f59e0b' : '#6d28d9',
            appearances: [],
            threads: ''
          } : {}),
          ...(type === 'note' ? {
            content: '',
            noteColor: '#6d28d9'
          } : {}),
          ...(type === 'lore' ? {
            content: '<p></p>',
            color: '#a855f7'
          } : {}),
          ...(type === 'image' || type === 'media' ? {
            imageUrl: '',
            label: 'New Image'
          } : {}),
          ...(type === 'shape' ? {
            shape: extra.shape ?? 'circle',
            color: extra.color ?? '#6d28d9',
            opacity: 0.9,
            label: ''
          } : {}),
          ...(type === 'concept' ? {
            name: extra.label || 'New Concept',
            category: '',
            description: '',
            color: '#d97706'
          } : {}),
          ...(type === 'item' ? {
            name: extra.label || 'New Item',
            itemType: '',
            description: '',
            holder: '',
            location: '',
            color: '#e11d48'
          } : {})
        },
      };

      if (type === 'chapter') {
        useWorldStore.getState().upsertChapter(id, newNode.data);
      }
      if (type === 'note') {
        useWorldStore.getState().upsertNote(id, newNode.data);
      }

      if (type === 'character') {
        useWorldStore.getState().updateCharacter(id, {
          id,
          name: extra.label ?? 'Anonymous',
          imageUrl: '',
          sex: '',
          lore: '',
          aliases: [],
          identities: [],
          origins: '',
          abilities: { inherent: [], acquired: [] },
          factions: { species: [], allegiance: [] },
          relationships: [],
        });
      }

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: any) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  return (
    <div className={`w-full h-screen canvas-grid fs-${fontSize} ${theme === 'light' ? 'light' : ''}`} style={{ background: 'var(--bg)' }}>
      <ReactFlow
        nodes={filteredNodes}
        edges={filteredEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeClick={(_evt, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'custom' }}
        fitView
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
          <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-4 shadow-2xl" 
               style={{ background: 'var(--glass)', borderColor: 'var(--border-2)' }}>
            
            {/* Canva Toggle */}
            <div className="flex bg-zinc-800/50 p-1 rounded-xl border border-white/5 shadow-inner">
              <button
                onClick={() => useCanvasStore.getState().setCanvasMode('main')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  canvasMode === 'main' 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Main Canva
              </button>
              <button
                onClick={() => useCanvasStore.getState().setCanvasMode('lore')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  canvasMode === 'lore' 
                  ? 'bg-amber-600 text-white shadow-lg' 
                  : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Lore Canva
              </button>
            </div>

            <div className="w-px h-6" style={{ background: 'var(--border)' }} />

            <button 
              onClick={() => {
                setEditingId(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
              style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--fg)'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--fg-2)'}
            >
              <Users className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Characters
              </span>
            </button>
            <button
              onClick={() => setChaptersLibOpen(true)}
              title="Open the chapter notes library — even the ones no longer on the canvas"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
              style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}
              onMouseOver={e => e.currentTarget.style.color = '#fbbf24'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--fg-2)'}
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Chapters
              </span>
            </button>
            <button
              onClick={() => setNotesLibOpen(true)}
              title="Open the notes library — even the ones no longer on the canvas"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
              style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}
              onMouseOver={e => e.currentTarget.style.color = '#34d399'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--fg-2)'}
            >
              <StickyNote className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Notes
              </span>
            </button>
            <div className="w-px h-6" style={{ background: 'var(--border)' }} />

            {/* Visibility toggles — hide/show element types */}
            <div className="relative">
              <button
                onClick={() => setVisibilityOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border"
                style={{
                  background: hiddenTypes.length > 0 ? 'rgba(251,191,36,0.1)' : 'var(--bg-3)',
                  color: hiddenTypes.length > 0 ? '#fbbf24' : 'var(--fg-3)',
                  borderColor: hiddenTypes.length > 0 ? 'rgba(251,191,36,0.3)' : 'transparent',
                }}
              >
                {hiddenTypes.length > 0 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="text-xs font-bold uppercase tracking-widest">
                  {hiddenTypes.length === 0 ? 'All Visible' : `${hiddenTypes.length} Hidden`}
                </span>
              </button>

              {visibilityOpen && (
                <>
                  {/* Click-outside catcher */}
                  <div
                    className="fixed inset-0 z-[90]"
                    onClick={() => setVisibilityOpen(false)}
                  />
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl border shadow-2xl z-[100] overflow-hidden"
                    style={{ background: 'var(--bg-2)', borderColor: 'var(--border)' }}
                  >
                    <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--fg-3)' }}>
                        Element Visibility
                      </span>
                      {hiddenTypes.length > 0 && (
                        <button
                          onClick={() => setHiddenTypes([])}
                          className="text-[10px] font-bold text-purple-400 hover:text-purple-300"
                        >
                          Show All
                        </button>
                      )}
                    </div>
                    <div className="p-1 max-h-80 overflow-y-auto">
                      {(canvasMode === 'main'
                        ? [
                            { type: 'character', label: 'Characters',  icon: User,       color: '#a78bfa' },
                            { type: 'chapter',   label: 'Chapter Notes', icon: BookOpen, color: '#fbbf24' },
                            { type: 'note',      label: 'Notes',        icon: StickyNote, color: '#34d399' },
                            { type: 'lore',      label: 'Text Blocks',  icon: FileText,   color: '#c084fc' },
                            { type: 'image',     label: 'Images',       icon: ImageIcon,  color: '#60a5fa' },
                            { type: 'media',     label: 'Media',        icon: ImageIcon,  color: '#60a5fa' },
                            { type: 'shape',     label: 'Shapes',       icon: Shapes,     color: '#94a3b8' },
                          ]
                        : [
                            { type: 'place',   label: 'Places',         icon: MapPin,     color: '#2dd4bf' },
                            { type: 'event',   label: 'Timeline Events', icon: Calendar,  color: '#f472b6' },
                            { type: 'concept', label: 'Concepts / Terms', icon: Scroll,   color: '#fbbf24' },
                            { type: 'item',    label: 'Items / Artifacts', icon: Gem,     color: '#fb7185' },
                            { type: 'note',    label: 'Notes',          icon: StickyNote, color: '#34d399' },
                            { type: 'image',   label: 'Images',         icon: ImageIcon,  color: '#60a5fa' },
                            { type: 'shape',   label: 'Shapes',         icon: Shapes,     color: '#94a3b8' },
                          ]
                      ).map(item => {
                        const isHidden = hiddenTypes.includes(item.type);
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.type}
                            onClick={() => toggleHiddenType(item.type)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left"
                            style={{
                              background: isHidden ? 'transparent' : item.color + '10',
                              color: isHidden ? 'var(--fg-3)' : 'var(--fg)',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = item.color + '22'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = isHidden ? 'transparent' : item.color + '10'; }}
                          >
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ background: item.color + '22', opacity: isHidden ? 0.4 : 1 }}
                            >
                              <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                            </div>
                            <span
                              className="text-xs font-semibold flex-1"
                              style={{ textDecoration: isHidden ? 'line-through' : 'none', opacity: isHidden ? 0.5 : 1 }}
                            >
                              {item.label}
                            </span>
                            {isHidden
                              ? <EyeOff className="w-3.5 h-3.5" style={{ color: 'var(--fg-3)' }} />
                              : <Eye className="w-3.5 h-3.5" style={{ color: item.color }} />
                            }
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="w-px h-6" style={{ background: 'var(--border)' }} />
            <button
              onClick={() => setHideThreads(!hideThreads)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border"
              style={{ 
                background: hideThreads ? 'var(--bg-3)' : 'rgba(124, 58, 237, 0.1)',
                color: hideThreads ? 'var(--fg-3)' : 'var(--primary)',
                borderColor: hideThreads ? 'transparent' : 'rgba(124, 58, 237, 0.3)',
                boxShadow: hideThreads ? 'none' : '0 0 15px rgba(124, 58, 237, 0.2)'
              }}
            >
              <Share2 className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                {hideThreads ? 'Threads Hidden' : 'Threads Visible'}
              </span>
            </button>
            <div className="w-px h-6" style={{ background: 'var(--border)' }} />
            <h2 className="text-xl font-serif capitalize" style={{ color: 'var(--fg)' }}>
              {canvasMode} Canva
            </h2>
            <div className="w-px h-6" style={{ background: 'var(--border)' }} />

            {/* Manual export + import (belt-and-suspenders backup) */}
            <button
              onClick={exportBackup}
              title="Download a backup file of your entire project"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
              style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}
            >
              <Download className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Export</span>
            </button>
            <button
              onClick={() => importInputRef.current?.click()}
              title="Restore from a backup file"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
              style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}
            >
              <Upload className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Restore</span>
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImportFile}
            />

            <div className="w-px h-6" style={{ background: 'var(--border)' }} />
            <button
              onClick={() => syncToFirestore()}
              title={
                syncStatus === 'saved'   ? 'All changes saved' :
                syncStatus === 'saving'  ? 'Saving changes...' :
                syncStatus === 'unsaved' ? 'Unsaved changes (auto-save pending)' :
                                           'Save failed — click to retry'
              }
              className="flex items-center gap-2 px-3 py-1.5 text-sm transition-all rounded-lg"
              style={{
                color:
                  syncStatus === 'saved'   ? '#34d399' :
                  syncStatus === 'saving'  ? '#fbbf24' :
                  syncStatus === 'unsaved' ? '#fbbf24' :
                                             '#f87171',
                background:
                  syncStatus === 'error'   ? 'rgba(248,113,113,0.1)' :
                  syncStatus === 'unsaved' ? 'rgba(251,191,36,0.08)' :
                                             'transparent',
              }}
            >
              {syncStatus === 'saved'   && <Check      className="w-4 h-4" />}
              {syncStatus === 'saving'  && <Loader2    className="w-4 h-4 animate-spin" />}
              {syncStatus === 'unsaved' && <Circle     className="w-3 h-3 fill-current" />}
              {syncStatus === 'error'   && <AlertTriangle className="w-4 h-4" />}
              <span className="text-xs font-bold uppercase tracking-widest">
                {syncStatus === 'saved'   ? 'Saved' :
                 syncStatus === 'saving'  ? 'Saving' :
                 syncStatus === 'unsaved' ? 'Unsaved' :
                                            'Retry Save'}
              </span>
            </button>
          </div>
        </Panel>
      </ReactFlow>

      <AnimatePresence>
        <GrimoirePanel />
      </AnimatePresence>

      <CharacterModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
        }}
        characterId={editingId}
      />

      <LibraryModal
        isOpen={chaptersLibOpen}
        onClose={() => setChaptersLibOpen(false)}
        kind="chapter"
      />

      <LibraryModal
        isOpen={notesLibOpen}
        onClose={() => setNotesLibOpen(false)}
        kind="note"
      />
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

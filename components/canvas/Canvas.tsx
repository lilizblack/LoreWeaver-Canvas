"use client";

import React, { useCallback, useMemo, useRef } from 'react';
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
import { useUserStore } from '@/store/useUserStore';
import { Sidebar } from './Sidebar';
import { Users, Share2, Save, MapPin, Calendar, Heart, Check, AlertTriangle, Circle, Loader2, Eye, EyeOff, User, BookOpen, StickyNote, FileText, Image as ImageIcon, Scroll, Gem, Shapes, Download, Upload, Library, ChevronDown, MoreHorizontal, Settings } from 'lucide-react';
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
import { useLoreSync } from '@/hooks/useLoreSync';
import { useThreadSync } from '@/hooks/useThreadSync';
import { CustomEdge } from './CustomEdge';

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



function CanvasInner({ projectId, projectName }: { projectId: string, projectName: string }) {
  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const onNodesChange = useCanvasStore((state) => state.onNodesChange);
  const onEdgesChange = useCanvasStore((state) => state.onEdgesChange);
  const onConnect = useCanvasStore((state) => state.onConnect);
  const addNode = useCanvasStore((state) => state.addNode);
  const setSelectedNodeId = useCanvasStore((state) => state.setSelectedNodeId);
  const { tier, setSettingsOpen } = useUserStore();
  const hideThreads = useCanvasStore((state) => state.hideThreads);
  const setHideThreads = useCanvasStore((state) => state.setHideThreads);
  const hiddenTypes = useCanvasStore((state) => state.hiddenTypes);
  const toggleHiddenType = useCanvasStore((state) => state.toggleHiddenType);
  const setHiddenTypes = useCanvasStore((state) => state.setHiddenTypes);
  const { canvasMode, threadEdges } = useCanvasStore();
  const [visibilityOpen, setVisibilityOpen] = React.useState(false);
  const [libraryMenuOpen, setLibraryMenuOpen] = React.useState(false);
  const [optionsMenuOpen, setOptionsMenuOpen] = React.useState(false);
  const { theme, fontSize } = useThemeStore();
  const { screenToFlowPosition } = useReactFlow();
  const importInputRef = useRef<HTMLInputElement>(null);

  const filteredNodes = useMemo(() => {
    if (hiddenTypes.length === 0) return nodes;
    return nodes.filter(n => !hiddenTypes.includes(n.type || ''));
  }, [nodes, hiddenTypes]);

  const filteredEdges = useMemo(() => {
    const baseEdges = hideThreads ? [] : [...edges, ...threadEdges];
    if (hiddenTypes.length === 0) return baseEdges;
    
    const visibleIds = new Set(filteredNodes.map(n => n.id));
    return baseEdges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));
  }, [edges, threadEdges, hideThreads, hiddenTypes, filteredNodes]);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [chaptersLibOpen, setChaptersLibOpen] = React.useState(false);
  const [notesLibOpen, setNotesLibOpen] = React.useState(false);
  const [placesLibOpen, setPlacesLibOpen] = React.useState(false);
  const [eventsLibOpen, setEventsLibOpen] = React.useState(false);
  const [conceptsLibOpen, setConceptsLibOpen] = React.useState(false);
  const [itemsLibOpen, setItemsLibOpen] = React.useState(false);
  const characters = useWorldStore((state) => state.characters);
  const chapters = useWorldStore((state) => state.chapters);
  const worldNotes = useWorldStore((state) => state.notes);
  const places = useWorldStore((state) => state.places);
  const events = useWorldStore((state) => state.events);
  const concepts = useWorldStore((state) => state.concepts);
  const items = useWorldStore((state) => state.items);

  const charCount = Object.keys(characters).length;
  const chapterCount = Object.keys(chapters).length;
  const noteCount = Object.keys(worldNotes).length;
  
  // Total count for current mode library
  const currentModeLibCount = canvasMode === 'main' 
    ? charCount + chapterCount + noteCount
    : Object.keys(places).length + Object.keys(events).length + Object.keys(concepts).length + Object.keys(items).length + noteCount;

  // Initialize Sync & Threads
  const { syncToFirestore, syncStatus, exportBackup, importBackup } = useLoreSync(projectId);
  useThreadSync();

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

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      // ── Spark Plan Limits Enforcement ──────────────────────────────────────
      if (tier === 'spark') {
        const limits = { chars: 30, lore: 100 };
        
        // Count characters
        const charCount = Object.keys(useWorldStore.getState().characters).length;
        
        // Count lore items (all categories + canvas elements)
        const ws = useWorldStore.getState();
        const cs = useCanvasStore.getState();
        const libraryLoreCount = 
          Object.keys(ws.places).length + 
          Object.keys(ws.events).length + 
          Object.keys(ws.concepts).length + 
          Object.keys(ws.items).length +
          Object.keys(ws.chapters).length +
          Object.keys(ws.notes).length;

        const allNodes = [...cs.mainNodes, ...cs.loreNodes];
        const nodeLoreCount = allNodes.filter(n => 
          n.type === 'image' || n.type === 'media' || n.type === 'lore' || n.type === 'shape'
        ).length;
        const totalLore = libraryLoreCount + nodeLoreCount;

        if (type === 'character' && charCount >= 50) {
          alert(`The Soul Weaver is at capacity (50/50 Characters). Ascend to Pro to craft more lives.`);
          setSettingsOpen(true, 'billing');
          return;
        }
        
        // Almost all other types count as lore elements
        const isLoreType = [
          'place', 'event', 'concept', 'item', 'note', 'chapter', 
          'image', 'media', 'lore', 'shape'
        ].includes(type);

        if (isLoreType && totalLore >= limits.lore) {
          alert(`The Chronicler's Vault is full (100/100 Lore Elements). Ascend to Pro to expand your world's archive.`);
          setSettingsOpen(true);
          return;
        }
      }

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
            threads: [],
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
      if (type === 'place') {
        useWorldStore.getState().upsertPlace(id, newNode.data);
      }
      if (type === 'event') {
        useWorldStore.getState().upsertEvent(id, newNode.data);
      }
      if (type === 'concept') {
        useWorldStore.getState().upsertConcept(id, newNode.data);
      }
      if (type === 'item') {
        useWorldStore.getState().upsertItem(id, newNode.data);
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
          threads: [],
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

        <Panel position="top-left" style={{ marginLeft: '12px' }} className="z-[1000]">
          <Sidebar projectName={projectName} />
        </Panel>
        
        <Panel position="top-right" className="p-4 flex flex-col items-end gap-3 z-[1000]">
          <div className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl overflow-visible" 
               style={{ background: 'var(--glass)', borderColor: 'var(--border-2)', maxWidth: 'calc(100vw - 40px)' }}>
            
            {/* Canva Toggle - Minimal version for mobile */}
            <div className="flex bg-zinc-800/50 p-1 rounded-xl border border-white/5 shadow-inner shrink-0">
              <button
                onClick={() => useCanvasStore.getState().setCanvasMode('main')}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  canvasMode === 'main' 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Main
              </button>
              <button
                onClick={() => useCanvasStore.getState().setCanvasMode('lore')}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  canvasMode === 'lore' 
                  ? 'bg-amber-600 text-white shadow-lg' 
                  : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Lore
              </button>
            </div>

            <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />

            {/* Chronicle Vault Dropdown - Saves space and floats */}
            <div className="relative group">
              <button 
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-white shadow-xl"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600/20 to-amber-600/20 flex items-center justify-center border border-white/10 shrink-0">
                  <BookOpen className="w-4 h-4 text-purple-300" />
                </div>
                <div className="flex flex-col items-start leading-none pr-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Chronicle</span>
                  <span className="text-xs font-serif text-zinc-100">The Vault</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
              </button>

              {/* Float-style Menu */}
              <div className="absolute right-0 top-full pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-[1001]">
                <div className="w-56 glass-panel p-2 rounded-2xl shadow-2xl border border-white/10" style={{ background: 'var(--bg-2)' }}>
                  <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 mb-2">
                    Gallery & Libraries
                  </div>
                  
                  <button 
                    onClick={() => { setEditingId(null); setIsModalOpen(true); }}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group/item"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-zinc-300 group-hover/item:text-white transition-colors">Characters</span>
                    </div>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-lg border border-purple-500/10">{charCount}</span>
                  </button>

                  <button 
                    onClick={() => setChaptersLibOpen(true)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group/item"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-zinc-300 group-hover/item:text-white transition-colors">Chapters</span>
                    </div>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-500/10">{chapterCount}</span>
                  </button>

                  <button 
                    onClick={() => setNotesLibOpen(true)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group/item"
                  >
                    <div className="flex items-center gap-3">
                      <StickyNote className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-zinc-300 group-hover/item:text-white transition-colors">Notes</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-lg border border-emerald-500/10">{noteCount}</span>
                  </button>

                  <div className="h-px bg-white/5 my-1" />

                  <button 
                    onClick={() => setPlacesLibOpen(true)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group/item"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-zinc-300 group-hover/item:text-white transition-colors">Places</span>
                    </div>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-lg border border-blue-500/10">{Object.keys(places).length}</span>
                  </button>

                  <button 
                    onClick={() => setEventsLibOpen(true)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group/item"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-violet-400" />
                      <span className="text-sm font-medium text-zinc-300 group-hover/item:text-white transition-colors">Events</span>
                    </div>
                    <span className="text-[10px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-lg border border-violet-500/10">{Object.keys(events).length}</span>
                  </button>

                  <button 
                    onClick={() => setConceptsLibOpen(true)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group/item"
                  >
                    <div className="flex items-center gap-3">
                      <Scroll className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-medium text-zinc-300 group-hover/item:text-white transition-colors">Concepts</span>
                    </div>
                    <span className="text-[10px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-lg border border-orange-500/10">{Object.keys(concepts).length}</span>
                  </button>

                  <button 
                    onClick={() => setItemsLibOpen(true)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group/item"
                  >
                    <div className="flex items-center gap-3">
                      <Gem className="w-4 h-4 text-rose-400" />
                      <span className="text-sm font-medium text-zinc-300 group-hover/item:text-white transition-colors">Items</span>
                    </div>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-lg border border-rose-500/10">{Object.keys(items).length}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* Combined Options Menu for everything else */}
            <div className="relative">
              <button
                onClick={() => setOptionsMenuOpen(v => !v)}
                className="flex items-center justify-center p-2 rounded-xl transition-all hover:bg-white/5 active:scale-95"
                style={{ color: optionsMenuOpen ? 'var(--fg)' : 'var(--fg-3)' }}
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {optionsMenuOpen && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[90]" 
                      onClick={() => setOptionsMenuOpen(false)} 
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-64 rounded-2xl border shadow-2xl z-[100] overflow-hidden backdrop-blur-2xl"
                      style={{ background: 'var(--bg-2)', borderColor: 'var(--border-2)' }}
                    >
                      <div className="p-2 space-y-1">
                        {/* Visibility Section */}
                        <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-between">
                          Visibility
                          <button onClick={() => setHiddenTypes([])} className="text-purple-400 hover:text-purple-300 normal-case">Reset</button>
                        </div>
                        <div className="grid grid-cols-2 gap-1 p-1">
                          <button 
                            onClick={() => setHideThreads(!hideThreads)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${!hideThreads ? 'bg-purple-500/10 text-purple-400' : 'text-zinc-500 hover:bg-white/5'}`}
                          >
                            <Share2 className="w-3.5 h-3.5" /> Threads
                          </button>
                          <button 
                            onClick={() => setVisibilityOpen(!visibilityOpen)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${hiddenTypes.length > 0 ? 'bg-amber-500/10 text-amber-400' : 'text-zinc-500 hover:bg-white/5'}`}
                          >
                            <Eye className="w-3.5 h-3.5" /> Types
                          </button>
                        </div>

                        <AnimatePresence>
                          {visibilityOpen && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden border-t border-white/5 pt-1 mt-1 space-y-0.5"
                            >
                              {['character', 'place', 'event', 'concept', 'item', 'note', 'chapter', 'image', 'shape'].map(type => (
                                <button
                                  key={type}
                                  onClick={() => toggleHiddenType(type)}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold transition-all hover:bg-white/5 ${!hiddenTypes.includes(type) ? 'text-zinc-400' : 'text-zinc-700 italic'}`}
                                >
                                  <span className="capitalize">{type === 'image' ? 'Images' : type + 's'}</span>
                                  {!hiddenTypes.includes(type) 
                                    ? <Eye className="w-3.5 h-3.5 text-purple-400/50" /> 
                                    : <EyeOff className="w-3.5 h-3.5 text-zinc-700" />
                                  }
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="h-px bg-white/5 my-2" />

                        {/* Project Operations */}
                        <div className="px-3 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Project</div>
                        <button
                          onClick={() => { exportBackup(); setOptionsMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all text-left group"
                        >
                          <Download className="w-4 h-4 text-zinc-500 group-hover:text-blue-400" />
                          <span className="text-xs font-medium text-zinc-300">Export Backup</span>
                        </button>
                        <button
                          onClick={() => { importInputRef.current?.click(); setOptionsMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all text-left group"
                        >
                          <Upload className="w-4 h-4 text-zinc-500 group-hover:text-amber-400" />
                          <span className="text-xs font-medium text-zinc-300">Restore State</span>
                        </button>

                        <div className="h-px bg-white/5 my-2" />

                        {/* Account Section */}
                        <button
                          onClick={() => { useUserStore.getState().setSettingsOpen(true, 'billing'); setOptionsMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all text-left group"
                        >
                          <Gem className="w-4 h-4 text-purple-400" />
                          <span className="text-xs font-medium text-purple-200">Subscription & Billing</span>
                        </button>
                        <button
                          onClick={() => { useUserStore.getState().setSettingsOpen(true, 'hosting'); setOptionsMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all text-left group"
                        >
                          <Settings className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                          <span className="text-xs font-medium text-zinc-300">Settings</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-6 bg-white/10 mx-1 hidden md:block" />

            {/* Sync Status Button */}
            <button
              onClick={() => syncToFirestore()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all hover:bg-white/5 shrink-0"
              style={{
                color:
                  syncStatus === 'saved'   ? '#34d399' :
                  syncStatus === 'saving'  || syncStatus === 'unsaved' ? '#fbbf24' :
                                             '#f87171',
              }}
            >
              {syncStatus === 'saved'   && <Check      className="w-4 h-4" />}
              {(syncStatus === 'saving' || syncStatus === 'unsaved') && <Loader2    className="w-4 h-4 animate-spin" />}
              {syncStatus === 'error'   && <AlertTriangle className="w-4 h-4" />}
              <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:inline">
                {syncStatus === 'saved' ? 'Saved' : syncStatus === 'saving' ? 'Saving' : syncStatus === 'unsaved' ? 'Unsaved' : 'Retry'}
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

      <LibraryModal
        isOpen={placesLibOpen}
        onClose={() => setPlacesLibOpen(false)}
        kind="place"
      />

      <LibraryModal
        isOpen={eventsLibOpen}
        onClose={() => setEventsLibOpen(false)}
        kind="event"
      />

      <LibraryModal
        isOpen={conceptsLibOpen}
        onClose={() => setConceptsLibOpen(false)}
        kind="concept"
      />

      <LibraryModal
        isOpen={itemsLibOpen}
        onClose={() => setItemsLibOpen(false)}
        kind="item"
      />

      <input 
        type="file" 
        ref={importInputRef} 
        onChange={handleImportFile} 
        style={{ display: 'none' }} 
        accept=".json"
      />
    </div>
  );
}

export function Canvas({ projectId, projectName }: { projectId: string, projectName: string }) {
  return (
    <ReactFlowProvider>
      <CanvasInner projectId={projectId} projectName={projectName} />
    </ReactFlowProvider>
  );
}

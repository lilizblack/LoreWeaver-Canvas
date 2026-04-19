"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Search, Eye, BookOpen, StickyNote, MapPin, Calendar, Scroll, Gem } from "lucide-react";
import { useWorldStore, ChapterRecord, NoteRecord, PlaceRecord, EventRecord, ConceptRecord, ItemRecord } from "@/store/useWorldStore";
import { useCanvasStore } from "@/store/useCanvasStore";
import { useUserStore } from "@/store/useUserStore";
import { Node } from "reactflow";

type Kind = 'chapter' | 'note' | 'place' | 'event' | 'concept' | 'item';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  kind: Kind;
}

const KIND_META = {
  chapter: {
    title: 'Chapter Notes',
    subtitle: 'All your chapter notes — saved forever, even when the canvas is empty.',
    icon: BookOpen,
    color: '#f59e0b',
    placeholder: 'Search chapter notes...',
    addLabel: 'New Chapter Note',
  },
  note: {
    title: 'Notes',
    subtitle: 'Your collected notes — preserved independently of the canvas.',
    icon: StickyNote,
    color: '#10b981',
    placeholder: 'Search notes...',
    addLabel: 'New Note',
  },
  place: {
    title: 'Places',
    subtitle: 'Locales and regions of your world.',
    icon: MapPin,
    color: '#0891b2',
    placeholder: 'Search places...',
    addLabel: 'New Place',
  },
  event: {
    title: 'Events',
    subtitle: 'Key occurrences in your timeline.',
    icon: Calendar,
    color: '#6d28d9',
    placeholder: 'Search events...',
    addLabel: 'New Event',
  },
  concept: {
    title: 'Concepts',
    subtitle: 'Magic systems, cultures, and philosophies.',
    icon: Scroll,
    color: '#d97706',
    placeholder: 'Search concepts...',
    addLabel: 'New Concept',
  },
  item: {
    title: 'Items',
    subtitle: 'Relics, artifacts, and mundane tools.',
    icon: Gem,
    color: '#e11d48',
    placeholder: 'Search items...',
    addLabel: 'New Item',
  },
} as const;

function getTitle(rec: any, kind: Kind): string {
  if (kind === 'chapter') return rec.title || rec.name || 'Untitled Chapter';
  if (kind === 'note') return rec.label || 'Untitled Note';
  return rec.name || 'Untitled ' + kind;
}

function getPreview(rec: any, kind: Kind): string {
  if (kind === 'chapter') return rec.summary || rec.beats || rec.worldBuilding || '';
  if (kind === 'note') return (rec.content || '').replace(/<[^>]+>/g, ' ').trim();
  return rec.description || rec.category || rec.itemType || '';
}

export function LibraryModal({ isOpen, onClose, kind }: Props) {
  const meta = KIND_META[kind];
  const Icon = meta.icon;

  const ws = useWorldStore();
  const records = useMemo(() => {
    if (kind === 'chapter') return ws.chapters;
    if (kind === 'note')    return ws.notes;
    if (kind === 'place')   return ws.places;
    if (kind === 'event')   return ws.events;
    if (kind === 'concept') return ws.concepts;
    if (kind === 'item')    return ws.items;
    return {};
  }, [ws, kind]);

  const deleteRecord = (id: string) => {
    if (kind === 'chapter') ws.deleteChapter(id);
    else if (kind === 'note')    ws.deleteNote(id);
    else if (kind === 'place')   ws.deletePlace(id);
    else if (kind === 'event')   ws.deleteEvent(id);
    else if (kind === 'concept') ws.deleteConcept(id);
    else if (kind === 'item')    ws.deleteItem(id);
  };

  const upsertRecord = (id: string, data: any) => {
    if (kind === 'chapter') ws.upsertChapter(id, data);
    else if (kind === 'note')    ws.upsertNote(id, data);
    else if (kind === 'place')   ws.upsertPlace(id, data);
    else if (kind === 'event')   ws.upsertEvent(id, data);
    else if (kind === 'concept') ws.upsertConcept(id, data);
    else if (kind === 'item')    ws.upsertItem(id, data);
  };
  const { tier, setSettingsOpen } = useUserStore();

  const loreNodes = useCanvasStore((s) => s.loreNodes);
  const mainNodes = useCanvasStore((s) => s.mainNodes);
  const addNode   = useCanvasStore((s) => s.addNode);
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);
  const setCanvasMode     = useCanvasStore((s) => s.setCanvasMode);
  const canvasMode        = useCanvasStore((s) => s.canvasMode);

  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const list = useMemo(() => {
    const arr = Object.values(records);
    const q = search.trim().toLowerCase();
    const filtered = q
      ? arr.filter(r =>
          getTitle(r, kind).toLowerCase().includes(q) ||
          getPreview(r, kind).toLowerCase().includes(q)
        )
      : arr;
    return filtered.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  }, [records, search, kind]);

  if (!isOpen) return null;

  const isOnCanvas = (id: string) => {
    const allNodes = [...mainNodes, ...loreNodes];
    return allNodes.some(n => n.id === id);
  };

  const focusOnCanvas = (id: string) => {
    setCanvasMode('main');
    setSelectedNodeId(id);
    onClose();
  };

  const restoreToCanvas = (rec: any) => {
    const isMainType = kind === 'chapter' || kind === 'note';
    const targetMode = isMainType ? 'main' : 'lore';
    
    const base: Node = {
      id: rec.id,
      type: kind,
      position: { x: 200 + Math.random() * 300, y: 200 + Math.random() * 200 },
      style: kind === 'chapter' ? { width: 300, height: 280 }
           : kind === 'event'   ? { width: 300, height: 280 }
           : kind === 'note'    ? { width: 220, height: 140 }
           : kind === 'place'   ? { width: 280, height: 220 }
           : kind === 'concept' ? { width: 280, height: 220 }
           : kind === 'item'    ? { width: 280, height: 220 }
           : { width: 200, height: 160 },
      data: {
        ...rec,
        // Ensure UI fields are present
        ...(kind === 'chapter' ? { title: rec.title || rec.name || 'Recovered Chapter' } : {}),
        ...(kind === 'note'    ? { label: rec.label || 'Recovered Note' } : {}),
      }
    };

    setCanvasMode(targetMode);
    addNode(base);
    setSelectedNodeId(rec.id);
    onClose();
  };

  const createNew = () => {
    // ── Spark Plan Limits Enforcement ──────────────────────────────────────
    if (tier === 'spark') {
      const limits = { lore: 100 };
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
      
      if (libraryLoreCount + nodeLoreCount >= limits.lore) {
        alert(`The Chronicler's Vault is full (100/100 Lore Elements). Ascend to Pro to expand your world's archive.`);
        setSettingsOpen(true);
        return;
      }
    }

    const id = `${kind}-${Date.now()}`;
    const now = Date.now();
    let initialData: any = { id, createdAt: now, updatedAt: now };

    if (kind === 'chapter') {
      initialData = { ...initialData, name: 'New Chapter Note', summary: '', noteColor: '#f59e0b', title: 'New Chapter Note' };
    } else if (kind === 'note') {
      initialData = { ...initialData, label: 'New Note', content: '', noteColor: '#6d28d9' };
    } else if (kind === 'place') {
      initialData = { ...initialData, name: 'New Place', description: '', color: '#0891b2' };
    } else if (kind === 'event') {
      initialData = { ...initialData, name: 'New Event', description: '', noteColor: '#6d28d9', title: 'New Event' };
    } else if (kind === 'concept') {
      initialData = { ...initialData, name: 'New Concept', description: '', color: '#d97706' };
    } else if (kind === 'item') {
      initialData = { ...initialData, name: 'New Item', description: '', color: '#e11d48' };
    }

    upsertRecord(id, initialData);
    restoreToCanvas(initialData);
  };

  const handleDelete = (id: string) => {
    deleteRecord(id);
    setConfirmDeleteId(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6"
           style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
           onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl max-h-[85vh] rounded-2xl border overflow-hidden flex flex-col shadow-2xl"
          style={{ background: 'var(--glass)', borderColor: 'var(--border-2)', backdropFilter: 'blur(24px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: meta.color + '22', border: `1px solid ${meta.color}55` }}
              >
                <Icon className="w-5 h-5" style={{ color: meta.color }} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--fg)' }}>{meta.title}</h2>
                <p className="text-xs" style={{ color: 'var(--fg-3)' }}>{meta.subtitle}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--fg-3)' }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ background: 'var(--bg-3)', borderColor: 'var(--border)' }}>
              <Search className="w-4 h-4" style={{ color: 'var(--fg-3)' }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={meta.placeholder}
                className="flex-1 bg-transparent text-sm focus:outline-none"
                style={{ color: 'var(--fg)' }}
              />
            </div>
            <button
              onClick={createNew}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
              style={{ background: meta.color, color: 'white' }}
            >
              <Plus className="w-4 h-4" />
              {meta.addLabel}
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {list.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Icon className="w-10 h-10 mb-3" style={{ color: meta.color, opacity: 0.4 }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--fg-2)' }}>
                  {search ? 'No matches.' : `No ${meta.title.toLowerCase()} yet.`}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--fg-3)' }}>
                  {search ? 'Try a different search term.' : `Add a ${kind} to the canvas or click the button above to create one.`}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {list.map(rec => {
                  const title = getTitle(rec, kind);
                  const preview = getPreview(rec, kind);
                  const onCanvas = isOnCanvas(rec.id);
                  const isConfirming = confirmDeleteId === rec.id;
                  const color = (rec as any).noteColor || meta.color;

                  return (
                    <div
                      key={rec.id}
                      className="group rounded-xl border p-3 flex items-start gap-3 transition-all"
                      style={{
                        background: 'var(--bg-3)',
                        borderColor: 'var(--border)',
                        borderLeftWidth: 3,
                        borderLeftColor: color,
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold truncate" style={{ color: 'var(--fg)' }}>{title}</h3>
                          {!onCanvas && (
                            <span
                              className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{ background: '#f59e0b22', color: '#f59e0b' }}
                              title="Not currently on the canvas — click Restore to place it back"
                            >
                              Not on canvas
                            </span>
                          )}
                        </div>
                        {preview && (
                          <p className="text-xs line-clamp-2" style={{ color: 'var(--fg-3)' }}>{preview}</p>
                        )}
                        {kind === 'chapter' && (() => {
                          const c = rec as any;
                          const chips: string[] = [];
                          if (c.chapterNumber) chips.push(`Ch. ${c.chapterNumber}`);
                          if (c.wordCount)     chips.push(`${Number(c.wordCount).toLocaleString()} words`);
                          if (c.appearances?.length) chips.push(`${c.appearances.length} appearance${c.appearances.length === 1 ? '' : 's'}`);
                          return chips.length > 0 ? (
                            <p className="text-[10px] font-semibold mt-1 uppercase tracking-wider" style={{ color: color }}>
                              {chips.join(' • ')}
                            </p>
                          ) : null;
                        })()}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {onCanvas ? (
                          <button
                            onClick={() => focusOnCanvas(rec.id)}
                            title="Jump to this on the canvas"
                            className="p-2 rounded-lg transition-colors opacity-60 group-hover:opacity-100 hover:bg-white/5"
                            style={{ color: 'var(--fg-2)' }}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => restoreToCanvas(rec)}
                            title="Restore this back onto the canvas"
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                            style={{ background: meta.color + '22', color: meta.color, border: `1px solid ${meta.color}55` }}
                          >
                            Restore
                          </button>
                        )}

                        {isConfirming ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(rec.id)}
                              className="px-2 py-1.5 rounded-lg text-[10px] font-bold bg-red-500 text-white"
                            >
                              Delete forever
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1.5 rounded-lg text-[10px] font-bold"
                              style={{ background: 'var(--bg-2)', color: 'var(--fg-2)' }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(rec.id)}
                            title="Remove from library (permanent)"
                            className="p-2 rounded-lg transition-colors opacity-40 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
                            style={{ color: 'var(--fg-3)' }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border)', color: 'var(--fg-3)' }}>
            <span className="capitalize">{list.length} {kind}{list.length === 1 ? '' : 's'} in library</span>
            <span className="italic">Deleting a canvas node does NOT remove it from this library.</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

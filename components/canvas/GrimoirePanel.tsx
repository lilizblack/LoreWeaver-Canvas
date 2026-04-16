"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useCanvasStore } from '@/store/useCanvasStore';
import {
  X, User, BookOpen, StickyNote, Upload, Smile, Zap, TrendingUp,
  Users, AlertCircle, Type, Sparkles, Palette, ChevronDown, MapPin,
  Link2, Calendar, Scroll, Gem, Heart, Trash2,
  ChevronsUp, ChevronsDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { LoreLink } from '@/store/useCanvasStore';
import { useWorldStore } from '@/store/useWorldStore';
import { CharacterRelationship } from '@/store/useWorldStore';
import {
  CHARACTER_ROLES,
  RELATIONSHIP_CATEGORIES,
  getRelationshipColor,
  getRelationshipCategory,
} from '@/lib/relationshipTypes';

const NOTE_COLORS = [
  null,       // default / no custom color
  '#6d28d9',  // violet
  '#2563eb',  // blue
  '#0891b2',  // cyan
  '#059669',  // emerald
  '#65a30d',  // lime
  '#d97706',  // amber
  '#ea580c',  // orange
  '#dc2626',  // red
  '#db2777',  // pink
  '#f59e0b',  // gold
  '#1e293b',  // midnight
];

function ColorPicker({ current, onChange }: { current: string | null; onChange: (c: string | null) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '2px 0' }}>
      {NOTE_COLORS.map((c, i) => (
        <button
          key={i}
          onClick={() => onChange(c)}
          title={c || 'Default'}
          style={{
            width: 22, height: 22, borderRadius: '50%',
            background: c ?? 'var(--bg-3)',
            border: current === c ? '2px solid white' : '2px solid var(--border-2)',
            boxShadow: current === c ? '0 0 0 2px var(--primary)' : 'none',
            cursor: 'pointer', flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}


// ─── Local-state wrapper for inputs ───────────────────────────────────────────
// Each field reads from a local draft and only flushes to the store on blur.
// This prevents Firestore echo-writes from blowing away the cursor mid-type.
function useField(
  nodeId: string | undefined,
  storeValue: string | undefined,
  key: string,
  updateNodeData: (id: string, data: any) => void
) {
  const [draft, setDraft] = useState(storeValue ?? '');

  // When the node selection changes, reset draft to store value
  useEffect(() => {
    setDraft(storeValue ?? '');
  }, [nodeId, key]); // intentionally NOT depending on storeValue to avoid mid-type resets

  const flush = useCallback(() => {
    if (nodeId) updateNodeData(nodeId, { [key]: draft });
  }, [nodeId, key, draft, updateNodeData]);

  return { value: draft, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value), onBlur: flush };
}

// ─── Lore node type colors ────────────────────────────────────────────────────
const LORE_TYPE_COLORS: Record<string, string> = {
  place:   '#0891b2',
  event:   '#db2777',
  concept: '#d97706',
  item:    '#e11d48',
  note:    '#059669',
  image:   '#2563eb',
};

function getLoreNodeName(n: any): string {
  return n.data?.name || n.data?.title || n.data?.label || 'Unnamed';
}

function getLoreNodeColor(type: string): string {
  return LORE_TYPE_COLORS[type] ?? '#6d28d9';
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export function GrimoirePanel() {
  const { selectedNodeId, nodes, updateNodeData, setSelectedNodeId, deleteNode, updateNodeZIndex } = useCanvasStore();
  const loreNodes  = useCanvasStore((state) => state.loreNodes);
  const mainNodes  = useCanvasStore((state) => state.mainNodes);
  const links      = useCanvasStore((state) => state.links);
  const addLink    = useCanvasStore((state) => state.addLink);
  const removeLink = useCanvasStore((state) => state.removeLink);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const allCharacters = useWorldStore((state) => state.characters);

  const [isUploading, setIsUploading] = useState(false);
  const [charPickerOpen, setCharPickerOpen] = useState(false);
  const [lorePickerOpen, setLorePickerOpen] = useState(false);
  const [loreSearch, setLoreSearch] = useState('');
  const [relFormOpen, setRelFormOpen] = useState(false);
  const [relTargetId, setRelTargetId] = useState('');
  const [relType, setRelType] = useState('');
  const [deleteArmed, setDeleteArmed] = useState(false);

  // ── Per-field local drafts ──
  const nameField          = useField(selectedNodeId ?? undefined, selectedNode?.data.name,          'name',          updateNodeData);
  const ageField           = useField(selectedNodeId ?? undefined, selectedNode?.data.age,           'age',           updateNodeData);
  const personalityField   = useField(selectedNodeId ?? undefined, selectedNode?.data.personality,   'personality',   updateNodeData);
  const appearanceField    = useField(selectedNodeId ?? undefined, selectedNode?.data.appearance,    'appearance',    updateNodeData);
  const growthField        = useField(selectedNodeId ?? undefined, selectedNode?.data.growth,        'growth',        updateNodeData);
  const summaryField       = useField(selectedNodeId ?? undefined, selectedNode?.data.summary,       'summary',       updateNodeData);
  const beatsField         = useField(selectedNodeId ?? undefined, selectedNode?.data.beats,         'beats',         updateNodeData);
  const threadsField       = useField(selectedNodeId ?? undefined, selectedNode?.data.threads,       'threads',       updateNodeData);
  const worldBuildingField = useField(selectedNodeId ?? undefined, selectedNode?.data.worldBuilding, 'worldBuilding', updateNodeData);
  const contentField       = useField(selectedNodeId ?? undefined, selectedNode?.data.content,       'content',       updateNodeData);
  const labelField         = useField(selectedNodeId ?? undefined, selectedNode?.data.label,         'label',         updateNodeData);
  const chapterNumField    = useField(selectedNodeId ?? undefined, selectedNode?.data.chapterNumber, 'chapterNumber', updateNodeData);
  const wordCountField     = useField(selectedNodeId ?? undefined, selectedNode?.data.wordCount,     'wordCount',     updateNodeData);
  const descriptionField   = useField(selectedNodeId ?? undefined, selectedNode?.data.description,   'description',   updateNodeData);

  // Instant-flush for selects/pickers (no typing involved)
  const handleSelect = (key: string, value: any) => {
    if (selectedNodeId) updateNodeData(selectedNodeId, { [key]: value });
  };

  // ── Lore linking helpers ──────────────────────────────────────────────────
  const chapterLinks = selectedNodeId
    ? links.filter(l => l.sourceId === selectedNodeId)
    : [];

  const isLoreLinked = (targetId: string) =>
    chapterLinks.some(l => l.targetId === targetId);

  const toggleLoreLink = (targetNode: any) => {
    const existing = chapterLinks.find(l => l.targetId === targetNode.id);
    if (existing) {
      removeLink(existing.id);
    } else {
      addLink({
        id: crypto.randomUUID(),
        sourceId: selectedNodeId!,
        sourceCanvas: 'main',
        targetId: targetNode.id,
        targetCanvas: 'lore',
        relationType: 'mentions',
        createdAt: Date.now(),
      });
    }
  };

  const filteredLoreNodes = loreNodes.filter(n => {
    if (!loreSearch) return true;
    const name = getLoreNodeName(n);
    return (
      name.toLowerCase().includes(loreSearch.toLowerCase()) ||
      (n.type || '').includes(loreSearch.toLowerCase())
    );
  });

  // ── Backlinks: which chapters reference this lore node ────────────────────
  const referencedInChapters = selectedNodeId
    ? links
        .filter(l => l.targetId === selectedNodeId)
        .map(l => mainNodes.find(n => n.id === l.sourceId))
        .filter(Boolean)
    : [];

  // ── Image upload ──────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedNodeId) return;
    const nodeId = selectedNodeId;
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `portraits/${nodeId}-${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      updateNodeData(nodeId, { imageUrl: url });
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please check Firebase Storage rules and try again.');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  if (!selectedNode) return null;

  const inputCls = "w-full bg-[var(--bg-3)] border border-[var(--border)] rounded-xl py-2.5 px-4 text-base focus:border-purple-500/50 focus:outline-none transition-colors placeholder:text-[var(--fg-3)] text-[var(--fg)]";
  const textareaCls = "w-full bg-[var(--bg-3)] border border-[var(--border)] rounded-xl py-2.5 px-4 text-base resize-none focus:border-purple-500/50 focus:outline-none transition-colors text-[var(--fg)] placeholder:text-[var(--fg-3)]";
  const labelCls = "text-xs font-extrabold text-[var(--fg-3)] uppercase tracking-widest flex items-center gap-1.5";

  // Reusable Font Size Row
  const FontSizeControl = () => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className={labelCls}><Type className="w-3 h-3 text-purple-400" /> Inner Font Size</label>
        <span className="text-[10px] font-bold text-[var(--fg-2)]">{selectedNode.data.fontSize ?? 14}px</span>
      </div>
      <input
        type="range" min="10" max="32" step="1"
        value={selectedNode.data.fontSize ?? 14}
        onChange={(e) => handleSelect('fontSize', parseInt(e.target.value))}
        className="w-full accent-purple-500 cursor-pointer h-1.5 bg-[var(--bg-3)] border border-[var(--border)] rounded-lg appearance-none"
      />
    </div>
  );

  const ImagePositionControl = () => (
    <div className="space-y-1.5">
      <label className={labelCls}>Image Formatting</label>
      <select
        value={selectedNode.data.imagePosition || 'center'}
        onChange={(e) => handleSelect('imagePosition', e.target.value)}
        className="w-full bg-[var(--bg-3)] border border-[var(--border)] rounded-xl py-2 px-3 text-sm text-[var(--fg)] focus:outline-none"
      >
        <option value="center">Center / Cover (Default)</option>
        <option value="top">Top Center</option>
        <option value="top right">Top Right</option>
        <option value="top left">Top Left</option>
        <option value="fill">Stretch (Fill)</option>
        <option value="contain">Fit to Frame (Contain)</option>
      </select>
    </div>
  );

  // ─── Shared "Referenced In" section for lore nodes ───────────────────────
  const ReferencedInSection = ({ accentColor = '#6d28d9' }: { accentColor?: string }) => {
    if (referencedInChapters.length === 0) return null;
    return (
      <div className="space-y-1.5">
        <label className={labelCls}>
          <BookOpen className="w-3 h-3" style={{ color: accentColor }} />
          Referenced In
        </label>
        <div className="space-y-1.5">
          {referencedInChapters.map((chapter: any) => (
            <div
              key={chapter.id}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs border"
              style={{ background: 'var(--bg-3)', borderColor: 'var(--border)', color: 'var(--fg-2)' }}
            >
              <BookOpen className="w-3 h-3 text-amber-500 flex-shrink-0" />
              <span className="font-medium truncate">
                {chapter.data.name || chapter.data.title || 'Untitled Chapter'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      key={selectedNodeId}
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        background: 'var(--glass)',
        backdropFilter: 'blur(24px)',
        border: '1px solid var(--border-2)',
        color: 'var(--fg)',
        boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
      }}
      className="fixed right-6 top-24 bottom-6 w-[440px] rounded-2xl flex flex-col z-[100] overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          {selectedNode.type === 'character' && <User       className="w-4 h-4 text-purple-400" />}
          {selectedNode.type === 'chapter'   && <BookOpen   className="w-4 h-4 text-amber-500"  />}
          {selectedNode.type === 'note'      && <StickyNote className="w-4 h-4 text-emerald-500" />}
          {selectedNode.type === 'place'     && <MapPin     className="w-4 h-4 text-cyan-500"   />}
          {selectedNode.type === 'event'     && <Calendar   className="w-4 h-4 text-pink-500"   />}
          {selectedNode.type === 'concept'   && <Scroll     className="w-4 h-4 text-amber-500"  />}
          {selectedNode.type === 'item'      && <Gem        className="w-4 h-4 text-rose-500"   />}
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--fg-2)' }}>
            {selectedNode.type} Details
          </span>
        </div>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="p-1.5 rounded-lg transition-colors border border-transparent"
          style={{ color: 'var(--fg-3)' }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--fg)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--fg-3)'}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar" onClick={() => setDeleteArmed(false)}>

        {/* ── CHARACTER ── */}
        {selectedNode.type === 'character' && (
          <>
            {/* Portrait */}
            <div className="space-y-2">
              <label className={labelCls}>Portrait & Theme</label>
              <div className="relative group aspect-square rounded-xl border overflow-hidden flex flex-col items-center justify-center border-dashed" style={{ background: 'var(--bg-3)', borderColor: 'var(--border)' }}>
                {selectedNode.data.imageUrl
                  ? <img src={selectedNode.data.imageUrl} className="w-full h-full" alt="portrait" style={{
                      objectFit: selectedNode.data.imagePosition === 'fill' ? 'fill' : selectedNode.data.imagePosition === 'contain' ? 'contain' : 'cover',
                      objectPosition: ['contain', 'fill'].includes(selectedNode.data.imagePosition) ? 'center' : (selectedNode.data.imagePosition || 'center')
                    }} />
                  : <div className="text-center p-4">
                      <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--fg-3)' }} />
                      <p className="text-[10px]" style={{ color: 'var(--fg-3)' }}>Upload PNG or JPG</p>
                    </div>
                }
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} disabled={isUploading} />
                <div className={`absolute inset-0 bg-black/60 transition-opacity flex items-center justify-center pointer-events-none ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <div className="flex flex-col items-center gap-2">
                    {isUploading
                      ? <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      : <Upload className="w-5 h-5 text-white" />
                    }
                    <span className="text-[10px] text-white font-bold uppercase">{isUploading ? 'Uploading...' : 'Replace'}</span>
                  </div>
                </div>
              </div>
              {selectedNode.data.imageUrl && (
                <div className="pt-2">
                  <ImagePositionControl />
                </div>
              )}
              <div className="pt-2">
                <ColorPicker
                  current={selectedNode.data.color || null}
                  onChange={(c) => handleSelect('color', c)}
                />
              </div>
            </div>

            <div className="w-full h-px" style={{ background: 'var(--border)' }} />

            {/* Name */}
            <div className="space-y-1.5">
              <label className={labelCls}>True Name</label>
              <input type="text" {...nameField} placeholder="Character name..." className={inputCls} style={{ color: 'var(--fg)' }} />
            </div>

            {/* Age + Sex + Type */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className={labelCls}>Age</label>
                <input type="text" {...ageField} className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Sex</label>
                <select
                  value={selectedNode.data.sex || ''}
                  onChange={(e) => handleSelect('sex', e.target.value)}
                  className="w-full bg-[var(--bg-3)] border border-[var(--border)] rounded-xl py-2.5 px-3 text-base text-[var(--fg)] focus:outline-none"
                >
                  <option value="">—</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Role</label>
                <select
                  value={selectedNode.data.characterType || 'Protagonist'}
                  onChange={(e) => handleSelect('characterType', e.target.value)}
                  className="w-full bg-[var(--bg-3)] border border-[var(--border)] rounded-xl py-2.5 px-3 text-base text-[var(--fg)] focus:outline-none"
                >
                  {CHARACTER_ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.value}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="w-full h-px" style={{ background: 'var(--border)' }} />
            <FontSizeControl />

            {/* Personality */}
            <div className="space-y-1.5">
              <label className={labelCls}><Smile className="w-3 h-3 text-purple-400" /> Personality</label>
              <textarea {...personalityField} rows={3} className={textareaCls} />
            </div>

            {/* Appearance */}
            <div className="space-y-1.5">
              <label className={labelCls}><Zap className="w-3 h-3 text-purple-400" /> Appearance</label>
              <textarea {...appearanceField} rows={3} className={textareaCls} />
            </div>

            {/* Growth */}
            <div className="space-y-1.5">
              <label className={labelCls}><TrendingUp className="w-3 h-3 text-purple-400" /> Character Growth</label>
              <textarea {...growthField} rows={3} className={textareaCls} />
            </div>

            <div className="w-full h-px" style={{ background: 'var(--border)' }} />

            {/* ── Relationships ── */}
            {(() => {
              const rels: CharacterRelationship[] = selectedNode.data.relationships || [];
              const thisCharId = selectedNode.data.characterId;
              const otherChars = Object.values(allCharacters).filter(c => c.id !== thisCharId);

              const addRel = () => {
                if (!relTargetId || !relType.trim()) return;
                const already = rels.some(r => r.characterId === relTargetId);
                if (already) return;
                const next = [...rels, { characterId: relTargetId, type: relType.trim() }];
                handleSelect('relationships', next);
                setRelTargetId('');
                setRelType('');
                setRelFormOpen(false);
              };

              const removeRel = (targetId: string) => {
                handleSelect('relationships', rels.filter(r => r.characterId !== targetId));
              };

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={labelCls}><Heart className="w-3 h-3 text-pink-400" /> Relationships</label>
                    <button
                      type="button"
                      onClick={() => { setRelFormOpen(o => !o); setRelTargetId(''); setRelType(''); }}
                      className="text-[10px] font-bold px-2 py-1 rounded-lg transition-colors border"
                      style={{
                        background: relFormOpen ? 'var(--primary)' : 'var(--bg-3)',
                        color: relFormOpen ? 'white' : 'var(--fg-3)',
                        borderColor: relFormOpen ? 'var(--primary)' : 'var(--border)',
                      }}
                    >
                      {relFormOpen ? '✕ Cancel' : '+ Add'}
                    </button>
                  </div>

                  {/* Add form */}
                  {relFormOpen && (
                    <div className="rounded-xl border p-3 space-y-3" style={{ background: 'var(--bg-3)', borderColor: 'var(--border)' }}>
                      <div className="space-y-1.5">
                        <label className={labelCls}>Character</label>
                        <select
                          value={relTargetId}
                          onChange={(e) => setRelTargetId(e.target.value)}
                          className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-xl py-2.5 px-3 text-base text-[var(--fg)] focus:outline-none"
                        >
                          <option value="">Select a character...</option>
                          {otherChars.map(c => (
                            <option key={c.id} value={c.id}>{c.name || 'Unnamed'}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelCls}>Relationship Type</label>
                        <input
                          type="text"
                          list="rel-types"
                          value={relType}
                          onChange={(e) => setRelType(e.target.value)}
                          placeholder="e.g. Boss, Best friend, Boyfriend, Cousin..."
                          className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-xl py-2.5 px-4 text-base text-[var(--fg)] focus:outline-none placeholder:opacity-40"
                        />
                        <datalist id="rel-types">
                          {RELATIONSHIP_CATEGORIES.flatMap(cat =>
                            cat.types.map(t => (
                              <option key={cat.label + '-' + t} value={t}>{cat.label}</option>
                            ))
                          )}
                        </datalist>
                        {relType && (
                          <div className="flex items-center gap-2 pt-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ background: getRelationshipColor(relType) }}
                            />
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--fg-3)' }}>
                              {getRelationshipCategory(relType) || 'Custom'} thread
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={addRel}
                        disabled={!relTargetId || !relType.trim()}
                        className="w-full py-2 rounded-xl text-sm font-bold transition-all"
                        style={{
                          background: (!relTargetId || !relType.trim()) ? 'var(--bg-2)' : 'var(--primary)',
                          color: (!relTargetId || !relType.trim()) ? 'var(--fg-3)' : 'white',
                          cursor: (!relTargetId || !relType.trim()) ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Confirm Relationship
                      </button>
                    </div>
                  )}

                  {/* Existing relationships */}
                  {rels.length === 0 && !relFormOpen && (
                    <p className="text-xs italic" style={{ color: 'var(--fg-3)' }}>No relationships recorded yet.</p>
                  )}
                  {rels.map(rel => {
                    const relChar = allCharacters[rel.characterId];
                    if (!relChar) return null;
                    const relColor = getRelationshipColor(rel.type);
                    return (
                      <div
                        key={rel.characterId}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl border"
                        style={{
                          background: 'var(--bg-3)',
                          borderColor: relColor + '40',
                          borderLeftWidth: 3,
                          borderLeftColor: relColor,
                        }}
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-2" style={{ borderColor: relColor }}>
                          {relChar.imageUrl
                            ? <img src={relChar.imageUrl} alt={relChar.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center" style={{ background: relColor + '20' }}>
                                <User className="w-4 h-4" style={{ color: relColor }} />
                              </div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--fg)' }}>{relChar.name || 'Unnamed'}</p>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{ background: relColor + '22', color: relColor }}
                            >
                              {rel.type}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeRel(rel.characterId)}
                          className="text-xs font-black opacity-40 hover:opacity-100 transition-opacity flex-shrink-0 p-1"
                          style={{ color: 'var(--fg)' }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </>
        )}

        {/* ── CHAPTER ── */}
        {selectedNode.type === 'chapter' && (
          <>
            {/* Color section */}
            <div className="space-y-2">
              <label className={labelCls}><Palette className="w-3 h-3 text-amber-500" /> Accent Color</label>
              <ColorPicker
                current={selectedNode.data.noteColor || null}
                onChange={(c) => handleSelect('noteColor', c)}
              />
            </div>

            <div className="w-full h-px" style={{ background: 'var(--border)' }} />
            <FontSizeControl />

            {/* Title */}
            <div className="space-y-1.5">
              <label className={labelCls}>Chapter Title</label>
              <input type="text" {...nameField} placeholder="Chapter name..." className={inputCls} />
            </div>

            {/* Number + Word Count */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelCls}>Chapter #</label>
                <input type="text" {...chapterNumField} placeholder="1" className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Length (Est)</label>
                <input type="number" {...wordCountField} placeholder="0" className={inputCls} />
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-1.5">
              <label className={labelCls}>Chapter Summary</label>
              <textarea {...summaryField} rows={4} className={`${textareaCls} italic`} placeholder="Plot beats..." />
            </div>

            {/* Character Appearances */}
            {(() => {
              const characterNodes = nodes.filter(n => n.type === 'character');
              const selectedChars: string[] = selectedNode.data.appearances || [];
              const toggleChar = (charId: string) => {
                const next = selectedChars.includes(charId)
                  ? selectedChars.filter(id => id !== charId)
                  : [...selectedChars, charId];
                handleSelect('appearances', next);
              };
              return (
                <div className="space-y-1.5">
                  <label className={labelCls}><Users className="w-3 h-3 text-amber-500" /> Cast Appearances</label>
                  <button
                    type="button"
                    onClick={() => setCharPickerOpen(o => !o)}
                    className="w-full flex items-center justify-between border rounded-xl py-2 px-3 text-sm text-left transition-colors"
                    style={{ background: 'var(--bg-3)', borderColor: 'var(--border)', color: 'var(--fg-2)' }}
                  >
                    <span>
                      {selectedChars.length === 0 ? 'Select characters...' : `${selectedChars.length} selected`}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${charPickerOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--fg-3)' }} />
                  </button>
                  {charPickerOpen && (
                    <div className="border rounded-xl overflow-hidden shadow-2xl mt-2 max-h-48 overflow-y-auto custom-scrollbar" style={{ background: 'var(--bg-2)', borderColor: 'var(--border)' }}>
                      {characterNodes.length === 0
                        ? <p className="text-xs text-center py-4 px-3" style={{ color: 'var(--fg-3)' }}>No characters on canvas.</p>
                        : characterNodes.map(c => {
                            const isSelected = selectedChars.includes(c.id);
                            return (
                              <button key={c.id} type="button" onClick={() => toggleChar(c.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors border-b last:border-0 ${isSelected ? 'bg-amber-500/10' : ''}`}
                                style={{ borderColor: 'var(--border)' }}
                              >
                                <div className={`w-6 h-6 rounded-md overflow-hidden flex-shrink-0 border ${isSelected ? 'border-amber-500/50' : ''}`} style={{ borderColor: isSelected ? undefined : 'var(--border)' }}>
                                  {c.data.imageUrl
                                    ? <img src={c.data.imageUrl} alt={c.data.name} className="w-full h-full object-cover" />
                                    : <div className="w-full h-full bg-purple-500/10 flex items-center justify-center"><User className="w-3 h-3 text-purple-400" /></div>
                                  }
                                </div>
                                <span className={`text-xs font-semibold flex-1 ${isSelected ? 'text-amber-500' : ''}`} style={{ color: isSelected ? undefined : 'var(--fg)' }}>{c.data.name || 'Unnamed'}</span>
                              </button>
                            );
                          })
                      }
                    </div>
                  )}
                  {selectedChars.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedChars.map(charId => {
                        const char = nodes.find(n => n.id === charId);
                        if (!char) return null;
                        return (
                          <div key={charId} className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                            {char.data.imageUrl && <img src={char.data.imageUrl} alt={char.data.name} className="w-3.5 h-3.5 rounded-full object-cover" />}
                            {char.data.name || '...'}
                            <button onClick={() => toggleChar(charId)} className="hover:text-amber-800 dark:hover:text-white transition-colors ml-1 font-black">×</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Beats */}
            <div className="space-y-1.5">
              <label className={labelCls}><Sparkles className="w-3 h-3 text-amber-500" /> Plot Beats</label>
              <textarea {...beatsField} rows={3} className={textareaCls} />
            </div>

            {/* Threads */}
            <div className="space-y-1.5">
              <label className={labelCls}><AlertCircle className="w-3 h-3 text-rose-500" /> Pending Hooks</label>
              <textarea {...threadsField} rows={3} className={textareaCls} placeholder="Unresolved plot threads, mysteries..." />
            </div>

            {/* World Building */}
            <div className="space-y-1.5">
              <label className={labelCls}><MapPin className="w-3 h-3 text-cyan-500" /> World Building Elements</label>
              <textarea {...worldBuildingField} rows={3} className={textareaCls} placeholder="Lore, locations, magic systems..." />
            </div>

            {/* ── Linked Lore Entities ── */}
            <div className="w-full h-px" style={{ background: 'var(--border)' }} />
            <div className="space-y-1.5">
              <label className={labelCls}>
                <Link2 className="w-3 h-3 text-purple-400" /> Linked Lore
              </label>

              <button
                type="button"
                onClick={() => { setLorePickerOpen(o => !o); setLoreSearch(''); }}
                className="w-full flex items-center justify-between border rounded-xl py-2 px-3 text-sm text-left transition-colors"
                style={{
                  background: 'var(--bg-3)',
                  borderColor: lorePickerOpen ? 'rgba(109,40,217,0.5)' : 'var(--border)',
                  color: 'var(--fg-2)'
                }}
              >
                <span>{chapterLinks.length === 0 ? 'Link lore entities...' : `${chapterLinks.length} linked`}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${lorePickerOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--fg-3)' }} />
              </button>

              {lorePickerOpen && (
                <div className="border rounded-xl overflow-hidden shadow-2xl mt-1" style={{ background: 'var(--bg-2)', borderColor: 'var(--border)' }}>
                  {/* Search */}
                  <div className="p-2 border-b" style={{ borderColor: 'var(--border)' }}>
                    <input
                      type="text"
                      value={loreSearch}
                      onChange={(e) => setLoreSearch(e.target.value)}
                      placeholder="Search lore entities..."
                      className="w-full bg-transparent text-sm focus:outline-none placeholder:opacity-40"
                      style={{ color: 'var(--fg)' }}
                      autoFocus
                    />
                  </div>
                  {/* List */}
                  <div className="max-h-52 overflow-y-auto custom-scrollbar">
                    {filteredLoreNodes.length === 0
                      ? <p className="text-xs text-center py-4 px-3" style={{ color: 'var(--fg-3)' }}>
                          {loreNodes.length === 0 ? 'No lore entities yet. Add Place or Event nodes to the Lore Canvas.' : 'No matches.'}
                        </p>
                      : filteredLoreNodes.map(n => {
                          const linked = isLoreLinked(n.id);
                          const color  = getLoreNodeColor(n.type || '');
                          return (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => toggleLoreLink(n)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b last:border-0"
                              style={{
                                background: linked ? `${color}12` : 'transparent',
                                borderColor: 'var(--border)',
                                color: 'var(--fg)'
                              }}
                            >
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                              <span className="text-xs flex-1 font-medium truncate">{getLoreNodeName(n)}</span>
                              <span
                                className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                                style={{ background: `${color}20`, color }}
                              >
                                {n.type}
                              </span>
                              {linked && <span className="text-[10px] text-purple-400 font-black flex-shrink-0">✓</span>}
                            </button>
                          );
                        })
                    }
                  </div>
                </div>
              )}

              {/* Linked chips */}
              {chapterLinks.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {chapterLinks.map((link: LoreLink) => {
                    const target = loreNodes.find(n => n.id === link.targetId);
                    if (!target) return null;
                    const color = getLoreNodeColor(target.type || '');
                    return (
                      <div
                        key={link.id}
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                        style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}
                      >
                        <span className="truncate max-w-[120px]">{getLoreNodeName(target)}</span>
                        <button
                          onClick={() => removeLink(link.id)}
                          className="font-black opacity-60 hover:opacity-100 transition-opacity ml-1 flex-shrink-0"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── NOTE ── */}
        {selectedNode.type === 'note' && (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className={labelCls}><Palette className="w-3 h-3 text-emerald-500" /> Accent Color</label>
              <ColorPicker
                current={selectedNode.data.noteColor || null}
                onChange={(c) => handleSelect('noteColor', c)}
              />
            </div>

            <div className="w-full h-px" style={{ background: 'var(--border)' }} />
            <FontSizeControl />

            <div className="space-y-1.5">
              <label className={labelCls}>Content</label>
              <textarea
                {...contentField}
                placeholder="Scribed notes..."
                className={`${textareaCls} min-h-[400px]`}
                style={{ fontSize: (selectedNode.data.fontSize ?? 14) + 'px' }}
              />
            </div>
          </div>
        )}

        {/* ── IMAGE / MOOD BOARD ── */}
        {selectedNode.type === 'image' && (
          <div className="space-y-5">
            <label className={labelCls}>Mood Board Image</label>
            <div className="relative group aspect-video rounded-xl border overflow-hidden flex flex-col items-center justify-center border-dashed" style={{ background: 'var(--bg-3)', borderColor: 'var(--border)' }}>
              {selectedNode.data.imageUrl
                ? <img src={selectedNode.data.imageUrl} className="w-full h-full" alt="mood" style={{
                    objectFit: selectedNode.data.imagePosition === 'fill' ? 'fill' : selectedNode.data.imagePosition === 'contain' ? 'contain' : 'cover',
                    objectPosition: ['contain', 'fill'].includes(selectedNode.data.imagePosition) ? 'center' : (selectedNode.data.imagePosition || 'center')
                  }} />
                : <div className="text-center p-4">
                    <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--fg-3)' }} />
                    <p className="text-[10px]" style={{ color: 'var(--fg-3)' }}>Click to upload</p>
                  </div>
              }
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} disabled={isUploading} />
              <div className={`absolute inset-0 bg-black/60 transition-opacity flex items-center justify-center pointer-events-none ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <div className="flex flex-col items-center gap-2">
                  {isUploading
                    ? <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    : <Upload className="w-5 h-5 text-white" />
                  }
                  <span className="text-[10px] text-white font-bold uppercase">{isUploading ? 'Magic...' : 'Upload Image'}</span>
                </div>
              </div>
            </div>
            {selectedNode.data.imageUrl && (
              <ImagePositionControl />
            )}
            <div className="space-y-1.5">
              <label className={labelCls}>Label / Notes</label>
              <textarea
                {...labelField}
                placeholder="Details about this vision..."
                className={`${textareaCls} h-24`}
              />
            </div>
          </div>
        )}

        {/* ── SHAPE ── */}
        {selectedNode.type === 'shape' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className={labelCls}>Shape Template</label>
              <select
                value={selectedNode.data.shape || 'circle'}
                onChange={(e) => handleSelect('shape', e.target.value)}
                className="w-full bg-[var(--bg-3)] border border-[var(--border)] rounded-xl py-2 px-3 text-sm text-[var(--fg)] focus:outline-none"
              >
                <option value="circle">Circle</option>
                <option value="square">Square</option>
                <option value="rectangle">Rectangle</option>
                <option value="diamond">Diamond</option>
                <option value="star">Star</option>
                <option value="arrow">Arrow</option>
                <option value="triangle">Triangle</option>
                <option value="hexagon">Hexagon</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className={labelCls}>Surface Color</label>
              <ColorPicker
                current={selectedNode.data.color || null}
                onChange={(c) => handleSelect('color', c)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className={labelCls}><Sparkles className="w-3 h-3 text-purple-400" /> Translucency</label>
                <span className="text-[10px] font-bold text-[var(--fg-2)]">{Math.round((selectedNode.data.opacity ?? 0.85) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={selectedNode.data.opacity ?? 0.85}
                onChange={(e) => handleSelect('opacity', parseFloat(e.target.value))}
                className="w-full accent-purple-500 h-1.5 bg-[var(--bg-3)] border border-[var(--border)] rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Identifier</label>
              <input type="text" {...labelField} placeholder="Name this shape..." className={inputCls} />
            </div>
          </div>
        )}

        {/* ── PLACE ── */}
        {selectedNode.type === 'place' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className={labelCls}>Location Image</label>
              <div className="relative group aspect-video rounded-xl border overflow-hidden flex flex-col items-center justify-center border-dashed" style={{ background: 'var(--bg-3)', borderColor: 'var(--border)' }}>
                {selectedNode.data.imageUrl
                  ? <img src={selectedNode.data.imageUrl} className="w-full h-full" alt="location" style={{
                      objectFit: selectedNode.data.imagePosition === 'fill' ? 'fill' : selectedNode.data.imagePosition === 'contain' ? 'contain' : 'cover',
                      objectPosition: ['contain', 'fill'].includes(selectedNode.data.imagePosition) ? 'center' : (selectedNode.data.imagePosition || 'center')
                    }} />
                  : <div className="text-center p-4">
                      <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--fg-3)' }} />
                      <p className="text-[10px]" style={{ color: 'var(--fg-3)' }}>Click to upload</p>
                    </div>
                }
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} disabled={isUploading} />
                <div className={`absolute inset-0 bg-black/60 transition-opacity flex items-center justify-center pointer-events-none ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <div className="flex flex-col items-center gap-2">
                    {isUploading
                      ? <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                      : <Upload className="w-5 h-5 text-white" />
                    }
                    <span className="text-[10px] text-white font-bold uppercase">{isUploading ? 'Uploading...' : 'Replace Space'}</span>
                  </div>
                </div>
              </div>
            </div>
            {selectedNode.data.imageUrl && (
              <ImagePositionControl />
            )}
            <div className="w-full h-px" style={{ background: 'var(--border)' }} />
            <div className="space-y-1.5">
              <label className={labelCls}>Identifier</label>
              <input type="text" {...nameField} placeholder="Name this space..." className={inputCls} />
            </div>

            {/* Backlinks */}
            <ReferencedInSection accentColor="#0891b2" />
          </div>
        )}

        {/* ── EVENT ── */}
        {selectedNode.type === 'event' && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className={labelCls}>Event Title</label>
              <input
                type="text"
                value={selectedNode.data.title || ''}
                onChange={(e) => handleSelect('title', e.target.value)}
                placeholder="Name this event..."
                className={inputCls}
              />
            </div>
            <FontSizeControl />

            {/* Backlinks */}
            <ReferencedInSection accentColor="#db2777" />
          </div>
        )}

        {/* ── CONCEPT / TERM ── */}
        {selectedNode.type === 'concept' && (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className={labelCls}><Palette className="w-3 h-3 text-amber-500" /> Accent Color</label>
              <ColorPicker
                current={selectedNode.data.color || null}
                onChange={(c) => handleSelect('color', c ?? '#d97706')}
              />
            </div>

            <div className="w-full h-px" style={{ background: 'var(--border)' }} />
            <FontSizeControl />

            <div className="space-y-1.5">
              <label className={labelCls}><Scroll className="w-3 h-3 text-amber-500" /> Name</label>
              <input type="text" {...nameField} placeholder="Name this concept..." className={inputCls} />
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Category</label>
              <input
                type="text"
                list="concept-categories"
                value={selectedNode.data.category || ''}
                onChange={(e) => handleSelect('category', e.target.value)}
                placeholder="e.g. Magic System, Faction, Religion..."
                className={inputCls}
              />
              <datalist id="concept-categories">
                <option value="Magic System" />
                <option value="Faction / Order" />
                <option value="Religion / Deity" />
                <option value="Prophecy / Legend" />
                <option value="Language / Script" />
                <option value="Custom / Ritual" />
                <option value="Law / Rule" />
                <option value="Philosophy" />
                <option value="Currency / Economy" />
                <option value="Cosmology" />
              </datalist>
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Description</label>
              <textarea
                {...descriptionField}
                rows={6}
                placeholder="Define this concept for your world..."
                className={textareaCls}
              />
            </div>

            <div className="w-full h-px" style={{ background: 'var(--border)' }} />

            {/* Backlinks */}
            <ReferencedInSection accentColor="#d97706" />
          </div>
        )}

        {/* ── ITEM / ARTIFACT ── */}
        {selectedNode.type === 'item' && (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className={labelCls}><Palette className="w-3 h-3 text-rose-500" /> Accent Color</label>
              <ColorPicker
                current={selectedNode.data.color || null}
                onChange={(c) => handleSelect('color', c ?? '#e11d48')}
              />
            </div>

            <div className="w-full h-px" style={{ background: 'var(--border)' }} />
            <FontSizeControl />

            <div className="space-y-1.5">
              <label className={labelCls}><Gem className="w-3 h-3 text-rose-500" /> Item Name</label>
              <input type="text" {...nameField} placeholder="Name this item..." className={inputCls} />
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Item Type</label>
              <input
                type="text"
                list="item-types"
                value={selectedNode.data.itemType || ''}
                onChange={(e) => handleSelect('itemType', e.target.value)}
                placeholder="e.g. Weapon, Artifact, Relic..."
                className={inputCls}
              />
              <datalist id="item-types">
                <option value="Weapon" />
                <option value="Artifact" />
                <option value="Relic" />
                <option value="Tome / Scroll" />
                <option value="Potion / Elixir" />
                <option value="Clothing / Armor" />
                <option value="Tool / Instrument" />
                <option value="Currency" />
                <option value="Vessel / Container" />
                <option value="Talisman / Charm" />
              </datalist>
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Description & Properties</label>
              <textarea
                {...descriptionField}
                rows={5}
                placeholder="What does this item do? What makes it significant?"
                className={textareaCls}
              />
            </div>

            <div className="w-full h-px" style={{ background: 'var(--border)' }} />

            <div className="space-y-1.5">
              <label className={labelCls}><User className="w-3 h-3 text-rose-500" /> Current Holder</label>
              <input
                type="text"
                value={selectedNode.data.holder || ''}
                onChange={(e) => handleSelect('holder', e.target.value)}
                placeholder="Who currently possesses this?"
                className={inputCls}
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}><MapPin className="w-3 h-3 text-rose-500" /> Last Known Location</label>
              <input
                type="text"
                value={selectedNode.data.location || ''}
                onChange={(e) => handleSelect('location', e.target.value)}
                placeholder="Where was it last seen?"
                className={inputCls}
              />
            </div>

            <div className="w-full h-px" style={{ background: 'var(--border)' }} />

            {/* Backlinks */}
            <ReferencedInSection accentColor="#e11d48" />
          </div>
        )}
      </div>

      {/* ── Layer controls row ────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-5 py-2 border-t flex items-center justify-between gap-2"
        style={{ borderColor: 'var(--border)', background: 'rgba(0,0,0,0.1)' }}
      >
        <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--fg-3)' }}>
          Layer Order
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => updateNodeZIndex(selectedNodeId!, 'front')}
            title="Bring to Front"
            className="p-1.5 rounded-lg transition-all hover:bg-purple-500/15"
            style={{ color: 'var(--fg-2)', border: '1px solid var(--border)' }}
          >
            <ChevronsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => updateNodeZIndex(selectedNodeId!, 'up')}
            title="Move Forward"
            className="p-1.5 rounded-lg transition-all hover:bg-purple-500/15"
            style={{ color: 'var(--fg-2)', border: '1px solid var(--border)' }}
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => updateNodeZIndex(selectedNodeId!, 'down')}
            title="Move Backward"
            className="p-1.5 rounded-lg transition-all hover:bg-purple-500/15"
            style={{ color: 'var(--fg-2)', border: '1px solid var(--border)' }}
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => updateNodeZIndex(selectedNodeId!, 'back')}
            title="Send to Back"
            className="p-1.5 rounded-lg transition-all hover:bg-purple-500/15"
            style={{ color: 'var(--fg-2)', border: '1px solid var(--border)' }}
          >
            <ChevronsDown className="w-3.5 h-3.5" />
          </button>
          <span className="ml-2 text-[10px] font-bold" style={{ color: 'var(--fg-3)' }}>
            z: {selectedNode.zIndex ?? 0}
          </span>
        </div>
      </div>

      {/* ── Delete footer ─────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 px-5 py-3 border-t flex items-center justify-between"
        style={{ borderColor: 'var(--border)', background: 'rgba(0,0,0,0.15)' }}
      >
        <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--fg-3)' }}>
          {selectedNode.type}
        </span>

        {deleteArmed ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-red-400">Are you sure?</span>
            <button
              onClick={() => { deleteNode(selectedNodeId!); setDeleteArmed(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500 hover:bg-red-400 text-white transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
            <button
              onClick={() => setDeleteArmed(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setDeleteArmed(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all opacity-50 hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
            style={{ color: 'var(--fg-3)' }}
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        )}
      </div>
    </motion.div>
  );
}

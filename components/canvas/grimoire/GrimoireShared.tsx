"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Type, Palette, Upload } from 'lucide-react';

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

export const labelCls = "text-xs font-extrabold text-[var(--fg-3)] uppercase tracking-widest flex items-center gap-1.5";
export const inputCls = "w-full bg-[var(--bg-3)] border border-[var(--border)] rounded-xl py-2.5 px-4 text-base focus:border-purple-500/50 focus:outline-none transition-colors placeholder:text-[var(--fg-3)] text-[var(--fg)]";
export const textareaCls = "w-full bg-[var(--bg-3)] border border-[var(--border)] rounded-xl py-2.5 px-4 text-base resize-none focus:border-purple-500/50 focus:outline-none transition-colors text-[var(--fg)] placeholder:text-[var(--fg-3)]";

export function ColorPicker({ current, onChange }: { current: string | null; onChange: (c: string | null) => void }) {
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

export function FontSizeControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className={labelCls}><Type className="w-3 h-3 text-purple-400" /> Inner Font Size</label>
        <span className="text-[10px] font-bold text-[var(--fg-2)]">{value ?? 14}px</span>
      </div>
      <input
        type="range" min="10" max="32" step="1"
        value={value ?? 14}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-purple-500 cursor-pointer h-1.5 bg-[var(--bg-3)] border border-[var(--border)] rounded-lg appearance-none"
      />
    </div>
  );
}

export function ImagePositionControl({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className={labelCls}>Image Formatting</label>
      <select
        value={value || 'center'}
        onChange={(e) => onChange(e.target.value)}
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
}

/**
 * Helper to get consistent colors for node types
 */
export const getLoreNodeColor = (type: string): string => {
  const colors: Record<string, string> = {
    character: '#a855f7', // purple
    chapter:   '#f59e0b', // amber
    place:     '#0891b2', // cyan
    event:     '#ec4899', // pink
    concept:   '#f59e0b', // amber (scroll)
    item:      '#f43f5e', // rose
    note:      '#10b981', // emerald
    image:     '#3b82f6', // blue
    shape:     '#94a3b8', // slate
  };
  return colors[type] || '#6366f1';
};

/**
 * Helper to get meaningful name from any node
 */
export const getNodeName = (node: any): string => 
  node?.data?.name || node?.data?.title || node?.data?.label || 'Unnamed';

import { useCanvasStore } from '@/store/useCanvasStore';
import { ChevronDown, Link2, Search } from 'lucide-react';
import { processMentions } from '@/lib/tagging';

interface ReferencedInSectionProps {
  nodeId: string;
  label?: string;
  filterTypes?: string[];
  relationType: string;
  targetCanvas?: 'main' | 'lore';
  sourceCanvas?: 'main' | 'lore';
}

export function ReferencedInSection({ 
  nodeId, 
  label = "Referenced in Sections", 
  filterTypes = ['chapter', 'note'],
  relationType = 'referenced_in',
  targetCanvas = 'lore', // Usually the node being edited is lore
  sourceCanvas = 'main'  // Usually linking from main canvas blocks
}: ReferencedInSectionProps) {
  const { nodes, links, addLink, removeLink, loreNodes, mainNodes } = useCanvasStore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Depending on direction, 'nodeId' could be source or target.
  // For Lore nodes (Place, Event, etc), they are usually TARGETS of links from Chapters (SOURCE).
  // For Chapters, they are usually SOURCES of links to Lore (TARGET).
  
  const isLoreNode = loreNodes.some(n => n.id === nodeId);
  
  // If editing lore, we look for links where this node is the TARGET
  // If editing main (chapter), we look for links where this node is the SOURCE
  const relevantLinks = isLoreNode 
    ? links.filter(l => l.targetId === nodeId && l.relationType === relationType)
    : links.filter(l => l.sourceId === nodeId && l.relationType === relationType);

  const isLinked = (otherId: string) => isLoreNode
    ? relevantLinks.some(l => l.sourceId === otherId)
    : relevantLinks.some(l => l.targetId === otherId);

  const toggleLink = (otherNode: any) => {
    const existing = isLoreNode
      ? relevantLinks.find(l => l.sourceId === otherNode.id)
      : relevantLinks.find(l => l.targetId === otherNode.id);

    if (existing) {
      removeLink(existing.id);
    } else {
      addLink({
        id: crypto.randomUUID(),
        sourceId: isLoreNode ? otherNode.id : nodeId,
        sourceCanvas: isLoreNode ? 'main' : sourceCanvas,
        targetId: isLoreNode ? nodeId : otherNode.id,
        targetCanvas: isLoreNode ? targetCanvas : 'lore',
        relationType,
        createdAt: Date.now(),
      });
    }
  };

  const pool = isLoreNode ? mainNodes : loreNodes;
  const filteredPool = pool.filter(n => {
    if (filterTypes.length > 0 && !filterTypes.includes(n.type || '')) return false;
    if (!search) return true;
    return getNodeName(n).toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-1.5">
      <label className={labelCls}>
        <Link2 className="w-3 h-3 text-purple-400" /> {label}
      </label>
      <button
        type="button"
        onClick={() => { setPickerOpen(o => !o); setSearch(''); }}
        className="w-full flex items-center justify-between border rounded-xl py-2 px-3 text-sm text-left transition-colors"
        style={{ background: 'var(--bg-3)', borderColor: pickerOpen ? 'rgba(109,40,217,0.5)' : 'var(--border)', color: 'var(--fg-2)' }}
      >
        <span>{relevantLinks.length === 0 ? `Link to ${filterTypes[0]}...` : `${relevantLinks.length} linked`}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${pickerOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--fg-3)' }} />
      </button>
      
      {pickerOpen && (
        <div className="border rounded-xl overflow-hidden shadow-2xl mt-1" style={{ background: 'var(--bg-2)', borderColor: 'var(--border)' }}>
          <div className="p-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
            <Search className="w-3.5 h-3.5 opacity-40" />
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search..."
              className="w-full bg-transparent text-sm focus:outline-none placeholder:opacity-40" 
              style={{ color: 'var(--fg)' }} 
              autoFocus 
            />
          </div>
          <div className="max-h-52 overflow-y-auto custom-scrollbar">
            {filteredPool.length === 0
              ? <p className="text-xs text-center py-4 px-3" style={{ color: 'var(--fg-3)' }}>No matches found.</p>
              : filteredPool.map(n => {
                  const linked = isLinked(n.id);
                  const color  = getLoreNodeColor(n.type || '');
                  return (
                    <button 
                      key={n.id} 
                      type="button" 
                      onClick={() => toggleLink(n)} 
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b last:border-0"
                      style={{ background: linked ? `${color}12` : 'transparent', borderColor: 'var(--border)', color: 'var(--fg)' }}
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-xs flex-1 font-medium truncate">{getNodeName(n)}</span>
                      {linked && <span className="text-[10px] text-purple-400 font-black flex-shrink-0">✓</span>}
                    </button>
                  );
                })
            }
          </div>
        </div>
      )}
      
      {relevantLinks.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {relevantLinks.map((link) => {
            const otherId = isLoreNode ? link.sourceId : link.targetId;
            const otherNode = pool.find(n => n.id === otherId);
            if (!otherNode) return null;
            const color = getLoreNodeColor(otherNode.type || '');
            return (
              <div 
                key={link.id} 
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold" 
                style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}
              >
                <span className="truncate max-w-[120px]">{getNodeName(otherNode)}</span>
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
  );
}

/**
 * Custom hook for debounced field updates to avoid cursor jumping and Firestore echos.
 */
export function useField(
  nodeId: string | undefined,
  storeValue: string | undefined,
  key: string,
  updateNodeData: (id: string, data: any) => void,
  options?: { maxLength?: number; maxWords?: number }
) {
  const [draft, setDraft] = useState(storeValue ?? '');

  useEffect(() => {
    setDraft(storeValue ?? '');
  }, [nodeId, key]);

  const flush = useCallback(() => {
    if (nodeId) {
      updateNodeData(nodeId, { [key]: draft });
      // Trigger @mention parsing
      if (typeof draft === 'string') {
        processMentions(nodeId, draft);
      }
    }
  }, [nodeId, key, draft, updateNodeData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let val = e.target.value;
    
    // Enforce Character Limit (only if maxWords is not set or specifically requested)
    if (options?.maxLength && !options?.maxWords && val.length > options.maxLength) {
      val = val.substring(0, options.maxLength);
    }
    
    // Enforce Word Limit
    if (options?.maxWords) {
      const words = val.trim().split(/\s+/);
      const currentWordCount = val.trim() ? words.length : 0;
      
      // We block adding new words if at limit, but allow deleting or editing existing words
      if (currentWordCount > options.maxWords) {
        // If we just added a space or character that pushed us over, revert
        const prevWords = draft.trim().split(/\s+/);
        const prevCount = draft.trim() ? prevWords.length : 0;
        
        if (currentWordCount > prevCount) {
          // Revert to prev draft to block the new word
          val = draft;
        } else {
          // They are editing existing text that was already over or at limit
          // We'll allow it as long as the word count doesn't increase further
          // This allows them to "fix" long text if they paste it in.
        }
      }
    }
    
    setDraft(val);
  };

  return { 
    value: draft, 
    onChange: handleChange, 
    onBlur: flush,
    isFull: (options?.maxWords && (draft.trim() ? draft.trim().split(/\s+/).length : 0) >= options.maxWords) || 
            (options?.maxLength && draft.length >= options.maxLength) || false,
    wordCount: draft.trim() ? draft.trim().split(/\s+/).length : 0,
    maxLength: options?.maxLength,
    maxWords: options?.maxWords
  };
}

"use client";

import React, { useState } from 'react';
import { BookOpen, Palette, Sparkles, AlertCircle, MapPin, ChevronDown, User, Users } from 'lucide-react';
import { useCanvasStore } from '@/store/useCanvasStore';
import { 
  labelCls, inputCls, textareaCls, 
  ColorPicker, FontSizeControl, useField, ReferencedInSection, WordCounter 
} from './GrimoireShared';

interface ChapterDetailsProps {
  nodeId: string;
  data: any;
  updateNodeData: (id: string, data: any) => void;
}

export function ChapterDetails({ nodeId, data, updateNodeData }: ChapterDetailsProps) {
  const { nodes } = useCanvasStore();
  const [charPickerOpen, setCharPickerOpen] = useState(false);

  const nameField          = useField(nodeId, data.name,          'name',          updateNodeData, { maxWords: 200 });
  const chapterNumField    = useField(nodeId, data.chapterNumber, 'chapterNumber', updateNodeData, { maxWords: 200 });
  const wordCountField     = useField(nodeId, data.wordCount,     'wordCount',     updateNodeData); // Numerical
  const summaryField       = useField(nodeId, data.summary,       'summary',       updateNodeData, { maxWords: 500 });
  const threadsField       = useField(nodeId, data.threads,       'threads',       updateNodeData, { maxWords: 200 });
  const worldBuildingField = useField(nodeId, data.worldBuilding, 'worldBuilding', updateNodeData, { maxWords: 200 });

  const handleSelect = (key: string, value: any) => {
    updateNodeData(nodeId, { [key]: value });
  };

  const characterNodes = nodes.filter(n => n.type === 'character');
  const selectedChars: string[] = data.appearances || [];
  const toggleChar = (charId: string) => {
    const next = selectedChars.includes(charId) ? selectedChars.filter(id => id !== charId) : [...selectedChars, charId];
    handleSelect('appearances', next);
  };

  return (
    <>
      <div className="space-y-2">
        <label className={labelCls}><Palette className="w-3 h-3 text-amber-500" /> Accent Color</label>
        <ColorPicker current={data.noteColor || null} onChange={(c) => handleSelect('noteColor', c)} />
      </div>

      <div className="w-full h-px" style={{ background: 'var(--border)' }} />
      <FontSizeControl value={data.fontSize} onChange={(v) => handleSelect('fontSize', v)} />

      <div className="space-y-1.5">
        <label className={labelCls}>Chapter Title</label>
        <input type="text" {...nameField.props} placeholder="Chapter name..." className={inputCls} />
        <WordCounter count={nameField.meta.wordCount} limit={200} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={labelCls}>Chapter #</label>
          <input type="text" {...chapterNumField.props} placeholder="1" className={inputCls} />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Length (Est)</label>
          <input type="number" {...wordCountField.props} placeholder="0" className={inputCls} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}>Chapter Summary</label>
        <textarea {...summaryField.props} rows={4} className={`${textareaCls} italic`} placeholder="Brief summary of the chapter..." />
        <WordCounter count={summaryField.meta.wordCount} limit={500} />
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}><Users className="w-3 h-3 text-amber-500" /> Cast Appearances</label>
        <button
          type="button"
          onClick={() => setCharPickerOpen(o => !o)}
          className="w-full flex items-center justify-between border rounded-xl py-2 px-3 text-sm text-left transition-colors"
          style={{ background: 'var(--bg-3)', borderColor: 'var(--border)', color: 'var(--fg-2)' }}
        >
          <span>{selectedChars.length === 0 ? 'Select characters...' : `${selectedChars.length} selected`}</span>
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
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b last:border-0 ${isSelected ? 'bg-amber-500/10' : ''}`}
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


      <div className="space-y-1.5">
        <label className={labelCls}><AlertCircle className="w-3 h-3 text-rose-500" /> Pending Hooks</label>
        <textarea {...threadsField.props} rows={3} className={textareaCls} placeholder="Unresolved plot threads, mysteries..." />
        <WordCounter count={threadsField.meta.wordCount} limit={200} />
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}><MapPin className="w-3 h-3 text-cyan-500" /> World Building Elements</label>
        <textarea {...worldBuildingField.props} rows={3} className={textareaCls} placeholder="Lore, locations, magic systems..." />
        <WordCounter count={worldBuildingField.meta.wordCount} limit={200} />
      </div>

      <div className="w-full h-px" style={{ background: 'var(--border)' }} />
      <ReferencedInSection 
        nodeId={nodeId} 
        label="Linked Lore" 
        filterTypes={['place', 'event', 'concept', 'item', 'note', 'image']} 
        relationType="referenced_in"
        targetCanvas="lore" 
      />
    </>
  );
}

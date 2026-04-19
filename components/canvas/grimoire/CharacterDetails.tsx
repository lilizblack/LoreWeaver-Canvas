"use client";

import React, { useState } from 'react';
import { Smile, Zap, TrendingUp, Heart, Upload, User } from 'lucide-react';
import { useWorldStore, CharacterThread } from '@/store/useWorldStore';
import { 
  CHARACTER_ROLES, 
  RELATIONSHIP_CATEGORIES, 
  getRelationshipColor,
  getRelationshipCategory
} from '@/lib/relationshipTypes';
import { 
  labelCls, inputCls, textareaCls, 
  ColorPicker, FontSizeControl, ImagePositionControl, useField, ReferencedInSection, WordCounter 
} from './GrimoireShared';

interface CharacterDetailsProps {
  nodeId: string;
  data: any;
  updateNodeData: (id: string, data: any) => void;
  isUploading: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CharacterDetails({ nodeId, data, updateNodeData, isUploading, onImageUpload }: CharacterDetailsProps) {
  const allCharacters = useWorldStore((state) => state.characters);
  const [relFormOpen, setRelFormOpen] = useState(false);
  const [relTargetId, setRelTargetId] = useState('');
  const [relType, setRelType] = useState('');

  const nameField        = useField(nodeId, data.name,        'name',        updateNodeData, { maxWords: 200 });
  const ageField         = useField(nodeId, data.age,         'age',         updateNodeData, { maxWords: 200 });
  const personalityField = useField(nodeId, data.personality, 'personality', updateNodeData, { maxWords: 200 });
  const appearanceField  = useField(nodeId, data.appearance,  'appearance',  updateNodeData, { maxWords: 200 });
  const growthField      = useField(nodeId, data.growth,      'growth',      updateNodeData, { maxWords: 200 });

  const handleSelect = (key: string, value: any) => {
    updateNodeData(nodeId, { [key]: value });
  };

  const threads: CharacterThread[] = data.threads || [];
  const thisCharId = data.characterId;
  const otherChars = Object.values(allCharacters).filter(c => c.id !== thisCharId);

  const addThread = () => {
    if (!relTargetId || !relType.trim()) return;
    if (threads.some(t => t.targetCharacterID === relTargetId)) return;
    const next = [...threads, { 
      targetCharacterID: relTargetId, 
      hexColor: getRelationshipColor(relType.trim()),
      relationType: relType.trim() 
    }];
    handleSelect('threads', next);
    setRelTargetId('');
    setRelType('');
    setRelFormOpen(false);
  };

  const removeThread = (targetId: string) => {
    handleSelect('threads', threads.filter(t => t.targetCharacterID !== targetId));
  };

  return (
    <>
      <div className="space-y-2">
        <label className={labelCls}>Portrait & Theme</label>
        <div className="relative group aspect-square rounded-xl border overflow-hidden flex flex-col items-center justify-center border-dashed" style={{ background: 'var(--bg-3)', borderColor: 'var(--border)' }}>
          {data.imageUrl
            ? <img src={data.imageUrl} className="w-full h-full" alt="portrait" style={{
                objectFit: data.imagePosition === 'fill' ? 'fill' : data.imagePosition === 'contain' ? 'contain' : 'cover',
                objectPosition: ['contain', 'fill'].includes(data.imagePosition) ? 'center' : (data.imagePosition || 'center')
              }} />
            : <div className="text-center p-4">
                <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--fg-3)' }} />
                <p className="text-[10px]" style={{ color: 'var(--fg-3)' }}>Upload PNG or JPG</p>
              </div>
          }
          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={onImageUpload} disabled={isUploading} />
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
        {data.imageUrl && (
          <div className="pt-2">
            <ImagePositionControl value={data.imagePosition} onChange={(v) => handleSelect('imagePosition', v)} />
          </div>
        )}
        <div className="pt-2">
          <ColorPicker current={data.color || null} onChange={(c) => handleSelect('color', c)} />
        </div>
      </div>

      <div className="w-full h-px" style={{ background: 'var(--border)' }} />

      <div className="space-y-1.5">
        <label className={labelCls}>True Name</label>
        <input type="text" {...nameField.props} placeholder="Character name..." className={inputCls} />
        <WordCounter count={nameField.meta.wordCount} limit={200} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <label className={labelCls}>Age</label>
          <input type="text" {...ageField.props} className={inputCls} />
          <WordCounter count={ageField.meta.wordCount} limit={200} />
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Sex</label>
          <select
            value={data.sex || ''}
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
            value={data.characterType || 'Protagonist'}
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
      <FontSizeControl value={data.fontSize} onChange={(v) => handleSelect('fontSize', v)} />

      <div className="space-y-1.5">
        <label className={labelCls}><Smile className="w-3 h-3 text-purple-400" /> Personality</label>
        <textarea {...personalityField.props} rows={3} className={textareaCls} />
        <WordCounter count={personalityField.meta.wordCount} limit={200} />
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}><Zap className="w-3 h-3 text-purple-400" /> Appearance</label>
        <textarea {...appearanceField.props} rows={3} className={textareaCls} />
        <WordCounter count={appearanceField.meta.wordCount} limit={200} />
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}><TrendingUp className="w-3 h-3 text-purple-400" /> Character Growth</label>
        <textarea {...growthField.props} rows={3} className={textareaCls} />
        <WordCounter count={growthField.meta.wordCount} limit={200} />
      </div>

      <div className="w-full h-px" style={{ background: 'var(--border)' }} />
      <ReferencedInSection nodeId={nodeId} label="Featured in Chapters" filterTypes={['chapter']} relationType="mentions" />

      <div className="w-full h-px" style={{ background: 'var(--border)' }} />

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
              onClick={addThread}
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

        {threads.length === 0 && !relFormOpen && (
          <p className="text-xs italic" style={{ color: 'var(--fg-3)' }}>No relationships recorded yet.</p>
        )}
        {threads.map(thread => {
          const relChar = allCharacters[thread.targetCharacterID];
          if (!relChar) return null;
          const relColor = thread.hexColor;
          return (
            <div
              key={thread.targetCharacterID}
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
                    {thread.relationType}
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeThread(thread.targetCharacterID)}
                className="text-xs font-black opacity-40 hover:opacity-100 transition-opacity flex-shrink-0 p-1"
                style={{ color: 'var(--fg)' }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

"use client";

import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import { BookOpen, Sparkles, AlertCircle, User, MapPin } from 'lucide-react';
import { useCanvasStore } from '@/store/useCanvasStore';

export const ChapterNode = memo(({ data, selected }: NodeProps) => {
  const nodes = useCanvasStore(s => s.nodes);
  const appearances: string[] = data.appearances || [];
  const taggedChars = appearances
    .map(id => nodes.find(n => n.id === id))
    .filter(Boolean) as any[];

  const accentColor = data.noteColor || '#f59e0b'; // default amber

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 16,
      borderWidth: 2,
      borderStyle: 'solid',
      overflow: 'hidden',
      borderColor: selected ? accentColor : accentColor + '30',
      background: 'var(--card-bg)',
      boxShadow: selected ? `0 0 30px ${accentColor}44` : 'var(--node-shadow)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    }}>
      <NodeResizer
        minWidth={260}
        minHeight={180}
        isVisible={selected}
        lineStyle={{ borderColor: accentColor }}
        handleClassName="!w-3 !h-3 !rounded-full !border-2 !border-zinc-900"
        handleStyle={{ background: accentColor }}
      />
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !border-2 !border-zinc-900" style={{ background: accentColor }} />
      <Handle type="target" position={Position.Left} id="left-target" className="!w-3 !h-3 !border-2 !border-zinc-900" style={{ background: accentColor }} />

      {/* Color accent strip */}
      <div style={{ height: 4, background: accentColor, flexShrink: 0 }} />

      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: accentColor + '08' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: accentColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookOpen style={{ width: 16, height: 16, color: accentColor }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h4 style={{ fontSize: (data.fontSize || 16) + 2, fontFamily: 'serif', fontWeight: 700, color: 'var(--fg)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {data.name || 'Untitled Chapter'}
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: (data.fontSize || 16) - 5, color: 'var(--fg-3)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' }}>Chronicle</span>
              {data.wordCount && (
                <>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--fg-3)', flexShrink: 0 }} />
                  <span style={{ fontSize: (data.fontSize || 16) - 5, color: accentColor, fontWeight: 700 }}>{Number(data.wordCount).toLocaleString()} words</span>
                </>
              )}
            </div>
          </div>
        </div>
        {data.chapterNumber && (
          <div style={{ flexShrink: 0, textAlign: 'center', marginLeft: 8 }}>
            <div style={{ fontSize: 9, color: accentColor + '80', fontWeight: 900, textTransform: 'uppercase' }}>Ch.</div>
            <div style={{ fontSize: (data.fontSize || 16) + 4, fontFamily: 'serif', fontWeight: 900, color: accentColor, lineHeight: 1 }}>{data.chapterNumber}</div>
          </div>
        )}
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
        {/* Summary */}
        <div>
          <p style={{ fontSize: (data.fontSize || 16) - 6, color: 'var(--fg-3)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4 }}>Summary</p>
          <p style={{ fontSize: data.fontSize || 14, color: 'var(--fg-2)', fontStyle: 'italic', lineHeight: 1.6, wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            &ldquo;{data.summary || 'A blank page in history...'}&rdquo;
          </p>
        </div>

        {/* Appearances */}
        {taggedChars.length > 0 && (
          <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: (data.fontSize || 16) - 6, color: 'var(--fg-3)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 6 }}>Appearances</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {taggedChars.map((c) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: 'var(--bg-2)', border: `1px solid var(--border)` }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                    {c.data.imageUrl
                      ? <img src={c.data.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', background: accentColor + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User style={{ width: 8, height: 8, color: accentColor }} /></div>
                    }
                  </div>
                  <span style={{ fontSize: 9, color: 'var(--fg-2)', fontWeight: 600 }}>{c.data.name || 'Unnamed'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Threads/World-building Icons */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {data.threads && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: 'var(--bg-2)', fontSize: 9, color: '#fb7185', fontWeight: 700, border: `1px solid var(--border)` }}>
              <AlertCircle style={{ width: 10, height: 10 }} /> Unresolved
            </div>
          )}
          {data.worldBuilding && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, background: 'var(--bg-2)', fontSize: 9, color: '#06b6d4', fontWeight: 700, border: `1px solid var(--border)` }}>
              <MapPin style={{ width: 10, height: 10 }} /> Lore
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="right-source" className="!w-3 !h-3 !border-2 !border-zinc-900" style={{ background: accentColor }} />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !border-2 !border-zinc-900" style={{ background: accentColor }} />
    </div>
  );
});

ChapterNode.displayName = 'ChapterNode';

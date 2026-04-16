"use client";

import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import { StickyNote } from 'lucide-react';

export const NoteNode = memo(({ data, selected }: NodeProps) => {
  const noteColor = data.noteColor || null;
  // Derive theme-aware bg from custom color or use CSS var
  const accentStyle = noteColor
    ? { borderColor: noteColor + '60', boxShadow: selected ? `0 0 20px ${noteColor}44` : undefined }
    : {};

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'solid',
        overflow: 'hidden',
        borderColor: selected
          ? (noteColor || 'var(--accent)')
          : (noteColor ? noteColor + '40' : 'var(--border)'),
        background: noteColor ? noteColor + '12' : 'var(--card-bg)',
        boxShadow: selected
          ? `0 0 20px ${noteColor || 'var(--accent)'}44`
          : 'var(--node-shadow)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      <NodeResizer
        minWidth={180}
        minHeight={100}
        isVisible={selected}
        lineStyle={{ borderColor: noteColor || 'var(--accent)' }}
        handleClassName="!w-3 !h-3 !rounded-full !border-2 !border-zinc-900"
        handleStyle={{ background: noteColor || 'var(--accent)' }}
      />
      <Handle 
        type="target" 
        position={Position.Top}    
        className="!w-2 !h-2 !border-2 !border-zinc-900" 
        style={{ background: noteColor || 'var(--accent)' }}
      />
      <Handle 
        type="target" 
        position={Position.Left}    
        id="left-target"
        className="!w-2 !h-2 !border-2 !border-zinc-900" 
        style={{ background: noteColor || 'var(--accent)' }}
      />

      {/* Header strip with note color accent */}
      {noteColor && (
        <div style={{ height: 4, background: noteColor, flexShrink: 0 }} />
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 14px', minHeight: 0 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <StickyNote
            style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2, color: noteColor || 'var(--accent)' }}
          />
          <div style={{ minWidth: 0, width: '100%' }}>
            <p style={{
              fontSize: data.fontSize || 14,
              color: 'var(--fg)',
              lineHeight: 1.6,
              fontWeight: 500,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              margin: 0,
            }}>
              {data.content || 'Important lore fragment...'}
            </p>
            <p style={{ 
              fontSize: (data.fontSize || 14) - 4, 
              color: 'var(--fg-3)', 
              textTransform: 'uppercase', 
              fontWeight: 700, 
              letterSpacing: '0.1em', 
              marginTop: 8 
            }}>
              Note Fragment
            </p>
          </div>
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        id="right-source"
        className="!w-2 !h-2 !border-2 !border-zinc-900" 
        style={{ background: noteColor || 'var(--accent)' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-2 !h-2 !border-2 !border-zinc-900" 
        style={{ background: noteColor || 'var(--accent)' }}
      />
    </div>
  );
});

NoteNode.displayName = 'NoteNode';

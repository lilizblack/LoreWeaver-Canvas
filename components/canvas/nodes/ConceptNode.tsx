"use client";

import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import { Scroll } from 'lucide-react';
import { useCanvasStore } from '@/store/useCanvasStore';

export const ConceptNode = memo(({ data, selected, id }: NodeProps) => {
  const { updateNodeData } = useCanvasStore();
  const accentColor = data.color || '#d97706'; // amber default

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
        minWidth={220}
        minHeight={160}
        isVisible={selected}
        lineStyle={{ borderColor: accentColor }}
        handleClassName="!w-3 !h-3 !rounded-full !border-2 !border-zinc-900"
        handleStyle={{ background: accentColor }}
      />
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !border-2 !border-zinc-900" style={{ background: accentColor }} />
      <Handle type="target" position={Position.Left} id="left-target" className="!w-3 !h-3 !border-2 !border-zinc-900" style={{ background: accentColor }} />

      {/* Color strip */}
      <div style={{ height: 4, background: accentColor, flexShrink: 0 }} />

      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: accentColor + '08',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: accentColor + '20',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Scroll style={{ width: 15, height: 15, color: accentColor }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 9, color: accentColor + '90', fontWeight: 900,
            textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 1
          }}>
            {data.category || 'Lore Concept'}
          </div>
          <div style={{
            fontSize: (data.fontSize || 14) + 2,
            fontFamily: 'serif', fontWeight: 700,
            color: 'var(--fg)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {data.name || 'Unnamed Concept'}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{
        flex: 1, overflow: 'hidden',
        padding: '10px 14px',
        fontSize: data.fontSize || 13,
        color: 'var(--fg-2)',
        lineHeight: 1.6,
        display: '-webkit-box',
        WebkitLineClamp: 10, // Increased to show more of those 300 words
        WebkitBoxOrient: 'vertical',
      }}>
        {data.details || <span style={{ color: 'var(--fg-3)', fontStyle: 'italic' }}>No technical details yet...</span>}
      </div>

      <Handle type="source" position={Position.Right} id="right-source" className="!w-3 !h-3 !border-2 !border-zinc-900" style={{ background: accentColor }} />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !border-2 !border-zinc-900" style={{ background: accentColor }} />
    </div>
  );
});

ConceptNode.displayName = 'ConceptNode';

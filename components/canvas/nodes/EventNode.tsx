"use client";

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Calendar, Clock } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { useCanvasStore } from '@/store/useCanvasStore';

export const EventNode = memo(({ data, selected, id }: NodeProps) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { updateNodeData } = useCanvasStore();

  return (
    <div className={`relative transition-all duration-300 ${selected ? 'scale-102' : ''}`}>
      {/* Glow */}
      <div className={`absolute -inset-1 rounded-xl blur transition-all duration-500 ${
        selected ? 'opacity-40 bg-pink-500' : 'opacity-0 bg-pink-500'
      }`} />

      <div
        className="relative w-80 rounded-xl border-2 shadow-xl overflow-hidden"
        style={{
          background: isDark ? 'rgba(24, 24, 27, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: selected ? '#db2777' : 'var(--border-2)',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* Color Bar */}
        <div className="h-1.5 w-full bg-pink-500" />

        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20">
              <Calendar className="w-4 h-4 text-pink-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500/70">Timeline Event</span>
          </div>

          <input
            type="text"
            value={data.title || ''}
            onChange={(e) => updateNodeData(id, { title: e.target.value })}
            className="bg-transparent border-none p-0 text-xl font-bold focus:ring-0 w-full mb-3 nodrag"
            style={{ color: 'var(--fg)', fontFamily: 'serif' }}
            placeholder="Event Title..."
          />

          <textarea
            value={data.content || ''}
            onChange={(e) => updateNodeData(id, { content: e.target.value })}
            className="bg-transparent border-none p-0 text-xs resize-none focus:ring-0 leading-relaxed min-h-[100px] w-full nodrag"
            style={{ color: 'var(--fg-2)' }}
            placeholder="Describe the historical ripples of this moment..."
          />

          <div className="mt-4 pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-500 uppercase">
              <Clock className="w-3 h-3" />
              <span>Temporal Node</span>
            </div>
            {data.linkedPlace && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 font-bold border border-cyan-500/20">
                @ {data.linkedPlace}
              </span>
            )}
          </div>
        </div>
      </div>

      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-pink-500 !border-2 !border-slate-900" />
      <Handle type="target" position={Position.Left} id="left-target" className="!w-3 !h-3 !bg-pink-500 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} id="right-source" className="!w-3 !h-3 !bg-pink-500 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-pink-500 !border-2 !border-slate-900" />
    </div>
  );
});

EventNode.displayName = 'EventNode';

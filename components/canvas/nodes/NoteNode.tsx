"use client";

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { StickyNote } from 'lucide-react';

export const NoteNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
      selected 
        ? 'border-emerald-500 bg-zinc-900 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-105 z-50' 
        : 'border-white/5 bg-zinc-900/95 shadow-xl'
    } min-w-[200px] max-w-[300px]`}>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-emerald-500 !border-2 !border-zinc-900" />
      
      <div className="flex items-start gap-3">
        <StickyNote className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm text-zinc-200 leading-relaxed font-medium">
            {data.content || 'Important lore fragment...'}
          </p>
          <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest pt-2">
            Thought Fragment
          </p>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-emerald-500 !border-2 !border-zinc-900" />
    </div>
  );
});

NoteNode.displayName = 'NoteNode';

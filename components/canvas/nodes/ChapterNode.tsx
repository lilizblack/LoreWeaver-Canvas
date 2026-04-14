"use client";

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { BookOpen, Sparkles, AlertCircle } from 'lucide-react';

export const ChapterNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div className={`p-0 rounded-2xl border-2 transition-all duration-500 overflow-hidden ${
      selected 
        ? 'border-amber-500 bg-zinc-900 shadow-[0_0_40px_rgba(245,158,11,0.4)] scale-105 z-50' 
        : 'border-white/5 bg-zinc-900/90'
    } min-w-[280px]`}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-amber-500 !border-2 !border-zinc-900" />
      
      {/* Chapter Title Section */}
      <div className="bg-amber-500/10 p-4 border-b border-white/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-lg font-serif font-bold text-white tracking-wide leading-tight">
            {data.name || 'Untitled Chapter'}
          </h4>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Chronicle</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary visible on canvas */}
        <div className="space-y-1">
          <p className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Chronicle Summary</p>
          <p className="text-sm text-zinc-300 leading-relaxed italic">
            "{data.summary || 'A blank page in history...'}"
          </p>
        </div>

        {/* Beats & Threads summary icons */}
        <div className="flex gap-2 pt-2 border-t border-white/5">
          {data.beats && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 text-[10px] text-amber-400 font-bold border border-white/5">
              <Sparkles className="w-3 h-3" />
              Beats
            </div>
          )}
          {data.threads && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 text-[10px] text-rose-400 font-bold border border-white/5">
              <AlertCircle className="w-3 h-3" />
              Unresolved
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-amber-500 !border-2 !border-zinc-900" />
    </div>
  );
});

ChapterNode.displayName = 'ChapterNode';

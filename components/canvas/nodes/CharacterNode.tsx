"use client";

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { User, ShieldCheck, Ghost } from 'lucide-react';

export const CharacterNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div className={`p-0 rounded-2xl border-2 transition-all duration-500 overflow-hidden ${
      selected 
        ? 'border-purple-500 bg-zinc-900 shadow-[0_0_40px_rgba(147,51,234,0.4)] scale-105 z-50' 
        : 'border-white/5 bg-zinc-900/90'
    } min-w-[240px] group`}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-purple-500 !border-2 !border-zinc-900" />
      
      {/* Character Image Header */}
      <div className="h-32 w-full bg-zinc-800 relative overflow-hidden">
        {data.imageUrl ? (
          <img src={data.imageUrl} alt={data.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-900/20 to-zinc-900">
            <User className="w-10 h-10 text-zinc-700 mb-2" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">No Portrait</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
        <div className="absolute bottom-3 left-4">
          <h4 className="text-lg font-serif font-bold text-white mb-0.5">{data.name || 'Anonymous'}</h4>
          <p className="text-xs text-purple-400/80 font-medium uppercase tracking-wider">{data.characterType || 'Folk'}</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/5 rounded-lg p-2 border border-white/5">
            <p className="text-[8px] text-zinc-500 uppercase font-bold tracking-tighter">Age</p>
            <p className="text-xs text-zinc-300">{data.age || '—'}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2 border border-white/5">
            <p className="text-[8px] text-zinc-500 uppercase font-bold tracking-tighter">Physical</p>
            <p className="text-xs text-zinc-300 truncate">{data.appearance || '—'}</p>
          </div>
        </div>

        {data.personality && (
          <div className="bg-white/5 rounded-lg p-2 border border-white/5">
            <p className="text-[8px] text-zinc-500 uppercase font-bold tracking-tighter">Personality</p>
            <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">{data.personality}</p>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-purple-500 !border-2 !border-zinc-900" />
    </div>
  );
});

CharacterNode.displayName = 'CharacterNode';

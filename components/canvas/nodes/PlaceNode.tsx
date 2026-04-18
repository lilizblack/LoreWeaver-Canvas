"use client";

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MapPin } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { useCanvasStore } from '@/store/useCanvasStore';

export const PlaceNode = memo(({ data, selected, id }: NodeProps) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { updateNodeData } = useCanvasStore();
  const [imgError, setImgError] = React.useState(false);

  // Reset image error state when imageUrl changes
  React.useEffect(() => {
    setImgError(false);
  }, [data.imageUrl]);

  return (
    <div className={`relative group transition-all duration-300 ${selected ? 'scale-105' : ''}`}>
      {/* Glow Effect */}
      <div className={`absolute -inset-1 rounded-2xl blur-lg transition-opacity duration-500 ${
        selected ? 'opacity-40 bg-cyan-500' : 'opacity-0 group-hover:opacity-20 bg-cyan-500'
      }`} />

      {/* Main Card */}
      <div
        className="relative w-64 rounded-2xl overflow-hidden border-2 shadow-2xl transition-all"
        style={{
          background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: selected ? '#0891b2' : 'var(--border-2)',
          backdropFilter: 'blur(12px)'
        }}
      >
        {/* Header/Image Area */}
        <div className="relative h-32 bg-zinc-800/50 flex items-center justify-center overflow-hidden">
          {data.imageUrl && !imgError ? (
            <img
              src={data.imageUrl}
              alt={data.name}
              onError={() => setImgError(true)}
              className="w-full h-full"
              style={{
                objectFit: data.imagePosition === 'fill' ? 'fill' : data.imagePosition === 'contain' ? 'contain' : 'cover',
                objectPosition: ['contain', 'fill'].includes(data.imagePosition) ? 'center' : (data.imagePosition || 'center')
              }}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-500">
              <MapPin className="w-10 h-10 opacity-20" />
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-50">Discovery Required</span>
            </div>
          )}

          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-[10px] font-bold text-cyan-400 uppercase tracking-tighter">
            Place
          </div>
        </div>

        {/* Info Area */}
        <div className="p-4 flex flex-col gap-2">
          <input
            type="text"
            value={data.name || ''}
            onChange={(e) => updateNodeData(id, { name: e.target.value })}
            className="bg-transparent border-none p-0 text-lg font-bold focus:ring-0 w-full nodrag"
            style={{ color: 'var(--fg)', fontFamily: 'serif' }}
            placeholder="Name this location..."
          />

          <textarea
            value={data.description || ''}
            onChange={(e) => updateNodeData(id, { description: e.target.value })}
            className="bg-transparent border-none p-0 text-xs resize-none focus:ring-0 leading-relaxed min-h-[60px] nodrag"
            style={{ color: 'var(--fg-2)' }}
            placeholder="What secrets does this place hold?"
          />
        </div>

        {/* Decorative footer */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Left} id="left" className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-slate-900" />
      <Handle type="source" position={Position.Right} id="right" className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-slate-900" />
    </div>
  );
});

PlaceNode.displayName = 'PlaceNode';

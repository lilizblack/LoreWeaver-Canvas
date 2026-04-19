"use client";

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Image as ImageIcon, FileText, Download } from 'lucide-react';

export const MediaNode = memo(({ data, selected }: NodeProps) => {
  const isImage = data.fileType?.startsWith('image/');
  
  return (
    <div className={`rounded-xl overflow-hidden border-2 transition-all duration-300 ${
      selected 
        ? 'shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
        : ''
    } min-w-[150px]`}
    style={{
      borderColor: selected ? (data.color || 'var(--accent)') : 'var(--border)',
      background: 'var(--card-bg)',
      boxShadow: selected ? `0 0 20px ${data.color || 'var(--accent)'}44` : 'var(--node-shadow)',
    }}>
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-2 !h-2 !border-2 !border-zinc-900" 
        style={{ background: data.color || 'var(--accent)' }}
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        id="left-target"
        className="!w-2 !h-2 !border-2 !border-zinc-900" 
        style={{ background: data.color || 'var(--accent)' }}
      />
      
      {(isImage || data.imageUrl) && (data.url || data.imageUrl) ? (
        <div className="relative group">
          <img 
            src={data.url || data.imageUrl} 
            alt={data.label} 
            className="w-full h-32 opacity-90 group-hover:opacity-100 transition-opacity" 
            style={{
              objectFit: data.imagePosition === 'fill' ? 'fill' : data.imagePosition === 'contain' ? 'contain' : 'cover',
              objectPosition: ['contain', 'fill'].includes(data.imagePosition) ? 'center' : (data.imagePosition || 'center')
            }}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <Download className="w-5 h-5 text-white" />
          </div>
        </div>
      ) : (
        <div className="h-32 flex flex-col items-center justify-center bg-white/5 text-zinc-500 gap-2" style={{ background: 'var(--bg-2)' }}>
          {data.fileType?.includes('pdf') ? <FileText className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
          <span style={{ fontSize: (data.fontSize || 14) - 4, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{data.extension || 'FILE'}</span>
        </div>
      )}

      <div className="p-3">
        <h4 className="font-semibold truncate" style={{ fontSize: data.fontSize || 12, color: 'var(--fg)' }}>{data.label || 'Attached Media'}</h4>
        <p className="mt-1 uppercase tracking-wider" style={{ fontSize: (data.fontSize || 12) - 3, color: 'var(--fg-3)' }}>
          {data.size ? `${(data.size / 1024).toFixed(1)} KB` : 'Embedded Element'}
        </p>
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        id="right-source"
        className="!w-2 !h-2 !border-2 !border-zinc-900" 
        style={{ background: data.color || 'var(--accent)' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-2 !h-2 !border-2 !border-zinc-900" 
        style={{ background: data.color || 'var(--accent)' }}
      />
    </div>
  );
});

MediaNode.displayName = 'MediaNode';

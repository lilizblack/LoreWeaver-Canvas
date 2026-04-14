"use client";

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Image as ImageIcon, FileText, Download } from 'lucide-react';

export const MediaNode = memo(({ data, selected }: NodeProps) => {
  const isImage = data.fileType?.startsWith('image/');
  
  return (
    <div className={`rounded-xl overflow-hidden border-2 transition-all duration-300 ${
      selected 
        ? 'border-blue-500 bg-zinc-900 shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-105' 
        : 'border-white/10 bg-zinc-900/90'
    } min-w-[150px]`}>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-blue-500" />
      
      {isImage && data.url ? (
        <div className="relative group">
          <img 
            src={data.url} 
            alt={data.label} 
            className="w-full h-32 object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <Download className="w-5 h-5 text-white" />
          </div>
        </div>
      ) : (
        <div className="h-32 flex flex-col items-center justify-center bg-white/5 text-zinc-500 gap-2">
          {data.fileType?.includes('pdf') ? <FileText className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
          <span className="text-[10px] uppercase font-bold tracking-widest">{data.extension || 'FILE'}</span>
        </div>
      )}

      <div className="p-3">
        <h4 className="text-xs font-semibold text-zinc-200 truncate">{data.label || 'Attached Media'}</h4>
        <p className="text-[9px] text-zinc-500 mt-1 uppercase tracking-wider">
          {data.size ? `${(data.size / 1024).toFixed(1)} KB` : 'Embedded Element'}
        </p>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-blue-500" />
    </div>
  );
});

MediaNode.displayName = 'MediaNode';

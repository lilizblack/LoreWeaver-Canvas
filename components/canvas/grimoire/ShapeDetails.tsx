"use client";

import React from 'react';
import { Palette, Sparkles } from 'lucide-react';
import { 
  labelCls, inputCls, 
  ColorPicker, useField 
} from './GrimoireShared';

interface ShapeDetailsProps {
  nodeId: string;
  data: any;
  updateNodeData: (id: string, data: any) => void;
}

export function ShapeDetails({ nodeId, data, updateNodeData }: ShapeDetailsProps) {
  const labelField = useField(nodeId, data.label, 'label', updateNodeData, { maxWords: 200 });

  const handleSelect = (key: string, value: any) => {
    updateNodeData(nodeId, { [key]: value });
  };

  return (
    <>
      <div className="space-y-2">
        <label className={labelCls}>Shape Template</label>
        <select
          value={data.shape || 'circle'}
          onChange={(e) => handleSelect('shape', e.target.value)}
          className="w-full bg-[var(--bg-3)] border border-[var(--border)] rounded-xl py-2 px-3 text-sm text-[var(--fg)] focus:outline-none"
        >
          <option value="circle">Circle</option>
          <option value="square">Square</option>
          <option value="rectangle">Rectangle</option>
          <option value="diamond">Diamond</option>
          <option value="star">Star</option>
          <option value="arrow">Arrow</option>
          <option value="triangle">Triangle</option>
          <option value="hexagon">Hexagon</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className={labelCls}>Surface Color</label>
        <ColorPicker current={data.color || null} onChange={(c) => handleSelect('color', c)} />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className={labelCls}><Sparkles className="w-3 h-3 text-purple-400" /> Translucency</label>
          <span className="text-[10px] font-bold text-[var(--fg-2)]">{Math.round((data.opacity ?? 0.85) * 100)}%</span>
        </div>
        <input
          type="range" min="0.1" max="1" step="0.05"
          value={data.opacity ?? 0.85}
          onChange={(e) => handleSelect('opacity', parseFloat(e.target.value))}
          className="w-full accent-purple-500 h-1.5 bg-[var(--bg-3)] border border-[var(--border)] rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}>Identifier</label>
        <input type="text" {...labelField} placeholder="Name this shape..." className={inputCls} />
      </div>
    </>
  );
}

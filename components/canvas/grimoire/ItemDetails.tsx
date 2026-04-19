"use client";

import React from 'react';
import { Palette } from 'lucide-react';
import { 
  labelCls, inputCls, textareaCls, 
  ColorPicker, FontSizeControl, useField, ReferencedInSection, WordCounter 
} from './GrimoireShared';

interface ItemDetailsProps {
  nodeId: string;
  data: any;
  updateNodeData: (id: string, data: any) => void;
}

export function ItemDetails({ nodeId, data, updateNodeData }: ItemDetailsProps) {
  const nameField = useField(nodeId, data.name, 'name', updateNodeData, { maxWords: 200 });
  const attrField = useField(nodeId, data.attributes, 'attributes', updateNodeData, { maxWords: 200 });

  const handleSelect = (key: string, value: any) => {
    updateNodeData(nodeId, { [key]: value });
  };

  return (
    <>
      <div className="space-y-2">
        <label className={labelCls}><Palette className="w-3 h-3 text-rose-500" /> Accent Color</label>
        <ColorPicker current={data.noteColor || null} onChange={(c) => handleSelect('noteColor', c)} />
      </div>

      <div className="w-full h-px" style={{ background: 'var(--border)' }} />
      <FontSizeControl value={data.fontSize} onChange={(v) => handleSelect('fontSize', v)} />

      <div className="space-y-1.5">
        <label className={labelCls}>Item Name</label>
        <input type="text" {...nameField.props} placeholder="Artifact, gear, object..." className={inputCls} />
        <WordCounter count={nameField.meta.wordCount} limit={200} />
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}>Attributes & History</label>
        <textarea {...attrField.props} rows={8} className={textareaCls} placeholder="Weight, materials, legend..." />
        <WordCounter count={attrField.meta.wordCount} limit={200} />
      </div>

      <div className="w-full h-px" style={{ background: 'var(--border)' }} />
      <ReferencedInSection nodeId={nodeId} label="Featured in Chapters" filterTypes={['chapter']} relationType="referenced_in" />
    </>
  );
}

"use client";

import React from 'react';
import { Palette } from 'lucide-react';
import { 
  labelCls, inputCls, textareaCls, 
  ColorPicker, FontSizeControl, useField, ReferencedInSection, WordCounter 
} from './GrimoireShared';

interface ConceptDetailsProps {
  nodeId: string;
  data: any;
  updateNodeData: (id: string, data: any) => void;
}

export function ConceptDetails({ nodeId, data, updateNodeData }: ConceptDetailsProps) {
  const nameField = useField(nodeId, data.name, 'name', updateNodeData, { maxWords: 200 });
  const detailsField = useField(nodeId, data.details, 'details', updateNodeData, { maxWords: 200 });

  const handleSelect = (key: string, value: any) => {
    updateNodeData(nodeId, { [key]: value });
  };

  return (
    <>
      <div className="space-y-2">
        <label className={labelCls}><Palette className="w-3 h-3 text-amber-600" /> Accent Color</label>
        <ColorPicker current={data.noteColor || null} onChange={(c) => handleSelect('noteColor', c)} />
      </div>

      <div className="w-full h-px" style={{ background: 'var(--border)' }} />
      <FontSizeControl value={data.fontSize} onChange={(v) => handleSelect('fontSize', v)} />

      <div className="space-y-1.5">
        <label className={labelCls}>Concept / Magic Name</label>
        <input type="text" {...nameField.props} placeholder="e.g. The Weave, Ether..." className={inputCls} />
        <WordCounter count={nameField.meta.wordCount} limit={200} />
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}>Technical Details</label>
        <textarea {...detailsField.props} rows={8} className={textareaCls} placeholder="Rules, mechanics, philosophy..." />
        <WordCounter count={detailsField.meta.wordCount} limit={200} />
      </div>

      <div className="w-full h-px" style={{ background: 'var(--border)' }} />
      <ReferencedInSection nodeId={nodeId} label="Referenced in Chapters" filterTypes={['chapter']} relationType="referenced_in" />
    </>
  );
}

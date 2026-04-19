"use client";

import React from 'react';
import { Palette } from 'lucide-react';
import { 
  labelCls, inputCls, textareaCls, 
  ColorPicker, FontSizeControl, useField, ReferencedInSection, WordCounter 
} from './GrimoireShared';

interface NoteDetailsProps {
  nodeId: string;
  data: any;
  updateNodeData: (id: string, data: any) => void;
}

export function NoteDetails({ nodeId, data, updateNodeData }: NoteDetailsProps) {
  const titleField   = useField(nodeId, data.title,   'title',   updateNodeData, { maxWords: 200 });
  const contentField = useField(nodeId, data.content, 'content', updateNodeData, { maxWords: 200 });

  const handleSelect = (key: string, value: any) => {
    updateNodeData(nodeId, { [key]: value });
  };

  return (
    <>
      <div className="space-y-2">
        <label className={labelCls}><Palette className="w-3 h-3 text-emerald-500" /> Accent Color</label>
        <ColorPicker current={data.noteColor || null} onChange={(c) => handleSelect('noteColor', c)} />
      </div>

      <div className="w-full h-px" style={{ background: 'var(--border)' }} />
      <FontSizeControl value={data.fontSize} onChange={(v) => handleSelect('fontSize', v)} />

      <div className="space-y-1.5">
        <label className={labelCls}>Note Title</label>
        <input 
          type="text" 
          {...titleField.props} 
          placeholder="Brief subject..." 
          className={inputCls} 
        />
        <WordCounter count={titleField.meta.wordCount} limit={200} />
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}>Note Content</label>
        <textarea 
          {...contentField.props} 
          rows={8} 
          className={textareaCls} 
          placeholder="Write anything..." 
        />
        <WordCounter count={contentField.meta.wordCount} limit={200} />
      </div>

      <div className="w-full h-px" style={{ background: 'var(--border)' }} />
      <ReferencedInSection nodeId={nodeId} label="Linked Chapters" filterTypes={['chapter', 'note']} relationType="referenced_in" />
    </>
  );
}

"use client";

import React from 'react';
import { Palette, Clock } from 'lucide-react';
import { 
  labelCls, inputCls, textareaCls, 
  ColorPicker, FontSizeControl, useField, ReferencedInSection, WordCounter 
} from './GrimoireShared';

interface EventDetailsProps {
  nodeId: string;
  data: any;
  updateNodeData: (id: string, data: any) => void;
}

export function EventDetails({ nodeId, data, updateNodeData }: EventDetailsProps) {
  const nameField = useField(nodeId, data.name, 'name', updateNodeData, { maxWords: 200 });
  const timeField = useField(nodeId, data.timestamp, 'timestamp', updateNodeData, { maxWords: 200 });
  const descField = useField(nodeId, data.description, 'description', updateNodeData, { maxWords: 200 });

  const handleSelect = (key: string, value: any) => {
    updateNodeData(nodeId, { [key]: value });
  };

  return (
    <>
      <div className="space-y-2">
        <label className={labelCls}><Palette className="w-3 h-3 text-pink-500" /> Accent Color</label>
        <ColorPicker current={data.noteColor || null} onChange={(c) => handleSelect('noteColor', c)} />
      </div>

      <div className="w-full h-px" style={{ background: 'var(--border)' }} />
      <FontSizeControl value={data.fontSize} onChange={(v) => handleSelect('fontSize', v)} />

      <div className="space-y-1.5">
        <label className={labelCls}>Event Title</label>
        <input type="text" {...nameField.props} placeholder="Historical marker..." className={inputCls} />
        <WordCounter count={nameField.meta.wordCount} limit={200} />
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}><Clock className="w-3 h-3" /> Timestamp / Era</label>
        <input type="text" {...timeField.props} placeholder="e.g. 403 AF, Second Era..." className={inputCls} />
        <WordCounter count={timeField.meta.wordCount} limit={200} />
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}>Description</label>
        <textarea {...descField.props} rows={6} className={textareaCls} placeholder="What occurred?" />
        <WordCounter count={descField.meta.wordCount} limit={200} />
      </div>

      <div className="w-full h-px" style={{ background: 'var(--border)' }} />
      <ReferencedInSection nodeId={nodeId} label="Featured in Chapters" filterTypes={['chapter']} relationType="referenced_in" />
    </>
  );
}

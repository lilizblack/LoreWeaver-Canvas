"use client";

import React from 'react';
import { Palette, Upload } from 'lucide-react';
import { 
  labelCls, inputCls, textareaCls, 
  ColorPicker, FontSizeControl, ImagePositionControl, useField, ReferencedInSection 
} from './GrimoireShared';

interface PlaceDetailsProps {
  nodeId: string;
  data: any;
  updateNodeData: (id: string, data: any) => void;
  isUploading: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function PlaceDetails({ nodeId, data, updateNodeData, isUploading, onImageUpload }: PlaceDetailsProps) {
  const nameField = useField(nodeId, data.name, 'name', updateNodeData, { maxWords: 300 });
  const descField = useField(nodeId, data.description, 'description', updateNodeData, { maxWords: 300 });

  const handleSelect = (key: string, value: any) => {
    updateNodeData(nodeId, { [key]: value });
  };

  return (
    <>
      <div className="space-y-2">
        <label className={labelCls}>Location Snapshot</label>
        <div className="relative group aspect-video rounded-xl border overflow-hidden flex flex-col items-center justify-center border-dashed" style={{ background: 'var(--bg-3)', borderColor: 'var(--border)' }}>
          {data.imageUrl
            ? <img src={data.imageUrl} className="w-full h-full" alt="place" style={{
                objectFit: data.imagePosition === 'fill' ? 'fill' : data.imagePosition === 'contain' ? 'contain' : 'cover',
                objectPosition: ['contain', 'fill'].includes(data.imagePosition) ? 'center' : (data.imagePosition || 'center')
              }} />
            : <div className="text-center p-4">
                <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--fg-3)' }} />
                <p className="text-[10px]" style={{ color: 'var(--fg-3)' }}>Upload Place Image</p>
              </div>
          }
          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={onImageUpload} disabled={isUploading} />
          <div className={`absolute inset-0 bg-black/60 transition-opacity flex items-center justify-center pointer-events-none ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <div className="flex flex-col items-center gap-2">
              {isUploading
                ? <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                : <Upload className="w-5 h-5 text-white" />
              }
              <span className="text-[10px] text-white font-bold uppercase">{isUploading ? 'Uploading...' : 'Replace Snapshot'}</span>
            </div>
          </div>
        </div>
        {data.imageUrl && (
          <div className="pt-2">
            <ImagePositionControl value={data.imagePosition} onChange={(v) => handleSelect('imagePosition', v)} />
          </div>
        )}
      </div>
      <div className="w-full h-px" style={{ background: 'var(--border)' }} />

      <div className="space-y-2">
        <label className={labelCls}><Palette className="w-3 h-3 text-cyan-500" /> Accent Color</label>
        <ColorPicker current={data.noteColor || null} onChange={(c) => handleSelect('noteColor', c)} />
      </div>

      <div className="w-full h-px" style={{ background: 'var(--border)' }} />
      <FontSizeControl value={data.fontSize} onChange={(v) => handleSelect('fontSize', v)} />

      <div className="space-y-1.5">
        <label className={labelCls}>Location Name</label>
        <input type="text" {...nameField} placeholder="Name of place..." className={inputCls} />
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}>Description</label>
        <textarea {...descField} rows={6} className={textareaCls} placeholder="Describe this location..." />
      </div>

      <div className="w-full h-px" style={{ background: 'var(--border)' }} />
      <ReferencedInSection nodeId={nodeId} label="Featured in Chapters" filterTypes={['chapter']} relationType="occurs_in" />
    </>
  );
}

"use client";

import React from 'react';
import { Palette, Link2, Upload, ImageIcon } from 'lucide-react';
import { 
  labelCls, inputCls, textareaCls, 
  ColorPicker, FontSizeControl, ImagePositionControl, useField 
} from './GrimoireShared';

interface ImageDetailsProps {
  nodeId: string;
  data: any;
  updateNodeData: (id: string, data: any) => void;
  isUploading: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ImageDetails({ nodeId, data, updateNodeData, isUploading, onImageUpload }: ImageDetailsProps) {
  const [imgError, setImgError] = React.useState(false);

  // Reset image error state when imageUrl changes
  React.useEffect(() => {
    setImgError(false);
  }, [data.imageUrl]);

  const labelField   = useField(nodeId, data.label,   'label',   updateNodeData, { maxWords: 200 });
  const captionField = useField(nodeId, data.caption, 'caption', updateNodeData, { maxWords: 200 });

  const handleSelect = (key: string, value: any) => {
    updateNodeData(nodeId, { [key]: value });
  };

  return (
    <>
      <div className="space-y-2">
        <label className={labelCls}>Image Source</label>
        <div className="relative group aspect-video rounded-xl border overflow-hidden flex flex-col items-center justify-center border-dashed" style={{ background: 'var(--bg-3)', borderColor: 'var(--border)' }}>
          {data.imageUrl && !imgError
            ? <img 
                src={data.imageUrl} 
                className="w-full h-full" 
                alt="content"
                onError={() => setImgError(true)}
                style={{
                  objectFit: data.objectPosition === 'fill' ? 'fill' : data.objectPosition === 'contain' ? 'contain' : 'cover',
                  objectPosition: ['contain', 'fill'].includes(data.objectPosition) ? 'center' : (data.objectPosition || 'center')
                }} />
            : <div className="text-center p-4">
                <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--fg-3)' }} />
                <p className="text-[10px]" style={{ color: 'var(--fg-3)' }}>{imgError ? 'Failed to load image' : 'Upload PNG or JPG'}</p>
              </div>
          }
          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={onImageUpload} disabled={isUploading} />
          <div className={`absolute inset-0 bg-black/60 transition-opacity flex items-center justify-center pointer-events-none ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <div className="flex flex-col items-center gap-2">
              {isUploading
                ? <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                : <Upload className="w-5 h-5 text-white" />
              }
              <span className="text-[10px] text-white font-bold uppercase">{isUploading ? 'Uploading...' : 'Replace Image'}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full h-px" style={{ background: 'var(--border)' }} />

      <div className="space-y-2">
        <label className={labelCls}><Palette className="w-3 h-3 text-blue-500" /> Accent Color</label>
        <ColorPicker current={data.noteColor || null} onChange={(c) => handleSelect('noteColor', c)} />
      </div>

      <div className="w-full h-px" style={{ background: 'var(--border)' }} />
      <FontSizeControl value={data.fontSize} onChange={(v) => handleSelect('fontSize', v)} />

      <div className="space-y-1.5">
        <label className={labelCls}>Image Label</label>
        <input type="text" {...labelField} placeholder="Label..." className={inputCls} />
      </div>

      <div className="space-y-1.5">
        <label className={labelCls}>Caption / Annotation</label>
        <textarea {...captionField} rows={4} className={textareaCls} placeholder="Description..." />
      </div>

      <div className="w-full h-px" style={{ background: 'var(--border)' }} />
      <ImagePositionControl value={data.objectPosition} onChange={(v) => handleSelect('objectPosition', v)} />
    </>
  );
}

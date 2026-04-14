"use client";

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export const TextCardNode = memo(({ data, selected }: NodeProps) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: data.content || '<p>Start writing lore...</p>',
    onUpdate: ({ editor }) => {
      data.content = editor.getHTML();
    },
    editable: selected,
  });

  return (
    <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
      selected 
        ? 'border-amber-500 bg-zinc-900 shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-[1.02]' 
        : 'border-white/10 bg-zinc-900/90'
    } min-w-[250px] max-w-[400px]`}>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-amber-500" />
      
      <div className="prose prose-invert prose-sm max-w-none">
        <EditorContent editor={editor} className="outline-none min-h-[100px]" />
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-amber-500" />
      
      {selected && (
        <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center">
          <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Lore Card</span>
          <div className="flex gap-1">
             <div className="w-2 h-2 rounded-full bg-amber-500/50" />
             <div className="w-2 h-2 rounded-full bg-amber-500/20" />
          </div>
        </div>
      )}
    </div>
  );
});

TextCardNode.displayName = 'TextCardNode';

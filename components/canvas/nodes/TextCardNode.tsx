"use client";

import React, { memo, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCanvasStore } from '@/store/useCanvasStore';

// ── Toolbar button ─────────────────────────────────────────────────────────────
function ToolbarBtn({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }} // preventDefault keeps editor focus
      title={title}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 26, height: 26, borderRadius: 6, padding: '0 6px',
        fontSize: 11, fontWeight: 800, letterSpacing: '-0.01em',
        border: '1px solid',
        borderColor: active ? 'rgba(168,85,247,0.6)' : 'rgba(255,255,255,0.08)',
        background: active ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.04)',
        color: active ? '#c084fc' : 'rgba(255,255,255,0.55)',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
        }
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 2px', flexShrink: 0 }} />;
}

// ── Main node ──────────────────────────────────────────────────────────────────
export const TextCardNode = memo(({ data, selected, id }: NodeProps) => {
  const { updateNodeData } = useCanvasStore();
  const accentColor = data.color || '#a855f7';

  const editor = useEditor({
    extensions: [StarterKit],
    content: data.content || '<p></p>',
    editable: selected,
    // Required for Next.js / React 19 SSR — without this, Tiptap 3 throws a
    // hydration error and crashes the canvas when the Text Block node mounts.
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      updateNodeData(id, { content: editor.getHTML() });
    },
  });

  // Keep editable in sync with selection state
  useEffect(() => {
    if (editor && editor.isEditable !== selected) {
      editor.setEditable(selected);
    }
  }, [editor, selected]);

  const isH = (level: 1 | 2 | 3) => editor?.isActive('heading', { level }) ?? false;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 14,
      borderWidth: 2,
      borderStyle: 'solid',
      overflow: 'hidden',
      borderColor: selected ? accentColor : accentColor + '30',
      background: 'var(--card-bg)',
      boxShadow: selected ? `0 0 24px ${accentColor}44` : 'var(--node-shadow)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    }}>
      <NodeResizer
        minWidth={220}
        minHeight={120}
        isVisible={selected}
        lineStyle={{ borderColor: accentColor }}
        handleClassName="!w-3 !h-3 !rounded-full !border-2 !border-zinc-900"
        handleStyle={{ background: accentColor }}
      />

      <Handle type="target" position={Position.Top}  className="!w-2.5 !h-2.5 !border-2 !border-zinc-900" style={{ background: accentColor }} />
      <Handle type="target" position={Position.Left} id="left-target" className="!w-2.5 !h-2.5 !border-2 !border-zinc-900" style={{ background: accentColor }} />

      {/* Formatting toolbar — only when selected */}
      {selected && editor && (
        <div
          className="nodrag"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            padding: '5px 8px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(0,0,0,0.3)',
            flexShrink: 0,
            flexWrap: 'wrap',
          }}
        >
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={isH(1)} title="Heading 1">H1</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={isH(2)} title="Heading 2">H2</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={isH(3)} title="Heading 3">H3</ToolbarBtn>
          <Divider />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()}         active={editor.isActive('bold')}         title="Bold"><b>B</b></ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()}       active={editor.isActive('italic')}       title="Italic"><i>I</i></ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()}       active={editor.isActive('strike')}       title="Strikethrough"><s>S</s></ToolbarBtn>
          <Divider />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()}   active={editor.isActive('bulletList')}   title="Bullet list">•—</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()}  active={editor.isActive('orderedList')}  title="Numbered list">1.</ToolbarBtn>
          <Divider />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()}   active={editor.isActive('blockquote')}   title="Blockquote">"</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()}  title="Divider line">—</ToolbarBtn>
        </div>
      )}

      {/* Content area */}
      <div
        className="prose prose-sm max-w-none flex-1 overflow-auto nodrag"
        style={{
          padding: '10px 14px',
          fontSize: data.fontSize || 14,
          color: 'var(--fg)',
          // Tiptap content styles
          ['--tw-prose-body' as any]: 'var(--fg)',
          ['--tw-prose-headings' as any]: 'var(--fg)',
          ['--tw-prose-bold' as any]: 'var(--fg)',
          ['--tw-prose-quotes' as any]: 'var(--fg-2)',
        }}
      >
        <EditorContent
          editor={editor}
          className="outline-none min-h-[60px] [&_.ProseMirror]:outline-none [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-1 [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:opacity-70 [&_hr]:border-t [&_hr]:my-3"
        />
      </div>

      {/* Footer label */}
      <div style={{
        padding: '4px 14px 6px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 9, color: accentColor + '80', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Text Block
        </span>
        <div style={{ display: 'flex', gap: 3 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: accentColor, opacity: 0.5 }} />
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: accentColor, opacity: 0.2 }} />
        </div>
      </div>

      <Handle type="source" position={Position.Right}  id="right-source" className="!w-2.5 !h-2.5 !border-2 !border-zinc-900" style={{ background: accentColor }} />
      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !border-2 !border-zinc-900" style={{ background: accentColor }} />
    </div>
  );
});

TextCardNode.displayName = 'TextCardNode';

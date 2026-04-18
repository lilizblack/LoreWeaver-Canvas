"use client";

import React, { useState } from 'react';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useUserStore } from '@/store/useUserStore';
import {
  User, BookOpen, StickyNote, Image, Plus,
  Sun, Moon, Circle, Square, Star, ArrowRight,
  Triangle, ChevronDown, ChevronUp, Hexagon,
  AArrowUp, AArrowDown, Type, Scroll, Gem, FileText,
  MapPin, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Node } from 'reactflow';
import Link from 'next/link';
import { useWorldStore } from '@/store/useWorldStore';
import { UsageBar } from './UsageBar';
import { BrandLogo } from '../BrandLogo';
import { ChevronLeft } from 'lucide-react';

const NOTE_COLORS = [
  '#6d28d9', '#7c3aed', '#2563eb', '#0891b2',
  '#059669', '#65a30d', '#d97706', '#ea580c',
  '#dc2626', '#db2777', '#ec4899', '#ffffff',
];

const SHAPES = [
  { shape: 'circle',    label: 'Circle',    color: '#6d28d9' },
  { shape: 'square',    label: 'Square',    color: '#2563eb' },
  { shape: 'rectangle', label: 'Rectangle', color: '#0891b2' },
  { shape: 'diamond',   label: 'Diamond',   color: '#db2777' },
  { shape: 'star',      label: 'Star',      color: '#d97706' },
  { shape: 'arrow',     label: 'Arrow',     color: '#059669' },
  { shape: 'triangle',  label: 'Triangle',  color: '#dc2626' },
  { shape: 'hexagon',   label: 'Hexagon',   color: '#7c3aed' },
];

const ShapeIconMap: Record<string, React.ReactNode> = {
  circle:    <Circle    className="w-4 h-4" />,
  square:    <Square    className="w-4 h-4" />,
  rectangle: <Square    className="w-4 h-4 scale-x-150" />,
  diamond:   <Square    className="w-4 h-4 rotate-45" />,
  star:      <Star      className="w-4 h-4" />,
  arrow:     <ArrowRight className="w-4 h-4" />,
  triangle:  <Triangle  className="w-4 h-4" />,
  hexagon:   <Hexagon   className="w-4 h-4" />,
};

const FONT_SIZES = [
  { key: 'sm',  label: 'S' },
  { key: 'md',  label: 'M' },
  { key: 'lg',  label: 'L' },
  { key: 'xl',  label: 'XL' },
] as const;

export function Sidebar({ projectName }: { projectName: string }) {
  const { addNode, canvasMode } = useCanvasStore();
  const { theme, toggleTheme, fontSize, setFontSize } = useThemeStore();
  const { tier, setSettingsOpen } = useUserStore();
  const [shapesOpen, setShapesOpen] = useState(false);

  const isDark = theme === 'dark';
  const isLore = canvasMode === 'lore';

  const onDragStart = (e: React.DragEvent, nodeType: string, extra?: any) => {
    // ── Spark Plan Limits Enforcement ──────────────────────────────────────
    if (tier === 'spark') {
      const ws = useWorldStore.getState();
      const cs = useCanvasStore.getState();

      if (nodeType === 'character') {
        const charCount = Object.keys(ws.characters).length;
        if (charCount >= 50) {
          alert(`The Character Gallery is full (50/50 Characters). Ascend to Pro to expand your story's cast.`);
          setSettingsOpen(true, 'billing');
          e.preventDefault();
          return;
        }
      } else {
        const libraryLoreCount = 
          Object.keys(ws.places).length + 
          Object.keys(ws.events).length + 
          Object.keys(ws.concepts).length + 
          Object.keys(ws.items).length +
          Object.keys(ws.chapters).length +
          Object.keys(ws.notes).length;

        const allNodes = [...cs.mainNodes, ...cs.loreNodes];
        const nodeLoreCount = allNodes.filter(n => 
          ['image', 'media', 'lore', 'shape', 'chapter', 'note'].includes(n.type || '')
        ).length;
        
        if (libraryLoreCount + nodeLoreCount >= 100) {
          alert(`The Chronicler's Vault is full (100/100 Lore Elements). Ascend to Pro to expand your world's archive.`);
          setSettingsOpen(true, 'billing');
          e.preventDefault();
          return;
        }
      }
    }

    e.dataTransfer.setData('application/reactflow', nodeType);
    if (extra) e.dataTransfer.setData('application/nodedata', JSON.stringify(extra));
    e.dataTransfer.effectAllowed = 'move';
  };

  const dropShape = (shape: string, color: string) => {
    // ── Spark Plan Limits Enforcement ──────────────────────────────────────
    if (tier === 'spark') {
      const ws = useWorldStore.getState();
      const cs = useCanvasStore.getState();
      
      const libraryLoreCount = 
        Object.keys(ws.places).length + 
        Object.keys(ws.events).length + 
        Object.keys(ws.concepts).length + 
        Object.keys(ws.items).length +
        Object.keys(ws.chapters).length +
        Object.keys(ws.notes).length;

      const allNodes = [...cs.mainNodes, ...cs.loreNodes];
      const nodeLoreCount = allNodes.filter(n => 
        ['image', 'media', 'lore', 'shape', 'chapter', 'note'].includes(n.type || '')
      ).length;
      
      if (libraryLoreCount + nodeLoreCount >= 100) {
        alert(`The Chronicler's Vault is full (100/100 Lore Elements). Ascend to Pro to expand your world's archive.`);
        setSettingsOpen(true, 'billing');
        return;
      }
    }

    const id = `shape-${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'shape',
      position: { x: 400, y: 300 },
      style: { width: 100, height: 100 },
      data: { shape, color, label: '', opacity: 0.9 },
    };
    addNode(newNode);
  };

  const mainTemplates = [
    { type: 'character', label: 'Character',    icon: User,      color: isDark ? '#a78bfa' : '#6d28d9', bg: isDark ? 'rgba(109,40,217,0.12)' : 'rgba(109,40,217,0.15)' },
    { type: 'chapter',   label: 'Chapter Note', icon: BookOpen,  color: isDark ? '#fbbf24' : '#b45309', bg: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.15)' },
    { type: 'note',      label: 'Notes',        icon: StickyNote,color: isDark ? '#34d399' : '#059669', bg: isDark ? 'rgba(5,150,105,0.12)' : 'rgba(5,150,105,0.15)'  },
    { type: 'lore',      label: 'Text Block',   icon: FileText,  color: isDark ? '#c084fc' : '#9333ea', bg: isDark ? 'rgba(147,51,234,0.12)' : 'rgba(147,51,234,0.15)' },
    { type: 'image',     label: 'Images',       icon: Image,     color: isDark ? '#60a5fa' : '#2563eb', bg: isDark ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.15)'  },
  ];

  const loreTemplates = [
    { type: 'place',     label: 'Place',           icon: MapPin,    color: isDark ? '#2dd4bf' : '#0891b2', bg: isDark ? 'rgba(13,148,136,0.12)' : 'rgba(13,148,136,0.15)' },
    { type: 'event',     label: 'Timeline Event',  icon: Calendar,  color: isDark ? '#f472b6' : '#db2777', bg: isDark ? 'rgba(219,39,119,0.12)' : 'rgba(219,39,119,0.15)' },
    { type: 'concept',   label: 'Concept / Term',  icon: Scroll,    color: isDark ? '#fbbf24' : '#d97706', bg: isDark ? 'rgba(217,119,6,0.12)'  : 'rgba(217,119,6,0.15)'  },
    { type: 'item',      label: 'Item / Artifact', icon: Gem,       color: isDark ? '#fb7185' : '#e11d48', bg: isDark ? 'rgba(225,29,72,0.12)'  : 'rgba(225,29,72,0.15)'  },
    { type: 'note',      label: 'Notes',           icon: StickyNote,color: isDark ? '#34d399' : '#059669', bg: isDark ? 'rgba(5,150,105,0.12)' : 'rgba(5,150,105,0.15)'  },
    { type: 'image',     label: 'Images',          icon: Image,     color: isDark ? '#60a5fa' : '#2563eb', bg: isDark ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.15)'  },
  ];

  const templates = isLore ? loreTemplates : mainTemplates;

  return (
    <div className="custom-scrollbar" style={{
      width: 'var(--sidebar-width, 240px)',
      maxHeight: 'calc(100vh - 40px)',
      overflowY: 'auto',
      background: 'var(--glass)',
      backdropFilter: 'blur(32px)',
      border: '1px solid var(--border-2)',
      borderRadius: 24,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      boxShadow: isDark ? '0 20px 50px rgba(0,0,0,0.5)' : '0 20px 50px rgba(0,0,0,0.08)',
      color: 'var(--fg)',
      transition: 'width 0.3s ease',
    }}>
      {/* Integrated Navigation Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-400 hover:text-white transition-all group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <Link href="/" className="flex items-center gap-2 pr-2 group/logo hover:opacity-80 transition-opacity">
            <BrandLogo className="w-8 h-8" withGlow={false} />
            <div className="w-px h-4 bg-white/10 mx-1" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none group-hover/logo:text-zinc-300 transition-colors">Loreweaver</span>
          </Link>
        </div>

        <div className="px-1">
          <h2 className="text-white font-serif text-xl leading-tight truncate" title={projectName}>
            {projectName}
          </h2>
          <span className="text-[9px] font-bold text-purple-400 uppercase tracking-[0.2em] mt-1 block">Active Workspace</span>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border)' }} />

      {/* ── Theme + Font Size ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
            borderRadius: 12, border: '1px solid var(--border-2)',
            background: 'var(--bg-2)', cursor: 'pointer', width: '100%',
            color: 'var(--fg)', fontSize: 12, fontWeight: 700,
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
        >
          {isDark
            ? <><Sun  style={{ width: 14, height: 14, color: '#fbbf24' }} /> Light Theme</>
            : <><Moon style={{ width: 14, height: 14, color: '#6366f1' }} /> Dark Theme</>
          }
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 2px' }}>
            <Type style={{ width: 10, height: 10, color: 'var(--fg-3)' }} />
            <span style={{ fontSize: 9, color: 'var(--fg-3)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>UI Scale</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
            {FONT_SIZES.map(f => (
              <button
                key={f.key}
                onClick={() => setFontSize(f.key)}
                style={{
                  padding: '6px 0', borderRadius: 10, border: '1px solid',
                  borderColor: fontSize === f.key ? 'var(--primary)' : 'var(--border)',
                  background: fontSize === f.key ? 'var(--primary)' : 'var(--bg-2)',
                  color: fontSize === f.key ? 'white' : 'var(--fg-2)',
                  fontSize: 10, fontWeight: 800, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border)' }} />

      {/* ── Node Templates ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 9, color: 'var(--fg-3)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', padding: '0 2px' }}>Elements</span>
        {templates.map((t) => (
          <div
            key={t.type}
            draggable
            onDragStart={(e) => onDragStart(e, t.type)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px',
              borderRadius: 14, border: '1px solid var(--border)',
              background: 'var(--bg-2)', cursor: 'grab',
              color: 'var(--fg)', fontSize: 13, fontWeight: 600,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = t.color + '40';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${t.color}20`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <t.icon style={{ width: 18, height: 18, color: t.color }} />
            </div>
            {t.label}
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--border)' }} />

      {/* ── Shapes ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={() => setShapesOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '4px 6px', background: 'var(--bg-2)', border: '1px solid var(--border)', 
            borderRadius: 10, cursor: 'pointer', color: 'var(--fg-2)', width: '100%',
          }}
        >
          <span style={{ fontSize: 9, textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Geometric Primitives</span>
          {shapesOpen ? <ChevronUp style={{ width: 12, height: 12 }} /> : <ChevronDown style={{ width: 12, height: 12 }} />}
        </button>

        <AnimatePresence>
          {shapesOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, paddingTop: 4 }}>
                {SHAPES.map(s => (
                  <button
                    key={s.shape}
                    onClick={() => dropShape(s.shape, s.color)}
                    draggable
                    onDragStart={(e) => onDragStart(e, 'shape', { shape: s.shape, color: s.color })}
                    title={s.label}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 4, padding: '10px 4px', borderRadius: 12,
                      border: '1px solid var(--border)', background: 'var(--bg-2)',
                      cursor: 'grab', color: s.color, transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = s.color;
                      e.currentTarget.style.background = s.color + '08';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.background = 'var(--bg-2)';
                    }}
                  >
                    <span style={{ color: s.color }}>{ShapeIconMap[s.shape]}</span>
                    <span style={{ fontSize: 8, color: 'var(--fg-3)', fontWeight: 800, textTransform: 'uppercase' }}>{s.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div style={{ paddingTop: 8 }}>
          <UsageBar />
        </div>
      </div>
    </div>
  );
}

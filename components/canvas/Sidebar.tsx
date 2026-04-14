"use client";

import React from 'react';
import { useCanvasStore } from '@/store/useCanvasStore';
import { User, BookOpen, StickyNote, Image, Link2, Search, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export function Sidebar() {
  const { addNode } = useCanvasStore();

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const templates = [
    { type: 'character', label: 'Character', icon: User, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { type: 'chapter', label: 'Chapter Note', icon: BookOpen, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { type: 'note', label: 'Notes', icon: StickyNote, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { type: 'image', label: 'Mood Board', icon: Image, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ];

  return (
    <div className="w-64 glass-panel rounded-2xl p-4 flex flex-col gap-6 shadow-2xl border-white/5">
      <div className="flex items-center gap-2 px-2">
        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
          <Plus className="w-5 h-5 text-white" />
        </div>
        <h3 className="font-semibold text-zinc-100">Creation Tool</h3>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input 
          type="text" 
          placeholder="Search lore..." 
          className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
        />
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2">Templates</p>
        <div className="grid grid-cols-1 gap-2">
          {templates.map((t) => (
            <div
              key={t.type}
              draggable
              onDragStart={(e) => onDragStart(e, t.type)}
              className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-grab active:cursor-grabbing group"
            >
              <div className={`w-10 h-10 rounded-lg ${t.bg} ${t.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                <t.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-zinc-300 group-hover:text-white">{t.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 overflow-hidden">
            {/* Placeholder for user avatar */}
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-zinc-300">Author Name</p>
            <p className="text-[10px] text-zinc-500">Chronicles of Midnight</p>
          </div>
        </div>
      </div>
    </div>
  );
}

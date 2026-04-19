"use client";

import React from 'react';
import { useWorldStore } from '@/store/useWorldStore';
import { useUserStore } from '@/store/useUserStore';
import { useCanvasStore } from '@/store/useCanvasStore';
import { motion } from 'framer-motion';
import { Gem, AlertCircle, TrendingUp, Info } from 'lucide-react';

export function UsageBar() {
  const { tier, setSettingsOpen } = useUserStore();
  
  // World Store Items (Library elements)
  const characters = useWorldStore((state) => state.characters);
  const places = useWorldStore((state) => state.places);
  const events = useWorldStore((state) => state.events);
  const concepts = useWorldStore((state) => state.concepts);
  const items = useWorldStore((state) => state.items);
  const chapters = useWorldStore((state) => state.chapters);
  const notes = useWorldStore((state) => state.notes);

  // Canvas Store Items
  const mainNodes = useCanvasStore((state) => state.mainNodes);
  const loreNodes = useCanvasStore((state) => state.loreNodes);
  
  const charCount = Object.keys(characters).length;
  
  // Count library items (all lore categories stored in library)
  const libraryLoreCount = 
    Object.keys(places).length + 
    Object.keys(events).length + 
    Object.keys(concepts).length + 
    Object.keys(items).length +
    Object.keys(chapters).length +
    Object.keys(notes).length;

  // Count ephemeral/canvas-only lore elements (Images, Text Cards)
  const allNodes = [...mainNodes, ...loreNodes];
  const nodeLoreCount = allNodes.filter(n => 
    n.type === 'image' || 
    n.type === 'media' || 
    n.type === 'lore' ||
    n.type === 'shape' // Technically a 'lore tool' for visual layout
  ).length;

  // The total lore elements count includes everything in library + canvas-only objects
  const loreCount = libraryLoreCount + nodeLoreCount;

  const limits = {
    spark: { chars: 50, lore: 200 },
  };

  if (tier !== 'spark') return null;

  const charPercent = Math.min((charCount / limits.spark.chars) * 100, 100);
  const lorePercent = Math.min((loreCount / limits.spark.lore) * 100, 100);
  
  const isNearLimit = charPercent > 80 || lorePercent > 80;
  const isAtLimit = charPercent >= 100 || lorePercent >= 100;

  return (
    <div className="flex flex-col gap-4 py-4 px-3 rounded-2xl bg-[#0d0d12]/60 border border-white/5 shadow-2xl backdrop-blur-md relative overflow-hidden group">
      {/* Decorative background glow */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/10 blur-[40px] rounded-full pointer-events-none" />
      
      <div className="flex items-center justify-between px-1 relative z-10">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isNearLimit ? 'bg-amber-500/10' : 'bg-purple-500/10'}`}>
            <TrendingUp className={`w-3 h-3 ${isNearLimit ? 'text-amber-500' : 'text-purple-400'}`} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 font-serif">
            The Scribe's Vault
          </span>
        </div>
        {isAtLimit && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <AlertCircle className="w-4 h-4 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
          </motion.div>
        )}
      </div>

      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

      {/* Characters Bar */}
      <div className="space-y-2.5 relative z-10">
        <div className="flex justify-between items-end px-1">
          <div className="flex flex-col">
            <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-600">Soul Weaver</span>
            <span className="text-[11px] font-serif font-bold text-zinc-300">Characters</span>
          </div>
          <span className={`text-[10px] font-black tabular-nums ${charPercent >= 90 ? 'text-rose-400' : 'text-purple-300/80'}`}>
            {charCount}<span className="text-zinc-700 font-bold mx-1">/</span>{limits.spark.chars}
          </span>
        </div>
        <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden p-[1px] border border-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${charPercent}%` }}
            className={`h-full rounded-full transition-all duration-1000 ${
              charPercent >= 90 
                ? 'bg-gradient-to-r from-rose-700 to-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)]' 
                : 'bg-gradient-to-r from-purple-900 to-indigo-500 shadow-[0_0_12px_rgba(124,58,237,0.2)]'
            }`}
          />
        </div>
      </div>

      {/* Lore Items Bar */}
      <div className="space-y-2.5 relative z-10">
        <div className="flex justify-between items-end px-1">
          <div className="flex flex-col">
            <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-600">Chronicler</span>
            <span className="text-[11px] font-serif font-bold text-zinc-300">Lore Elements</span>
          </div>
          <span className={`text-[10px] font-black tabular-nums ${lorePercent >= 90 ? 'text-rose-400' : 'text-amber-300/80'}`}>
            {loreCount}<span className="text-zinc-700 font-bold mx-1">/</span>{limits.spark.lore}
          </span>
        </div>
        <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden p-[1px] border border-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${lorePercent}%` }}
            className={`h-full rounded-full transition-all duration-1000 ${
              lorePercent >= 90 
                ? 'bg-gradient-to-r from-rose-700 to-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)]' 
                : 'bg-gradient-to-r from-amber-700 to-orange-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
            }`}
          />
        </div>
        <div className="flex items-start gap-1.5 px-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Info className="w-2.5 h-2.5 text-zinc-600 mt-0.5" />
          <p className="text-[8px] leading-tight text-zinc-600 font-medium italic">
            Counts all library records and canvas images.
          </p>
        </div>
      </div>

      <button 
        onClick={() => setSettingsOpen(true)}
        className="mt-1 w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.25em] transition-all duration-500
                   bg-zinc-900/80 border border-purple-500/20 text-purple-300/80
                   hover:bg-purple-900/40 hover:text-white hover:shadow-[0_0_25px_rgba(124,58,237,0.25)]
                   hover:border-purple-500/40 active:scale-[0.98]
                   flex items-center justify-center gap-2 group/btn relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
        <Gem className="w-3.5 h-3.5 text-purple-400 group-hover/btn:animate-pulse group-hover/btn:text-white transition-colors" />
        Ascend to Pro
      </button>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '@/store/useCanvasStore';
import { 
  X, 
  User, 
  BookOpen, 
  StickyNote, 
  Upload, 
  Smile, 
  Zap, 
  TrendingUp, 
  Users,
  AlertCircle,
  Type,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function GrimoirePanel() {
  const { selectedNodeId, nodes, updateNodeData, setSelectedNodeId } = useCanvasStore();
  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  
  const [activeTab, setActiveTab] = useState('basic');
  const [isUploading, setIsUploading] = useState(false);

  if (!selectedNode) return null;

  const handleUpdate = (updates: any) => {
    updateNodeData(selectedNode.id, updates);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `portraits/${selectedNode.id}-${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      handleUpdate({ imageUrl: url });
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="fixed right-6 top-24 bottom-6 w-80 bg-zinc-900/90 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl flex flex-col z-[100] overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          {selectedNode.type === 'character' && <User className="w-4 h-4 text-purple-400" />}
          {selectedNode.type === 'chapter' && <BookOpen className="w-4 h-4 text-amber-500" />}
          {selectedNode.type === 'note' && <StickyNote className="w-4 h-4 text-emerald-500" />}
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            {selectedNode.type} Details
          </span>
        </div>
        <button 
          onClick={() => setSelectedNodeId(null)}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-zinc-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        {selectedNode.type === 'character' && (
          <>
            {/* Portrait Upload */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Character Portrait</label>
              <div className="relative group aspect-square rounded-xl bg-black/40 border border-white/5 overflow-hidden flex flex-col items-center justify-center border-dashed">
                {selectedNode.data.imageUrl ? (
                  <img src={selectedNode.data.imageUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <Upload className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                    <p className="text-[10px] text-zinc-600">Upload CSV, PNG, or JPG</p>
                  </div>
                )}
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-xs text-white font-medium">{isUploading ? 'Uploading...' : 'Replace Portrait'}</span>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                  <Type className="w-3 h-3 text-purple-400" /> True Name
                </label>
                <input 
                  type="text" 
                  value={selectedNode.data.name || ''}
                  onChange={(e) => handleUpdate({ name: e.target.value })}
                  placeholder="The name they go by..."
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-sm focus:border-purple-500/50 transition-colors placeholder:text-zinc-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Age / Lifespan</label>
                  <input 
                    type="text" 
                    value={selectedNode.data.age || ''}
                    onChange={(e) => handleUpdate({ age: e.target.value })}
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Character Type</label>
                  <select 
                    value={selectedNode.data.characterType || ''}
                    onChange={(e) => handleUpdate({ characterType: e.target.value })}
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-2 text-sm text-zinc-300"
                  >
                    <option value="Protagonist">Protagonist</option>
                    <option value="Antagonist">Antagonist</option>
                    <option value="Herald">Herald</option>
                    <option value="Shadow">Shadow</option>
                    <option value="Ally">Ally</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-white/5" />

            {/* Rich Text Fields */}
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                  <Smile className="w-3 h-3 text-purple-400" /> Personality
                </label>
                <textarea 
                  value={selectedNode.data.personality || ''}
                  onChange={(e) => handleUpdate({ personality: e.target.value })}
                  rows={3}
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-sm resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-purple-400" /> Appearance
                </label>
                <textarea 
                  value={selectedNode.data.appearance || ''}
                  onChange={(e) => handleUpdate({ appearance: e.target.value })}
                  rows={3}
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-sm resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-purple-400" /> Character Growth
                </label>
                <textarea 
                  value={selectedNode.data.growth || ''}
                  onChange={(e) => handleUpdate({ growth: e.target.value })}
                  rows={3}
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-sm resize-none"
                />
              </div>
            </div>
          </>
        )}

        {selectedNode.type === 'chapter' && (
          <>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Chapter Title</label>
                <input 
                  type="text" 
                  value={selectedNode.data.name || ''}
                  onChange={(e) => handleUpdate({ name: e.target.value })}
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Summary</label>
                <textarea 
                  value={selectedNode.data.summary || ''}
                  onChange={(e) => handleUpdate({ summary: e.target.value })}
                  rows={4}
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-sm resize-none italic"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500" /> World Building Beats
                </label>
                <textarea 
                  value={selectedNode.data.beats || ''}
                  onChange={(e) => handleUpdate({ beats: e.target.value })}
                  rows={3}
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-sm resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 text-rose-500" /> Unresolved Threads
                </label>
                <textarea 
                  value={selectedNode.data.threads || ''}
                  onChange={(e) => handleUpdate({ threads: e.target.value })}
                  rows={3}
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-2 px-3 text-sm resize-none"
                />
              </div>
            </div>
          </>
        )}

        {selectedNode.type === 'note' && (
          <textarea 
            value={selectedNode.data.content || ''}
            onChange={(e) => handleUpdate({ content: e.target.value })}
            placeholder="Write your lore fragments here..."
            className="w-full h-full min-h-[400px] bg-transparent border-none focus:ring-0 text-sm text-zinc-200 resize-none leading-relaxed"
          />
        )}
      </div>
    </motion.div>
  );
}

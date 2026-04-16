"use client";

import React, { useState } from 'react';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useWorldStore } from '@/store/useWorldStore';
import {
  X, User, BookOpen, StickyNote, MapPin,
  Calendar, Scroll, Gem, Trash2,
  ChevronsUp, ChevronsDown, ArrowUp, ArrowDown,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Modular components
import { CharacterDetails } from './grimoire/CharacterDetails';
import { ChapterDetails }   from './grimoire/ChapterDetails';
import { NoteDetails }      from './grimoire/NoteDetails';
import { PlaceDetails }     from './grimoire/PlaceDetails';
import { EventDetails }     from './grimoire/EventDetails';
import { ConceptDetails }   from './grimoire/ConceptDetails';
import { ItemDetails }      from './grimoire/ItemDetails';
import { ImageDetails }     from './grimoire/ImageDetails';
import { ShapeDetails }     from './grimoire/ShapeDetails';

import imageCompression from 'browser-image-compression';

export function GrimoirePanel() {
  const { 
    deleteNode, 
    updateNodeZIndex,
    addNode,
    setCanvasMode,
    nodes,
    selectedNodeId,
    setSelectedNodeId,
    updateNodeData
  } = useCanvasStore();

  const world = useWorldStore();
  const rawSelectedNode = nodes.find(n => n.id === selectedNodeId);
  
  // Fallback to library if not on canvas
  const selectedNode = React.useMemo(() => {
    if (rawSelectedNode) return rawSelectedNode;
    if (!selectedNodeId) return null;

    // Determine type from ID prefix
    const [type] = selectedNodeId.split('-');
    
    let libraryData: any = null;
    switch(type) {
      case 'character': libraryData = world.characters[selectedNodeId]; break;
      case 'chapter':   libraryData = world.chapters[selectedNodeId];   break;
      case 'note':      libraryData = world.notes[selectedNodeId];      break;
      case 'place':     libraryData = world.places[selectedNodeId];     break;
      case 'event':     libraryData = world.events[selectedNodeId];     break;
      case 'concept':   libraryData = world.concepts[selectedNodeId];   break;
      case 'item':      libraryData = world.items[selectedNodeId];      break;
    }

    if (libraryData) {
      return {
        id: selectedNodeId,
        type: type as any,
        data: libraryData,
        zIndex: 0,
        position: { x: 0, y: 0 },
        isIsolated: true // Custom flag
      };
    }
    return null;
  }, [selectedNodeId, rawSelectedNode, world]);

  const [isUploading, setIsUploading] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedNodeId) return;
    const nodeId = selectedNodeId;
    setIsUploading(true);
    
    try {
      // 1. Image Compression
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
      };
      
      console.log(`Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      const compressedFile = await imageCompression(file, options);
      console.log(`Compressed file size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

      // 2. Firebase Upload
      const storageRef = ref(storage, `portraits/${nodeId}-${Date.now()}`);
      await uploadBytes(storageRef, compressedFile);
      const url = await getDownloadURL(storageRef);
      updateNodeData(nodeId, { imageUrl: url });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRestore = () => {
    if (!selectedNode || !('isIsolated' in selectedNode) || !(selectedNode as any).isIsolated) return;
    
    // Determine target canvas
    const mainTypes = ['chapter', 'note', 'character'];
    const targetMode = mainTypes.includes(selectedNode.type) ? 'main' : 'lore';
    
    const newNode = {
      ...selectedNode,
      position: { x: 200 + Math.random() * 200, y: 200 + Math.random() * 200 },
      style: selectedNode.type === 'chapter' ? { width: 300, height: 280 } : 
             selectedNode.type === 'note' ? { width: 220, height: 140 } : undefined
    };
    
    delete (newNode as any).isIsolated;
    
    setCanvasMode(targetMode);
    addNode(newNode);
    // Keep it selected
  };

  if (!selectedNodeId) return null;

  return (
    <AnimatePresence>
      {selectedNode && (
        <motion.div
          key={selectedNodeId}
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            background: 'var(--glass)',
            backdropFilter: 'blur(24px)',
            border: '1px solid var(--border-2)',
            color: 'var(--fg)',
            boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
          }}
          className="fixed right-6 top-24 bottom-6 w-[440px] rounded-2xl flex flex-col z-[100] overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              {selectedNode.type === 'character' && <User       className="w-4 h-4 text-purple-400" />}
              {selectedNode.type === 'chapter'   && <BookOpen   className="w-4 h-4 text-amber-500"  />}
              {selectedNode.type === 'note'      && <StickyNote className="w-4 h-4 text-emerald-500" />}
              {selectedNode.type === 'place'     && <MapPin     className="w-4 h-4 text-cyan-500"   />}
              {selectedNode.type === 'event'     && <Calendar   className="w-4 h-4 text-pink-500"   />}
              {selectedNode.type === 'concept'   && <Scroll     className="w-4 h-4 text-amber-500"  />}
              {selectedNode.type === 'item'      && <Gem        className="w-4 h-4 text-rose-500"   />}
              {selectedNode.type === 'shape'     && <Layout     className="w-4 h-4 text-slate-400"  />}
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--fg-2)' }}>
                {selectedNode.type} Details
              </span>
              {(selectedNode as any).isIsolated && (
                <span className="bg-amber-500/20 text-amber-500 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                  Isolated from Canvas
                </span>
              )}
            </div>
            <button
              onClick={() => setSelectedNodeId(null)}
              className="p-1.5 rounded-lg transition-colors border border-transparent hover:bg-white/10"
              style={{ color: 'var(--fg-3)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar" onClick={() => setDeleteArmed(false)}>
            {selectedNode.type === 'character' && (
              <CharacterDetails 
                nodeId={selectedNodeId} 
                data={selectedNode.data} 
                updateNodeData={updateNodeData} 
                isUploading={isUploading} 
                onImageUpload={handleImageUpload} 
              />
            )}
            {selectedNode.type === 'chapter' && (
              <ChapterDetails 
                nodeId={selectedNodeId} 
                data={selectedNode.data} 
                updateNodeData={updateNodeData} 
              />
            )}
            {selectedNode.type === 'note' && (
              <NoteDetails 
                nodeId={selectedNodeId} 
                data={selectedNode.data} 
                updateNodeData={updateNodeData} 
              />
            )}
            {selectedNode.type === 'place' && (
              <PlaceDetails 
                nodeId={selectedNodeId} 
                data={selectedNode.data} 
                updateNodeData={updateNodeData}
                isUploading={isUploading}
                onImageUpload={handleImageUpload} 
              />
            )}
            {selectedNode.type === 'event' && (
              <EventDetails 
                nodeId={selectedNodeId} 
                data={selectedNode.data} 
                updateNodeData={updateNodeData} 
              />
            )}
            {selectedNode.type === 'concept' && (
              <ConceptDetails 
                nodeId={selectedNodeId} 
                data={selectedNode.data} 
                updateNodeData={updateNodeData} 
              />
            )}
            {selectedNode.type === 'item' && (
              <ItemDetails 
                nodeId={selectedNodeId} 
                data={selectedNode.data} 
                updateNodeData={updateNodeData} 
              />
            )}
            {selectedNode.type === 'image' && (
              <ImageDetails 
                nodeId={selectedNodeId} 
                data={selectedNode.data} 
                updateNodeData={updateNodeData} 
                isUploading={isUploading}
                onImageUpload={handleImageUpload}
              />
            )}
            {selectedNode.type === 'shape' && (
              <ShapeDetails 
                nodeId={selectedNodeId} 
                data={selectedNode.data} 
                updateNodeData={updateNodeData} 
              />
            )}
          </div>

          {/* Layer controls row */}
          <div
            className="flex-shrink-0 px-5 py-2 border-t flex items-center justify-between gap-2"
            style={{ borderColor: 'var(--border)', background: 'rgba(0,0,0,0.1)' }}
          >
            <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--fg-3)' }}>
              Layer Order
            </span>
            {(selectedNode as any).isIsolated ? (
               <button 
                onClick={handleRestore}
                className="flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-lg shadow-amber-600/20"
              >
                Restore to Canvas
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => updateNodeZIndex(selectedNodeId, 'front')} 
                  title="Bring to Front"
                  className="p-1.5 rounded-lg transition-all hover:bg-purple-500/15"
                  style={{ color: 'var(--fg-2)', border: '1px solid var(--border)' }}
                >
                  <ChevronsUp className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => updateNodeZIndex(selectedNodeId, 'up')} 
                  title="Move Forward"
                  className="p-1.5 rounded-lg transition-all hover:bg-purple-500/15"
                  style={{ color: 'var(--fg-2)', border: '1px solid var(--border)' }}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => updateNodeZIndex(selectedNodeId, 'down')} 
                  title="Move Backward"
                  className="p-1.5 rounded-lg transition-all hover:bg-purple-500/15"
                  style={{ color: 'var(--fg-2)', border: '1px solid var(--border)' }}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => updateNodeZIndex(selectedNodeId, 'back')} 
                  title="Send to Back"
                  className="p-1.5 rounded-lg transition-all hover:bg-purple-500/15"
                  style={{ color: 'var(--fg-2)', border: '1px solid var(--border)' }}
                >
                  <ChevronsDown className="w-3.5 h-3.5" />
                </button>
                <span className="ml-2 text-[10px] font-bold" style={{ color: 'var(--fg-3)' }}>
                  z: {selectedNode.zIndex ?? 0}
                </span>
              </div>
            )}
          </div>

          {/* Delete footer */}
          <div
            className="flex-shrink-0 px-5 py-4 border-t flex items-center justify-between"
            style={{ borderColor: 'var(--border)', background: 'rgba(0,0,0,0.15)' }}
          >
            <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--fg-3)' }}>
              {selectedNode.type}
            </span>

            {deleteArmed ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-red-400">Are you sure?</span>
                <button
                  onClick={() => { deleteNode(selectedNodeId); setSelectedNodeId(null); setDeleteArmed(false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500 hover:bg-red-400 text-white transition-colors shadow-lg shadow-red-500/20"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
                <button
                  onClick={() => setDeleteArmed(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  style={{ background: 'var(--bg-3)', color: 'var(--fg-2)' }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteArmed(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all opacity-50 hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
                style={{ color: 'var(--fg-3)' }}
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

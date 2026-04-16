"use client";

import React, { useState, useEffect } from "react";
import { X, Shield, Zap, Book, Users, Tag, Plus, Trash2, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Character, useWorldStore } from "@/store/useWorldStore";
import { useCanvasStore } from "@/store/useCanvasStore";

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string | null;
}

export function CharacterModal({ isOpen, onClose, characterId }: CharacterModalProps) {
  const { characters, updateCharacter, deleteCharacter } = useWorldStore();
  const { nodes, addNode } = useCanvasStore();
  const [internalId, setInternalId] = useState<string | null>(characterId);
  const character = internalId ? characters[internalId] : null;

  const [formData, setFormData] = useState<Partial<Character>>({
    name: "",
    aliases: [],
    origins: "",
    abilities: { inherent: [], acquired: [] },
    factions: { species: [], allegiance: [] },
    lore: "",
  });

  useEffect(() => {
    setInternalId(characterId);
  }, [characterId, isOpen]);

  useEffect(() => {
    if (character) {
      setFormData(character);
    } else {
      setFormData({
        name: "",
        aliases: [],
        origins: "",
        abilities: { inherent: [], acquired: [] },
        factions: { species: [], allegiance: [] },
        lore: "",
      });
    }
  }, [character]);

  if (!isOpen) return null;

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAbilityChange = (type: 'inherent' | 'acquired', value: string[]) => {
    setFormData(prev => ({
      ...prev,
      abilities: { ...prev.abilities!, [type]: value }
    }));
  };

  const handleSave = () => {
    if (internalId) {
      updateCharacter(internalId, formData);
      setInternalId(null);
      if (characterId) {
         onClose(); // If opened specifically for one character, close entirely.
      }
    }
  };

  const handlePlaceOnCanvas = () => {
    if (!internalId || !character) return;
    addNode({
      id: internalId,
      type: "character",
      position: { x: window.innerWidth / 2 - 130, y: window.innerHeight / 2 - 110 },
      data: {
        characterId: internalId,
        name: character.name,
        imageUrl: character.imageUrl || "",
        label: character.name || "Unnamed",
      },
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to completely erase this character's record?")) {
      if (internalId) {
        deleteCharacter(internalId);
        const store = useCanvasStore.getState();
        const filterNodes = (n: any) => !(n.type === 'character' && n.data?.characterId === internalId);
        useCanvasStore.setState({
          nodes: store.nodes.filter(filterNodes),
          mainNodes: store.mainNodes.filter(filterNodes),
          loreNodes: store.loreNodes.filter(filterNodes),
        });
      }
      setInternalId(null);
      if (characterId) onClose();
    }
  };

  const isOnCanvas = internalId ? nodes.some(n => n.id === internalId) : false;

  const charArray = Object.values(characters);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
          style={{ background: 'var(--bg)', border: '1px solid var(--border-2)' }}
        >
          {/* Header */}
          <div className="p-6 flex items-center justify-between" style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-semibold" style={{ color: 'var(--fg)' }}>
                  {!internalId ? "Character Directory" : (formData.name || "Unnamed Character")}
                </h2>
                <p className="text-xs uppercase tracking-widest mt-1" style={{ color: 'var(--fg-3)' }}>
                  {!internalId ? `${charArray.length} recorded entities` : "Character Profile & Lore"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full transition-colors"
              style={{ color: 'var(--fg-2)' }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-3)'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {!internalId ? (
             /* LIST VIEW */
            <div className="flex-1 overflow-y-auto p-8" style={{ background: 'var(--bg)' }}>
              {charArray.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center" style={{ color: 'var(--fg-3)' }}>
                  <Users className="w-16 h-16 mb-4 opacity-50" />
                  <h3 className="text-xl font-serif">No characters recorded.</h3>
                  <p className="mt-2 text-sm max-w-md">Create character cards on your canvas to add them to this directory and manage their detailed lore.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {charArray.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => setInternalId(c.id)}
                      className="p-4 rounded-xl border cursor-pointer transition-all hover:-translate-y-1"
                      style={{ background: 'var(--bg-2)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                    >
                      <h3 className="font-semibold text-lg">{c.name || "Unnamed Character"}</h3>
                      <p className="text-sm mt-1 truncate opacity-70">
                        {c.lore || "No historical records."}
                      </p>
                      <div className="flex gap-2 mt-3 justify-between items-center">
                         <div>
                           {c.factions?.species?.[0] && (
                             <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-500 font-medium">
                               {c.factions.species[0]}
                             </span>
                           )}
                         </div>
                         <button 
                           onClick={(e) => { 
                             e.stopPropagation(); 
                             if(confirm('Delete record?')) {
                               deleteCharacter(c.id);
                               const store = useCanvasStore.getState();
                               const filterNodes = (n: any) => !(n.type === 'character' && n.data?.characterId === c.id);
                               useCanvasStore.setState({
                                 nodes: store.nodes.filter(filterNodes),
                                 mainNodes: store.mainNodes.filter(filterNodes),
                                 loreNodes: store.loreNodes.filter(filterNodes),
                               });
                             }
                           }}
                           className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                           title="Delete Record"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
             /* EDIT VIEW */
            <>
              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide" style={{ background: 'var(--bg)' }}>
                {/* Identity Section */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-purple-500">
                    <Shield className="w-5 h-5" />
                    <h3 className="font-semibold uppercase text-sm tracking-wider">Identity & Aliases</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-medium mb-2 uppercase" style={{ color: 'var(--fg-2)' }}>True Name</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => handleChange("name", e.target.value)}
                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 transition-colors"
                        style={{ background: 'var(--bg-2)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-2 uppercase" style={{ color: 'var(--fg-2)' }}>Known Aliases</label>
                      <input
                        type="text"
                        placeholder="Separate by commas"
                        value={formData.aliases?.join(", ") || ''}
                        onChange={(e) => handleChange("aliases", e.target.value.split(",").map(s => s.trim()))}
                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 transition-colors"
                        style={{ background: 'var(--bg-2)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                      />
                    </div>
                  </div>
                </section>

                {/* Origins & Abilities */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-amber-500">
                    <Zap className="w-5 h-5" />
                    <h3 className="font-semibold uppercase text-sm tracking-wider">Origins & Power Signature</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <div>
                        <label className="block text-xs font-medium mb-2 uppercase" style={{ color: 'var(--fg-2)' }}>Inherent Traits (Born with)</label>
                        <textarea
                          value={formData.abilities?.inherent?.join("\n") || ''}
                          onChange={(e) => handleAbilityChange('inherent', e.target.value.split("\n"))}
                          rows={3}
                          className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                          style={{ background: 'var(--bg-2)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                       <div>
                        <label className="block text-xs font-medium mb-2 uppercase" style={{ color: 'var(--fg-2)' }}>Acquired Traits (Engineered/Mastered)</label>
                        <textarea
                          value={formData.abilities?.acquired?.join("\n") || ''}
                          onChange={(e) => handleAbilityChange('acquired', e.target.value.split("\n"))}
                          rows={3}
                          className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                          style={{ background: 'var(--bg-2)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Factions & Species */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-500">
                    <Tag className="w-5 h-5" />
                    <h3 className="font-semibold uppercase text-sm tracking-wider">Factions & Taxonomy</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-medium mb-2 uppercase" style={{ color: 'var(--fg-2)' }}>Species / Hierarchy</label>
                      <input
                        type="text"
                        value={formData.factions?.species?.join(", ") || ''}
                        onChange={(e) => handleChange("factions", { ...formData.factions, species: e.target.value.split(",").map(s => s.trim()) })}
                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 transition-colors"
                        style={{ background: 'var(--bg-2)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-2 uppercase" style={{ color: 'var(--fg-2)' }}>Allegiances</label>
                      <input
                        type="text"
                        value={formData.factions?.allegiance?.join(", ") || ''}
                        onChange={(e) => handleChange("factions", { ...formData.factions, allegiance: e.target.value.split(",").map(s => s.trim()) })}
                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 transition-colors"
                        style={{ background: 'var(--bg-2)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                      />
                    </div>
                  </div>
                </section>

                {/* Lore Editor */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-500">
                    <Book className="w-5 h-5" />
                    <h3 className="font-semibold uppercase text-sm tracking-wider">Historical Records & Lore</h3>
                  </div>
                  <textarea
                    value={formData.lore || ''}
                    onChange={(e) => handleChange("lore", e.target.value)}
                    placeholder="The bloodlines of the fae were never meant to mingle with the lycan lineages..."
                    className="w-full border rounded-2xl px-6 py-6 focus:outline-none focus:border-purple-500/50 transition-colors min-h-[300px] leading-relaxed font-serif text-lg"
                    style={{ background: 'var(--bg-2)', borderColor: 'var(--border)', color: 'var(--fg)' }}
                  />
                </section>
              </div>

              {/* Footer */}
              <div className="p-6 flex items-center justify-between" style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Erase Record
                  </button>
                  
                  {!isOnCanvas && (
                    <button
                      onClick={handlePlaceOnCanvas}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      Place on Canvas
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setInternalId(null);
                      if (characterId) onClose();
                    }}
                    className="px-6 py-2 text-sm font-medium transition-colors"
                    style={{ color: 'var(--fg-2)' }}
                    onMouseOver={e => e.currentTarget.style.color = 'var(--fg)'}
                    onMouseOut={e => e.currentTarget.style.color = 'var(--fg-2)'}
                  >
                    {characterId ? "Close without saving" : "Back to Directory"}
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-purple-500/20"
                  >
                    Seal Record
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

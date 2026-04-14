"use client";

import React, { useState, useEffect } from "react";
import { X, Shield, Zap, Book, Users, Tag, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Character, useWorldStore } from "@/store/useWorldStore";

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: string | null;
}

export function CharacterModal({ isOpen, onClose, characterId }: CharacterModalProps) {
  const { characters, updateCharacter } = useWorldStore();
  const character = characterId ? characters[characterId] : null;

  const [formData, setFormData] = useState<Partial<Character>>({
    name: "",
    aliases: [],
    origins: "",
    abilities: { inherent: [], acquired: [] },
    factions: { species: [], allegiance: [] },
    lore: "",
  });

  useEffect(() => {
    if (character) {
      setFormData(character);
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
    if (characterId) {
      updateCharacter(characterId, formData);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] glass-panel rounded-3xl overflow-hidden border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-semibold text-white">
                  {formData.name || "Unnamed Character"}
                </h2>
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Character Profile & Lore</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-400"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
            {/* Identity Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-purple-400">
                <Shield className="w-5 h-5" />
                <h3 className="font-semibold uppercase text-sm tracking-wider">Identity & Aliases</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase">True Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase">Known Aliases</label>
                  <input
                    type="text"
                    placeholder="Separate by commas"
                    value={formData.aliases?.join(", ")}
                    onChange={(e) => handleChange("aliases", e.target.value.split(",").map(s => s.trim()))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>
              </div>
            </section>

            {/* Origins & Abilities */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-amber-400">
                <Zap className="w-5 h-5" />
                <h3 className="font-semibold uppercase text-sm tracking-wider">Origins & Power Signature</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                   <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase">Inherent Traits (Born with)</label>
                    <textarea
                      value={formData.abilities?.inherent.join("\n")}
                      onChange={(e) => handleAbilityChange('inherent', e.target.value.split("\n"))}
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                   <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase">Acquired Traits (Engineered/Mastered)</label>
                    <textarea
                      value={formData.abilities?.acquired.join("\n")}
                      onChange={(e) => handleAbilityChange('acquired', e.target.value.split("\n"))}
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Factions & Species */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-blue-400">
                <Tag className="w-5 h-5" />
                <h3 className="font-semibold uppercase text-sm tracking-wider">Factions & Taxonomy</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase">Species / Hierarchy</label>
                  <input
                    type="text"
                    value={formData.factions?.species.join(", ")}
                    onChange={(e) => handleChange("factions", { ...formData.factions, species: e.target.value.split(",").map(s => s.trim()) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase">Allegiances</label>
                  <input
                    type="text"
                    value={formData.factions?.allegiance.join(", ")}
                    onChange={(e) => handleChange("factions", { ...formData.factions, allegiance: e.target.value.split(",").map(s => s.trim()) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>
              </div>
            </section>

            {/* Lore Editor */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <Book className="w-5 h-5" />
                <h3 className="font-semibold uppercase text-sm tracking-wider">Historical Records & Lore</h3>
              </div>
              <textarea
                value={formData.lore}
                onChange={(e) => handleChange("lore", e.target.value)}
                placeholder="The bloodlines of the fae were never meant to mingle with the lycan lineages..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-6 text-zinc-200 focus:outline-none focus:border-purple-500/50 transition-colors min-h-[300px] leading-relaxed font-serif text-lg"
              />
            </section>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/5 bg-black/40 flex items-center justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-purple-500/20"
            >
              Seal Record
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

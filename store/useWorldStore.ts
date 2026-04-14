import { create } from 'zustand';

export interface Character {
  id: string;
  name: string;
  aliases: string[];
  identities: string[];
  origins: string;
  abilities: {
    inherent: string[];
    acquired: string[];
  };
  lore: string;
  factions: {
    species: string[]; // Lycans, Fae, Vampires, etc.
    allegiance: string[];
  };
  metadata: {
    createdAt: number;
    updatedAt: number;
  };
}

interface WorldStore {
  characters: Record<string, Character>;
  activeCharacterId: string | null;
  
  setCharacters: (characters: Record<string, Character>) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  setActiveCharacterId: (id: string | null) => void;
}

export const useWorldStore = create<WorldStore>((set) => ({
  characters: {},
  activeCharacterId: null,

  setCharacters: (characters) => set({ characters }),
  
  updateCharacter: (id, updates) => set((state) => ({
    characters: {
      ...state.characters,
      [id]: {
        ...state.characters[id],
        ...updates,
        metadata: {
          ...state.characters[id]?.metadata,
          updatedAt: Date.now(),
        }
      }
    }
  })),

  setActiveCharacterId: (id) => set({ activeCharacterId: id }),
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Character {
  id: string;
  name: string;
  imageUrl?: string;
  sex?: string;
  lore?: string;
  aliases?: string[];
  identities?: string[];
  origins?: string;
  abilities?: { inherent: string[]; acquired: string[] };
  factions?: { species: string[]; allegiance: string[] };
  threads?: string[];
  metadata?: {
    createdAt: number;
    updatedAt: number;
    wordCount?: number;
  };
}

export interface Place {
  id: string;
  name: string;
  imageUrl?: string;
  description?: string;
  color?: string;
  updatedAt: number;
  createdAt: number;
}

export interface TimelineEvent {
  id: string;
  title: string;
  date?: string;
  description?: string;
  noteColor?: string;
  appearances?: string[];
  threads?: string;
  updatedAt: number;
  createdAt: number;
}

export interface Concept {
  id: string;
  name: string;
  category?: string;
  description?: string;
  color?: string;
  updatedAt: number;
  createdAt: number;
}

export interface Item {
  id: string;
  name: string;
  itemType?: string;
  description?: string;
  holder?: string;
  location?: string;
  color?: string;
  updatedAt: number;
  createdAt: number;
}

export interface Chapter {
  id: string;
  title: string;
  content?: string;
  noteColor?: string;
  appearances?: string[];
  threads?: string;
  updatedAt: number;
  createdAt: number;
}

export interface Note {
  id: string;
  title?: string;
  content: string;
  noteColor?: string;
  updatedAt: number;
  createdAt: number;
}

interface WorldState {
  characters: Record<string, Character>;
  places: Record<string, Place>;
  events: Record<string, TimelineEvent>;
  concepts: Record<string, Concept>;
  items: Record<string, Item>;
  chapters: Record<string, Chapter>;
  notes: Record<string, Note>;

  // Actions
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  upsertPlace: (id: string, updates: Partial<Place>) => void;
  upsertEvent: (id: string, updates: Partial<TimelineEvent>) => void;
  upsertConcept: (id: string, updates: Partial<Concept>) => void;
  upsertItem: (id: string, updates: Partial<Item>) => void;
  upsertChapter: (id: string, updates: Partial<Chapter>) => void;
  upsertNote: (id: string, updates: Partial<Note>) => void;
  
  // Bulk Actions for LoreSync
  setWorldState: (data: Partial<WorldState>) => void;
  resetWorld: () => void;
}

const countWords = (str: any) => {
  if (typeof str !== 'string') return 0;
  return str.trim().split(/\s+/).length;
};

const constrain = (obj: any) => {
  const constrained = { ...obj };
  Object.keys(constrained).forEach(key => {
    if (typeof constrained[key] === 'string') {
      // Allow image URLs to be long
      if (key === 'imageUrl') return;
      
      if (countWords(constrained[key]) > 300) {
        constrained[key] = constrained[key].split(/\s+/).slice(0, 300).join(' ') + '... (limit reached)';
      }
    }
  });
  return constrained;
};

export const useWorldStore = create<WorldState>()(
  persist(
    (set) => ({
      characters: {},
      places: {},
      events: {},
      concepts: {},
      items: {},
      chapters: {},
      notes: {},

      updateCharacter: (id, updates) => set((state) => {
        const existing = state.characters[id];
        const now = Date.now();
        const constrained = constrain(updates);
        
        return { 
          characters: { 
            ...state.characters, 
            [id]: { 
              ...existing, 
              ...constrained, 
              id, // Ensure ID is preserved
              metadata: {
                createdAt: existing?.metadata?.createdAt ?? now,
                updatedAt: now,
              } as any
            } 
          } 
        };
      }),

      deleteCharacter: (id) => set((state) => {
        const { [id]: _, ...rest } = state.characters;
        return { characters: rest };
      }),

      upsertPlace: (id, updates) => set((state) => {
        const existing = state.places[id];
        const now = Date.now();
        const constrained = constrain(updates);
        return { places: { ...state.places, [id]: { ...existing, ...constrained, id, createdAt: existing?.createdAt ?? now, updatedAt: now } } };
      }),

      upsertEvent: (id, updates) => set((state) => {
        const existing = state.events[id];
        const now = Date.now();
        const constrained = constrain(updates);
        return { events: { ...state.events, [id]: { ...existing, ...constrained, id, createdAt: existing?.createdAt ?? now, updatedAt: now } } };
      }),

      upsertConcept: (id, updates) => set((state) => {
        const existing = state.concepts[id];
        const now = Date.now();
        const constrained = constrain(updates);
        return { concepts: { ...state.concepts, [id]: { ...existing, ...constrained, id, createdAt: existing?.createdAt ?? now, updatedAt: now } } };
      }),

      upsertItem: (id, updates) => set((state) => {
        const existing = state.items[id];
        const now = Date.now();
        const constrained = constrain(updates);
        return { items: { ...state.items, [id]: { ...existing, ...constrained, id, createdAt: existing?.createdAt ?? now, updatedAt: now } } };
      }),

      upsertChapter: (id, updates) => set((state) => {
        const existing = state.chapters[id];
        const now = Date.now();
        const constrained = constrain(updates);
        return { chapters: { ...state.chapters, [id]: { ...existing, ...constrained, id, createdAt: existing?.createdAt ?? now, updatedAt: now } } };
      }),

      upsertNote: (id, updates) => set((state) => {
        const existing = state.notes[id];
        const now = Date.now();
        const constrained = constrain(updates);
        return { notes: { ...state.notes, [id]: { ...existing, ...constrained, id, createdAt: existing?.createdAt ?? now, updatedAt: now } } };
      }),

      setWorldState: (data) => set((state) => ({ ...state, ...data })),
      
      resetWorld: () => set({
        characters: {},
        places: {},
        events: {},
        concepts: {},
        items: {},
        chapters: {},
        notes: {}
      }),
    }),
    {
      name: 'lore-weaver-world-storage',
    }
  )
);

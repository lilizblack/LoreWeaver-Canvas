import { create } from 'zustand';

export interface CharacterRelationship {
  characterId: string;
  type: string; // e.g. "Sister", "Rival", "Mentor", "Love Interest"
}

export interface Character {
  id: string;
  name: string;
  sex?: string;
  aliases: string[];
  identities: string[];
  origins: string;
  abilities: {
    inherent: string[];
    acquired: string[];
  };
  lore: string;
  imageUrl?: string;
  factions: {
    species: string[];
    allegiance: string[];
  };
  relationships?: CharacterRelationship[];
  metadata: {
    createdAt: number;
    updatedAt: number;
  };
}

// ── Chapter library record — mirrors a chapter node's data ──────────────────
export interface ChapterRecord {
  id: string;
  title?: string;
  name?: string;
  summary?: string;
  beats?: string;
  threads?: string;
  worldBuilding?: string;
  wordCount?: string;
  chapterNumber?: string;
  noteColor?: string;
  appearances?: string[];
  createdAt: number;
  updatedAt: number;
}

// ── Generic note library record ─────────────────────────────────────────────
export interface NoteRecord {
  id: string;
  label?: string;
  content?: string;
  noteColor?: string;
  createdAt: number;
  updatedAt: number;
}

// ── Lore library records (one per node type on the Lore canvas) ─────────────
export interface PlaceRecord {
  id: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  imagePosition?: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
}

export interface EventRecord {
  id: string;
  title?: string;
  name?: string;
  content?: string;
  threads?: string;
  appearances?: string[];
  noteColor?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ConceptRecord {
  id: string;
  name?: string;
  category?: string;
  description?: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ItemRecord {
  id: string;
  name?: string;
  itemType?: string;
  description?: string;
  holder?: string;
  location?: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
}

interface WorldStore {
  characters: Record<string, Character>;
  chapters: Record<string, ChapterRecord>;
  notes: Record<string, NoteRecord>;
  places: Record<string, PlaceRecord>;
  events: Record<string, EventRecord>;
  concepts: Record<string, ConceptRecord>;
  items: Record<string, ItemRecord>;
  activeCharacterId: string | null;

  setCharacters: (characters: Record<string, Character>) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  setActiveCharacterId: (id: string | null) => void;

  setChapters: (chapters: Record<string, ChapterRecord>) => void;
  upsertChapter: (id: string, updates: Partial<ChapterRecord>) => void;
  deleteChapter: (id: string) => void;

  setNotes: (notes: Record<string, NoteRecord>) => void;
  upsertNote: (id: string, updates: Partial<NoteRecord>) => void;
  deleteNote: (id: string) => void;

  setPlaces: (places: Record<string, PlaceRecord>) => void;
  upsertPlace: (id: string, updates: Partial<PlaceRecord>) => void;
  deletePlace: (id: string) => void;

  setEvents: (events: Record<string, EventRecord>) => void;
  upsertEvent: (id: string, updates: Partial<EventRecord>) => void;
  deleteEvent: (id: string) => void;

  setConcepts: (concepts: Record<string, ConceptRecord>) => void;
  upsertConcept: (id: string, updates: Partial<ConceptRecord>) => void;
  deleteConcept: (id: string) => void;

  setItems: (items: Record<string, ItemRecord>) => void;
  upsertItem: (id: string, updates: Partial<ItemRecord>) => void;
  deleteItem: (id: string) => void;
}

export const useWorldStore = create<WorldStore>((set) => ({
  characters: {},
  chapters: {},
  notes: {},
  activeCharacterId: null,

  setCharacters: (characters) => set({ characters }),

  updateCharacter: (id, updates) => set((state) => {
    const existing = state.characters[id];
    const now = Date.now();
    return {
      characters: {
        ...state.characters,
        [id]: {
          ...existing,
          ...updates,
          metadata: {
            createdAt: existing?.metadata?.createdAt ?? now,
            updatedAt: now,
          } as any
        }
      }
    };
  }),

  deleteCharacter: (id) => set((state) => {
    const newCharacters = { ...state.characters };
    delete newCharacters[id];
    return {
      characters: newCharacters,
      activeCharacterId: state.activeCharacterId === id ? null : state.activeCharacterId
    };
  }),

  setActiveCharacterId: (id) => set({ activeCharacterId: id }),

  // ── Chapter library ──────────────────────────────────────────────────────
  setChapters: (chapters) => set({ chapters }),

  upsertChapter: (id, updates) => set((state) => {
    const existing = state.chapters[id];
    const now = Date.now();
    return {
      chapters: {
        ...state.chapters,
        [id]: {
          ...existing,
          ...updates,
          id,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        }
      }
    };
  }),

  deleteChapter: (id) => set((state) => {
    const next = { ...state.chapters };
    delete next[id];
    return { chapters: next };
  }),

  // ── Notes library ────────────────────────────────────────────────────────
  setNotes: (notes) => set({ notes }),

  upsertNote: (id, updates) => set((state) => {
    const existing = state.notes[id];
    const now = Date.now();
    return {
      notes: {
        ...state.notes,
        [id]: {
          ...existing,
          ...updates,
          id,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        }
      }
    };
  }),

  deleteNote: (id) => set((state) => {
    const next = { ...state.notes };
    delete next[id];
    return { notes: next };
  }),
}));

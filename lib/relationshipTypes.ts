// Shared relationship + character role definitions.
// Keeps colors/options consistent between the GrimoirePanel, CharacterNode,
// and auto-generated relationship edges on the canvas.

export interface RelationshipCategory {
  label: string;
  color: string;
  types: string[];
}

export const RELATIONSHIP_CATEGORIES: RelationshipCategory[] = [
  {
    label: 'Family',
    color: '#10b981', // emerald
    types: [
      'Mother', 'Father', 'Son', 'Daughter',
      'Brother', 'Sister',
      'Grandfather', 'Grandmother',
      'Grandson', 'Granddaughter',
      'Uncle', 'Aunt',
      'Nephew', 'Niece',
      'Cousin',
      'Stepfather', 'Stepmother', 'Stepbrother', 'Stepsister',
      'Half-brother', 'Half-sister',
      'Adoptive parent', 'Adoptive child',
      'In-law',
    ],
  },
  {
    label: 'Romance',
    color: '#ec4899', // pink
    types: [
      'Spouse', 'Husband', 'Wife',
      'Partner', 'Fiancé', 'Fiancée',
      'Boyfriend', 'Girlfriend',
      'Lover', 'Paramour',
      'Crush', 'Admirer',
      'Ex-lover', 'Ex-spouse', 'Ex-partner',
    ],
  },
  {
    label: 'Friendship',
    color: '#06b6d4', // cyan
    types: [
      'Best friend', 'Close friend', 'Friend',
      'Childhood friend', 'Old friend',
      'Confidant', 'Companion',
      'Roommate', 'Neighbor',
      'Pen pal',
    ],
  },
  {
    label: 'Mentor / Guide',
    color: '#3b82f6', // blue
    types: [
      'Mentor', 'Protégé',
      'Master', 'Apprentice', 'Student',
      'Teacher', 'Pupil',
      'Guardian', 'Ward',
      'Advisor', 'Counselor',
      'Handler',
    ],
  },
  {
    label: 'Work / Hierarchy',
    color: '#f59e0b', // amber
    types: [
      'Boss', 'Employer',
      'Employee', 'Subordinate',
      'Second-in-command', 'Second Hand', 'Right-hand',
      'Colleague', 'Coworker',
      'Business partner',
      'Client', 'Patron',
      'Lord', 'Liege', 'Vassal',
      'King', 'Queen', 'Prince', 'Princess',
      'Captain', 'Lieutenant',
      'Commander', 'Soldier',
      'Servant', 'Butler',
    ],
  },
  {
    label: 'Conflict',
    color: '#dc2626', // red
    types: [
      'Rival', 'Nemesis',
      'Sworn enemy', 'Arch-enemy',
      'Foe', 'Adversary',
      'Traitor', 'Betrayer',
      'Captor', 'Captive',
      'Hunter', 'Prey',
    ],
  },
  {
    label: 'Allegiance',
    color: '#8b5cf6', // violet
    types: [
      'Ally', 'Sworn ally',
      'Sidekick', 'Comrade',
      'Accomplice', 'Conspirator',
      'Follower', 'Disciple',
      'Leader',
    ],
  },
];

// Flat map { type → color } for quick lookup (case-insensitive)
const _TYPE_COLOR_MAP: Record<string, string> = {};
RELATIONSHIP_CATEGORIES.forEach(cat => {
  cat.types.forEach(t => {
    _TYPE_COLOR_MAP[t.toLowerCase()] = cat.color;
  });
});

export function getRelationshipColor(type: string | undefined | null): string {
  if (!type) return '#6d28d9';
  return _TYPE_COLOR_MAP[type.toLowerCase()] ?? '#6d28d9';
}

export function getRelationshipCategory(type: string | undefined | null): string | null {
  if (!type) return null;
  const match = RELATIONSHIP_CATEGORIES.find(cat =>
    cat.types.some(t => t.toLowerCase() === type.toLowerCase())
  );
  return match?.label ?? null;
}

// Flat ordered list for datalist
export const ALL_RELATIONSHIP_TYPES: string[] = RELATIONSHIP_CATEGORIES
  .flatMap(c => c.types);

// ─── Character Roles ───────────────────────────────────────────────────────
export interface CharacterRoleDef {
  value: string;
  color: string;
}

export const CHARACTER_ROLES: CharacterRoleDef[] = [
  { value: 'Protagonist',           color: '#a78bfa' }, // violet
  { value: 'Second Protagonist',    color: '#818cf8' }, // indigo
  { value: 'Deuteragonist',         color: '#60a5fa' }, // blue
  { value: 'Antagonist',            color: '#f87171' }, // red
  { value: 'Villain',               color: '#dc2626' }, // deep red
  { value: 'Anti-hero',             color: '#a3a3a3' }, // neutral
  { value: 'Supporting Character',  color: '#34d399' }, // emerald
  { value: 'Mentor',                color: '#3b82f6' }, // blue
  { value: 'Sidekick',              color: '#06b6d4' }, // cyan
  { value: 'Love Interest',         color: '#ec4899' }, // pink
  { value: 'Ally',                  color: '#8b5cf6' }, // violet
  { value: 'Foil',                  color: '#f59e0b' }, // amber
  { value: 'Herald',                color: '#fbbf24' }, // gold
  { value: 'Shadow',                color: '#475569' }, // slate
  { value: 'Trickster',             color: '#d946ef' }, // fuchsia
  { value: 'Comic Relief',          color: '#facc15' }, // yellow
  { value: 'Narrator',              color: '#94a3b8' }, // slate-lighter
  { value: 'Background Character',  color: '#64748b' }, // slate-dim
];

const _ROLE_COLOR_MAP: Record<string, string> = {};
CHARACTER_ROLES.forEach(r => { _ROLE_COLOR_MAP[r.value.toLowerCase()] = r.color; });

export function getRoleColor(role: string | undefined | null): string {
  if (!role) return '#a78bfa';
  return _ROLE_COLOR_MAP[role.toLowerCase()] ?? '#a78bfa';
}

import type { DrumPiece, PatternStep } from '@/types';

export type GrooveStyleId =
  | 'funk'
  | 'jazz'
  | 'rock'
  | 'hip-hop'
  | 'reggae'
  | 'latin'
  | 'metal'
  | 'disco'
  | 'blues'
  | 'electronic';

export interface GrooveHit {
  step: number;
  drumId: string;
  velocity: number;
}

export interface GroovePreset {
  id: GrooveStyleId;
  label: string;
  description: string;
  suggestedBpm: number;
  hits: GrooveHit[];
}

/** 16 steps = one bar of 16th notes (4/4). */
const LEN = 16;

/**
 * Snare steps with velocity below this render as ghost hits (UI + softer playback).
 * Accents should stay at or above ~0.78 so they read clearly against ghosts (~0.4–0.52).
 */
export const GHOST_VELOCITY_MAX = 0.72;

const GHOST_SNARE = 0.48;
const GHOST_SNARE_LIGHT = 0.42;

function emptyBar(kit: DrumPiece[]): PatternStep[] {
  return kit.map((drum) => ({ drumId: drum.id, velocity: 0.8, active: false }));
}

export function createEmptySteps(kit: DrumPiece[], length: number = LEN): PatternStep[][] {
  return Array.from({ length }, () => emptyBar(kit));
}

/**
 * Apply groove hits onto empty steps. Unknown drumIds are skipped if not in kit.
 */
export function stepsFromGrooveHits(kit: DrumPiece[], hits: GrooveHit[], length: number = LEN): PatternStep[][] {
  const steps = createEmptySteps(kit, length);
  const ids = new Set(kit.map((d) => d.id));

  for (const h of hits) {
    if (h.step < 0 || h.step >= length || !ids.has(h.drumId)) continue;
    const cell = steps[h.step].find((s) => s.drumId === h.drumId);
    if (cell) {
      cell.active = true;
      cell.velocity = h.velocity;
    }
  }
  return steps;
}

/** Overlay groove hits; keeps other active cells unless same drum+step (then overwrites velocity). */
export function mergeGrooveHitsIntoSteps(
  current: PatternStep[][],
  hits: GrooveHit[],
  kit: DrumPiece[]
): PatternStep[][] {
  const ids = new Set(kit.map((d) => d.id));
  const next = current.map((row) => row.map((s) => ({ ...s })));

  for (const h of hits) {
    if (h.step < 0 || h.step >= next.length || !ids.has(h.drumId)) continue;
    const cell = next[h.step].find((s) => s.drumId === h.drumId);
    if (cell) {
      cell.active = true;
      cell.velocity = h.velocity;
    }
  }
  return next;
}

/** Funk: 8th hats, backbeat snare, syncopated kick + ghost snares. */
const funkHits: GrooveHit[] = [
  ...[0, 2, 4, 6, 8, 10, 12, 14].map((s) => ({ step: s, drumId: 'hihat', velocity: 0.68 })),
  { step: 0, drumId: 'kick', velocity: 0.95 },
  { step: 7, drumId: 'kick', velocity: 0.78 },
  { step: 10, drumId: 'kick', velocity: 0.88 },
  { step: 4, drumId: 'snare', velocity: 0.92 },
  { step: 12, drumId: 'snare', velocity: 0.9 },
  { step: 6, drumId: 'snare', velocity: GHOST_SNARE },
  { step: 14, drumId: 'snare', velocity: GHOST_SNARE_LIGHT },
  { step: 3, drumId: 'snare', velocity: 0.5 },
];

/**
 * Jazz (straight 16ths): ride ostinato, feathered kick, light snare on 2 & 4.
 * Swing is approximated; user can nudge steps for feel.
 */
const jazzHits: GrooveHit[] = [
  { step: 0, drumId: 'ride', velocity: 0.52 },
  { step: 2, drumId: 'ride', velocity: 0.4 },
  { step: 4, drumId: 'ride', velocity: 0.5 },
  { step: 6, drumId: 'ride', velocity: 0.38 },
  { step: 8, drumId: 'ride', velocity: 0.52 },
  { step: 10, drumId: 'ride', velocity: 0.4 },
  { step: 12, drumId: 'ride', velocity: 0.48 },
  { step: 14, drumId: 'ride', velocity: 0.36 },
  { step: 0, drumId: 'kick', velocity: 0.42 },
  { step: 8, drumId: 'kick', velocity: 0.4 },
  { step: 4, drumId: 'snare', velocity: 0.82 },
  { step: 12, drumId: 'snare', velocity: 0.8 },
  { step: 11, drumId: 'snare', velocity: GHOST_SNARE_LIGHT },
  { step: 15, drumId: 'snare', velocity: 0.4 },
];

/** Rock: driving 8th hats, kick on 1 and 3, snare backbeat, push on 4&. */
const rockHits: GrooveHit[] = [
  ...[0, 2, 4, 6, 8, 10, 12, 14].map((s) => ({ step: s, drumId: 'hihat', velocity: 0.72 })),
  { step: 0, drumId: 'kick', velocity: 0.95 },
  { step: 8, drumId: 'kick', velocity: 0.9 },
  { step: 14, drumId: 'kick', velocity: 0.78 },
  { step: 4, drumId: 'snare', velocity: 0.92 },
  { step: 12, drumId: 'snare', velocity: 0.9 },
  { step: 6, drumId: 'crash', velocity: 0.45 },
];

/** Hip-hop: boom-bap style kick/snare, slightly laid-back hats. */
const hipHopHits: GrooveHit[] = [
  ...[0, 2, 4, 6, 8, 10, 12, 14].map((s) => ({ step: s, drumId: 'hihat', velocity: 0.52 })),
  { step: 0, drumId: 'kick', velocity: 0.95 },
  { step: 10, drumId: 'kick', velocity: 0.82 },
  { step: 4, drumId: 'snare', velocity: 0.9 },
  { step: 12, drumId: 'snare', velocity: 0.88 },
  { step: 7, drumId: 'snare', velocity: GHOST_SNARE },
];

/** Reggae: one-drop — kick on beat 3, snare on 2 & 4, steady hats. */
const reggaeHits: GrooveHit[] = [
  ...[0, 2, 4, 6, 8, 10, 12, 14].map((s) => ({ step: s, drumId: 'hihat', velocity: 0.58 })),
  { step: 8, drumId: 'kick', velocity: 0.92 },
  { step: 4, drumId: 'snare', velocity: 0.75 },
  { step: 12, drumId: 'snare', velocity: 0.73 },
];

/** Latin: syncopated kick, tom accents, busy hats (straight-grid salsa-ish). */
const latinHits: GrooveHit[] = [
  ...[0, 1, 4, 5, 8, 9, 12, 13].map((s) => ({ step: s, drumId: 'hihat', velocity: 0.55 })),
  { step: 0, drumId: 'kick', velocity: 0.9 },
  { step: 3, drumId: 'kick', velocity: 0.72 },
  { step: 6, drumId: 'kick', velocity: 0.68 },
  { step: 10, drumId: 'kick', velocity: 0.8 },
  { step: 4, drumId: 'snare', velocity: 0.55 },
  { step: 11, drumId: 'snare', velocity: 0.5 },
  { step: 7, drumId: 'mid-tom', velocity: 0.62 },
  { step: 14, drumId: 'high-tom', velocity: 0.58 },
  { step: 15, drumId: 'floor-tom', velocity: 0.65 },
];

/** Metal: fast kick bursts, heavy snare backbeat, crash accents. */
const metalHits: GrooveHit[] = [
  ...[0, 1, 2, 3, 8, 9, 10, 11].map((s) => ({ step: s, drumId: 'kick', velocity: 0.88 })),
  { step: 4, drumId: 'snare', velocity: 0.95 },
  { step: 12, drumId: 'snare', velocity: 0.93 },
  { step: 0, drumId: 'crash', velocity: 0.55 },
  { step: 8, drumId: 'crash-2', velocity: 0.5 },
  ...[2, 6, 10, 14].map((s) => ({ step: s, drumId: 'hihat', velocity: 0.45 })),
];

/** Disco / house: four-on-the-floor kick, offbeat hats, snare on 2 & 4. */
const discoHits: GrooveHit[] = [
  { step: 0, drumId: 'kick', velocity: 0.95 },
  { step: 4, drumId: 'kick', velocity: 0.95 },
  { step: 8, drumId: 'kick', velocity: 0.95 },
  { step: 12, drumId: 'kick', velocity: 0.95 },
  { step: 2, drumId: 'hihat', velocity: 0.85 },
  { step: 6, drumId: 'hihat', velocity: 0.85 },
  { step: 10, drumId: 'hihat', velocity: 0.85 },
  { step: 14, drumId: 'hihat', velocity: 0.85 },
  { step: 4, drumId: 'snare', velocity: 0.78 },
  { step: 12, drumId: 'snare', velocity: 0.76 },
];

/**
 * Blues shuffle feel approximated on a 16th grid (triplet spacing: 0,3,6,9…).
 */
const bluesHits: GrooveHit[] = [
  ...[0, 3, 6, 9, 12, 15].map((s) => ({ step: s, drumId: 'hihat', velocity: 0.62 })),
  { step: 0, drumId: 'kick', velocity: 0.92 },
  { step: 10, drumId: 'kick', velocity: 0.78 },
  { step: 4, drumId: 'snare', velocity: 0.88 },
  { step: 12, drumId: 'snare', velocity: 0.85 },
  { step: 7, drumId: 'snare', velocity: GHOST_SNARE },
];

/** Electronic / garage-leaning: sparse kick, snare, syncopated hats. */
const electronicHits: GrooveHit[] = [
  { step: 0, drumId: 'kick', velocity: 0.95 },
  { step: 8, drumId: 'kick', velocity: 0.85 },
  { step: 11, drumId: 'kick', velocity: 0.72 },
  { step: 4, drumId: 'snare', velocity: 0.88 },
  { step: 12, drumId: 'snare', velocity: 0.86 },
  ...[2, 5, 6, 10, 13, 14].map((s) => ({ step: s, drumId: 'hihat', velocity: 0.48 })),
  { step: 15, drumId: 'ride', velocity: 0.42 },
];

export const GROOVE_PRESETS: GroovePreset[] = [
  {
    id: 'funk',
    label: 'Funk',
    description: '8th-note hi-hats, syncopated kick, backbeat and ghost snares.',
    suggestedBpm: 92,
    hits: funkHits,
  },
  {
    id: 'jazz',
    label: 'Jazz',
    description: 'Ride ostinato, feather kick, light comping snare (straight 16ths).',
    suggestedBpm: 120,
    hits: jazzHits,
  },
  {
    id: 'rock',
    label: 'Rock',
    description: 'Classic backbeat, 8th hats, kick on 1 & 3 with a push into the next bar.',
    suggestedBpm: 118,
    hits: rockHits,
  },
  {
    id: 'hip-hop',
    label: 'Hip-hop',
    description: 'Boom-bap style: strong kick/snare, laid-back hi-hats, ghost snare.',
    suggestedBpm: 88,
    hits: hipHopHits,
  },
  {
    id: 'reggae',
    label: 'Reggae',
    description: 'One-drop: kick on beat 3, rim/backbeat snare on 2 & 4, steady hats.',
    suggestedBpm: 75,
    hits: reggaeHits,
  },
  {
    id: 'latin',
    label: 'Latin',
    description: 'Syncopated kick, tom fills, busier hat pattern (salsa-inspired on a straight grid).',
    suggestedBpm: 100,
    hits: latinHits,
  },
  {
    id: 'metal',
    label: 'Metal',
    description: 'Double-kick bursts, heavy snare on 2 & 4, crashes and tight hats.',
    suggestedBpm: 140,
    hits: metalHits,
  },
  {
    id: 'disco',
    label: 'Disco / house',
    description: 'Four-on-the-floor kick, offbeat hi-hats, snare/clap on backbeat.',
    suggestedBpm: 124,
    hits: discoHits,
  },
  {
    id: 'blues',
    label: 'Blues shuffle',
    description: 'Shuffle feel approximated on 16ths; kick, backbeat snare, triplet-ish hats.',
    suggestedBpm: 96,
    hits: bluesHits,
  },
  {
    id: 'electronic',
    label: 'Electronic',
    description: 'UK garage–leaning: broken kick, syncopated hats, light ride accent.',
    suggestedBpm: 130,
    hits: electronicHits,
  },
];

export function getGroovePreset(id: GrooveStyleId): GroovePreset | undefined {
  return GROOVE_PRESETS.find((p) => p.id === id);
}

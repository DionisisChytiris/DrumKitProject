/**
 * Default General MIDI percussion note → app drum id map.
 * Matches the ids in `defaultDrumKit` (`kick`, `snare`, `hihat`, …).
 * Custom per-user mapping UI can override this in a later step.
 */
import type { DrumPiece } from '@/types';

export const DEFAULT_GM_NOTE_TO_DRUM_ID: Readonly<Record<number, string>> = {
  35: 'kick',
  36: 'kick',
  37: 'snare',
  38: 'snare',
  39: 'snare',
  40: 'snare',
  41: 'low-floor-tom',
  42: 'hihat',
  43: 'floor-tom',
  44: 'hihat',
  45: 'floor-tom',
  46: 'hihat',
  47: 'mid-tom',
  48: 'mid-tom',
  49: 'crash',
  50: 'high-tom',
  51: 'ride',
  52: 'china',
  53: 'ride',
  55: 'crash-2',
  57: 'crash-2',
};

/** Resolve a MIDI note number to an app drum id, or null if unmapped. */
export function mapMidiNoteToDrumId(note: number): string | null {
  return DEFAULT_GM_NOTE_TO_DRUM_ID[note] ?? null;
}

/** O(1) lookup table: MIDI note number → drum piece (for low-latency MIDI playback). */
export function buildMidiNoteDrumMap(drumKit: ReadonlyArray<DrumPiece>): Map<number, DrumPiece> {
  const byId = new Map(drumKit.map((drum) => [drum.id, drum]));
  const map = new Map<number, DrumPiece>();

  for (const [noteStr, drumId] of Object.entries(DEFAULT_GM_NOTE_TO_DRUM_ID)) {
    const piece = byId.get(drumId);
    if (piece) {
      map.set(Number(noteStr), piece);
    }
  }

  return map;
}

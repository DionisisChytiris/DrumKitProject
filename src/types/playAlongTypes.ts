/**
 * MusicXML + audio play-along exercise (OSMD score viewer).
 * Add entries in src/data/playAlongExercises.ts — no new component file needed.
 */
export interface PlayAlongExerciseDefinition {
  /** Stable slug, e.g. "funky-groove" */
  id: string;
  title: string;
  /** Short line under the title in the player toolbar */
  subtitle: string;
  /** Public URL to .musicxml / .xml under /public */
  scoreUrl: string;
  /** Public URL to backing track under /public */
  audioUrl: string;
  /**
   * Optional starting BPM for the tempo control before the score loads.
   * After load, tempo is taken from the MusicXML when available.
   */
  defaultBpm?: number;
  /** Seconds to nudge score sync vs audio (negative = score leads) */
  playbackOffsetSeconds?: number;
  /**
   * When true, MIDI snare hits are recorded during playback and graded at the end.
   * Start with snare-only exercises; expand later.
   */
  kitPractice?: boolean;
  /** Drum id to grade in kit practice (default `snare`). */
  kitPracticeDrumId?: string;
}

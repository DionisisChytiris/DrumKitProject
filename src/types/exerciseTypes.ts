/**
 * Exercise data structure for VexFlow drum exercises
 */

export interface DrumNote {
  /** VexFlow key notation (e.g., "f/2" for kick, "c/3" for snare, "x/5" for hi-hat) */
  key: string;
  /** Line position on the staff */
  line: number;
  /** Whether this note should have a custom notehead (like X for hi-hat) */
  customNoteHead?: boolean;
}

export interface ExerciseBeat {
  /** Beat number (1-4 for 4/4 time) */
  beat: number;
  /** Position within the beat (0-7 for eighth notes) */
  position: number;
  /** Drums to play on this position */
  drums: DrumNote[];
}

export interface ExerciseDefinition {
  /** Unique exercise ID */
  id: number;
  /** Exercise title */
  title: string;
  /** Exercise description */
  description?: string;
  /** Time signature numerator (e.g., 4 for 4/4) */
  timeSignature: number;
  /** Number of bars */
  bars: number;
  /** Note duration (e.g., "8" for eighth notes) */
  noteDuration: string;
  /** Pattern definition - function that returns drums for each position */
  pattern: (beat: number, position: number, totalPosition: number) => DrumNote[];
}

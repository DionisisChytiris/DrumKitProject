import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Subdivision = 'quarters' | 'eighths' | 'sixteenths' | 'triplets';
export type ClickSound = 'tick' | 'beep' | 'wood' | 'metallic';

export type TimeSignatureDenominator = 2 | 4 | 8 | 16;

export interface TimeSignatureSegment {
  id: string;
  bars: number;
  numerator: number;
  denominator: TimeSignatureDenominator;
}

const createSegmentId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `seg-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

export const makeTimeSignatureSegment = (
  overrides?: Partial<Omit<TimeSignatureSegment, 'id'>> & { id?: string }
): TimeSignatureSegment => {
  const denom = overrides?.denominator;
  const safeDenom: TimeSignatureDenominator =
    denom === 2 || denom === 4 || denom === 8 || denom === 16 ? denom : 4;
  return {
    id: overrides?.id ?? createSegmentId(),
    bars: Math.max(1, Math.min(999, overrides?.bars ?? 4)),
    numerator: Math.max(1, Math.min(19, overrides?.numerator ?? 4)),
    denominator: safeDenom,
  };
};

export interface MetronomeState {
  bpm: number;
  isPlaying: boolean;
  subdivision: Subdivision;
  timeSignature: number; // Numerator
  timeSignatureDenom: number; // Denominator (2, 4, 8, 16)
  volume: number; // 0-1
  clickSound: ClickSound;
  swing: number; // 0-100
  accentPattern: boolean[]; // Array of booleans for each beat
  visualFlashIntensity: number; // 0-1
  /** When true, playback cycles `timeSignatureSegments` (each row = N bars at that meter). */
  useTimeSignatureSequence: boolean;
  timeSignatureSegments: TimeSignatureSegment[];
}

const initialState: MetronomeState = {
  bpm: 120,
  isPlaying: false,
  subdivision: 'quarters',
  timeSignature: 4,
  timeSignatureDenom: 4,
  volume: 0.7,
  clickSound: 'tick',
  swing: 0,
  accentPattern: [true, false, false, false], // First beat accented by default
  visualFlashIntensity: 0.5,
  useTimeSignatureSequence: false,
  timeSignatureSegments: [makeTimeSignatureSegment()],
};

const metronomeSlice = createSlice({
  name: 'metronome',
  initialState,
  reducers: {
    setBpm: (state, action: PayloadAction<number>) => {
      const clampedBpm = Math.max(30, Math.min(400, action.payload));
      if (!isNaN(clampedBpm) && clampedBpm >= 30 && clampedBpm <= 400) {
        state.bpm = clampedBpm;
      }
    },
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },
    setSubdivision: (state, action: PayloadAction<Subdivision>) => {
      state.subdivision = action.payload;
    },
    setTimeSignature: (state, action: PayloadAction<number>) => {
      const value = Math.max(1, Math.min(19, action.payload));
      if (value >= 1 && value <= 19) {
        state.timeSignature = value;
        // Update accent pattern length to match new time signature
        const newPattern = new Array(value).fill(false);
        const minLength = Math.min(state.accentPattern.length, value);
        for (let i = 0; i < minLength; i++) {
          newPattern[i] = state.accentPattern[i];
        }
        // Ensure at least first beat is accented
        if (!newPattern.some(acc => acc)) {
          newPattern[0] = true;
        }
        state.accentPattern = newPattern;
      }
    },
    setTimeSignatureDenom: (state, action: PayloadAction<number>) => {
      if ([2, 4, 8, 16].includes(action.payload)) {
        state.timeSignatureDenom = action.payload;
        // Auto-change subdivision when denominator changes
        if (action.payload === 8) {
          state.subdivision = 'eighths';
        } else if (action.payload === 16) {
          state.subdivision = 'sixteenths';
        } else if (action.payload === 2 || action.payload === 4) {
          state.subdivision = 'quarters';
        }
      }
    },
    setVolume: (state, action: PayloadAction<number>) => {
      const clampedVolume = Math.max(0, Math.min(1, action.payload));
      state.volume = clampedVolume;
    },
    setClickSound: (state, action: PayloadAction<ClickSound>) => {
      state.clickSound = action.payload;
    },
    setSwing: (state, action: PayloadAction<number>) => {
      const clampedSwing = Math.max(0, Math.min(100, action.payload));
      state.swing = clampedSwing;
    },
    setAccentPattern: (state, action: PayloadAction<boolean[]>) => {
      state.accentPattern = action.payload;
    },
    toggleAccent: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (index >= 0 && index < state.accentPattern.length) {
        state.accentPattern[index] = !state.accentPattern[index];
        // Ensure at least one beat is accented
        if (!state.accentPattern.some(acc => acc)) {
          state.accentPattern[0] = true;
        }
      }
    },
    setVisualFlashIntensity: (state, action: PayloadAction<number>) => {
      const clamped = Math.max(0, Math.min(1, action.payload));
      state.visualFlashIntensity = clamped;
    },
    setUseTimeSignatureSequence: (state, action: PayloadAction<boolean>) => {
      state.useTimeSignatureSequence = action.payload;
    },
    setTimeSignatureSegments: (state, action: PayloadAction<TimeSignatureSegment[]>) => {
      const next = action.payload.filter((s) => s && s.id);
      state.timeSignatureSegments = next.length ? next : [makeTimeSignatureSegment()];
    },
    addTimeSignatureSegment: (state) => {
      state.timeSignatureSegments.push(makeTimeSignatureSegment({ bars: 4, numerator: 4, denominator: 4 }));
    },
    removeTimeSignatureSegment: (state, action: PayloadAction<string>) => {
      if (state.timeSignatureSegments.length <= 1) return;
      state.timeSignatureSegments = state.timeSignatureSegments.filter((s) => s.id !== action.payload);
    },
    updateTimeSignatureSegment: (
      state,
      action: PayloadAction<{
        id: string;
        patch: Partial<Pick<TimeSignatureSegment, 'bars' | 'numerator' | 'denominator'>>;
      }>
    ) => {
      const seg = state.timeSignatureSegments.find((s) => s.id === action.payload.id);
      if (!seg) return;
      const { patch } = action.payload;
      if (patch.bars != null) seg.bars = Math.max(1, Math.min(999, Math.floor(patch.bars)));
      if (patch.numerator != null) seg.numerator = Math.max(1, Math.min(19, Math.floor(patch.numerator)));
      if (patch.denominator != null && [2, 4, 8, 16].includes(patch.denominator)) {
        seg.denominator = patch.denominator as TimeSignatureDenominator;
      }
    },
    toggleMetronome: (state) => {
      state.isPlaying = !state.isPlaying;
    },
    resetMetronome: (state) => {
      state.isPlaying = false;
    },
  },
});

export const {
  setBpm,
  setIsPlaying,
  setSubdivision,
  setTimeSignature,
  setTimeSignatureDenom,
  setVolume,
  setClickSound,
  setSwing,
  setAccentPattern,
  toggleAccent,
  setVisualFlashIntensity,
  setUseTimeSignatureSequence,
  setTimeSignatureSegments,
  addTimeSignatureSegment,
  removeTimeSignatureSegment,
  updateTimeSignatureSegment,
  toggleMetronome,
  resetMetronome,
} = metronomeSlice.actions;

export default metronomeSlice.reducer;

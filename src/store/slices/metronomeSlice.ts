import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Subdivision = 'quarters' | 'eighths' | 'sixteenths' | 'triplets';
export type ClickSound = 'tick' | 'beep' | 'wood' | 'metallic';

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
};

const metronomeSlice = createSlice({
  name: 'metronome',
  initialState,
  reducers: {
    setBpm: (state, action: PayloadAction<number>) => {
      const clampedBpm = Math.max(30, Math.min(300, action.payload));
      if (!isNaN(clampedBpm) && clampedBpm >= 30 && clampedBpm <= 300) {
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
      const value = Math.max(2, Math.min(19, action.payload));
      if (value >= 2 && value <= 19) {
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
  toggleMetronome,
  resetMetronome,
} = metronomeSlice.actions;

export default metronomeSlice.reducer;

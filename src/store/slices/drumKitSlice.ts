import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DrumPiece } from '@/types';
import { defaultDrumKit } from '@/utils/drumConfig';

export interface DrumSample {
  id: string;
  name: string;
  type: string;
  audioUrl?: string;
  isCustom?: boolean;
  file?: File;
}

export interface DrumKitState {
  drumKit: DrumPiece[];
  customSamples: Record<string, DrumSample[]>; // key: drum type, value: array of samples
}

const initialState: DrumKitState = {
  drumKit: defaultDrumKit,
  customSamples: {},
};

const drumKitSlice = createSlice({
  name: 'drumKit',
  initialState,
  reducers: {
    updateDrumKit: (state, action: PayloadAction<DrumPiece[]>) => {
      state.drumKit = action.payload;
    },
    updateDrumPiece: (state, action: PayloadAction<{ id: string; updates: Partial<DrumPiece> }>) => {
      const { id, updates } = action.payload;
      const index = state.drumKit.findIndex(drum => drum.id === id);
      if (index !== -1) {
        state.drumKit[index] = { ...state.drumKit[index], ...updates };
      }
    },
    addCustomSample: (state, action: PayloadAction<{ type: string; sample: DrumSample }>) => {
      const { type, sample } = action.payload;
      if (!state.customSamples[type]) {
        state.customSamples[type] = [];
      }
      state.customSamples[type].push(sample);
    },
    removeCustomSample: (state, action: PayloadAction<{ type: string; sampleId: string }>) => {
      const { type, sampleId } = action.payload;
      if (state.customSamples[type]) {
        state.customSamples[type] = state.customSamples[type].filter(s => s.id !== sampleId);
      }
    },
    loadState: (state, action: PayloadAction<DrumKitState>) => {
      return action.payload;
    },
  },
});

export const { 
  updateDrumKit, 
  updateDrumPiece, 
  addCustomSample, 
  removeCustomSample,
  loadState 
} = drumKitSlice.actions;

export default drumKitSlice.reducer;

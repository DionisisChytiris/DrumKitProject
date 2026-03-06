import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DrumMixerSettings } from '@/types';

export interface MixerState {
  drumSettings: Record<string, DrumMixerSettings>;
  globalVolume: number;
  globalReverb: number;
  globalCompression: number;
  globalEQ: {
    low: number;
    mid: number;
    high: number;
  };
  velocitySensitivity: number;
}

const initialState: MixerState = {
  drumSettings: {},
  globalVolume: 0.7,
  globalReverb: 0.2,
  globalCompression: 0.3,
  globalEQ: {
    low: 0,
    mid: 0,
    high: 0,
  },
  velocitySensitivity: 0.5,
};

// Load from localStorage
const loadMixerState = (): MixerState | undefined => {
  try {
    const serialized = localStorage.getItem('mixerState');
    if (serialized) {
      const parsed = JSON.parse(serialized);
      // Validate globalVolume is a finite number
      if (parsed.globalVolume !== undefined) {
        if (!Number.isFinite(parsed.globalVolume) || isNaN(parsed.globalVolume)) {
          console.warn('[MixerSlice] Invalid globalVolume in localStorage, resetting to 0.7');
          parsed.globalVolume = 0.7;
        } else {
          // Clamp between 0 and 1
          parsed.globalVolume = Math.max(0, Math.min(1, parsed.globalVolume));
        }
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error loading mixer state:', err);
  }
  return undefined;
};

const savedState = loadMixerState();

const mixerSlice = createSlice({
  name: 'mixer',
  initialState: savedState || initialState,
  reducers: {
    updateDrumSetting: (
      state,
      action: PayloadAction<{ drumId: string; setting: keyof DrumMixerSettings; value: number | { low: number; mid: number; high: number } }>
    ) => {
      const { drumId, setting, value } = action.payload;
      console.log(`[MixerSlice] updateDrumSetting:`, { drumId, setting, value });
      
      // Ensure drum settings exist
      if (!state.drumSettings[drumId]) {
        state.drumSettings[drumId] = {
          volume: 0.8,
          pan: 0,
          reverb: 0.1,
          compression: 0.2,
          eq: { low: 0, mid: 0, high: 0 },
        };
      }
      
      // Get current settings
      const currentSettings = state.drumSettings[drumId];
      
      // Create updated settings object
      let updatedSettings: DrumMixerSettings;
      
      if (setting === 'eq') {
        updatedSettings = {
          ...currentSettings,
          eq: value as { low: number; mid: number; high: number },
        };
      } else {
        // Validate numeric values are finite
        const numValue = value as number;
        if (!Number.isFinite(numValue) || isNaN(numValue)) {
          console.warn(`[MixerSlice] Invalid ${setting} value for ${drumId}: ${numValue}, using current value`);
          updatedSettings = { ...currentSettings };
        } else {
          // Clamp volume, pan, reverb, compression between valid ranges
          let validatedValue = numValue;
          if (setting === 'volume') {
            validatedValue = Math.max(0, Math.min(1, numValue));
          } else if (setting === 'pan') {
            validatedValue = Math.max(-1, Math.min(1, numValue));
          } else if (setting === 'reverb' || setting === 'compression') {
            validatedValue = Math.max(0, Math.min(1, numValue));
          }
          
          updatedSettings = {
            ...currentSettings,
            [setting]: validatedValue,
          };
        }
      }
      
      console.log(`[MixerSlice] Before update - current:`, currentSettings);
      console.log(`[MixerSlice] After update - new:`, updatedSettings);
      
      // IMPORTANT: Create a new drumSettings object to ensure reference changes
      // This ensures React detects the state change
      state.drumSettings = {
        ...state.drumSettings,
        [drumId]: updatedSettings,
      };
      
      console.log(`[MixerSlice] State after assignment:`, state.drumSettings[drumId]);
    },
    initializeDrumSettings: (state, action: PayloadAction<Array<{ id: string }>>) => {
      action.payload.forEach((drum) => {
        if (!state.drumSettings[drum.id]) {
          state.drumSettings[drum.id] = {
            volume: 0.8,
            pan: 0,
            reverb: 0.1,
            compression: 0.2,
            eq: { low: 0, mid: 0, high: 0 },
          };
        }
      });
    },
    setGlobalReverb: (state, action: PayloadAction<number>) => {
      state.globalReverb = action.payload;
    },
    setGlobalCompression: (state, action: PayloadAction<number>) => {
      state.globalCompression = action.payload;
    },
    setGlobalEQ: (state, action: PayloadAction<{ low: number; mid: number; high: number }>) => {
      state.globalEQ = action.payload;
    },
    setVelocitySensitivity: (state, action: PayloadAction<number>) => {
      state.velocitySensitivity = action.payload;
    },
    setGlobalVolume: (state, action: PayloadAction<number>) => {
      // Validate that the payload is a finite number
      if (!Number.isFinite(action.payload) || isNaN(action.payload)) {
        console.warn(`[MixerSlice] Attempted to set invalid globalVolume: ${action.payload}, using 0.7`);
        state.globalVolume = 0.7;
        return;
      }
      // Clamp between 0 and 1
      state.globalVolume = Math.max(0, Math.min(1, action.payload));
    },
    resetMixerSettings: () => {
      return initialState;
    },
  },
});

export const {
  updateDrumSetting,
  initializeDrumSettings,
  setGlobalVolume,
  setGlobalReverb,
  setGlobalCompression,
  setGlobalEQ,
  setVelocitySensitivity,
  resetMixerSettings,
} = mixerSlice.actions;

export default mixerSlice.reducer;

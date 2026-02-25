import { configureStore } from '@reduxjs/toolkit';
import drumKitReducer from './slices/drumKitSlice';
import metronomeReducer from './slices/metronomeSlice';
import { defaultDrumKit } from '@/utils/drumConfig';

// Load state from localStorage on store creation
const loadState = () => {
  try {
    const serializedState = localStorage.getItem('drumKitState');
    if (serializedState === null) {
      return undefined;
    }
    const parsed = JSON.parse(serializedState);
    
    // Merge saved drumKit with defaultDrumKit to ensure audioUrls are preserved
    if (parsed.drumKit?.drumKit) {
      parsed.drumKit.drumKit = parsed.drumKit.drumKit.map((savedDrum: any) => {
        const defaultDrum = defaultDrumKit.find(d => d.id === savedDrum.id);
        // Merge saved drum with default, prioritizing saved audioUrl if it exists
        return {
          ...defaultDrum,
          ...savedDrum,
          // Only use saved audioUrl if it exists, otherwise use default
          audioUrl: savedDrum.audioUrl || defaultDrum?.audioUrl,
        };
      });
    }
    
    // Filter out File objects from customSamples (they can't be serialized)
    if (parsed.drumKit?.customSamples) {
      Object.keys(parsed.drumKit.customSamples).forEach(type => {
        parsed.drumKit.customSamples[type] = parsed.drumKit.customSamples[type].map((sample: any) => {
          const { file, ...sampleWithoutFile } = sample;
          return sampleWithoutFile;
        });
      });
    }
    return parsed;
  } catch (err) {
    console.error('Error loading state from localStorage:', err);
    return undefined;
  }
};

const preloadedState = loadState();

export const store = configureStore({
  reducer: {
    drumKit: drumKitReducer,
    metronome: metronomeReducer,
  },
  preloadedState: preloadedState || undefined,
});

// Save state to localStorage whenever it changes
store.subscribe(() => {
  try {
    const state = store.getState();
    const serializedState = JSON.stringify(state);
    localStorage.setItem('drumKitState', serializedState);
  } catch (err) {
    console.error('Error saving state to localStorage:', err);
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

import type { Subdivision } from '@/store/slices/metronomeSlice';

export const getSubdivisionConfig = (sub: Subdivision, ts: number, tsDenom: number) => {
  // If denominator is not 4, play only the numerator beats (no subdivisions)
  if (tsDenom !== 4) {
    // 2 = half notes (2x longer), 8 = eighth notes (0.5x), 16 = sixteenth notes (0.25x)
    const intervalMultiplier = tsDenom === 2 ? 2 : tsDenom === 8 ? 0.5 : tsDenom === 16 ? 0.25 : 1;
    return { beatsPerMeasure: ts, intervalMultiplier };
  }

  // For 4/4 time, use subdivisions
  const beatsPerMeasure = ts; // Time signature numerator determines main beats
  switch (sub) {
    case 'quarters':
      return { beatsPerMeasure, intervalMultiplier: 1 };
    case 'eighths':
      return { beatsPerMeasure: beatsPerMeasure * 2, intervalMultiplier: 0.5 };
    case 'sixteenths':
      return { beatsPerMeasure: beatsPerMeasure * 4, intervalMultiplier: 0.25 };
    case 'triplets':
      return { beatsPerMeasure: beatsPerMeasure * 3, intervalMultiplier: 1 / 3 };
    default:
      return { beatsPerMeasure, intervalMultiplier: 1 };
  }
};

// Calculate the main beat number (1..timeSignature) based on current beat, subdivision, and time signature
export const getMainBeatNumber = (
  currentBeat: number,
  sub: Subdivision,
  ts: number,
  tsDenom: number
): number => {
  // If denominator is not 4, each beat is a main beat (no subdivisions)
  if (tsDenom !== 4) {
    return (currentBeat % ts) + 1;
  }

  // For 4/4 time, use subdivision logic
  switch (sub) {
    case 'quarters':
      return (currentBeat % ts) + 1;
    case 'eighths':
      return (Math.floor(currentBeat / 2) % ts) + 1;
    case 'sixteenths':
      return (Math.floor(currentBeat / 4) % ts) + 1;
    case 'triplets':
      return (Math.floor(currentBeat / 3) % ts) + 1;
    default:
      return (currentBeat % ts) + 1;
  }
};

// Determine if current beat should be a main click or ghost click
export const isMainClick = (currentBeat: number, sub: Subdivision, tsDenom: number): boolean => {
  // If denominator is not 4, all beats are main clicks (no ghost notes)
  if (tsDenom !== 4) return true;

  switch (sub) {
    case 'quarters':
      return true;
    case 'eighths':
      // Main clicks on beats 0, 2, 4, 6
      return currentBeat % 2 === 0;
    case 'sixteenths':
      // Main clicks on beats 0, 4, 8, 12
      return currentBeat % 4 === 0;
    case 'triplets':
      // Main clicks on beats 0, 3, 6, 9
      return currentBeat % 3 === 0;
    default:
      return true;
  }
};


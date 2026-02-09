import { DrumPiece } from '@/types';

/**
 * Realistic drum kit configuration
 * Sizes based on standard acoustic drum dimensions:
 * - Kick: 20-22" (we'll use 22")
 * - Snare: 14"
 * - High Tom: 10-12" (we'll use 10")
 * - Mid Tom: 12-13" (we'll use 12")
 * - Floor Tom: 14-16" (we'll use 16")
 * - Cymbals: 14-20" (Crash 16", Ride 20", Hi-hat 14")
 * 
 * Layout from drummer's perspective (natural reach)
 */
export const defaultDrumKit: DrumPiece[] = [
  // Kick drum (22" bass drum) - bottom center, largest
  {
    id: 'kick',
    name: 'Kick Drum',
    type: 'kick',
    position: { x: 50, y: 88 },
    size: { width: 220, height: 160 },
    keyBinding: 'Space',
  },
  // Snare drum (14") - center, main focus
  {
    id: 'snare',
    name: 'Snare Drum',
    type: 'snare',
    position: { x: 50, y: 58 },
    size: { width: 140, height: 140 },
    keyBinding: 'S',
  },
  // Hi-hat (14") - left side, slightly above snare
  {
    id: 'hihat',
    name: 'Hi-Hat',
    type: 'hihat',
    position: { x: 28, y: 50 },
    size: { width: 140, height: 140 },
    keyBinding: 'H',
  },
  // Crash cymbal (16") - top left
  {
    id: 'crash',
    name: 'Crash Cymbal',
    type: 'cymbal',
    position: { x: 22, y: 28 },
    size: { width: 160, height: 160 },
    keyBinding: 'C',
  },
  // High tom (10") - left of snare, slightly higher
  {
    id: 'high-tom',
    name: 'High Tom',
    type: 'tom',
    position: { x: 38, y: 42 },
    size: { width: 100, height: 100 },
    keyBinding: 'T',
  },
  // Mid tom (12") - right of snare, slightly higher
  {
    id: 'mid-tom',
    name: 'Mid Tom',
    type: 'tom',
    position: { x: 62, y: 42 },
    size: { width: 120, height: 120 },
    keyBinding: 'M',
  },
  // Floor tom (16") - right side, lower position
  {
    id: 'floor-tom',
    name: 'Floor Tom',
    type: 'tom',
    position: { x: 72, y: 68 },
    size: { width: 160, height: 160 },
    keyBinding: 'F',
  },
  // Ride cymbal (20") - top right, largest cymbal
  {
    id: 'ride',
    name: 'Ride Cymbal',
    type: 'cymbal',
    position: { x: 78, y: 32 },
    size: { width: 200, height: 200 },
    keyBinding: 'R',
  },
];

/**
 * Sample exercises for demonstration
 */
export const sampleExercises = [
  {
    id: 'ex1',
    title: 'Basic 4/4 Beat',
    description: 'Practice the fundamental rock beat pattern',
    difficulty: 'beginner' as const,
    pattern: ['kick', 'snare', 'kick', 'snare'],
    bpm: 80,
  },
  {
    id: 'ex2',
    title: 'Tom Roll',
    description: 'Practice moving between toms',
    difficulty: 'beginner' as const,
    pattern: ['high-tom', 'mid-tom', 'floor-tom', 'snare'],
    bpm: 100,
  },
  {
    id: 'ex3',
    title: 'Cymbal Accents',
    description: 'Add cymbal accents to your beats',
    difficulty: 'intermediate' as const,
    pattern: ['hihat', 'crash', 'hihat', 'ride'],
    bpm: 120,
  },
];

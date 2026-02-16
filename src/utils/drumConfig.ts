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
/**
 * Helper function to get audio file path
 * 
 * Place your audio files in: public/audio/
 * 
 * Supported formats: .mp3, .wav, .ogg
 * 
 * Usage:
 *   - getAudioPath('kick') → /audio/kick.mp3
 *   - getAudioPath('snare1', 'wav') → /audio/snare1.wav
 *   - getAudioPath('kick 1', 'wav') → /audio/kick 1.wav (handles spaces)
 * 
 * For files with spaces, you can also set audioUrl directly:
 *   audioUrl: '/audio/kick 1.wav'
 * 
 * If the file doesn't exist, the system will fall back to generateTone() in audioManager.ts
 */
const getAudioPath = (filename: string, extension?: string): string => {
  // If extension is provided, treat filename as base name
  if (extension) {
    return `/audio/${filename}.${extension}`;
  }
  // Otherwise, filename is the full filename (may include extension and spaces)
  return `/audio/${filename}`;
};

export const defaultDrumKit: DrumPiece[] = [
  // Kick drum (22" bass drum) - bottom center, largest
  {
    id: 'kick',
    name: 'Kick Drum',
    type: 'kick',
    position: { x: 50, y: 88 },
    size: { width: 220, height: 160 },
    keyBinding: 'Space',
    audioUrl: getAudioPath('kick 1', 'wav'), // Default: kick 1.wav (change to 'kick 2.wav' or any other file)
  },
  // Snare drum (14") - center, main focus
  {
    id: 'snare',
    name: 'Snare Drum',
    type: 'snare',
    position: { x: 50, y: 58 },
    size: { width: 140, height: 140 },
    keyBinding: 'S',
    audioUrl: getAudioPath('snare1', 'wav'), // Using snare1.wav from public/audio/
  },
  // Hi-hat (14") - left side, slightly above snare
  {
    id: 'hihat',
    name: 'Hi-Hat',
    type: 'hihat',
    position: { x: 28, y: 50 },
    size: { width: 140, height: 140 },
    keyBinding: 'H',
    audioUrl: getAudioPath('hihat'), // Add your hihat.wav/mp3/ogg to public/audio/
  },
  // Crash cymbal (16") - top left
  {
    id: 'crash',
    name: 'Crash Cymbal',
    type: 'cymbal',
    position: { x: 22, y: 28 },
    size: { width: 160, height: 160 },
    keyBinding: 'C',
    audioUrl: getAudioPath('crash'), // Add your crash.wav/mp3/ogg to public/audio/
  },
  // Crash cymbal 2 (16") - second crash, typically positioned on right side
  {
    id: 'crash-2',
    name: 'Crash Cymbal 2',
    type: 'cymbal',
    position: { x: 75, y: 28 },
    size: { width: 160, height: 160 },
    keyBinding: 'V',
    audioUrl: getAudioPath('crash-2'), // Add your crash-2.wav/mp3/ogg to public/audio/
  },
  // High tom (10") - left of snare, slightly higher
  {
    id: 'high-tom',
    name: 'High Tom',
    type: 'tom',
    position: { x: 38, y: 42 },
    size: { width: 100, height: 100 },
    keyBinding: 'T',
    audioUrl: getAudioPath('high-tom'), // Add your high-tom.wav/mp3/ogg to public/audio/
  },
  // Mid tom (12") - right of snare, slightly higher
  {
    id: 'mid-tom',
    name: 'Mid Tom',
    type: 'tom',
    position: { x: 62, y: 42 },
    size: { width: 120, height: 120 },
    keyBinding: 'M',
    audioUrl: getAudioPath('mid-tom'), // Add your mid-tom.wav/mp3/ogg to public/audio/
  },
  // Floor tom (16") - right side, lower position
  {
    id: 'floor-tom',
    name: 'Floor Tom',
    type: 'tom',
    position: { x: 72, y: 68 },
    size: { width: 160, height: 160 },
    keyBinding: 'F',
    audioUrl: getAudioPath('floor-tom'), // Add your floor-tom.wav/mp3/ogg to public/audio/
  },
  // Ride cymbal (20") - top right, largest cymbal
  {
    id: 'ride',
    name: 'Ride Cymbal',
    type: 'cymbal',
    position: { x: 78, y: 32 },
    size: { width: 200, height: 200 },
    keyBinding: 'R',
    audioUrl: getAudioPath('ride'), // Add your ride.wav/mp3/ogg to public/audio/
  },
  // Low Floor Tom (18") - extra low floor tom, positioned lower than regular floor tom
  {
    id: 'low-floor-tom',
    name: 'Low Floor Tom',
    type: 'tom',
    position: { x: 80, y: 75 },
    size: { width: 180, height: 180 },
    keyBinding: 'L',
    audioUrl: getAudioPath('low-floor-tom'), // Add your low-floor-tom.wav/mp3/ogg to public/audio/
  },
  // China cymbal (18") - positioned on right side, often lower
  {
    id: 'china',
    name: 'China Cymbal',
    type: 'cymbal',
    position: { x: 85, y: 45 },
    size: { width: 180, height: 180 },
    keyBinding: 'X',
    audioUrl: getAudioPath('china'), // Add your china.wav/mp3/ogg to public/audio/
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

import type { PlayAlongExerciseDefinition } from '@/types/playAlongTypes';

/**
 * Play-along catalog (MusicXML + WAV). To add a new exercise, copy the template
 * object below into this array and place assets under /public/scores/ and /public/playalongs/.
 *
 * Template:
 * {
 *   id: 'my-groove',
 *   title: 'My Groove',
 *   subtitle: 'Drum set · MusicXML score + WAV play-along',
 *   scoreUrl: '/scores/my-groove/part.musicxml',
 *   audioUrl: '/playalongs/my-groove/backing.wav',
 *   defaultBpm: 120,
 *   playbackOffsetSeconds: 0,
 * },
 */
export const playAlongExercises: PlayAlongExerciseDefinition[] = [
  {
    id: 'funky-groove',
    title: 'Toto Groove',
    subtitle: 'Drum set · MusicXML score + WAV play-along',
    scoreUrl: '/scores/funky-groove/testdrums.musicxml',
    audioUrl: '/playalongs/funky-groove-1/test.wav',
    defaultBpm: 162,
    playbackOffsetSeconds: 0,
  },
  {
    id: 'funky-groove',
    title: 'Test 2',
    subtitle: 'Drum set · MusicXML score + WAV play-along',
    scoreUrl: '/scores/funky-groove/testdrums.musicxml',
    audioUrl: '/playalongs/funky-groove-1/test.wav',
    defaultBpm: 162,
    playbackOffsetSeconds: 0,
  },
];

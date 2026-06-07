import type { ClickSound, Subdivision } from '@/store/slices/metronomeSlice';
import { getMainBeatNumber, isMainClick } from '@/screens/Metronome/metronomeTiming';

export interface MetronomeClickContext {
  beat: number;
  subdivision: Subdivision;
  timeSignature: number;
  timeSignatureDenom: number;
  volume: number;
  clickSound: ClickSound;
  accentPattern: boolean[];
}

export function ensureMetronomeAudioContext(existing: AudioContext | null): AudioContext | null {
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  const context = existing ?? new AudioContextClass();
  if (context.state === 'suspended') {
    context.resume().catch(() => {
      // Ignore — browser may block until a user gesture.
    });
  }
  return context;
}

export function playMetronomeClick(audioContext: AudioContext, context: MetronomeClickContext): void {
  const { beat, subdivision, timeSignature, timeSignatureDenom, volume, clickSound, accentPattern } =
    context;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  const mainClick = isMainClick(beat, subdivision, timeSignatureDenom);
  const mainBeatNumber = getMainBeatNumber(beat, subdivision, timeSignature, timeSignatureDenom);
  const isDownbeat = mainBeatNumber === 1 && mainClick;

  const beatIndex = (mainBeatNumber - 1) % Math.max(accentPattern.length, 1);
  const isAccented = accentPattern[beatIndex] && mainClick;

  let frequency = 600;
  let baseVolume = 0.2;
  let oscillatorType: OscillatorType = 'sine';

  if (isDownbeat) {
    frequency = 800;
    baseVolume = 0.3;
  } else if (isAccented) {
    frequency = 700;
    baseVolume = 0.28;
  } else if (mainClick) {
    frequency = 600;
    baseVolume = 0.25;
  } else {
    frequency = 400;
    baseVolume = 0.1;
  }

  switch (clickSound) {
    case 'tick':
      oscillatorType = 'sine';
      break;
    case 'beep':
      oscillatorType = 'square';
      frequency *= 1.2;
      break;
    case 'wood':
      oscillatorType = 'sawtooth';
      frequency *= 0.8;
      break;
    case 'metallic':
      oscillatorType = 'triangle';
      frequency *= 1.5;
      break;
  }

  const finalVolume = Math.max(0, Math.min(1, baseVolume * volume));
  const now = audioContext.currentTime;

  oscillator.frequency.value = frequency;
  oscillator.type = oscillatorType;

  gainNode.gain.setValueAtTime(finalVolume, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.1);
}

export function buildAccentPatternForMeter(
  beatsPerMeasure: number,
  sourcePattern: boolean[],
): boolean[] {
  const safeBeats = Math.max(1, Math.min(19, beatsPerMeasure));
  const pattern: boolean[] = [];

  for (let i = 0; i < safeBeats; i += 1) {
    if (i < sourcePattern.length) {
      pattern.push(sourcePattern[i]);
    } else {
      pattern.push(i === 0);
    }
  }

  if (!pattern.some(Boolean)) {
    pattern[0] = true;
  }

  return pattern;
}

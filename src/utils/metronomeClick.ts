import type { ClickSound, Subdivision } from '@/store/slices/metronomeSlice';
import { getMainBeatNumber, isMainClick } from '@/screens/Metronome/metronomeTiming';

const CLICK_ATTACK_SEC = 0.003;
const CLICK_DURATION_SEC = 0.035;
const SCHEDULER_LOOKAHEAD_SEC = 0.1;
const SCHEDULER_TICK_MS = 25;

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

export function playMetronomeClick(
  audioContext: AudioContext,
  context: MetronomeClickContext,
  when?: number,
): void {
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
  const startTime = when ?? audioContext.currentTime;

  oscillator.frequency.value = frequency;
  oscillator.type = oscillatorType;

  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(finalVolume, startTime + CLICK_ATTACK_SEC);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + CLICK_DURATION_SEC);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + CLICK_DURATION_SEC);
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

export interface MetronomeSchedulerOptions {
  bpm: number;
  beatsPerMeasure: number;
  intervalMultiplier: number;
  getClickContext: (beat: number) => MetronomeClickContext;
  onBeat?: (beat: number) => void;
  startBeat?: number;
  /** AudioContext time for the first scheduled click (defaults to now). */
  firstBeatTime?: number;
  maxBeats?: number;
  onComplete?: () => void;
}

/** Align metronome phase to backing-track media time (works when toggling mid-exercise). */
export function computeMetronomePhaseFromMediaTime(
  mediaTimeSec: number,
  beatIntervalMediaSec: number,
  beatsPerMeasure: number,
  audioContextNow: number,
  playbackRate: number,
  playbackOffsetSeconds = 0,
): { startBeat: number; firstBeatTime: number } {
  const effectiveTime = Math.max(0, mediaTimeSec - playbackOffsetSeconds);
  const rate = Math.max(0.001, playbackRate);
  const beatsElapsed = effectiveTime / beatIntervalMediaSec;
  const nextBeatIndex = Math.ceil(beatsElapsed - 1e-9);
  const nextBeatMediaTime = nextBeatIndex * beatIntervalMediaSec;
  const mediaDelay = Math.max(0, nextBeatMediaTime - effectiveTime);
  const onGrid = mediaDelay < 0.003;

  return {
    startBeat: (onGrid ? Math.round(beatsElapsed) : nextBeatIndex) % beatsPerMeasure,
    firstBeatTime: audioContextNow + (onGrid ? 0 : mediaDelay / rate),
  };
}

/** Align a metronome to an anchor when the scheduler starts late. */
export function computeMetronomePhase(
  anchorTime: number,
  intervalSec: number,
  beatsPerMeasure: number,
  now: number,
): { startBeat: number; firstBeatTime: number } {
  if (now <= anchorTime) {
    return { startBeat: 0, firstBeatTime: anchorTime };
  }

  const elapsed = now - anchorTime;
  const graceSec = Math.min(0.05, intervalSec * 0.05);
  if (elapsed < graceSec) {
    return { startBeat: 0, firstBeatTime: now };
  }

  const beatIndex = Math.ceil(elapsed / intervalSec);
  return {
    startBeat: beatIndex % beatsPerMeasure,
    firstBeatTime: anchorTime + beatIndex * intervalSec,
  };
}

export interface MediaLockedMetronomeOptions {
  beatIntervalMediaSec: number;
  beatsPerMeasure: number;
  playbackOffsetSeconds: number;
  getMediaTime: () => number | null;
  getPlaybackRate: () => number;
  getClickContext: (beat: number) => MetronomeClickContext;
}

function initialLastScheduledBeatIndex(effectiveMediaSec: number, intervalSec: number): number {
  if (intervalSec <= 0) return -1;
  if (effectiveMediaSec < 0.003) return -1;

  const beatsElapsed = effectiveMediaSec / intervalSec;
  const fractional = beatsElapsed - Math.floor(beatsElapsed);
  const nearGrid = fractional < 0.02 || fractional > 0.98;
  if (nearGrid) {
    return Math.round(beatsElapsed) - 1;
  }
  return Math.floor(beatsElapsed + 1e-9);
}

/** Schedule clicks from live backing-track media time (self-correcting tempo / mid-toggle sync). */
export function startMediaLockedMetronomeScheduler(
  audioContext: AudioContext,
  options: MediaLockedMetronomeOptions,
): MetronomeSchedulerHandle {
  const mediaNow = options.getMediaTime();
  const effectiveStart =
    mediaNow !== null
      ? Math.max(0, mediaNow - options.playbackOffsetSeconds)
      : 0;
  let lastScheduledBeatIndex = initialLastScheduledBeatIndex(
    effectiveStart,
    options.beatIntervalMediaSec,
  );
  let stopped = false;
  let tickId: ReturnType<typeof setInterval> | null = null;

  const tick = () => {
    if (stopped) return;

    const mediaTime = options.getMediaTime();
    if (mediaTime === null) return;

    const intervalSec = options.beatIntervalMediaSec;
    if (intervalSec <= 0) return;

    const rate = Math.max(0.001, options.getPlaybackRate());
    const effectiveMedia = Math.max(0, mediaTime - options.playbackOffsetSeconds);
    const nowContext = audioContext.currentTime;
    const nextBeatIndex = lastScheduledBeatIndex + 1;
    const nextBeatMediaTime = nextBeatIndex * intervalSec;
    const mediaDelay = nextBeatMediaTime - effectiveMedia;
    const wallDelay = mediaDelay / rate;

    if (wallDelay > SCHEDULER_LOOKAHEAD_SEC + 0.02) return;

    const when = wallDelay <= 0.002 ? nowContext : nowContext + wallDelay;
    const beat = nextBeatIndex % options.beatsPerMeasure;
    playMetronomeClick(audioContext, options.getClickContext(beat), when);
    lastScheduledBeatIndex = nextBeatIndex;
  };

  tick();
  tickId = setInterval(tick, SCHEDULER_TICK_MS);

  return {
    stop: () => {
      stopped = true;
      if (tickId) {
        clearInterval(tickId);
        tickId = null;
      }
    },
  };
}

export interface MetronomeSchedulerHandle {
  stop: () => void;
}

export function startMetronomeScheduler(
  audioContext: AudioContext,
  options: MetronomeSchedulerOptions,
): MetronomeSchedulerHandle {
  const intervalSec = (60 / options.bpm) * options.intervalMultiplier;
  let beat = options.startBeat ?? 0;
  let beatsScheduled = 0;
  let nextNoteTime = options.firstBeatTime ?? audioContext.currentTime;
  let stopped = false;
  let tickId: ReturnType<typeof setInterval> | null = null;

  const scheduleTicks = () => {
    if (stopped) return;

    while (nextNoteTime < audioContext.currentTime + SCHEDULER_LOOKAHEAD_SEC) {
      playMetronomeClick(audioContext, options.getClickContext(beat), nextNoteTime);
      options.onBeat?.(beat);
      beatsScheduled += 1;

      if (options.maxBeats !== undefined && beatsScheduled >= options.maxBeats) {
        stopped = true;
        if (tickId) {
          clearInterval(tickId);
          tickId = null;
        }
        options.onComplete?.();
        return;
      }

      nextNoteTime += intervalSec;
      beat = (beat + 1) % options.beatsPerMeasure;
    }
  };

  scheduleTicks();
  tickId = setInterval(scheduleTicks, SCHEDULER_TICK_MS);

  return {
    stop: () => {
      stopped = true;
      if (tickId) {
        clearInterval(tickId);
        tickId = null;
      }
    },
  };
}

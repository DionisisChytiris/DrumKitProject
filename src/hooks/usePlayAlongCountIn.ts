import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClickSound } from '@/store/slices/metronomeSlice';
import {
  buildAccentPatternForMeter,
  ensureMetronomeAudioContext,
  startMetronomeScheduler,
  type MetronomeSchedulerHandle,
} from '@/utils/metronomeClick';

export const PLAY_ALONG_COUNT_IN_BEATS = 4;

export interface UsePlayAlongCountInOptions {
  bpm: number;
  volume: number;
  clickSound: ClickSound;
  accentPattern: boolean[];
  /** Shared AudioContext (e.g. backing-track graph) for clock-aligned count-in. */
  getAudioContext?: () => AudioContext | null;
}

export function usePlayAlongCountIn({
  bpm,
  volume,
  clickSound,
  accentPattern,
  getAudioContext,
}: UsePlayAlongCountInOptions) {
  const [isCountingIn, setIsCountingIn] = useState(false);
  const [countInBeat, setCountInBeat] = useState(0);

  const schedulerRef = useRef<MetronomeSchedulerHandle | null>(null);
  const completeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ownedAudioContextRef = useRef<AudioContext | null>(null);
  const onCompleteRef = useRef<((downbeatTime: number) => void) | null>(null);

  const clickSettingsRef = useRef({ volume, clickSound, accentPattern });
  clickSettingsRef.current = { volume, clickSound, accentPattern };

  const resolveAudioContext = useCallback((): AudioContext | null => {
    const shared = getAudioContext?.();
    if (shared) return shared;
    ownedAudioContextRef.current = ensureMetronomeAudioContext(ownedAudioContextRef.current);
    return ownedAudioContextRef.current;
  }, [getAudioContext]);

  const clearTimers = useCallback(() => {
    schedulerRef.current?.stop();
    schedulerRef.current = null;
    if (completeTimeoutRef.current) {
      clearTimeout(completeTimeoutRef.current);
      completeTimeoutRef.current = null;
    }
  }, []);

  const cancelCountIn = useCallback(() => {
    clearTimers();
    setIsCountingIn(false);
    setCountInBeat(0);
    onCompleteRef.current = null;
  }, [clearTimers]);

  const startCountIn = useCallback(
    (onComplete: (downbeatTime: number) => void) => {
      if (bpm <= 0) {
        onComplete(0);
        return;
      }

      cancelCountIn();
      onCompleteRef.current = onComplete;

      const audioContext = resolveAudioContext();
      if (!audioContext) {
        onComplete(0);
        return;
      }

      const beatIntervalSec = 60 / bpm;
      const countInStartTime = audioContext.currentTime;
      const downbeatTime = countInStartTime + PLAY_ALONG_COUNT_IN_BEATS * beatIntervalSec;
      const effectiveAccent = buildAccentPatternForMeter(
        PLAY_ALONG_COUNT_IN_BEATS,
        accentPattern,
      );

      setIsCountingIn(true);
      setCountInBeat(1);

      schedulerRef.current = startMetronomeScheduler(audioContext, {
        bpm,
        beatsPerMeasure: PLAY_ALONG_COUNT_IN_BEATS,
        intervalMultiplier: 1,
        firstBeatTime: countInStartTime,
        maxBeats: PLAY_ALONG_COUNT_IN_BEATS,
        getClickContext: (beat) => {
          const settings = clickSettingsRef.current;
          return {
            beat,
            subdivision: 'quarters',
            timeSignature: PLAY_ALONG_COUNT_IN_BEATS,
            timeSignatureDenom: 4,
            volume: settings.volume,
            clickSound: settings.clickSound,
            accentPattern: effectiveAccent,
          };
        },
        onBeat: (beat) => {
          setCountInBeat(beat + 1);
        },
      });

      const delayMs = Math.max(0, (downbeatTime - audioContext.currentTime) * 1000);
      completeTimeoutRef.current = setTimeout(() => {
        completeTimeoutRef.current = null;
        setIsCountingIn(false);
        setCountInBeat(0);
        const done = onCompleteRef.current;
        onCompleteRef.current = null;
        done?.(downbeatTime);
      }, delayMs);
    },
    [accentPattern, bpm, cancelCountIn, resolveAudioContext],
  );

  useEffect(() => {
    if (!getAudioContext) {
      ownedAudioContextRef.current = ensureMetronomeAudioContext(ownedAudioContextRef.current);
    }
    return () => {
      cancelCountIn();
      if (!getAudioContext) {
        ownedAudioContextRef.current?.close().catch(() => {});
        ownedAudioContextRef.current = null;
      }
    };
  }, [cancelCountIn, getAudioContext]);

  return {
    isCountingIn,
    countInBeat,
    startCountIn,
    cancelCountIn,
  };
}

import { useEffect, useMemo, useRef } from 'react';
import type { ClickSound, Subdivision } from '@/store/slices/metronomeSlice';
import { getSubdivisionConfig } from '@/screens/Metronome/metronomeTiming';
import {
  buildAccentPatternForMeter,
  ensureMetronomeAudioContext,
  playMetronomeClick,
} from '@/utils/metronomeClick';

export interface UseMetronomeClicksOptions {
  bpm: number;
  /** User wants metronome clicks during the exercise */
  enabled: boolean;
  /** Backing track / exercise is actively playing */
  isRunning: boolean;
  timeSignature: number;
  timeSignatureDenom?: number;
  subdivision?: Subdivision;
  volume: number;
  clickSound: ClickSound;
  accentPattern: boolean[];
}

export function useMetronomeClicks({
  bpm,
  enabled,
  isRunning,
  timeSignature,
  timeSignatureDenom = 4,
  subdivision = 'quarters',
  volume,
  clickSound,
  accentPattern,
}: UseMetronomeClicksOptions): void {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const beatRef = useRef(0);

  const effectiveAccentPattern = useMemo(
    () => buildAccentPatternForMeter(timeSignature, accentPattern),
    [accentPattern, timeSignature],
  );

  const isActive = enabled && isRunning && bpm > 0;

  useEffect(() => {
    audioContextRef.current = ensureMetronomeAudioContext(audioContextRef.current);
    return () => {
      audioContextRef.current?.close().catch(() => {});
      audioContextRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      beatRef.current = 0;
      return;
    }

    const config = getSubdivisionConfig(subdivision, timeSignature, timeSignatureDenom);
    const intervalMs = (60 / bpm) * 1000 * config.intervalMultiplier;

    const playBeat = (beat: number) => {
      const audioContext = ensureMetronomeAudioContext(audioContextRef.current);
      if (!audioContext) return;
      audioContextRef.current = audioContext;

      playMetronomeClick(audioContext, {
        beat,
        subdivision,
        timeSignature,
        timeSignatureDenom,
        volume,
        clickSound,
        accentPattern: effectiveAccentPattern,
      });
    };

    beatRef.current = 0;
    playBeat(0);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      beatRef.current = (beatRef.current + 1) % config.beatsPerMeasure;
      playBeat(beatRef.current);
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    bpm,
    clickSound,
    effectiveAccentPattern,
    isActive,
    subdivision,
    timeSignature,
    timeSignatureDenom,
    volume,
  ]);
}

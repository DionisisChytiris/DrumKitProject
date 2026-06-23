import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import type { ClickSound, Subdivision } from '@/store/slices/metronomeSlice';
import { getSubdivisionConfig } from '@/screens/Metronome/metronomeTiming';
import { playbackRateForTempo } from '@/utils/osmdPlaybackMap';
import {
  buildAccentPatternForMeter,
  computeMetronomePhase,
  ensureMetronomeAudioContext,
  startMediaLockedMetronomeScheduler,
  startMetronomeScheduler,
  type MetronomeSchedulerHandle,
} from '@/utils/metronomeClick';

export interface UseMetronomeClicksOptions {
  bpm: number;
  /** Score / backing reference BPM used for media-time beat spacing. */
  scoreBpm: number;
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
  playbackOffsetSeconds?: number;
  /** Shared AudioContext for clock-aligned clicks (e.g. backing-track graph). */
  getAudioContext?: () => AudioContext | null;
  /** Current backing-track media position in seconds (paused => ignored). */
  getMediaTime?: () => number | null;
  /** Live HTMLAudioElement playbackRate (defaults to manualBpm / scoreBpm). */
  getPlaybackRate?: () => number;
  /** Beat-0 anchor after count-in; fallback when media time is unavailable. */
  phaseAnchorRef?: MutableRefObject<number | null>;
}

export function useMetronomeClicks({
  bpm,
  scoreBpm,
  enabled,
  isRunning,
  timeSignature,
  timeSignatureDenom = 4,
  subdivision = 'quarters',
  volume,
  clickSound,
  accentPattern,
  playbackOffsetSeconds = 0,
  getAudioContext,
  getMediaTime,
  getPlaybackRate,
  phaseAnchorRef,
}: UseMetronomeClicksOptions): void {
  const schedulerRef = useRef<MetronomeSchedulerHandle | null>(null);
  const ownedAudioContextRef = useRef<AudioContext | null>(null);

  const effectiveAccentPattern = useMemo(
    () => buildAccentPatternForMeter(timeSignature, accentPattern),
    [accentPattern, timeSignature],
  );

  const clickSettingsRef = useRef({
    subdivision,
    timeSignature,
    timeSignatureDenom,
    volume,
    clickSound,
    accentPattern: effectiveAccentPattern,
  });
  clickSettingsRef.current = {
    subdivision,
    timeSignature,
    timeSignatureDenom,
    volume,
    clickSound,
    accentPattern: effectiveAccentPattern,
  };

  const timingRef = useRef({ bpm, scoreBpm, playbackOffsetSeconds });
  timingRef.current = { bpm, scoreBpm, playbackOffsetSeconds };

  const isActive = enabled && isRunning && bpm > 0;

  const resolveAudioContext = (): AudioContext | null => {
    const shared = getAudioContext?.();
    if (shared) return shared;
    ownedAudioContextRef.current = ensureMetronomeAudioContext(ownedAudioContextRef.current);
    return ownedAudioContextRef.current;
  };

  const resolvePlaybackRate = (): number => {
    if (getPlaybackRate) return getPlaybackRate();
    const { bpm: liveBpm, scoreBpm: liveScoreBpm } = timingRef.current;
    return playbackRateForTempo(liveBpm, liveScoreBpm > 0 ? liveScoreBpm : liveBpm);
  };

  useEffect(() => {
    if (!getAudioContext) {
      ownedAudioContextRef.current = ensureMetronomeAudioContext(ownedAudioContextRef.current);
    }
    return () => {
      schedulerRef.current?.stop();
      schedulerRef.current = null;
      if (!getAudioContext) {
        ownedAudioContextRef.current?.close().catch(() => {});
        ownedAudioContextRef.current = null;
      }
    };
  }, [getAudioContext]);

  useEffect(() => {
    schedulerRef.current?.stop();
    schedulerRef.current = null;

    if (!isActive) return;

    const audioContext = resolveAudioContext();
    if (!audioContext) return;

    const config = getSubdivisionConfig(subdivision, timeSignature, timeSignatureDenom);
    const { scoreBpm: liveScoreBpm, playbackOffsetSeconds: offset } = timingRef.current;
    const referenceBpm = liveScoreBpm > 0 ? liveScoreBpm : bpm;
    const beatIntervalMediaSec = (60 / referenceBpm) * config.intervalMultiplier;

    if (getMediaTime) {
      schedulerRef.current = startMediaLockedMetronomeScheduler(audioContext, {
        beatIntervalMediaSec,
        beatsPerMeasure: config.beatsPerMeasure,
        playbackOffsetSeconds: offset,
        getMediaTime,
        getPlaybackRate: resolvePlaybackRate,
        getClickContext: (beat) => {
          const settings = clickSettingsRef.current;
          return {
            beat,
            subdivision: settings.subdivision,
            timeSignature: settings.timeSignature,
            timeSignatureDenom: settings.timeSignatureDenom,
            volume: settings.volume,
            clickSound: settings.clickSound,
            accentPattern: settings.accentPattern,
          };
        },
      });
      return () => {
        schedulerRef.current?.stop();
        schedulerRef.current = null;
      };
    }

    const wallIntervalSec = (60 / bpm) * config.intervalMultiplier;
    const anchorTime = phaseAnchorRef?.current ?? null;
    const now = audioContext.currentTime;
    const phase =
      anchorTime !== null
        ? computeMetronomePhase(anchorTime, wallIntervalSec, config.beatsPerMeasure, now)
        : { startBeat: 0, firstBeatTime: now };

    schedulerRef.current = startMetronomeScheduler(audioContext, {
      bpm,
      beatsPerMeasure: config.beatsPerMeasure,
      intervalMultiplier: config.intervalMultiplier,
      startBeat: phase.startBeat,
      firstBeatTime: phase.firstBeatTime,
      getClickContext: (beat) => {
        const settings = clickSettingsRef.current;
        return {
          beat,
          subdivision: settings.subdivision,
          timeSignature: settings.timeSignature,
          timeSignatureDenom: settings.timeSignatureDenom,
          volume: settings.volume,
          clickSound: settings.clickSound,
          accentPattern: settings.accentPattern,
        };
      },
    });

    return () => {
      schedulerRef.current?.stop();
      schedulerRef.current = null;
    };
  }, [
    bpm,
    clickSound,
    effectiveAccentPattern,
    getAudioContext,
    getMediaTime,
    getPlaybackRate,
    isActive,
    phaseAnchorRef,
    playbackOffsetSeconds,
    scoreBpm,
    subdivision,
    timeSignature,
    timeSignatureDenom,
    volume,
  ]);
}

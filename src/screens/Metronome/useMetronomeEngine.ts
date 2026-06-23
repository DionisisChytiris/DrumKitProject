import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setBpm,
  setIsPlaying,
  setTimeSignature,
  setTimeSignatureDenom,
} from '@/store/slices/metronomeSlice';
import { getSubdivisionConfig } from './metronomeTiming';
import {
  buildAccentPatternForMeter,
  ensureMetronomeAudioContext,
  startMetronomeScheduler,
  type MetronomeSchedulerHandle,
} from '@/utils/metronomeClick';

export type AutoBpmRampConfig = {
  enabled: boolean;
  increment: number;
  everyBars: number;
};

export type MetronomeEngineOptions = {
  autoBpmRamp: AutoBpmRampConfig;
  /** When false, meter segments and custom accent patterns are not applied. */
  advancedFeaturesEnabled: boolean;
  accentPattern: boolean[];
};

export const useMetronomeEngine = ({
  autoBpmRamp,
  advancedFeaturesEnabled,
  accentPattern,
}: MetronomeEngineOptions) => {
  const dispatch = useAppDispatch();
  const {
    bpm,
    isPlaying,
    subdivision,
    timeSignature,
    timeSignatureDenom,
    volume,
    clickSound,
    swing,
    useTimeSignatureSequence,
    timeSignatureSegments,
  } = useAppSelector((state) => state.metronome);

  const [beat, setBeat] = useState<number>(0);
  const [barCount, setBarCount] = useState(0);
  const schedulerRef = useRef<MetronomeSchedulerHandle | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  /** Tracks previous `beat` so we can detect bar wrap in an effect (not inside setBeat — Strict Mode may run that updater twice in dev). */
  const prevBeatForBarRef = useRef<number | null>(null);
  const lastAutoRampBarRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;
  const autoRampRef = useRef(autoBpmRamp);
  autoRampRef.current = autoBpmRamp;
  const advancedFeaturesRef = useRef(advancedFeaturesEnabled);
  advancedFeaturesRef.current = advancedFeaturesEnabled;
  const accentPatternRef = useRef(accentPattern);
  accentPatternRef.current = accentPattern;
  const timingRef = useRef({ subdivision, timeSignature, timeSignatureDenom });
  timingRef.current = { subdivision, timeSignature, timeSignatureDenom };
  const clickSettingsRef = useRef({ volume, clickSound });
  clickSettingsRef.current = { volume, clickSound };
  const segmentAdvanceRef = useRef(false);
  const segmentIndexRef = useRef(0);
  const barsCompletedInSegmentRef = useRef(0);
  const sequenceEnabledRef = useRef(useTimeSignatureSequence && advancedFeaturesEnabled);
  sequenceEnabledRef.current = useTimeSignatureSequence && advancedFeaturesEnabled;
  const segmentsRef = useRef(timeSignatureSegments);
  segmentsRef.current = timeSignatureSegments;

  const resetBarCount = useCallback(() => {
    lastAutoRampBarRef.current = null;
    setBarCount(0);
  }, []);

  useEffect(() => {
    audioContextRef.current = ensureMetronomeAudioContext(audioContextRef.current);
    return () => {
      schedulerRef.current?.stop();
      schedulerRef.current = null;
      audioContextRef.current?.close().catch(() => {});
      audioContextRef.current = null;
    };
  }, []);

  const toggleMetronome = useCallback(() => {
    if (isPlaying) {
      schedulerRef.current?.stop();
      schedulerRef.current = null;
      dispatch(setIsPlaying(false));
      prevBeatForBarRef.current = null;
      lastAutoRampBarRef.current = null;
      segmentIndexRef.current = 0;
      barsCompletedInSegmentRef.current = 0;
      setBeat(0);
      setBarCount(0);
    } else {
      const useSeq = sequenceEnabledRef.current;
      const segs = segmentsRef.current;
      if (useSeq && segs.length > 0) {
        const s0 = segs[0];
        segmentIndexRef.current = 0;
        barsCompletedInSegmentRef.current = 0;
        dispatch(setTimeSignature(s0.numerator));
        dispatch(setTimeSignatureDenom(s0.denominator));
      } else {
        segmentIndexRef.current = 0;
        barsCompletedInSegmentRef.current = 0;
      }
      dispatch(setIsPlaying(true));
      setBeat(0);
      setBarCount(1);
    }
  }, [dispatch, isPlaying]);

  useEffect(() => {
    schedulerRef.current?.stop();
    schedulerRef.current = null;

    if (!isPlaying) return;

    const audioContext = ensureMetronomeAudioContext(audioContextRef.current);
    if (!audioContext) return;
    audioContextRef.current = audioContext;

    prevBeatForBarRef.current = null;
    const skipFullRestart = segmentAdvanceRef.current;
    if (skipFullRestart) {
      segmentAdvanceRef.current = false;
    } else {
      lastAutoRampBarRef.current = null;
      setBeat(0);
      setBarCount(1);
    }

    const config = getSubdivisionConfig(subdivision, timeSignature, timeSignatureDenom);
    const effectiveAccent = buildAccentPatternForMeter(timeSignature, accentPatternRef.current);

    schedulerRef.current = startMetronomeScheduler(audioContext, {
      bpm,
      beatsPerMeasure: config.beatsPerMeasure,
      intervalMultiplier: config.intervalMultiplier,
      getClickContext: (beatIndex) => {
        const timing = timingRef.current;
        const clickSettings = clickSettingsRef.current;
        return {
          beat: beatIndex,
          subdivision: timing.subdivision,
          timeSignature: timing.timeSignature,
          timeSignatureDenom: timing.timeSignatureDenom,
          volume: clickSettings.volume,
          clickSound: clickSettings.clickSound,
          accentPattern: effectiveAccent,
        };
      },
      onBeat: (beatIndex) => {
        setBeat(beatIndex);
      },
    });

    return () => {
      schedulerRef.current?.stop();
      schedulerRef.current = null;
    };
  }, [bpm, isPlaying, subdivision, timeSignature, timeSignatureDenom, swing, volume, clickSound]);

  useEffect(() => {
    if (!isPlaying) {
      prevBeatForBarRef.current = null;
      return;
    }

    const cfg = getSubdivisionConfig(subdivision, timeSignature, timeSignatureDenom);
    const n = cfg.beatsPerMeasure;
    const prev = prevBeatForBarRef.current;
    prevBeatForBarRef.current = beat;

    if (prev === null) return;
    if (prev === n - 1 && beat === 0) {
      setBarCount((c) => c + 1);

      if (sequenceEnabledRef.current && segmentsRef.current.length > 0) {
        barsCompletedInSegmentRef.current += 1;
        const idx = segmentIndexRef.current;
        const seg = segmentsRef.current[idx];
        if (barsCompletedInSegmentRef.current >= seg.bars) {
          barsCompletedInSegmentRef.current = 0;
          segmentIndexRef.current = (idx + 1) % segmentsRef.current.length;
          const nextSeg = segmentsRef.current[segmentIndexRef.current];
          segmentAdvanceRef.current = true;
          dispatch(setTimeSignature(nextSeg.numerator));
          dispatch(setTimeSignatureDenom(nextSeg.denominator));
        }
      }
    }
  }, [beat, isPlaying, subdivision, timeSignature, timeSignatureDenom, dispatch]);

  useEffect(() => {
    if (!isPlaying) {
      lastAutoRampBarRef.current = null;
      return;
    }
    const { enabled, increment, everyBars } = autoRampRef.current;
    const step = Math.max(0, Math.floor(increment));
    const interval = Math.max(1, Math.floor(everyBars));
    if (!advancedFeaturesRef.current || !enabled || step <= 0) return;
    if (barCount <= 1) return;
    if ((barCount - 1) % interval !== 0) return;
    if (lastAutoRampBarRef.current === barCount) return;
    lastAutoRampBarRef.current = barCount;
    dispatch(setBpm(Math.min(400, bpmRef.current + step)));
  }, [barCount, isPlaying, dispatch]);

  return { beat, toggleMetronome, barCount, resetBarCount };
};

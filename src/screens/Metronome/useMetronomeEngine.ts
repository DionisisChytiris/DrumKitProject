import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setBpm,
  setIsPlaying,
  setTimeSignature,
  setTimeSignatureDenom,
} from '@/store/slices/metronomeSlice';
import { getSubdivisionConfig, getMainBeatNumber, isMainClick } from './metronomeTiming';

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  // Initialize AudioContext
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Play click sound (depends on current beat)
  const playClick = useCallback(() => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Determine if this is a main click or ghost click
    const mainClick = isMainClick(beat, subdivision, timeSignatureDenom);
    const mainBeatNumber = getMainBeatNumber(beat, subdivision, timeSignature, timeSignatureDenom);
    const isDownbeat = mainBeatNumber === 1 && mainClick;

    // Check if this beat should be accented (based on accent pattern)
    const pattern = accentPatternRef.current;
    const beatIndex = (mainBeatNumber - 1) % pattern.length;
    const isAccented = pattern[beatIndex] && mainClick;

    // Different pitches and base volumes: downbeat (highest), accented beats (high), main clicks (medium), ghost clicks (lowest)
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

    // Adjust frequency and type based on click sound selection
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

    // Apply user volume setting
    const finalVolume = baseVolume * volume;

    oscillator.frequency.value = frequency;
    oscillator.type = oscillatorType;

    gainNode.gain.setValueAtTime(finalVolume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  }, [beat, subdivision, timeSignature, timeSignatureDenom, volume, clickSound, accentPattern]);

  // Start/Stop metronome
  const toggleMetronome = useCallback(() => {
    if (isPlaying) {
      // Stop
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
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
      setBarCount(1); // bar #1 begins at beat index 0
    }
  }, [dispatch, isPlaying]);

  // Update interval when BPM/subdivision/timeSignature changes
  useEffect(() => {
    if (!isPlaying) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

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

    const interval = setInterval(() => {
      setBeat((prevBeat) => {
        const cfg = getSubdivisionConfig(
          timingRef.current.subdivision,
          timingRef.current.timeSignature,
          timingRef.current.timeSignatureDenom
        );
        const n = cfg.beatsPerMeasure;
        return (prevBeat + 1) % n;
      });
    }, (60 / bpm) * 1000 * config.intervalMultiplier);

    intervalRef.current = interval;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [bpm, isPlaying, subdivision, timeSignature, timeSignatureDenom, swing]);

  // One bar = one full cycle of `beat` (0..n-1). Increment only when we wrap (n-1)->0.
  // Done here instead of inside setBeat's updater so React Strict Mode's double-invocation in dev cannot double-count.
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

  // After every N completed bars (barCount 2 = first bar finished), optionally raise BPM (capped at 400).
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

  // Play click on beat change
  useEffect(() => {
    if (isPlaying) {
      playClick();
    }
  }, [beat, isPlaying, playClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { beat, toggleMetronome, barCount, resetBarCount };
};


import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setIsPlaying } from '@/store/slices/metronomeSlice';
import { getSubdivisionConfig, getMainBeatNumber, isMainClick } from './metronomeTiming';

export const useMetronomeEngine = () => {
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
    accentPattern,
  } = useAppSelector((state) => state.metronome);

  const [beat, setBeat] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

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
    const beatIndex = (mainBeatNumber - 1) % accentPattern.length;
    const isAccented = accentPattern[beatIndex] && mainClick;

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
      setBeat(0);
    } else {
      // Start
      const config = getSubdivisionConfig(subdivision, timeSignature, timeSignatureDenom);
      dispatch(setIsPlaying(true));
      setBeat(0);

      // Play first click immediately using current settings
      if (audioContextRef.current) {
        const audioContext = audioContextRef.current;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        let frequency = 800; // Downbeat
        let oscillatorType: OscillatorType = 'sine';

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

        oscillator.frequency.value = frequency;
        oscillator.type = oscillatorType;

        const finalVolume = 0.3 * volume; // Downbeat volume * user volume
        gainNode.gain.setValueAtTime(finalVolume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
      }

      const interval = setInterval(() => {
        setBeat((prevBeat) => {
          const nextBeat = (prevBeat + 1) % config.beatsPerMeasure;
          return nextBeat;
        });
      }, (60 / bpm) * 1000 * config.intervalMultiplier);

      intervalRef.current = interval;
    }
  }, [dispatch, isPlaying, bpm, subdivision, timeSignature, timeSignatureDenom, volume, clickSound, swing]);

  // Update interval when BPM/subdivision/timeSignature changes
  useEffect(() => {
    if (isPlaying && intervalRef.current) {
      clearInterval(intervalRef.current);
      setBeat(0);
      const config = getSubdivisionConfig(subdivision, timeSignature, timeSignatureDenom);

      const interval = setInterval(() => {
        setBeat((prevBeat) => {
          const nextBeat = (prevBeat + 1) % config.beatsPerMeasure;
          return nextBeat;
        });
      }, (60 / bpm) * 1000 * config.intervalMultiplier);

      intervalRef.current = interval;
    }
  }, [bpm, isPlaying, subdivision, timeSignature, timeSignatureDenom, swing]);

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

  return { beat, toggleMetronome };
};


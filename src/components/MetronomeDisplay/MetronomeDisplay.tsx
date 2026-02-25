import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
    setIsPlaying,
    Subdivision,
} from '@/store/slices/metronomeSlice';
import './MetronomeDisplay.css';

const MetronomeDisplay: React.FC = () => {
    const dispatch = useAppDispatch();
    const {
        bpm,
        isPlaying,
        subdivision,
        timeSignature,
        timeSignatureDenom,
        volume,
        clickSound,
        accentPattern,
    } = useAppSelector((state) => state.metronome);

    const [beat, setBeat] = useState<number>(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Initialize AudioContext
    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    // Calculate beats per measure and interval timing
    const getSubdivisionConfig = (sub: Subdivision, ts: number, tsDenom: number) => {
        if (tsDenom !== 4) {
            const intervalMultiplier = tsDenom === 2 ? 2 : tsDenom === 8 ? 0.5 : tsDenom === 16 ? 0.25 : 1;
            return { beatsPerMeasure: ts, intervalMultiplier };
        }
        
        const beatsPerMeasure = ts;
        switch (sub) {
            case 'quarters':
                return { beatsPerMeasure: beatsPerMeasure, intervalMultiplier: 1 };
            case 'eighths':
                return { beatsPerMeasure: beatsPerMeasure * 2, intervalMultiplier: 0.5 };
            case 'sixteenths':
                return { beatsPerMeasure: beatsPerMeasure * 4, intervalMultiplier: 0.25 };
            case 'triplets':
                return { beatsPerMeasure: beatsPerMeasure * 3, intervalMultiplier: 1 / 3 };
            default:
                return { beatsPerMeasure: beatsPerMeasure, intervalMultiplier: 1 };
        }
    };

    const getMainBeatNumber = (currentBeat: number, sub: Subdivision, ts: number, tsDenom: number): number => {
        if (tsDenom !== 4) {
            return (currentBeat % ts) + 1;
        }
        
        switch (sub) {
            case 'quarters':
                return (currentBeat % ts) + 1;
            case 'eighths':
                return Math.floor(currentBeat / 2) % ts + 1;
            case 'sixteenths':
                return Math.floor(currentBeat / 4) % ts + 1;
            case 'triplets':
                return Math.floor(currentBeat / 3) % ts + 1;
            default:
                return (currentBeat % ts) + 1;
        }
    };

    const isMainClick = (currentBeat: number, sub: Subdivision, tsDenom: number): boolean => {
        if (tsDenom !== 4) {
            return true;
        }
        
        switch (sub) {
            case 'quarters':
                return true;
            case 'eighths':
                return currentBeat % 2 === 0;
            case 'sixteenths':
                return currentBeat % 4 === 0;
            case 'triplets':
                return currentBeat % 3 === 0;
            default:
                return true;
        }
    };

    // Play click sound
    const playClick = useCallback(() => {
        if (!audioContextRef.current) return;

        const audioContext = audioContextRef.current;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        const mainClick = isMainClick(beat, subdivision, timeSignatureDenom);
        const mainBeatNumber = getMainBeatNumber(beat, subdivision, timeSignature, timeSignatureDenom);
        const isDownbeat = mainBeatNumber === 1 && mainClick;
        
        const beatIndex = (mainBeatNumber - 1) % accentPattern.length;
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

    // Toggle metronome
    const toggleMetronome = useCallback(() => {
        if (isPlaying) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            dispatch(setIsPlaying(false));
            setBeat(0);
        } else {
            const config = getSubdivisionConfig(subdivision, timeSignature, timeSignatureDenom);
            dispatch(setIsPlaying(true));
            setBeat(0);
            
            // Play first click immediately
            if (audioContextRef.current) {
                const audioContext = audioContextRef.current;
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                let frequency = 800;
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

                const finalVolume = 0.3 * volume;
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
    }, [isPlaying, bpm, subdivision, timeSignature, timeSignatureDenom, volume, clickSound, dispatch]);

    // Update interval when settings change
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
    }, [bpm, isPlaying, subdivision, timeSignature, timeSignatureDenom]);

    // Play click on beat change
    useEffect(() => {
        if (isPlaying) {
            playClick();
        }
    }, [beat, isPlaying, playClick]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    return (
        <div className="metronome-display">
            <div className="metronome-display-content">
                <div className="metronome-display-bpm">
                    <span className="metronome-display-label">BPM:</span>
                    <span className="metronome-display-value">{bpm}</span>
                </div>
                <div className="metronome-display-time-signature">
                    <span className="metronome-display-ts">{timeSignature}/{timeSignatureDenom}</span>
                </div>
                <button
                    className={`metronome-display-button ${isPlaying ? 'playing' : ''}`}
                    onClick={toggleMetronome}
                    title={isPlaying ? 'Stop Metronome' : 'Start Metronome'}
                >
                    {isPlaying ? '⏸' : '▶'}
                </button>
            </div>
        </div>
    );
};

export default MetronomeDisplay;

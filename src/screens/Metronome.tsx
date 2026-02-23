import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavBarHome } from '@/components/Navigation/NavBarHome';
import './styles/Metronome.css';

type Subdivision = 'quarters' | 'eighths' | 'sixteenths' | 'triplets';
type ClickSound = 'tick' | 'beep' | 'wood' | 'metallic';

const Metronome: React.FC = () => {
    const [bpm, setBpm] = useState<number>(120);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [beat, setBeat] = useState<number>(0);
    const [subdivision, setSubdivision] = useState<Subdivision>('quarters');
    const [volume, setVolume] = useState<number>(0.7);
    const [clickSound, setClickSound] = useState<ClickSound>('tick');
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Calculate beats per measure and interval timing based on subdivision
    const getSubdivisionConfig = (sub: Subdivision) => {
        switch (sub) {
            case 'quarters':
                return { beatsPerMeasure: 4, intervalMultiplier: 1 };
            case 'eighths':
                return { beatsPerMeasure: 8, intervalMultiplier: 0.5 };
            case 'sixteenths':
                return { beatsPerMeasure: 16, intervalMultiplier: 0.25 };
            case 'triplets':
                return { beatsPerMeasure: 12, intervalMultiplier: 1 / 3 };
            default:
                return { beatsPerMeasure: 4, intervalMultiplier: 1 };
        }
    };

    // Calculate the main beat number (1-4) based on current beat and subdivision
    const getMainBeatNumber = (currentBeat: number, sub: Subdivision): number => {
        switch (sub) {
            case 'quarters':
                return currentBeat + 1; // 0->1, 1->2, 2->3, 3->4
            case 'eighths':
                return Math.floor(currentBeat / 2) + 1; // 0,1->1, 2,3->2, 4,5->3, 6,7->4
            case 'sixteenths':
                return Math.floor(currentBeat / 4) + 1; // 0-3->1, 4-7->2, 8-11->3, 12-15->4
            case 'triplets':
                return Math.floor(currentBeat / 3) + 1; // 0-2->1, 3-5->2, 6-8->3, 9-11->4
            default:
                return currentBeat + 1;
        }
    };

    // Initialize AudioContext
    useEffect(() => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    // Determine if current beat should be a main click or ghost click
    const isMainClick = (currentBeat: number, sub: Subdivision): boolean => {
        switch (sub) {
            case 'quarters':
                return true; // All beats are main clicks
            case 'eighths':
                // Main clicks on beats 0, 2, 4, 6 (odd positions: 1st, 3rd, 5th, 7th)
                return currentBeat % 2 === 0;
            case 'sixteenths':
                // Main clicks on beats 0, 4, 8, 12 (1st, 5th, 9th, 13th)
                return currentBeat % 4 === 0;
            case 'triplets':
                // Main clicks on beats 0, 3, 6, 9 (1st, 4th, 7th, 10th)
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

        // Determine if this is a main click or ghost click
        const mainClick = isMainClick(beat, subdivision);
        const mainBeatNumber = getMainBeatNumber(beat, subdivision);
        const isDownbeat = mainBeatNumber === 1 && mainClick;

        // Different pitches and base volumes: downbeat (highest), main clicks (medium), ghost clicks (lowest)
        let frequency = 600;
        let baseVolume = 0.2;
        let oscillatorType: OscillatorType = 'sine';
        
        // Set frequency and base volume based on click type and beat type
        if (isDownbeat) {
            frequency = 800;
            baseVolume = 0.3;
        } else if (mainClick) {
            frequency = 600;
            baseVolume = 0.25;
        } else {
            // Ghost click - quieter and lower
            frequency = 400;
            baseVolume = 0.1;
        }

        // Adjust frequency and type based on click sound selection
        switch (clickSound) {
            case 'tick':
                oscillatorType = 'sine';
                // Keep frequencies as is
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
    }, [beat, subdivision, volume, clickSound]);

    // Start/Stop metronome
    const toggleMetronome = useCallback(() => {
        if (isPlaying) {
            // Stop
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setIsPlaying(false);
            setBeat(0);
        } else {
            // Start - play first click immediately, then set up interval
            const config = getSubdivisionConfig(subdivision);
            setIsPlaying(true);
            setBeat(0);
            
            // Play first click immediately using current settings
            if (audioContextRef.current) {
                const audioContext = audioContextRef.current;
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                let frequency = 800; // Downbeat
                let oscillatorType: OscillatorType = 'sine';
                
                // Adjust based on click sound selection
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
    }, [isPlaying, bpm, subdivision, volume, clickSound]);

    // Update interval when BPM or subdivision changes
    useEffect(() => {
        if (isPlaying && intervalRef.current) {
            clearInterval(intervalRef.current);
            setBeat(0);
            const config = getSubdivisionConfig(subdivision);

            const interval = setInterval(() => {
                setBeat((prevBeat) => {
                    const nextBeat = (prevBeat + 1) % config.beatsPerMeasure;
                    return nextBeat;
                });
            }, (60 / bpm) * 1000 * config.intervalMultiplier);

            intervalRef.current = interval;
        }
    }, [bpm, isPlaying, subdivision]);

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

    const handleBpmChange = (newBpm: number) => {
        // Allow any value while typing, but clamp to valid range
        const clampedBpm = Math.max(30, Math.min(300, newBpm));
        if (!isNaN(clampedBpm) && clampedBpm >= 30 && clampedBpm <= 300) {
            setBpm(clampedBpm);
        }
    };

    const handleBpmInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Allow empty input while typing
        if (value === '') {
            return;
        }
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue)) {
            handleBpmChange(numValue);
        }
    };

    const handleBpmBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (isNaN(value) || value < 30) {
            setBpm(30);
        } else if (value > 300) {
            setBpm(300);
        } else {
            setBpm(value);
        }
    };

    return (
        <div className="metronome-container">
            <div className="metronome-background"></div>
            <div className="metronome-content">
                <NavBarHome />
                <div className="metronome-wrapper">
                    {/* Subdivision Selector - Left Side */}
                    <div className="subdivision-container">
                        <div className="subdivision-control">
                            <label>Subdivision</label>
                            <div className="subdivision-buttons">
                                <button
                                    className={`subdivision-button ${subdivision === 'quarters' ? 'active' : ''}`}
                                    onClick={() => setSubdivision('quarters')}
                                    disabled={isPlaying}
                                >
                                    ¼
                                </button>
                                <button
                                    className={`subdivision-button ${subdivision === 'eighths' ? 'active' : ''}`}
                                    onClick={() => setSubdivision('eighths')}
                                    disabled={isPlaying}
                                >
                                    ⅛
                                </button>
                                <button
                                    className={`subdivision-button ${subdivision === 'sixteenths' ? 'active' : ''}`}
                                    onClick={() => setSubdivision('sixteenths')}
                                    disabled={isPlaying}
                                >
                                    1/16
                                </button>
                                <button
                                    className={`subdivision-button ${subdivision === 'triplets' ? 'active' : ''}`}
                                    onClick={() => setSubdivision('triplets')}
                                    disabled={isPlaying}
                                >
                                    ♫
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Controls - Center/Right */}
                    <div className="metronome-controls">
                        {/* BPM Control */}
                        <div className="bpm-control">
                            <label>BPM</label>
                            <div className="bpm-input-group">
                                <button 
                                    className="bpm-button"
                                    onClick={() => handleBpmChange(bpm - 1)}
                                    disabled={bpm <= 30}
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    className="bpm-input"
                                    value={bpm}
                                    min={20}
                                    max={30}
                                    onChange={handleBpmInputChange}
                                    onBlur={handleBpmBlur}
                                />
                                <button 
                                    className="bpm-button"
                                    onClick={() => handleBpmChange(bpm + 1)}
                                    disabled={bpm >= 300}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Visual Beat Indicator */}
                        <div className="beat-indicator">
                            <div className={`beat-circle ${isPlaying ? 'active' : ''} ${getMainBeatNumber(beat, subdivision) === 1 ? 'downbeat' : ''}`}>
                                <div className="beat-number">{getMainBeatNumber(beat, subdivision)}</div>
                                <div className="beat-subdivision">
                                    {subdivision === 'quarters' ? '¼' : 
                                     subdivision === 'eighths' ? '⅛' : 
                                     subdivision === 'sixteenths' ? '1/16' : '♫'}
                                </div>
                            </div>
                        </div>

                        {/* Play/Stop Button */}
                        <button 
                            className={`play-button ${isPlaying ? 'playing' : ''}`}
                            onClick={toggleMetronome}
                        >
                            {isPlaying ? '⏸ Stop' : '▶ Play'}
                        </button>
                    </div>

                    {/* Settings Container - Right Side */}
                    <div className="settings-container">
                        <div className="settings-control">
                            <label>Volume</label>
                            <div className="volume-control">
                                <input
                                    type="range"
                                    className="volume-slider"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                />
                                <span className="volume-value">{Math.round(volume * 100)}%</span>
                            </div>
                        </div>

                        <div className="settings-control">
                            <label>Click Sound</label>
                            <div className="click-sound-buttons">
                                <button
                                    className={`click-sound-button ${clickSound === 'tick' ? 'active' : ''}`}
                                    onClick={() => setClickSound('tick')}
                                >
                                    Tick
                                </button>
                                <button
                                    className={`click-sound-button ${clickSound === 'beep' ? 'active' : ''}`}
                                    onClick={() => setClickSound('beep')}
                                >
                                    Beep
                                </button>
                                <button
                                    className={`click-sound-button ${clickSound === 'wood' ? 'active' : ''}`}
                                    onClick={() => setClickSound('wood')}
                                >
                                    Wood
                                </button>
                                <button
                                    className={`click-sound-button ${clickSound === 'metallic' ? 'active' : ''}`}
                                    onClick={() => setClickSound('metallic')}
                                >
                                    Metallic
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Metronome;
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
    const [timeSignature, setTimeSignature] = useState<number>(4); // Numerator
    const [timeSignatureDenom, setTimeSignatureDenom] = useState<number>(4); // Denominator
    const [volume, setVolume] = useState<number>(0.7);
    const [clickSound, setClickSound] = useState<ClickSound>('tick');
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
    const [swing, setSwing] = useState<number>(0); // Swing/shuffle feel (0-100%)
    const [accentPattern, setAccentPattern] = useState<boolean[]>(() => {
        // Initialize with 4 beats (default 4/4 time)
        const pattern = new Array(4).fill(false);
        pattern[0] = true; // First beat always accented
        return pattern;
    }); // Which beats to accent
    const [visualFlashIntensity, setVisualFlashIntensity] = useState<number>(0.5); // Visual flash intensity
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Calculate beats per measure and interval timing based on subdivision and time signature
    const getSubdivisionConfig = (sub: Subdivision, ts: number, tsDenom: number) => {
        // If denominator is not 4, play only the numerator beats (no subdivisions)
        if (tsDenom !== 4) {
            // Calculate interval multiplier based on denominator
            // 2 = half notes (2x longer), 8 = eighth notes (0.5x), 16 = sixteenth notes (0.25x)
            const intervalMultiplier = tsDenom === 2 ? 2 : tsDenom === 8 ? 0.5 : tsDenom === 16 ? 0.25 : 1;
            return { beatsPerMeasure: ts, intervalMultiplier };
        }
        
        // For 4/4 time, use subdivisions
        const beatsPerMeasure = ts; // Time signature numerator determines main beats
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

    // Calculate the main beat number (1 to timeSignature) based on current beat, subdivision, and time signature
    const getMainBeatNumber = (currentBeat: number, sub: Subdivision, ts: number, tsDenom: number): number => {
        // If denominator is not 4, each beat is a main beat (no subdivisions)
        if (tsDenom !== 4) {
            return (currentBeat % ts) + 1;
        }
        
        // For 4/4 time, use subdivision logic
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
    const isMainClick = (currentBeat: number, sub: Subdivision, tsDenom: number): boolean => {
        // If denominator is not 4, all beats are main clicks (no subdivisions, no ghost notes)
        if (tsDenom !== 4) {
            return true; // All beats are main clicks
        }
        
        // Original logic for 4/4 time
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
        
        // Set frequency and base volume based on click type and beat type
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
    }, [beat, subdivision, timeSignature, timeSignatureDenom, volume, clickSound, accentPattern]);

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
            const config = getSubdivisionConfig(subdivision, timeSignature, timeSignatureDenom);
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
    }, [isPlaying, bpm, subdivision, timeSignature, volume, clickSound, swing]);

    // Update interval when BPM or subdivision changes
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

    // Update accent pattern to match time signature numerator
    useEffect(() => {
        setAccentPattern((prevPattern) => {
            // If the length already matches, don't change
            if (prevPattern.length === timeSignature) {
                return prevPattern;
            }
            
            // Create a new pattern array with length matching the numerator
            const newPattern = new Array(timeSignature).fill(false);
            
            // Preserve existing accents where possible
            const minLength = Math.min(prevPattern.length, timeSignature);
            for (let i = 0; i < minLength; i++) {
                newPattern[i] = prevPattern[i];
            }
            
            // Ensure at least the first beat is accented
            if (!newPattern.some(acc => acc)) {
                newPattern[0] = true;
            }
            
            return newPattern;
        });
    }, [timeSignature]);

    // Auto-change subdivision when denominator changes
    useEffect(() => {
        if (timeSignatureDenom === 8) {
            setSubdivision('eighths');
        } else if (timeSignatureDenom === 16) {
            setSubdivision('sixteenths');
        } else if (timeSignatureDenom === 2 || timeSignatureDenom === 4) {
            // For 2/4 or 4/4, default to quarters
            setSubdivision('quarters');
        }
    }, [timeSignatureDenom]);

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
                        {!showAdvanced ? (
                            <>
                                <div className="subdivision-control">
                                    <label>Subdivision</label>
                                    <div className="subdivision-buttons">
                                        <button
                                            className={`subdivision-button ${subdivision === 'quarters' ? 'active' : ''}`}
                                            onClick={() => setSubdivision('quarters')}
                                            disabled={isPlaying || timeSignatureDenom === 8 || timeSignatureDenom === 16}
                                        >
                                             ♩

                                        </button>
                                        <button
                                            className={`subdivision-button ${subdivision === 'eighths' ? 'active' : ''}`}
                                            onClick={() => setSubdivision('eighths')}
                                            disabled={isPlaying || timeSignatureDenom === 8 || timeSignatureDenom === 16}
                                        >
                                            ♫
                                        </button>
                                        <button
                                            className={`subdivision-button ${subdivision === 'sixteenths' ? 'active' : ''}`}
                                            onClick={() => setSubdivision('sixteenths')}
                                            disabled={isPlaying || timeSignatureDenom === 8 || timeSignatureDenom === 16}
                                        >
                                            ♬♬
                                        </button>
                                        <button
                                            className={`subdivision-button ${subdivision === 'triplets' ? 'active' : ''} `}
                                            onClick={() => setSubdivision('triplets')}
                                            disabled={isPlaying || timeSignatureDenom === 8 || timeSignatureDenom === 16}
                                        >
                                            <div className="triplet-notation">
                                                <div className="triplet-line"></div>
                                                <span>♩♩♩</span>
                                            </div>
                                        </button>
                                    </div>
                                    {(timeSignatureDenom === 8 || timeSignatureDenom === 16) && (
                                        <div className="subdivision-disabled-hint">
                                            Subdivision is automatically set based on denominator
                                        </div>
                                    )}
                                </div>

                                <div className="time-signature-control">
                                    <label>Time Signature</label>
                                    <div className="time-signature-input-group">
                                        <button
                                            className="time-signature-button"
                                            onClick={() => {
                                                if (timeSignature > 2) {
                                                    setTimeSignature(timeSignature - 1);
                                                }
                                            }}
                                            disabled={isPlaying || timeSignature <= 2}
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            className="time-signature-input"
                                            min="2"
                                            max="19"
                                            value={timeSignature}
                                            onChange={(e) => {
                                                const value = parseInt(e.target.value, 10);
                                                if (!isNaN(value) && value >= 2 && value <= 19) {
                                                    setTimeSignature(value);
                                                }
                                            }}
                                            disabled={isPlaying}
                                        />
                                        <span className="time-signature-slash">/</span>
                                        <div className="time-signature-denominator-display">{timeSignatureDenom}</div>
                                        <button
                                            className="time-signature-button"
                                            onClick={() => {
                                                if (timeSignature < 19) {
                                                    setTimeSignature(timeSignature + 1);
                                                }
                                            }}
                                            disabled={isPlaying || timeSignature >= 19}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                {/* Advanced Button */}
                                <button
                                    className="advanced-button"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    disabled={isPlaying}
                                >
                                    Advanced ►
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Advanced Section */}
                                <div className="advanced-control">
                                    <label>Advanced Settings</label>
                                    
                                    {/* Time Signature Display & Denominator */}
                                    <div className="advanced-setting">
                                        <label className="advanced-label">Time Signature</label>
                                        <div className="advanced-time-signature-display">
                                            <span className="advanced-time-signature-numerator">{timeSignature}</span>
                                            <span className="advanced-time-signature-slash">/</span>
                                            <span className="advanced-time-signature-denominator">{timeSignatureDenom}</span>
                                        </div>
                                        <div className="advanced-denominator-hint">
                                            Change denominator below
                                        </div>
                                        <div className="time-signature-denominator-buttons">
                                            <button
                                                className={`time-signature-denom-button ${timeSignatureDenom === 2 ? 'active' : ''}`}
                                                onClick={() => setTimeSignatureDenom(2)}
                                                disabled={isPlaying}
                                            >
                                                2
                                            </button>
                                            <button
                                                className={`time-signature-denom-button ${timeSignatureDenom === 4 ? 'active' : ''}`}
                                                onClick={() => setTimeSignatureDenom(4)}
                                                disabled={isPlaying}
                                            >
                                                4
                                            </button>
                                            <button
                                                className={`time-signature-denom-button ${timeSignatureDenom === 8 ? 'active' : ''}`}
                                                onClick={() => setTimeSignatureDenom(8)}
                                                disabled={isPlaying}
                                            >
                                                8
                                            </button>
                                            <button
                                                className={`time-signature-denom-button ${timeSignatureDenom === 16 ? 'active' : ''}`}
                                                onClick={() => setTimeSignatureDenom(16)}
                                                disabled={isPlaying}
                                            >
                                                16
                                            </button>
                                        </div>
                                    </div>

                                    {/* Accent Pattern */}
                                    <div className="advanced-setting">
                                        <label className="advanced-label">Accent Pattern</label>
                                        <div className="accent-pattern-buttons">
                                            {accentPattern.map((accented, index) => (
                                                <button
                                                    key={index}
                                                    className={`accent-pattern-button ${accented ? 'active' : ''}`}
                                                    onClick={() => {
                                                        const newPattern = [...accentPattern];
                                                        newPattern[index] = !newPattern[index];
                                                        setAccentPattern(newPattern);
                                                    }}
                                                    disabled={isPlaying}
                                                >
                                                    {index + 1}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Swing/Shuffle */}
                                    {/* <div className="advanced-setting">
                                        <label className="advanced-label">Swing / Shuffle: {swing}%</label>
                                        <input
                                            type="range"
                                            className="swing-slider"
                                            min="0"
                                            max="100"
                                            step="1"
                                            value={swing}
                                            onChange={(e) => setSwing(parseInt(e.target.value, 10))}
                                            disabled={isPlaying}
                                        />
                                    </div> */}

                                    {/* Visual Flash Intensity */}
                                    {/* <div className="advanced-setting">
                                        <label className="advanced-label">Visual Flash: {Math.round(visualFlashIntensity * 100)}%</label>
                                        <input
                                            type="range"
                                            className="swing-slider"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value={visualFlashIntensity}
                                            onChange={(e) => setVisualFlashIntensity(parseFloat(e.target.value))}
                                        />
                                    </div> */}

                                    {/* Back to Basic Button */}
                                    <button
                                        className="advanced-button"
                                        onClick={() => setShowAdvanced(false)}
                                        disabled={isPlaying}
                                    >
                                        ◄ Basic
                                    </button>
                                </div>
                            </>
                        )}
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
                            <div className="bpm-slider-container">
                                <input
                                    type="range"
                                    className="bpm-slider"
                                    min="30"
                                    max="300"
                                    step="1"
                                    value={bpm}
                                    onChange={(e) => handleBpmChange(parseInt(e.target.value, 10))}
                                />
                            </div>
                        </div>

                        {/* Visual Beat Indicator */}
                        <div className="beat-indicator">
                            <div 
                                className={`beat-circle ${isPlaying ? 'active' : ''} ${getMainBeatNumber(beat, subdivision, timeSignature, timeSignatureDenom) === 1 ? 'downbeat' : ''}`}
                                style={{
                                    boxShadow: isPlaying && visualFlashIntensity > 0 
                                        ? `0 0 ${30 * visualFlashIntensity}px rgba(76, 175, 80, ${0.6 * visualFlashIntensity})` 
                                        : undefined
                                }}
                            >
                                <div className="beat-number">{getMainBeatNumber(beat, subdivision, timeSignature, timeSignatureDenom)}</div>
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
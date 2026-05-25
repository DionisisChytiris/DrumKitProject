import React, { useState, useEffect } from 'react';
import { NavBarHome } from '@/components/Navigation/NavBarHome';
import { useAppSelector } from '@/store/hooks';
import './styles/Metronome.css';
import { TimeSignatureBeatDots } from './Metronome/TimeSignatureBeatDots';
import { useMetronomeEngine } from './Metronome/useMetronomeEngine';
import { MetronomeLeftBasicPanel } from './Metronome/MetronomeLeftBasicPanel';
import { MetronomeLeftAdvancedPanel } from './Metronome/MetronomeLeftAdvancedPanel';
import { MetronomeCenterPanel } from './Metronome/MetronomeCenterPanel';
import { MetronomeRightSettingsPanel } from './Metronome/MetronomeRightSettingsPanel';
import { MetronomeSequenceSummary } from './Metronome/MetronomeSequenceSummary';

const Metronome: React.FC = () => {
    const {
        isPlaying,
        subdivision,
        timeSignature,
        timeSignatureDenom,
        accentPattern,
        visualFlashIntensity,
        useTimeSignatureSequence,
        timeSignatureSegments,
    } = useAppSelector((state) => state.metronome);

    // Client-only auth gating for limited services (no backend)
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('drumkitAuth.loggedIn') === 'true';
    });
    
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
    const [autoBpmRampEnabled, setAutoBpmRampEnabled] = useState(false);
    const [autoBpmIncrement, setAutoBpmIncrement] = useState(1);
    const [autoBpmEveryBars, setAutoBpmEveryBars] = useState(4);

    const { beat, toggleMetronome, barCount, resetBarCount } = useMetronomeEngine({
        enabled: autoBpmRampEnabled,
        increment: autoBpmIncrement,
        everyBars: autoBpmEveryBars,
    });

    useEffect(() => {
        const onStorage = () => {
            const logged = localStorage.getItem('drumkitAuth.loggedIn') === 'true';
            setIsLoggedIn(logged);
            if (!logged) setShowAdvanced(false);
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    // Metronome audio/timing handled in `useMetronomeEngine`.
    return (
        <div className="metronome-container">
            <div className="metronome-background"></div>
            <div className="metronome-content">
                <NavBarHome />
                <header className="metronome-header">
                    <h1 className="metronome-title">Metronome</h1>
                    <p className="metronome-onboarding">
                        Tap the circle to start · Advanced needs demo login
                    </p>
                </header>
                {/* <div className="metronome-top-beat-dots">
                    <TimeSignatureBeatDots
                        variant="top"
                        beat={beat}
                        isPlaying={isPlaying}
                        subdivision={subdivision}
                        timeSignature={timeSignature}
                        timeSignatureDenom={timeSignatureDenom}
                        accentPattern={accentPattern}
                    />
                    {useTimeSignatureSequence && timeSignatureSegments.length > 0 && (
                        <div className="metronome-sequence-summary-shell">
                            <MetronomeSequenceSummary segments={timeSignatureSegments} />
                        </div>
                    )}
                </div> */}
                <div className="metronome-wrapper">
                    {/* Subdivision Selector - Left Side */}
                    <div
                        className={`subdivision-container${
                            showAdvanced && useTimeSignatureSequence ? ' subdivision-container--sequence-focus' : ''
                        }`}
                    >
                        {!showAdvanced ? (
                            <MetronomeLeftBasicPanel isLoggedIn={isLoggedIn} setShowAdvanced={setShowAdvanced} />
                        ) : (
                            <MetronomeLeftAdvancedPanel setShowAdvanced={setShowAdvanced} />
                        )}
                    </div>

                    {/* Main Controls - Center/Right */}
                    <MetronomeCenterPanel
                        beat={beat}
                        isPlaying={isPlaying}
                        subdivision={subdivision}
                        timeSignature={timeSignature}
                        timeSignatureDenom={timeSignatureDenom}
                        visualFlashIntensity={visualFlashIntensity}
                        toggleMetronome={toggleMetronome}
                        barCount={barCount}
                        onResetBarCount={resetBarCount}
                        autoBpmRampEnabled={autoBpmRampEnabled}
                        onAutoBpmRampEnabledChange={setAutoBpmRampEnabled}
                        autoBpmIncrement={autoBpmIncrement}
                        onAutoBpmIncrementChange={setAutoBpmIncrement}
                        autoBpmEveryBars={autoBpmEveryBars}
                        onAutoBpmEveryBarsChange={setAutoBpmEveryBars}
                    />

                    {/* Settings Container - Right Side */}
                    <MetronomeRightSettingsPanel />
                </div>
            </div>
        </div>
    );
};

export default Metronome;
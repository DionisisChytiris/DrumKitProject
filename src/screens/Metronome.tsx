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

const Metronome: React.FC = () => {
    const {
        isPlaying,
        subdivision,
        timeSignature,
        timeSignatureDenom,
        accentPattern,
        visualFlashIntensity,
    } = useAppSelector((state) => state.metronome);

    // Client-only auth gating for limited services (no backend)
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('drumkitAuth.loggedIn') === 'true';
    });
    
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
    const { beat, toggleMetronome } = useMetronomeEngine();

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
                <div className="metronome-top-beat-dots">
                    <TimeSignatureBeatDots
                        variant="top"
                        beat={beat}
                        isPlaying={isPlaying}
                        subdivision={subdivision}
                        timeSignature={timeSignature}
                        timeSignatureDenom={timeSignatureDenom}
                        accentPattern={accentPattern}
                    />
                </div>
                <div className="metronome-wrapper">
                    {/* Subdivision Selector - Left Side */}
                    <div className="subdivision-container">
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
                    />

                    {/* Settings Container - Right Side */}
                    <MetronomeRightSettingsPanel />
                </div>
        </div>
        </div>
    );
};

export default Metronome;
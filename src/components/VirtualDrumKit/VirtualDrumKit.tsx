import { useState, useEffect, useCallback, useRef } from 'react';
import { DrumPiece } from '@/types';
import { audioManager } from '@/utils/audioManager';
import { enhancedAudioManager } from '@/utils/enhancedAudioManager';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setGlobalVolume } from '@/store/slices/mixerSlice';
import './VirtualDrumKit.css';

interface VirtualDrumKitProps {
  drumKit: DrumPiece[];
  onDrumHit?: (drumPieceId: string) => void;
}

export const VirtualDrumKit: React.FC<VirtualDrumKitProps> = ({
  drumKit,
  onDrumHit,
}) => {
  const dispatch = useAppDispatch();
  const globalVolume = useAppSelector((state) => state.mixer.globalVolume);
  const [activeDrums, setActiveDrums] = useState<Set<string>>(new Set());
  const [showVolumeIndicator, setShowVolumeIndicator] = useState<boolean>(false);
  const drumMapRef = useRef<Map<string, DrumPiece>>(new Map());
  const onDrumHitRef = useRef(onDrumHit);
  const volumeIndicatorTimeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync Redux globalVolume to audioManager whenever it changes
  useEffect(() => {
    audioManager.setVolume(globalVolume);
  }, [globalVolume]);

  // Keep refs updated
  useEffect(() => {
    onDrumHitRef.current = onDrumHit;
  }, [onDrumHit]);

  // Preload all audio files on mount for zero latency
  useEffect(() => {
    const soundsToPreload = drumKit
      .filter(drum => drum.audioUrl)
      .map(drum => ({ id: drum.id, url: drum.audioUrl! }));
    
    if (soundsToPreload.length > 0) {
      // Preload in both managers for compatibility
      // enhancedAudioManager for mixer effects, audioManager as fallback
      enhancedAudioManager.preloadSounds(soundsToPreload);
      audioManager.preloadSounds(soundsToPreload).catch((error) => {
        console.warn('Some audio files failed to preload:', error);
      });
    }

    // Build drum map for fast lookup
    drumMapRef.current.clear();
    drumKit.forEach(drum => {
      if (drum.keyBinding) {
        drumMapRef.current.set(drum.keyBinding.toUpperCase(), drum);
      }
    });
  }, [drumKit]);

  const handleDrumClick = useCallback(
    (drumPiece: DrumPiece) => {
      // Always use enhancedAudioManager - it will apply mixer settings if configured
      // The Mixer component initializes settings for all drums, so enhancedAudioManager is always ready
      enhancedAudioManager.playSound(drumPiece.id, drumPiece.audioUrl, 1.0);

      // Visual feedback (non-blocking)
      setActiveDrums((prev) => new Set(prev).add(drumPiece.id));
      setTimeout(() => {
        setActiveDrums((prev) => {
          const next = new Set(prev);
          next.delete(drumPiece.id);
          return next;
        });
      }, 150);

      // Notify parent (non-blocking)
      onDrumHitRef.current?.(drumPiece.id);
    },
    []
  );

  // Optimized keyboard support - direct lookup, no dependencies
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key.toUpperCase();
      const drumPiece = drumMapRef.current.get(key);

      if (drumPiece) {
        event.preventDefault();
        // Use enhancedAudioManager to apply mixer settings
        enhancedAudioManager.playSound(drumPiece.id, drumPiece.audioUrl, 1.0);
        
        // Visual feedback
        setActiveDrums((prev) => new Set(prev).add(drumPiece.id));
        setTimeout(() => {
          setActiveDrums((prev) => {
            const next = new Set(prev);
            next.delete(drumPiece.id);
            return next;
          });
        }, 150);

        // Notify parent
        onDrumHitRef.current?.(drumPiece.id);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []); // Empty deps - uses refs for everything

  // Mouse wheel volume control
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      // Check if we're over the drum kit container
      const target = event.target as HTMLElement;
      const isOverDrumKit = target.closest('.drum-kit-container') || target.closest('.virtual-drum-kit');
      
      if (!isOverDrumKit) {
        return;
      }

      // Prevent default scrolling behavior
      event.preventDefault();
      event.stopPropagation();

      // Calculate volume change (scroll up = increase, scroll down = decrease)
      const delta = event.deltaY > 0 ? -0.1 : 0.1; // 10% increments
      const newVolume = Math.max(0, Math.min(1, globalVolume + delta));
      
      // Only update if volume actually changed
      if (Math.abs(newVolume - globalVolume) < 0.01) {
        return;
      }
      
      // Update volume in Redux (which will sync to audioManager via useEffect)
      dispatch(setGlobalVolume(newVolume));

      // Show volume indicator
      setShowVolumeIndicator(true);

      // Clear existing timeout
      if (volumeIndicatorTimeoutRef.current) {
        clearTimeout(volumeIndicatorTimeoutRef.current);
      }

      // Hide indicator after 2 seconds
      volumeIndicatorTimeoutRef.current = window.setTimeout(() => {
        setShowVolumeIndicator(false);
      }, 2000);
    };

    // Also add to drum-kit-container directly for better event capture
    const drumKitContainer = document.querySelector('.drum-kit-container') as HTMLElement;
    if (drumKitContainer) {
      drumKitContainer.addEventListener('wheel', handleWheel as EventListener, { passive: false });
    }

    // Attach to both container and window for better coverage
    container.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('wheel', handleWheel);
      const drumKitContainer = document.querySelector('.drum-kit-container') as HTMLElement;
      if (drumKitContainer) {
        drumKitContainer.removeEventListener('wheel', handleWheel as EventListener);
      }
      if (volumeIndicatorTimeoutRef.current) {
        clearTimeout(volumeIndicatorTimeoutRef.current);
      }
    };
  }, [globalVolume, dispatch]); // Use globalVolume from Redux

  const getDrumClassName = (drumPiece: DrumPiece): string => {
    const baseClass = `drum-piece drum-${drumPiece.type}`;
    return activeDrums.has(drumPiece.id)
      ? `${baseClass} drum-active`
      : baseClass;
  };

  return (
    <div className="virtual-drum-kit" ref={containerRef}>
      {showVolumeIndicator && (
        <div className="volume-indicator">
          <div className="volume-indicator-label">Volume</div>
          <div className="volume-indicator-bar">
            <div 
              className="volume-indicator-fill" 
              style={{ width: `${globalVolume * 100}%` }}
            ></div>
          </div>
          <div className="volume-indicator-value">{Math.round(globalVolume * 100)}%</div>
        </div>
      )}
      <div className="drum-kit-container">
        {drumKit.map((drumPiece) => (
          <div
            key={drumPiece.id}
            className={getDrumClassName(drumPiece)}
            style={{
              left: `${drumPiece.position.x}%`,
              top: `${drumPiece.position.y}%`,
              width: `${drumPiece.size.width}px`,
              height: `${drumPiece.size.height}px`,
            }}
            onClick={() => handleDrumClick(drumPiece)}
            role="button"
            tabIndex={0}
            aria-label={`${drumPiece.name} (${drumPiece.keyBinding || 'No key'})`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleDrumClick(drumPiece);
              }
            }}
          >
            {drumPiece.type === 'cymbal' || drumPiece.type === 'hihat' ? (
              <>
                <div className="cymbal-shadow"></div>
                <div className="cymbal-bottom"></div>
                <div className="cymbal-top"></div>
                <div className="cymbal-center"></div>
                <div className="cymbal-hole"></div>
                <div className="cymbal-wear"></div>
              </>
            ) : (
              <>
                <div className="drum-shadow"></div>
                <div className="drum-shell"></div>
                <div className="drum-shell-highlight"></div>
                <div className="drum-head"></div>
                {drumPiece.type === 'snare' && <div className="drum-stick-marks"></div>}
                <div className="drum-rim"></div>
                <div className="drum-rim-highlight"></div>
                {drumPiece.type === 'kick' && (
                  <>
                    <div className="drum-kick-front"></div>
                    <div className="drum-kick-logo"></div>
                  </>
                )}
                <div className="drum-lugs"></div>
              </>
            )}
            <div className="drum-piece-inner">
              {drumPiece.keyBinding && (
                <span className="drum-key">{drumPiece.keyBinding}</span>
              )}
            </div>
          </div>
        ))}
      </div>
             <div className="volume-control-section">
               <label className="volume-label">Volume: {Math.round(globalVolume * 100)}%</label>
               <input
                 type="range"
                 min="0"
                 max="100"
                 value={globalVolume * 100}
                 onChange={(e) => {
                   const newVolume = parseInt(e.target.value) / 100;
                   dispatch(setGlobalVolume(newVolume));
                 }}
                 className="volume-slider"
                 style={{
                   '--volume-percent': `${globalVolume * 100}%`
                 } as React.CSSProperties}
               />
             </div>
      <div className="drum-kit-instructions">
        <p>Click on drums or use keyboard keys to play</p>
        <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.7 }}>
          Scroll mouse wheel over drum kit to adjust volume
        </p>
      </div>
    </div>
  );
};

import { useState, useEffect, useCallback } from 'react';
import { DrumPiece } from '@/types';
import { audioManager } from '@/utils/audioManager';
import './VirtualDrumKit.css';

interface VirtualDrumKitProps {
  drumKit: DrumPiece[];
  onDrumHit?: (drumPieceId: string) => void;
}

export const VirtualDrumKit: React.FC<VirtualDrumKitProps> = ({
  drumKit,
  onDrumHit,
}) => {
  const [activeDrums, setActiveDrums] = useState<Set<string>>(new Set());

  const handleDrumClick = useCallback(
    (drumPiece: DrumPiece) => {
      // Play sound
      audioManager.playSound(drumPiece.id, drumPiece.audioUrl);

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
      onDrumHit?.(drumPiece.id);
    },
    [onDrumHit]
  );

  // Keyboard support
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key.toUpperCase();
      const drumPiece = drumKit.find(
        (drum) => drum.keyBinding?.toUpperCase() === key
      );

      if (drumPiece) {
        event.preventDefault();
        handleDrumClick(drumPiece);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [drumKit, handleDrumClick]);

  const getDrumClassName = (drumPiece: DrumPiece): string => {
    const baseClass = `drum-piece drum-${drumPiece.type}`;
    return activeDrums.has(drumPiece.id)
      ? `${baseClass} drum-active`
      : baseClass;
  };

  return (
    <div className="virtual-drum-kit">
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
      <div className="drum-kit-instructions">
        <p>Click on drums or use keyboard keys to play</p>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setBpm, type Subdivision } from '@/store/slices/metronomeSlice';
import { getMainBeatNumber } from './metronomeTiming';

interface MetronomeCenterPanelProps {
  beat: number;
  isPlaying: boolean;
  subdivision: Subdivision;
  timeSignature: number;
  timeSignatureDenom: number;
  visualFlashIntensity: number;
  toggleMetronome: () => void;
}

export const MetronomeCenterPanel: React.FC<MetronomeCenterPanelProps> = ({
  beat,
  isPlaying,
  subdivision,
  timeSignature,
  timeSignatureDenom,
  visualFlashIntensity,
  toggleMetronome,
}) => {
  const dispatch = useAppDispatch();
  const { bpm } = useAppSelector((state) => state.metronome);

  const [bpmInputValue, setBpmInputValue] = useState<string>(bpm.toString());
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inputRef.current !== document.activeElement) {
      setBpmInputValue(bpm.toString());
    }
  }, [bpm]);

  const handleBpmChange = (newBpm: number) => {
    dispatch(setBpm(newBpm));
  };

  const handleBpmInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBpmInputValue(value);

    if (value !== '') {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue >= 30 && numValue <= 400) {
        handleBpmChange(numValue);
      }
    }
  };

  const handleBpmBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 30) {
      dispatch(setBpm(30));
      setBpmInputValue('30');
    } else if (value > 400) {
      dispatch(setBpm(400));
      setBpmInputValue('400');
    } else {
      dispatch(setBpm(value));
      setBpmInputValue(value.toString());
    }
  };

  const mainBeatNumber = getMainBeatNumber(beat, subdivision, timeSignature, timeSignatureDenom);

  return (
    <div className="metronome-controls">
      {/* BPM Control */}
      <div className="bpm-control">
        <div className="bpm-input-group">
          <button
            className="bpm-button"
            onClick={() => handleBpmChange(bpm - 1)}
            disabled={bpm <= 30}
          >
            −
          </button>
          <input
            ref={inputRef}
            type="number"
            className="bpm-input"
            value={bpmInputValue}
            min={30}
            max={400}
            onChange={handleBpmInputChange}
            onBlur={handleBpmBlur}
          />
          <button
            className="bpm-button"
            onClick={() => handleBpmChange(bpm + 1)}
            disabled={bpm >= 400}
          >
            +
          </button>
        </div>
        <div className="bpm-slider-container">
          <input
            type="range"
            className="bpm-slider"
            min="30"
            max="400"
            step="1"
            value={bpm}
            onChange={(e) => handleBpmChange(parseInt(e.target.value, 10))}
          />
        </div>
      </div>

      {/* Visual Beat Indicator */}
      <div className="beat-indicator">
        <div
          className={`beat-circle ${isPlaying ? 'active' : ''} ${mainBeatNumber === 1 ? 'downbeat' : ''}`}
          style={{
            boxShadow:
              isPlaying && visualFlashIntensity > 0
                ? `0 0 ${30 * visualFlashIntensity}px rgba(76, 175, 80, ${0.6 * visualFlashIntensity})`
                : undefined,
          }}
        >
          <div className="beat-number">{mainBeatNumber}</div>
        </div>
      </div>

      {/* Play/Stop Button */}
      <button className={`play-button ${isPlaying ? 'playing' : ''}`} onClick={toggleMetronome}>
        {isPlaying ? '⏸ Stop' : '▶ Play'}
      </button>
    </div>
  );
};


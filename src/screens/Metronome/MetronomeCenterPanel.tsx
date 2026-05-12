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
  barCount: number;
  onResetBarCount: () => void;
  autoBpmRampEnabled: boolean;
  onAutoBpmRampEnabledChange: (enabled: boolean) => void;
  autoBpmIncrement: number;
  onAutoBpmIncrementChange: (value: number) => void;
  autoBpmEveryBars: number;
  onAutoBpmEveryBarsChange: (value: number) => void;
}

export const MetronomeCenterPanel: React.FC<MetronomeCenterPanelProps> = ({
  beat,
  isPlaying,
  subdivision,
  timeSignature,
  timeSignatureDenom,
  visualFlashIntensity,
  toggleMetronome,
  barCount,
  onResetBarCount,
  autoBpmRampEnabled,
  onAutoBpmRampEnabledChange,
  autoBpmIncrement,
  onAutoBpmIncrementChange,
  autoBpmEveryBars,
  onAutoBpmEveryBarsChange,
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

      {/* Beat count circle — tap to play / stop */}
      <div className="beat-indicator">
        <button
          type="button"
          className={`beat-circle ${isPlaying ? 'active' : ''} ${mainBeatNumber === 1 ? 'downbeat' : ''}`}
          style={{
            boxShadow:
              isPlaying && visualFlashIntensity > 0
                ? `0 0 ${30 * visualFlashIntensity}px rgba(76, 175, 80, ${0.6 * visualFlashIntensity})`
                : undefined,
          }}
          onClick={toggleMetronome}
          aria-pressed={isPlaying}
          aria-label={isPlaying ? 'Stop metronome' : 'Start metronome'}
        >
          <span className="beat-number">{mainBeatNumber}</span>
          <span className="beat-circle-action-label">{isPlaying ? 'Stop' : 'Play'}</span>
        </button>
      </div>

      <div className="metronome-bar-row">
        <div className="metronome-bar-counter" aria-live="polite">
          <span className="metronome-bar-counter-label">Bars</span>
          <div className="metronome-bar-counter-row">
            <span className="metronome-bar-counter-value">{barCount}</span>
            <button
              type="button"
              className="metronome-bar-reset"
              onClick={onResetBarCount}
              aria-label="Reset bar count to zero"
              title="Reset bar count"
            >
              <svg
                className="metronome-bar-reset-icon"
                viewBox="0 0 24 24"
                width={20}
                height={20}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
            </button>
          </div>
        </div>

        <div className="metronome-auto-bpm-ramp">
          <label className="metronome-auto-bpm-toggle">
            <input
              type="checkbox"
              checked={autoBpmRampEnabled}
              onChange={(e) => onAutoBpmRampEnabledChange(e.target.checked)}
            />
            <span className="metronome-auto-bpm-toggle-label">Auto +BPM</span>
          </label>
          <div className="metronome-auto-bpm-fields">
            <label className="metronome-auto-bpm-field">
              <span className="metronome-auto-bpm-field-label">+ BPM</span>
              <input
                type="number"
                className="metronome-auto-bpm-input"
                min={1}
                max={50}
                value={autoBpmIncrement}
                disabled={!autoBpmRampEnabled}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (Number.isNaN(v)) return;
                  onAutoBpmIncrementChange(Math.min(50, Math.max(1, v)));
                }}
                aria-label="BPM increase per interval"
              />
            </label>
            <label className="metronome-auto-bpm-field">
              <span className="metronome-auto-bpm-field-label">Every N bars</span>
              <input
                type="number"
                className="metronome-auto-bpm-input"
                min={1}
                max={999}
                value={autoBpmEveryBars}
                disabled={!autoBpmRampEnabled}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (Number.isNaN(v)) return;
                  onAutoBpmEveryBarsChange(Math.min(999, Math.max(1, v)));
                }}
                aria-label="Number of bars between BPM increases"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};


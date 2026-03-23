import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setAccentPattern, setTimeSignatureDenom } from '@/store/slices/metronomeSlice';

interface MetronomeLeftAdvancedPanelProps {
  setShowAdvanced: (value: boolean) => void;
}

export const MetronomeLeftAdvancedPanel: React.FC<MetronomeLeftAdvancedPanelProps> = ({
  setShowAdvanced,
}) => {
  const dispatch = useAppDispatch();
  const { isPlaying, timeSignature, timeSignatureDenom, accentPattern } = useAppSelector((state) => state.metronome);

  return (
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
        <div className="advanced-denominator-hint">Change denominator below</div>
        <div className="time-signature-denominator-buttons">
          <button
            className={`time-signature-denom-button ${timeSignatureDenom === 2 ? 'active' : ''}`}
            onClick={() => dispatch(setTimeSignatureDenom(2))}
            disabled={isPlaying}
          >
            2
          </button>
          <button
            className={`time-signature-denom-button ${timeSignatureDenom === 4 ? 'active' : ''}`}
            onClick={() => dispatch(setTimeSignatureDenom(4))}
            disabled={isPlaying}
          >
            4
          </button>
          <button
            className={`time-signature-denom-button ${timeSignatureDenom === 8 ? 'active' : ''}`}
            onClick={() => dispatch(setTimeSignatureDenom(8))}
            disabled={isPlaying}
          >
            8
          </button>
          <button
            className={`time-signature-denom-button ${timeSignatureDenom === 16 ? 'active' : ''}`}
            onClick={() => dispatch(setTimeSignatureDenom(16))}
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
                dispatch(setAccentPattern(newPattern));
              }}
              disabled={isPlaying}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Back to Basic Button */}
      <button
        className="advanced-button"
        onClick={() => setShowAdvanced(false)}
        disabled={isPlaying}
      >
        ◄ Basic
      </button>
    </div>
  );
};


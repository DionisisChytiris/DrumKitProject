import { useCallback, useRef } from 'react';
import './PlayAlongKnob.css';

const KNOB_ROTATION_MIN = -140;
const KNOB_ROTATION_MAX = 140;

export interface PlayAlongKnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  displayValue?: string;
  variant?: 'tempo' | 'volume';
  ariaLabel: string;
  onInput: (value: number) => void;
  onCommit?: (value: number) => void;
}

function clampValue(value: number, min: number, max: number, step: number): number {
  const stepped = step > 0 ? Math.round(value / step) * step : value;
  return Math.min(max, Math.max(min, stepped));
}

function valueToRotation(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  const t = (value - min) / (max - min);
  return KNOB_ROTATION_MIN + t * (KNOB_ROTATION_MAX - KNOB_ROTATION_MIN);
}

export const PlayAlongKnob: React.FC<PlayAlongKnobProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  disabled = false,
  displayValue,
  variant = 'tempo',
  ariaLabel,
  onInput,
  onCommit,
}) => {
  const dragRef = useRef<{ startY: number; startValue: number } | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const rotation = valueToRotation(value, min, max);
  const shownValue = displayValue ?? String(value);

  const emitInput = useCallback(
    (next: number) => {
      onInput(clampValue(next, min, max, step));
    },
    [max, min, onInput, step],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startY: event.clientY, startValue: value };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || !dragRef.current) return;

    const range = max - min;
    const sensitivity = range / 160;
    const deltaY = dragRef.current.startY - event.clientY;
    emitInput(dragRef.current.startValue + deltaY * sensitivity);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onCommit?.(clampValue(valueRef.current, min, max, step));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
      event.preventDefault();
      emitInput(value + step);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
      event.preventDefault();
      emitInput(value - step);
    } else if (event.key === 'Enter' || event.key === ' ') {
      return;
    }
  };

  const handleKeyUp = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === 'ArrowUp' || event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
      onCommit?.(clampValue(value, min, max, step));
    }
  };

  return (
    <div className={`playalong-knob playalong-knob--${variant}${disabled ? ' playalong-knob--disabled' : ''}`}>
      <span className="playalong-knob-label">{label}</span>
      <button
        type="button"
        className="playalong-knob-dial"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={() => onCommit?.(clampValue(valueRef.current, min, max, step))}
      >
        <span className="playalong-knob-ring" aria-hidden="true" />
        <span
          className="playalong-knob-indicator"
          style={{ transform: `rotate(${rotation}deg)` }}
          aria-hidden="true"
        />
        <span className="playalong-knob-center" aria-hidden="true" />
      </button>
      <span className="playalong-knob-value" aria-live="polite">
        {shownValue}
      </span>
    </div>
  );
};

export default PlayAlongKnob;

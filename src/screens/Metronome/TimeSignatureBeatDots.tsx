import React from 'react';
import type { Subdivision } from '@/store/slices/metronomeSlice';
import { getMainBeatNumber, isMainClick } from './metronomeTiming';

type Variant = 'top' | 'basic' | 'advanced';

interface TimeSignatureBeatDotsProps {
  variant: Variant;
  beat: number;
  isPlaying: boolean;
  subdivision: Subdivision;
  timeSignature: number;
  timeSignatureDenom: number;
  accentPattern: boolean[];
}

export const TimeSignatureBeatDots: React.FC<TimeSignatureBeatDotsProps> = ({
  variant,
  beat,
  isPlaying,
  subdivision,
  timeSignature,
  timeSignatureDenom,
  accentPattern,
}) => {
  const mainBeatNumber = getMainBeatNumber(beat, subdivision, timeSignature, timeSignatureDenom);
  const activeDotIndex = isPlaying ? mainBeatNumber - 1 : 0;
  const activeMainClick = isPlaying ? isMainClick(beat, subdivision, timeSignatureDenom) : true;

  const tsDotCount = Math.max(1, timeSignature);
  const isBarMode = tsDotCount > 7;

  const tsDotHeight = Math.max(20, Math.min(60, 60 - tsDotCount * 0.8));
  const tsDotGap = Math.max(8, Math.min(38, 38 - tsDotCount * 0.15));
  const tsDotWidth = isBarMode ? tsDotHeight / 2 : tsDotHeight;
  const tsDotFinalGap = isBarMode ? tsDotGap / 2 : tsDotGap;

  const tsDotVars = {
    ['--ts-dot-height' as any]: `${tsDotHeight}px`,
    ['--ts-dot-width' as any]: `${tsDotWidth}px`,
    ['--ts-dot-gap' as any]: `${tsDotFinalGap}px`,
  } as React.CSSProperties;

  const wrapperClass =
    variant === 'advanced'
      ? 'time-signature-beat-dots time-signature-beat-dots--advanced'
      : variant === 'top'
        ? 'time-signature-beat-dots time-signature-beat-dots--top'
        : 'time-signature-beat-dots';

  return (
    <div className={wrapperClass} style={tsDotVars} aria-hidden="true">
      {Array.from({ length: tsDotCount }, (_, i) => {
        const isActive = i === activeDotIndex;
        const isDownbeat = isActive && i === 0 && activeMainClick;
        const isAccented = isActive && !isDownbeat && activeMainClick && (accentPattern[i] ?? false);
        const isGhost = isActive && isPlaying && !activeMainClick;

        return (
          <div
            key={i}
            className={`time-signature-beat-dot ${isBarMode ? 'time-signature-beat-dot--bar' : ''} ${
              isActive ? 'active' : ''
            } ${
              isDownbeat
                ? 'downbeat'
                : isAccented
                  ? 'accented'
                  : isGhost
                    ? 'ghost'
                    : ''
            }`}
            title={`Beat ${i + 1}`}
          />
        );
      })}
    </div>
  );
};


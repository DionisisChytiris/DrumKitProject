import React, { useMemo } from 'react';
import type { TimeSignatureSegment } from '@/store/slices/metronomeSlice';

/** Compact one-line form for screen readers / tooltips */
export function formatMeterSequenceLine(segments: TimeSignatureSegment[]): string {
  return segments
    .map((s) => `${s.numerator}/${s.denominator} for ${s.bars} bar${s.bars === 1 ? '' : 's'}`)
    .join('; then ');
}

const ArrowBetween: React.FC = () => (
  <span className="metronome-sequence-arrow" aria-hidden>
    <svg className="metronome-sequence-arrow-svg" viewBox="0 0 24 24" width="14" height="14" fill="none">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

interface MetronomeSequenceSummaryProps {
  segments: TimeSignatureSegment[];
}

export const MetronomeSequenceSummary: React.FC<MetronomeSequenceSummaryProps> = ({ segments }) => {
  const ariaDescription = useMemo(() => formatMeterSequenceLine(segments), [segments]);

  if (!segments.length) return null;

  return (
    <aside
      className="metronome-sequence-summary"
      role="complementary"
      aria-label={`Meter loop. ${ariaDescription}. Repeats in order while playing.`}
    >
      <div className="metronome-sequence-summary-inner">
        <div className="metronome-sequence-summary-head">
          <span className="metronome-sequence-summary-title">Meter loop</span>
          <span className="metronome-sequence-summary-sub">Then repeats</span>
        </div>
        <ol className="metronome-sequence-track" aria-label="Segments in play order">
          {segments.map((seg, index) => (
            <li key={seg.id} className="metronome-sequence-step">
              {index > 0 && <ArrowBetween />}
              <div className="metronome-sequence-chip">
                <span className="metronome-sequence-chip-meter">
                  {seg.numerator}/{seg.denominator}
                </span>
                <span className="metronome-sequence-chip-dot" aria-hidden>
                  ·
                </span>
                <span className="metronome-sequence-chip-bars">
                  {seg.bars} bar{seg.bars === 1 ? '' : 's'}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
};

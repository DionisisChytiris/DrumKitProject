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

const ArrowDown: React.FC = () => (
  <span className="metronome-sequence-arrow metronome-sequence-arrow--down" aria-hidden>
    <svg className="metronome-sequence-arrow-svg" viewBox="0 0 24 24" width="14" height="14" fill="none">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

function formatSegmentChip(bars: number, numerator: number, denominator: number): string {
  const barLabel = bars === 1 ? 'bar' : 'bars';
  return `${bars} ${barLabel} → ${numerator}/${denominator}`;
}

export const MetronomeSequenceHead: React.FC = () => (
  <div className="metronome-sequence-summary-head">
    <span className="metronome-sequence-summary-title">Meter loop</span>
    <span className="metronome-sequence-summary-sub">Then repeats</span>
  </div>
);

interface MetronomeSequenceSummaryProps {
  segments: TimeSignatureSegment[];
  variant?: 'inline' | 'stacked';
}

export const MetronomeSequenceSummary: React.FC<MetronomeSequenceSummaryProps> = ({
  segments,
  variant = 'inline',
}) => {
  const ariaDescription = useMemo(() => formatMeterSequenceLine(segments), [segments]);
  const stacked = variant === 'stacked';

  if (!segments.length) return null;

  const track = (
    <ol className="metronome-sequence-track" aria-label="Segments in play order">
      {segments.map((seg, index) => (
        <li key={seg.id} className="metronome-sequence-step">
          {index > 0 && (stacked ? <ArrowDown /> : <ArrowBetween />)}
          <div className="metronome-sequence-chip">
            {stacked ? (
              <span className="metronome-sequence-chip-line">
                {formatSegmentChip(seg.bars, seg.numerator, seg.denominator)}
              </span>
            ) : (
              <>
                <span className="metronome-sequence-chip-meter">
                  {seg.numerator}/{seg.denominator}
                </span>
                <span className="metronome-sequence-chip-dot" aria-hidden>
                  ·
                </span>
                <span className="metronome-sequence-chip-bars">
                  {seg.bars} bar{seg.bars === 1 ? '' : 's'}
                </span>
              </>
            )}
          </div>
        </li>
      ))}
    </ol>
  );

  if (stacked) {
    return (
      <div className="metronome-sequence-summary metronome-sequence-summary--stacked metronome-sequence-summary--list-only">
        {track}
      </div>
    );
  }

  return (
    <aside
      className="metronome-sequence-summary"
      role="complementary"
      aria-label={`Meter loop. ${ariaDescription}. Repeats in order while playing.`}
    >
      <div className="metronome-sequence-summary-inner">
        <MetronomeSequenceHead />
        {track}
      </div>
    </aside>
  );
};

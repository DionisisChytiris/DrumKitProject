import type { CSSProperties, FC, ReactNode } from 'react';
import { useAppSelector } from '@/store/hooks';
import type { Subdivision } from '@/store/slices/metronomeSlice';
import './MetronomeSettingsHud.css';

function resolveSubdivisionDisplay(
  subdivision: Subdivision,
  denom: number
): Subdivision | 'half' | 'eighth-beat' | 'sixteenth-beat' {
  if (denom === 2) return 'half';
  if (denom === 8) return 'eighth-beat';
  if (denom === 16) return 'sixteenth-beat';
  return subdivision;
}

const SUBDIVISION_LABELS: Record<Subdivision | 'half' | 'eighth-beat' | 'sixteenth-beat', string> = {
  quarters: 'Quarter notes',
  eighths: 'Eighth notes',
  sixteenths: 'Sixteenth notes',
  triplets: 'Triplets',
  half: 'Half-note beats',
  'eighth-beat': 'Eighth-note beats',
  'sixteenth-beat': 'Sixteenth-note beats',
};

function SubdivisionIcon({ kind }: { kind: Subdivision | 'half' | 'eighth-beat' | 'sixteenth-beat' }): ReactNode {
  switch (kind) {
    case 'half':
      return <span className="metronome-settings-hud-subdivision-glyph">𝅗𝅥</span>;
    case 'quarters':
      return <span className="metronome-settings-hud-subdivision-glyph">♩</span>;
    case 'eighths':
    case 'eighth-beat':
      return <span className="metronome-settings-hud-subdivision-glyph">♫</span>;
    case 'sixteenths':
    case 'sixteenth-beat':
      return <span className="metronome-settings-hud-subdivision-glyph">♬♬</span>;
    case 'triplets':
      return (
        <span className="metronome-settings-hud-subdivision-triplet">
          <span className="metronome-settings-hud-subdivision-triplet-line" aria-hidden="true" />
          <span className="metronome-settings-hud-subdivision-glyph">♩♩♩</span>
        </span>
      );
    default:
      return null;
  }
}

export const MetronomeSettingsHud: FC<{ accentPattern: boolean[] }> = ({ accentPattern }) => {
  const { timeSignature, timeSignatureDenom, subdivision } = useAppSelector(
    (state) => state.metronome
  );

  const subdivisionDisplay = resolveSubdivisionDisplay(subdivision, timeSignatureDenom);
  const meterLabel = `${timeSignature} over ${timeSignatureDenom}`;
  const accentSummary = accentPattern.map((on) => (on ? 'accent' : 'beat')).join(', ');
  const dotsWide = timeSignature > 6 || accentPattern.length > 6;

  const dotsStyle = dotsWide
    ? ({ '--hud-dot-count': accentPattern.length } as CSSProperties)
    : undefined;

  return (
    <aside className="metronome-settings-hud" aria-label={`Time signature ${meterLabel}`}>
      <div className="metronome-settings-hud-meter">
        <div className="metronome-settings-hud-signature" aria-live="polite">
          <span className="metronome-settings-hud-signature-num">{timeSignature}</span>
          <span className="metronome-settings-hud-signature-bar" aria-hidden="true" />
          <span className="metronome-settings-hud-signature-num">{timeSignatureDenom}</span>
        </div>

        <div
          className="metronome-settings-hud-subdivision"
          aria-label={`Subdivision: ${SUBDIVISION_LABELS[subdivisionDisplay]}`}
        >
          <SubdivisionIcon kind={subdivisionDisplay} />
        </div>
      </div>

      <div
        className={`metronome-settings-hud-dots${dotsWide ? ' metronome-settings-hud-dots--wide' : ''}`}
        style={dotsStyle}
        role="img"
        aria-label={`Accent pattern: ${accentSummary}`}
      >
        {accentPattern.map((accented, index) => (
          <span
            key={index}
            className={`metronome-settings-hud-dot${accented ? ' metronome-settings-hud-dot--accent' : ''}`}
          />
        ))}
      </div>
    </aside>
  );
};

export default MetronomeSettingsHud;

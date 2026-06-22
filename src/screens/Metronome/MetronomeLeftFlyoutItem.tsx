import { useRef, useState, type ReactNode } from 'react';

export interface MetronomeLeftFlyoutItemProps {
  title: string;
  panelLabel?: string;
  helpOpen: boolean;
  onToggleHelp: () => void;
  helpText: string;
  panelClassName?: string;
  /** Muted title — another control owns this setting */
  overridden?: boolean;
  /** Highlight title — this control is the active source */
  emphasized?: boolean;
  /** Demo login required — shows lock styling on the rail label */
  locked?: boolean;
  /** Short badge next to the title (e.g. current meter or "Segments") */
  titleBadge?: string;
  /** Shown at top of flyout panel when set */
  panelNotice?: ReactNode;
  children: ReactNode;
}

export const MetronomeLeftFlyoutItem: React.FC<MetronomeLeftFlyoutItemProps> = ({
  title,
  panelLabel,
  helpOpen,
  onToggleHelp,
  helpText,
  panelClassName = '',
  overridden = false,
  emphasized = false,
  locked = false,
  titleBadge,
  panelNotice,
  children,
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    const root = itemRef.current;
    if (!root) return;

    const active = document.activeElement;
    if (active instanceof HTMLElement && root.contains(active)) {
      active.blur();
    }
  };

  const itemClass = [
    'metronome-left-flyout-item',
    open ? 'metronome-left-flyout-item--open' : '',
    overridden ? 'metronome-left-flyout-item--overridden' : '',
    emphasized ? 'metronome-left-flyout-item--emphasized' : '',
    locked ? 'metronome-left-flyout-item--locked' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={itemRef}
      className={itemClass}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onFocusCapture={handleOpen}
      onBlurCapture={(event) => {
        if (!itemRef.current?.contains(event.relatedTarget as Node | null)) {
          handleClose();
        }
      }}
    >
      <span className="metronome-left-flyout-title">
        {locked ? '🔒 ' : ''}
        {title}
        {titleBadge && (
          <span className="metronome-left-flyout-title-badge">{titleBadge}</span>
        )}
      </span>
      <div className={`metronome-left-flyout-panel${panelClassName ? ` ${panelClassName}` : ''}`}>
        <div className="metronome-left-flyout-panel-head">
          <span className="metronome-left-flyout-panel-label">{panelLabel ?? title}</span>
          <button
            type="button"
            className="metronome-help-btn"
            onClick={onToggleHelp}
            aria-label={`${title} help`}
            aria-expanded={helpOpen}
          >
            ?
          </button>
        </div>
        {helpOpen && <p className="metronome-help-pop">{helpText}</p>}
        {panelNotice && (
          <p className="metronome-left-flyout-notice" role="status">
            {panelNotice}
          </p>
        )}
        <div
          className={`metronome-left-flyout-panel-body${overridden ? ' metronome-left-flyout-panel-body--locked' : ''}`}
          aria-disabled={overridden || undefined}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

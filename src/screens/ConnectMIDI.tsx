import { useMemo } from 'react';
import { useMidiInput } from '@/hooks/useMidiInput';
import { NavBarHome } from '@/components/Navigation/NavBarHome';
import {
  detectBrowserMidiHint,
  getWebMidiUnsupportedMessage,
  MIDI_BROWSER_COMPAT_ROWS,
} from '@/utils/midi/midiSupport';
import './styles/ConnectMIDI.css';

const ConnectMIDI: React.FC = () => {
  const {
    supported,
    status,
    errorMessage,
    inputs,
    selectedInputId,
    selectedInputName,
    lastNoteEvent,
    lastNoteLabel,
    requestAccess,
    selectInput,
    disconnect,
  } = useMidiInput({ autoConnect: true });

  const browserHint = useMemo(() => detectBrowserMidiHint(), []);
  const isConnected = status === 'connected';
  const isRequesting = status === 'requesting';

  const browserStatusClass =
    browserHint.status === 'supported'
      ? 'connectmidi-browser-badge--supported'
      : browserHint.status === 'limited'
        ? 'connectmidi-browser-badge--limited'
        : 'connectmidi-browser-badge--unsupported';

  return (
    <div className="connectmidi-container">
      <div className="connectmidi-background" aria-hidden="true" />
      <div className="connectmidi-content">
        <NavBarHome />

        <main className="connectmidi-main">
          <div className="connectmidi-layout">
            <div className="connectmidi-focus">
              <header className="connectmidi-header">
                <h1 className="connectmidi-title">Connect MIDI</h1>
                <p className="connectmidi-lead">
                  Plug in your kit, connect below, then hit pads to test.
                </p>
              </header>
              <section
                className="connectmidi-panel connectmidi-panel--hero"
                aria-labelledby="connectmidi-actions-heading"
              >
                <h2 id="connectmidi-actions-heading" className="connectmidi-sr-only">
                  Connect your drum kit
                </h2>

                <div className="connectmidi-hero-actions">
                  {supported && !isConnected && (
                    <button
                      type="button"
                      className="connectmidi-btn connectmidi-btn--hero"
                      onClick={() => void requestAccess()}
                      disabled={isRequesting}
                    >
                      {isRequesting ? 'Connecting…' : 'Connect MIDI kit'}
                    </button>
                  )}

                  {supported && isConnected && (
                    <button
                      type="button"
                      className="connectmidi-btn connectmidi-btn--hero connectmidi-btn--hero-connected"
                      onClick={disconnect}
                    >
                      Disconnect
                    </button>
                  )}

                  {!supported && (
                    <p className="connectmidi-hero-blocked" role="alert">
                      Web MIDI is not available in this browser. Open{' '}
                      <strong>Chrome</strong> or <strong>Edge</strong> on a laptop, then return
                      here.
                    </p>
                  )}
                </div>

                {supported && !isConnected && !errorMessage && status === 'idle' && (
                  <p className="connectmidi-hero-hint">
                    Allow MIDI access when your browser asks. USB plugged in and module powered on?
                  </p>
                )}

                {errorMessage && (
                  <p className="connectmidi-error connectmidi-error--centered" role="alert">
                    {errorMessage}
                  </p>
                )}

                {isConnected && selectedInputName && (
                  <p className="connectmidi-status connectmidi-status--connected" role="status">
                    Connected to <strong>{selectedInputName}</strong>
                  </p>
                )}

                {supported && inputs.length > 0 && (
                  <div className="connectmidi-hero-devices">
                    <h3 className="connectmidi-subtitle">MIDI input</h3>
                    <ul className="connectmidi-device-list">
                      {inputs.map((input) => {
                        const isSelected = input.id === selectedInputId;
                        return (
                          <li key={input.id}>
                            <button
                              type="button"
                              className={`connectmidi-device${isSelected ? ' connectmidi-device--active' : ''}`}
                              onClick={() => selectInput(input.id)}
                              aria-pressed={isSelected}
                            >
                              <span className="connectmidi-device-name">{input.name}</span>
                              <span className="connectmidi-device-meta">
                                {input.manufacturer} · {input.state}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {supported && (
                  <div className="connectmidi-hero-padtest">
                    <h3 className="connectmidi-subtitle">Pad test</h3>
                    <div
                      className={`connectmidi-hit-display${lastNoteEvent ? ' connectmidi-hit-display--active' : ''}`}
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {lastNoteEvent ? (
                        <>
                          <p className="connectmidi-hit-label">{lastNoteLabel}</p>
                          <p className="connectmidi-hit-detail">
                            Note <strong>{lastNoteEvent.note}</strong> · velocity{' '}
                            <strong>{lastNoteEvent.velocity}</strong>
                          </p>
                        </>
                      ) : (
                        <p className="connectmidi-hit-placeholder">
                          {isConnected
                            ? 'Hit a pad on your kit…'
                            : 'Connect your kit to start testing.'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>

            <aside className="connectmidi-help" aria-label="Help and setup guides">
              <div className="connectmidi-help-scroll">
                <p className="connectmidi-help-label">Help</p>

                <details className="connectmidi-help-item">
                <summary className="connectmidi-help-question">
                  Which browser should I use?
                </summary>
                <div className="connectmidi-help-answer">
                  <p className="connectmidi-browser-current">
                    You are using{' '}
                    <span className={`connectmidi-browser-badge ${browserStatusClass}`}>
                      {browserHint.label}
                    </span>
                  </p>
                  <p className="connectmidi-hint connectmidi-hint--flush">{browserHint.detail}</p>
                  <ul className="connectmidi-browser-list">
                    {MIDI_BROWSER_COMPAT_ROWS.map((row) => (
                      <li key={row.name} className="connectmidi-browser-list-item">
                        <span className="connectmidi-browser-list-name">{row.name}</span>
                        <span className="connectmidi-browser-list-status">{row.status}</span>
                        <span className="connectmidi-browser-list-note">{row.note}</span>
                      </li>
                    ))}
                  </ul>
                  {!supported && (
                    <p className="connectmidi-error connectmidi-error--spaced" role="alert">
                      {getWebMidiUnsupportedMessage()}
                    </p>
                  )}
                </div>
              </details>

              <details className="connectmidi-help-item">
                <summary className="connectmidi-help-question">
                  How do I connect my kit to a laptop?
                </summary>
                <div className="connectmidi-help-answer">
                  <ol className="connectmidi-steps">
                    <li>
                      Connect all pads to the <strong>drum module</strong> (the brain on the rack).
                    </li>
                    <li>
                      Plug a <strong>USB cable</strong> into the port labeled USB, USB-MIDI, or
                      Computer on the module.
                    </li>
                    <li>
                      Connect the other end to your <strong>laptop</strong> (use a USB-C adapter
                      if needed).
                    </li>
                    <li>
                      <strong>Power on</strong> the module and wait until it finishes starting.
                    </li>
                    <li>
                      Click <strong>Connect MIDI kit</strong> and allow access when asked.
                    </li>
                    <li>
                      Hit pads — snare often shows note <strong>38</strong> (Acoustic snare).
                    </li>
                  </ol>
                  <p className="connectmidi-hint">
                    Use a data-capable USB cable. You do not need a DAW.
                  </p>
                </div>
              </details>

              <details className="connectmidi-help-item">
                <summary className="connectmidi-help-question">
                  Something is not working — what should I check?
                </summary>
                <div className="connectmidi-help-answer">
                  <ul className="connectmidi-troubleshoot">
                    <li>
                      <strong>No device in the list</strong> — Check power, try another USB port or
                      cable, and use the USB-MIDI port.
                    </li>
                    <li>
                      <strong>Pad test never updates</strong> — Select the correct input; reconnect
                      USB.
                    </li>
                    <li>
                      <strong>Firefox or Safari</strong> — Use Chrome or Edge on desktop instead.
                    </li>
                    <li>
                      <strong>Kit sounds</strong> — Headphones on the module for built-in sounds; Pad
                      test only checks MIDI data.
                    </li>
                  </ul>
                </div>
              </details>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ConnectMIDI;

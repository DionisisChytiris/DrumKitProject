import React, { useEffect, useState } from 'react';
import { NavBarHome } from '@/components/Navigation/NavBarHome';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import './styles/Metronome.css';
import { useMetronomeEngine } from './Metronome/useMetronomeEngine';
import { MetronomeCenterPanel } from './Metronome/MetronomeCenterPanel';
import {
  addTimeSignatureSegment,
  removeTimeSignatureSegment,
  setAccentPattern,
  setClickSound,
  setSubdivision,
  setTimeSignature,
  setTimeSignatureDenom,
  setUseTimeSignatureSequence,
  setVolume,
  updateTimeSignatureSegment,
  type ClickSound,
  type Subdivision,
  type TimeSignatureDenominator,
} from '@/store/slices/metronomeSlice';

type HelpKey = 'subdivision' | 'timeSigTop' | 'timeSigBottom' | 'accentPattern' | 'meterSegments' | 'clickSound' | 'volume';

const DENOMS: TimeSignatureDenominator[] = [2, 4, 8, 16];
const CLICK_SOUNDS: ClickSound[] = ['tick', 'beep', 'wood', 'metallic'];

const Metronome: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    isPlaying,
    subdivision,
    timeSignature,
    timeSignatureDenom,
    accentPattern,
    visualFlashIntensity,
    useTimeSignatureSequence,
    timeSignatureSegments,
    clickSound,
    volume,
  } = useAppSelector((state) => state.metronome);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('drumkitAuth.loggedIn') === 'true';
  });

  const [autoBpmRampEnabled, setAutoBpmRampEnabled] = useState(false);
  const [autoBpmIncrement, setAutoBpmIncrement] = useState(1);
  const [autoBpmEveryBars, setAutoBpmEveryBars] = useState(4);
  const [openHelp, setOpenHelp] = useState<HelpKey | null>(null);
  const [showSegmentsModal, setShowSegmentsModal] = useState(false);
  const [showClickSoundModal, setShowClickSoundModal] = useState(false);
  const [accentExpanded, setAccentExpanded] = useState(false);

  const { beat, toggleMetronome, barCount, resetBarCount } = useMetronomeEngine({
    enabled: autoBpmRampEnabled,
    increment: autoBpmIncrement,
    everyBars: autoBpmEveryBars,
  });

  useEffect(() => {
    const onStorage = () => {
      const logged = localStorage.getItem('drumkitAuth.loggedIn') === 'true';
      setIsLoggedIn(logged);
      if (!logged) {
        setShowSegmentsModal(false);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleHelp = (key: HelpKey) => {
    setOpenHelp((prev) => (prev === key ? null : key));
  };

  return (
    <div className="metronome-container">
      <div className="metronome-background"></div>
      <div className="metronome-content">
        <NavBarHome />
        <header className="metronome-header">
          <h1 className="metronome-title">Metronome</h1>
          <p className="metronome-onboarding">Tap the circle to start · Advanced needs demo login</p>
        </header>

        <div className="metronome-wrapper">
          <aside className="metronome-left-controls">
            <section className="metronome-left-section">
              <div className="metronome-left-inline-row">
                <h3>Subdivision</h3>
                <div className="subdivision-buttons">
                  <button
                    className={`subdivision-button ${subdivision === 'quarters' ? 'active' : ''}`}
                    onClick={() => dispatch(setSubdivision('quarters' as Subdivision))}
                    disabled={isPlaying || timeSignatureDenom === 8 || timeSignatureDenom === 16}
                  >
                    ♩
                  </button>
                  <button
                    className={`subdivision-button ${subdivision === 'eighths' ? 'active' : ''}`}
                    onClick={() => dispatch(setSubdivision('eighths' as Subdivision))}
                    disabled={isPlaying || timeSignatureDenom === 8 || timeSignatureDenom === 16}
                  >
                    ♫
                  </button>
                  <button
                    className={`subdivision-button ${subdivision === 'sixteenths' ? 'active' : ''}`}
                    onClick={() => dispatch(setSubdivision('sixteenths' as Subdivision))}
                    disabled={isPlaying || timeSignatureDenom === 8 || timeSignatureDenom === 16}
                  >
                    ♬♬
                  </button>
                  <button
                    className={`subdivision-button ${subdivision === 'triplets' ? 'active' : ''}`}
                    onClick={() => dispatch(setSubdivision('triplets' as Subdivision))}
                    disabled={isPlaying || timeSignatureDenom === 8 || timeSignatureDenom === 16}
                  >
                    <div className="triplet-notation">
                      <div className="triplet-line"></div>
                      <span>♩♩♩</span>
                    </div>
                  </button>
                </div>
                <button className="metronome-help-btn" onClick={() => toggleHelp('subdivision')} aria-label="Subdivision help">?</button>
              </div>
              {openHelp === 'subdivision' && (
                <p className="metronome-help-pop">Choose 4th, 8th, 16th, or triplet notes. In x/8 or x/16, subdivision auto-locks with disabled opacity.</p>
              )}
            </section>

            <section className="metronome-left-section">
              <div className="metronome-left-inline-row">
                <h3>Time Signature Top</h3>
                <div className="time-signature-input-group">
                  <button
                    className="time-signature-button"
                    onClick={() => {
                      if (timeSignature > 1) dispatch(setTimeSignature(timeSignature - 1));
                    }}
                    disabled={isPlaying || useTimeSignatureSequence || timeSignature <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    className="time-signature-input"
                    min="1"
                    max="19"
                    value={timeSignature}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (!Number.isNaN(value) && value >= 1 && value <= 19) dispatch(setTimeSignature(value));
                    }}
                    disabled={isPlaying || useTimeSignatureSequence}
                  />
                  <button
                    className="time-signature-button"
                    onClick={() => {
                      if (timeSignature < 19) dispatch(setTimeSignature(timeSignature + 1));
                    }}
                    disabled={isPlaying || useTimeSignatureSequence || timeSignature >= 19}
                  >
                    +
                  </button>
                </div>
                <button className="metronome-help-btn" onClick={() => toggleHelp('timeSigTop')} aria-label="Time signature top help">?</button>
              </div>
              {openHelp === 'timeSigTop' && <p className="metronome-help-pop">Top number (numerator), range 1–19.</p>}
            </section>

            <section className="metronome-left-section">
              <div className="metronome-left-inline-row">
                <h3>Time Signature Bottom</h3>
                <div className="time-signature-denominator-buttons">
                  {DENOMS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`time-signature-denom-button ${timeSignatureDenom === d ? 'active' : ''}`}
                      onClick={() => dispatch(setTimeSignatureDenom(d))}
                      disabled={isPlaying || useTimeSignatureSequence}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <button className="metronome-help-btn" onClick={() => toggleHelp('timeSigBottom')} aria-label="Time signature bottom help">?</button>
              </div>
              {openHelp === 'timeSigBottom' && <p className="metronome-help-pop">Bottom number (denominator): 2, 4, 8, or 16.</p>}
            </section>

            <section className="metronome-left-section metronome-left-section--wide">
              <div className="metronome-left-inline-row">
                <h3>Accent Pattern</h3>
                {!isLoggedIn ? (
                  <p className="metronome-rail-locked">Demo login required</p>
                ) : (
                  <div className="accent-pattern-buttons">
                    {(accentExpanded ? accentPattern : accentPattern.slice(0, 12)).map((accented, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`accent-pattern-button ${accented ? 'active' : ''}`}
                        onClick={() => {
                          const next = [...accentPattern];
                          next[index] = !next[index];
                          if (!next.some(Boolean)) next[0] = true;
                          dispatch(setAccentPattern(next));
                        }}
                        disabled={isPlaying}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                )}
                <button className="metronome-help-btn" onClick={() => toggleHelp('accentPattern')} aria-label="Accent pattern help">?</button>
                {isLoggedIn && accentPattern.length > 12 && (
                  <button
                    className="metronome-accent-expand"
                    type="button"
                    onClick={() => setAccentExpanded((prev) => !prev)}
                    disabled={isPlaying}
                  >
                    {accentExpanded ? 'Close expansion' : 'Expand full view'}
                  </button>
                )}
              </div>
              {openHelp === 'accentPattern' && <p className="metronome-help-pop">Toggle accents per beat. At least one beat remains accented.</p>}
            </section>

            <section className="metronome-left-section">
              <div className="metronome-left-inline-row">
                <div className="metronome-title-with-action metronome-title-with-action--centered">
                  <h3>Meter Segments</h3>
                  <label className="metronome-inline-checkbox">
                    <input
                      type="checkbox"
                      checked={useTimeSignatureSequence}
                      disabled={isPlaying || !isLoggedIn}
                      onChange={(e) => {
                        dispatch(setUseTimeSignatureSequence(e.target.checked));
                        if (e.target.checked) {
                          setShowSegmentsModal(true);
                        } else {
                          setShowSegmentsModal(false);
                        }
                      }}
                    />
                    <span>Enable sequence</span>
                  </label>
                </div>
                <button className="metronome-help-btn" onClick={() => toggleHelp('meterSegments')} aria-label="Meter segments help">?</button>
              </div>
              {openHelp === 'meterSegments' && <p className="metronome-help-pop">Opens a larger editor for per-segment bars + meter settings.</p>}
              {!isLoggedIn && <p className="metronome-rail-locked">Demo login required</p>}
            </section>

            <section className="metronome-left-section">
              <div className="metronome-left-inline-row">
                <div className="metronome-title-with-action metronome-title-with-action--centered">
                  <h3>Click Sound</h3>
                  <button className="metronome-segments-open" onClick={() => setShowClickSoundModal(true)}>
                    Pick sound
                  </button>
                </div>
                <button className="metronome-help-btn" onClick={() => toggleHelp('clickSound')} aria-label="Click sound help">?</button>
              </div>
              {openHelp === 'clickSound' && <p className="metronome-help-pop">Open popup editor and choose Tick, Beep, Wood, or Metallic.</p>}
            </section>

            <section className="metronome-left-section">
              <div className="metronome-left-inline-row">
                <h3>Volume</h3>
                <div className="volume-control">
                  <div className="volume-slider-container">
                    <div className="volume-progress-bar" style={{ width: `${volume * 100}%` }}></div>
                    <input
                      type="range"
                      className="volume-slider"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => dispatch(setVolume(parseFloat(e.target.value)))}
                    />
                  </div>
                </div>
                <button className="metronome-help-btn" onClick={() => toggleHelp('volume')} aria-label="Volume help">?</button>
              </div>
              {openHelp === 'volume' && <p className="metronome-help-pop">Adjust metronome click playback level.</p>}
            </section>
          </aside>

          <MetronomeCenterPanel
            beat={beat}
            isPlaying={isPlaying}
            subdivision={subdivision}
            timeSignature={timeSignature}
            timeSignatureDenom={timeSignatureDenom}
            visualFlashIntensity={visualFlashIntensity}
            toggleMetronome={toggleMetronome}
            barCount={barCount}
            onResetBarCount={resetBarCount}
            autoBpmRampEnabled={autoBpmRampEnabled}
            onAutoBpmRampEnabledChange={setAutoBpmRampEnabled}
            autoBpmIncrement={autoBpmIncrement}
            onAutoBpmIncrementChange={setAutoBpmIncrement}
            autoBpmEveryBars={autoBpmEveryBars}
            onAutoBpmEveryBarsChange={setAutoBpmEveryBars}
          />
        </div>

        {showSegmentsModal && isLoggedIn && (
          <div className="metronome-segments-modal-overlay" onClick={() => setShowSegmentsModal(false)}>
            <div className="metronome-segments-modal" onClick={(e) => e.stopPropagation()}>
              <div className="metronome-left-section-head">
                <h3>Meter Segments</h3>
                <button className="metronome-help-btn" onClick={() => setShowSegmentsModal(false)} aria-label="Close meter segments">×</button>
              </div>
              <label className="metronome-rail-toggle">
                <input
                  type="checkbox"
                  checked={useTimeSignatureSequence}
                  onChange={(e) => dispatch(setUseTimeSignatureSequence(e.target.checked))}
                  disabled={isPlaying}
                />
                <span>Enable sequence</span>
              </label>
              {useTimeSignatureSequence && (
                <div className="metronome-rail-segments">
                  {timeSignatureSegments.map((seg, index) => (
                    <div key={seg.id} className="metronome-rail-segment-row">
                      <span>{index + 1}</span>
                      <input
                        type="number"
                        className="ts-sequence-input"
                        min={1}
                        max={999}
                        value={seg.bars}
                        disabled={isPlaying}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (Number.isNaN(v)) return;
                          dispatch(updateTimeSignatureSegment({ id: seg.id, patch: { bars: v } }));
                        }}
                      />
                      <input
                        type="number"
                        className="ts-sequence-input ts-sequence-input-narrow"
                        min={1}
                        max={19}
                        value={seg.numerator}
                        disabled={isPlaying}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (Number.isNaN(v)) return;
                          dispatch(updateTimeSignatureSegment({ id: seg.id, patch: { numerator: v } }));
                        }}
                      />
                      <div className="ts-sequence-denom-group">
                        {DENOMS.map((d) => (
                          <button
                            key={d}
                            type="button"
                            className={`ts-sequence-denom ${seg.denominator === d ? 'active' : ''}`}
                            disabled={isPlaying}
                            onClick={() =>
                              dispatch(
                                updateTimeSignatureSegment({
                                  id: seg.id,
                                  patch: { denominator: d },
                                })
                              )
                            }
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="ts-sequence-remove"
                        disabled={isPlaying || timeSignatureSegments.length <= 1}
                        onClick={() => dispatch(removeTimeSignatureSegment(seg.id))}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button type="button" className="ts-sequence-add" disabled={isPlaying} onClick={() => dispatch(addTimeSignatureSegment())}>
                    + Add segment
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {showClickSoundModal && (
          <div className="metronome-segments-modal-overlay" onClick={() => setShowClickSoundModal(false)}>
            <div className="metronome-segments-modal metronome-click-sound-modal" onClick={(e) => e.stopPropagation()}>
              <div className="metronome-left-section-head">
                <h3>Click Sound</h3>
                <button className="metronome-help-btn" onClick={() => setShowClickSoundModal(false)} aria-label="Close click sound">×</button>
              </div>
              <div className="click-sound-buttons">
                {CLICK_SOUNDS.map((sound) => (
                  <button
                    key={sound}
                    className={`click-sound-button ${clickSound === sound ? 'active' : ''}`}
                    onClick={() => dispatch(setClickSound(sound))}
                  >
                    {sound === 'tick' ? 'Tick' : sound.charAt(0).toUpperCase() + sound.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Metronome;
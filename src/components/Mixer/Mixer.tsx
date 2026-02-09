import { useState, useEffect } from 'react';
import { DrumPiece, DrumMixerSettings } from '@/types';
import { enhancedAudioManager } from '@/utils/enhancedAudioManager';
import './Mixer.css';

interface MixerProps {
  drumKit: DrumPiece[];
}

export const Mixer: React.FC<MixerProps> = ({ drumKit }) => {
  const [drumSettings, setDrumSettings] = useState<Record<string, DrumMixerSettings>>({});
  const [globalReverb, setGlobalReverb] = useState(0.2);
  const [globalCompression, setGlobalCompression] = useState(0.3);
  const [globalEQ, setGlobalEQ] = useState({ low: 0, mid: 0, high: 0 });
  const [velocitySensitivity, setVelocitySensitivity] = useState(0.5);

  useEffect(() => {
    // Initialize default settings for each drum
    const defaultSettings: Record<string, DrumMixerSettings> = {};
    drumKit.forEach((drum) => {
      defaultSettings[drum.id] = {
        volume: 0.8,
        pan: 0,
        reverb: 0.1,
        compression: 0.2,
        eq: { low: 0, mid: 0, high: 0 },
      };
      enhancedAudioManager.setDrumSettings(drum.id, defaultSettings[drum.id]);
    });
    setDrumSettings(defaultSettings);
  }, [drumKit]);

  const updateDrumSetting = (
    drumId: string,
    setting: keyof DrumMixerSettings,
    value: number | { low: number; mid: number; high: number }
  ) => {
    const newSettings = { ...drumSettings };
    if (!newSettings[drumId]) {
      newSettings[drumId] = {
        volume: 0.8,
        pan: 0,
        reverb: 0.1,
        compression: 0.2,
        eq: { low: 0, mid: 0, high: 0 },
      };
    }

    if (setting === 'eq') {
      newSettings[drumId].eq = value as { low: number; mid: number; high: number };
    } else {
      (newSettings[drumId] as any)[setting] = value;
    }

    setDrumSettings(newSettings);
    enhancedAudioManager.setDrumSettings(drumId, newSettings[drumId]);
  };

  const updateGlobalSettings = () => {
    enhancedAudioManager.setGlobalSettings({
      reverb: globalReverb,
      compression: globalCompression,
      eq: globalEQ,
    });
  };

  useEffect(() => {
    updateGlobalSettings();
  }, [globalReverb, globalCompression, globalEQ]);

  useEffect(() => {
    enhancedAudioManager.setVelocitySensitivity(velocitySensitivity);
  }, [velocitySensitivity]);

  return (
    <div className="mixer-container">
      <div className="mixer-header">
        <h3>🎛️ Mixer</h3>
        <div className="mixer-global-controls">
          <div className="mixer-control-group">
            <label>Velocity Sensitivity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={velocitySensitivity}
              onChange={(e) => setVelocitySensitivity(parseFloat(e.target.value))}
            />
            <span>{Math.round(velocitySensitivity * 100)}%</span>
          </div>
          <div className="mixer-control-group">
            <label>Global Reverb</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={globalReverb}
              onChange={(e) => setGlobalReverb(parseFloat(e.target.value))}
            />
            <span>{Math.round(globalReverb * 100)}%</span>
          </div>
          <div className="mixer-control-group">
            <label>Global Compression</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={globalCompression}
              onChange={(e) => setGlobalCompression(parseFloat(e.target.value))}
            />
            <span>{Math.round(globalCompression * 100)}%</span>
          </div>
        </div>
        <div className="mixer-global-eq">
          <h4>Global EQ</h4>
          <div className="eq-controls">
            <div className="eq-band">
              <label>Low</label>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={globalEQ.low}
                onChange={(e) => setGlobalEQ({ ...globalEQ, low: parseFloat(e.target.value) })}
              />
              <span>{globalEQ.low > 0 ? '+' : ''}{globalEQ.low.toFixed(1)}dB</span>
            </div>
            <div className="eq-band">
              <label>Mid</label>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={globalEQ.mid}
                onChange={(e) => setGlobalEQ({ ...globalEQ, mid: parseFloat(e.target.value) })}
              />
              <span>{globalEQ.mid > 0 ? '+' : ''}{globalEQ.mid.toFixed(1)}dB</span>
            </div>
            <div className="eq-band">
              <label>High</label>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={globalEQ.high}
                onChange={(e) => setGlobalEQ({ ...globalEQ, high: parseFloat(e.target.value) })}
              />
              <span>{globalEQ.high > 0 ? '+' : ''}{globalEQ.high.toFixed(1)}dB</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mixer-channels">
        {drumKit.map((drum) => {
          const settings = drumSettings[drum.id] || {
            volume: 0.8,
            pan: 0,
            reverb: 0.1,
            compression: 0.2,
            eq: { low: 0, mid: 0, high: 0 },
          };

          return (
            <div key={drum.id} className="mixer-channel">
              <div className="channel-header">
                <span className="channel-name">{drum.name}</span>
              </div>
              <div className="channel-controls">
                <div className="channel-control">
                  <label>Vol</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.volume}
                    onChange={(e) =>
                      updateDrumSetting(drum.id, 'volume', parseFloat(e.target.value))
                    }
                  />
                  <span>{Math.round(settings.volume * 100)}%</span>
                </div>
                <div className="channel-control">
                  <label>Pan</label>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.01"
                    value={settings.pan}
                    onChange={(e) =>
                      updateDrumSetting(drum.id, 'pan', parseFloat(e.target.value))
                    }
                  />
                  <span>{settings.pan > 0 ? 'R' : settings.pan < 0 ? 'L' : 'C'}</span>
                </div>
                <div className="channel-control">
                  <label>Reverb</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.reverb}
                    onChange={(e) =>
                      updateDrumSetting(drum.id, 'reverb', parseFloat(e.target.value))
                    }
                  />
                  <span>{Math.round(settings.reverb * 100)}%</span>
                </div>
                <div className="channel-control">
                  <label>Comp</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.compression}
                    onChange={(e) =>
                      updateDrumSetting(drum.id, 'compression', parseFloat(e.target.value))
                    }
                  />
                  <span>{Math.round(settings.compression * 100)}%</span>
                </div>
                <div className="channel-eq">
                  <div className="eq-band-small">
                    <label>L</label>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={settings.eq.low}
                      onChange={(e) =>
                        updateDrumSetting(drum.id, 'eq', {
                          ...settings.eq,
                          low: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="eq-band-small">
                    <label>M</label>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={settings.eq.mid}
                      onChange={(e) =>
                        updateDrumSetting(drum.id, 'eq', {
                          ...settings.eq,
                          mid: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="eq-band-small">
                    <label>H</label>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={settings.eq.high}
                      onChange={(e) =>
                        updateDrumSetting(drum.id, 'eq', {
                          ...settings.eq,
                          high: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

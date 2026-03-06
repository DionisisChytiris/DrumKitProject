import { useEffect } from 'react';
import { DrumPiece, DrumMixerSettings } from '@/types';
import { enhancedAudioManager } from '@/utils/enhancedAudioManager';
import { audioManager } from '@/utils/audioManager';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  updateDrumSetting,
  initializeDrumSettings,
  setGlobalVolume,
  setGlobalReverb,
  setGlobalCompression,
  setGlobalEQ,
  setVelocitySensitivity,
} from '@/store/slices/mixerSlice';
import './Mixer.css';

interface MixerProps {
  drumKit: DrumPiece[];
}

export const Mixer: React.FC<MixerProps> = ({ drumKit }) => {
  const dispatch = useAppDispatch();
  // Use individual selectors to ensure re-renders when specific values change
  const drumSettings = useAppSelector((state) => state.mixer.drumSettings);
  const globalVolume = useAppSelector((state) => state.mixer.globalVolume);
  const globalReverb = useAppSelector((state) => state.mixer.globalReverb);
  const globalCompression = useAppSelector((state) => state.mixer.globalCompression);
  const globalEQ = useAppSelector((state) => state.mixer.globalEQ);
  const velocitySensitivity = useAppSelector((state) => state.mixer.velocitySensitivity);
  
  // Debug: log selector result
  console.log('[Mixer] Selector result - drumSettings keys:', Object.keys(drumSettings), 'snare volume:', drumSettings['snare']?.volume);
  console.log('[Mixer] drumKit length:', drumKit?.length);
  
  // Early return if no drumKit
  if (!drumKit || drumKit.length === 0) {
    return (
      <div className="mixer-container">
        <p style={{ color: '#fff', padding: '2rem', textAlign: 'center' }}>
          No drum kit loaded. Please load a drum kit first.
        </p>
      </div>
    );
  }

  // Initialize drum settings when drumKit changes
  useEffect(() => {
    dispatch(initializeDrumSettings(drumKit.map(d => ({ id: d.id }))));
  }, [drumKit, dispatch]);

  // Sync Redux state with enhancedAudioManager and audioManager whenever settings change
  useEffect(() => {
    // Sync global volume to both audioManager (for compatibility) and enhancedAudioManager
    audioManager.setVolume(globalVolume);
    enhancedAudioManager.setGlobalVolume(globalVolume); // Apply global volume to enhancedAudioManager's master gain
    
    // Debug: log Redux state changes
    console.log('[Mixer] Redux state changed:', {
      drumSettings,
      globalVolume,
      globalReverb,
      globalCompression,
      globalEQ,
      velocitySensitivity
    });
    
    // Sync all drum settings immediately
    Object.entries(drumSettings).forEach(([drumId, settings]) => {
      console.log(`[Mixer] Syncing settings for ${drumId}:`, settings);
      if (drumId === 'snare') {
        console.log(`[Mixer] 🔍 SNARE - Syncing to enhancedAudioManager:`, {
          drumId,
          settings,
          'settings.volume': settings.volume,
          'typeof volume': typeof settings.volume
        });
      }
      enhancedAudioManager.setDrumSettings(drumId, settings);
    });

    // Sync global settings (reverb, compression, EQ - but NOT volume, that's handled by setGlobalVolume)
    enhancedAudioManager.setGlobalSettings({
      reverb: globalReverb,
      compression: globalCompression,
      eq: globalEQ,
    });

    // Sync velocity sensitivity
    enhancedAudioManager.setVelocitySensitivity(velocitySensitivity);
  }, [drumSettings, globalVolume, globalReverb, globalCompression, globalEQ, velocitySensitivity]);

  const handleUpdateDrumSetting = (
    drumId: string,
    setting: 'volume' | 'pan' | 'reverb' | 'compression' | 'eq',
    value: number | { low: number; mid: number; high: number }
  ) => {
    console.log(`[Mixer] handleUpdateDrumSetting called:`, { drumId, setting, value, type: typeof value });
    dispatch(updateDrumSetting({ drumId, setting, value }));
  };

  return (
    <div className="mixer-container">
      <div className="mixer-header">
        <h3>🎛️ Mixer</h3>
        <div className="mixer-global-controls">
          <div className="mixer-control-group">
            <label>Global Volume</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={globalVolume}
              onChange={(e) => {
                const newValue = parseFloat(e.target.value);
                console.log(`[Mixer] Global volume changed: ${globalVolume} -> ${newValue}`);
                if (newValue < 0.5) {
                  console.warn(`[Mixer] ⚠️ WARNING: Global volume is ${newValue} (${Math.round(newValue * 100)}%) - individual drum volume changes may not be audible!`);
                }
                dispatch(setGlobalVolume(newValue));
              }}
            />
            <span>{Math.round(globalVolume * 100)}%</span>
            {globalVolume < 0.5 && (
              <span style={{ fontSize: '0.7rem', color: '#ff6b6b', marginLeft: '0.5rem' }}>
                ⚠️ Low - individual changes may not be audible
              </span>
            )}
          </div>
          <div className="mixer-control-group">
            <label>Velocity Sensitivity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={velocitySensitivity}
              onChange={(e) => dispatch(setVelocitySensitivity(parseFloat(e.target.value)))}
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
              onChange={(e) => dispatch(setGlobalReverb(parseFloat(e.target.value)))}
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
              onChange={(e) => dispatch(setGlobalCompression(parseFloat(e.target.value)))}
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
                onChange={(e) => dispatch(setGlobalEQ({ ...globalEQ, low: parseFloat(e.target.value) }))}
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
                onChange={(e) => dispatch(setGlobalEQ({ ...globalEQ, mid: parseFloat(e.target.value) }))}
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
                onChange={(e) => dispatch(setGlobalEQ({ ...globalEQ, high: parseFloat(e.target.value) }))}
              />
              <span>{globalEQ.high > 0 ? '+' : ''}{globalEQ.high.toFixed(1)}dB</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mixer-channels">
        {drumKit.map((drum) => {
          // Get settings from Redux state - use a more specific selector to ensure reactivity
          const reduxSettings = drumSettings[drum.id];
          
          // CRITICAL: Always use Redux settings if they exist, never fall back to defaults during render
          // The defaults are only used if Redux hasn't initialized the drum yet
          // This ensures the slider always reflects the Redux state
          const settings: DrumMixerSettings = reduxSettings ? {
            volume: reduxSettings.volume,
            pan: reduxSettings.pan,
            reverb: reduxSettings.reverb,
            compression: reduxSettings.compression,
            eq: { ...reduxSettings.eq }, // Create new object to avoid mutation
          } : {
            // Only use defaults if Redux hasn't initialized this drum yet
            volume: 0.8,
            pan: 0,
            reverb: 0.1,
            compression: 0.2,
            eq: { low: 0, mid: 0, high: 0 },
          };
          
          // Debug: log settings for this drum
          if (drum.id === 'snare') {
            console.log(`[Mixer] 🔍 SNARE - Rendering with settings:`, {
              'reduxSettings exists?': !!reduxSettings,
              reduxSettings,
              'settings being used': settings,
              'settings.volume': settings.volume,
              'drumSettings object keys': Object.keys(drumSettings),
              'drumSettings[snare]': drumSettings['snare'],
              'drumSettings[snare]?.volume': drumSettings['snare']?.volume,
              'IS USING REDUX?': !!reduxSettings
            });
          }

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
                    key={`${drum.id}-volume-${reduxSettings?.volume ?? settings.volume}`} // Force re-render when volume changes
                    value={reduxSettings?.volume ?? settings.volume} // Use Redux value directly, fallback to settings
                    onChange={(e) => {
                      const newValue = parseFloat(e.target.value);
                      console.log(`[Mixer] Volume slider changed for ${drum.id}:`, {
                        'newValue': newValue,
                        'currentReduxValue': reduxSettings?.volume,
                        'currentSettingsValue': settings.volume,
                        'reduxSettings exists?': !!reduxSettings
                      });
                      if (drum.id === 'snare') {
                        console.log(`[Mixer] 🔍 SNARE VOLUME SLIDER - Changing from ${settings.volume} to ${newValue}`);
                        console.log(`[Mixer] 🔍 SNARE - Redux value before update:`, reduxSettings?.volume);
                      }
                      handleUpdateDrumSetting(drum.id, 'volume', newValue);
                    }}
                  />
                  <span>{Math.round(settings.volume * 100)}%</span>
                  {drum.id === 'snare' && (
                    <span style={{ fontSize: '0.7rem', color: '#888', marginLeft: '0.5rem' }}>
                      (Redux: {reduxSettings ? Math.round(reduxSettings.volume * 100) : 'N/A'}%)
                    </span>
                  )}
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
                      handleUpdateDrumSetting(drum.id, 'pan', parseFloat(e.target.value))
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
                      handleUpdateDrumSetting(drum.id, 'reverb', parseFloat(e.target.value))
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
                      handleUpdateDrumSetting(drum.id, 'compression', parseFloat(e.target.value))
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
                        handleUpdateDrumSetting(drum.id, 'eq', {
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
                        handleUpdateDrumSetting(drum.id, 'eq', {
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
                        handleUpdateDrumSetting(drum.id, 'eq', {
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

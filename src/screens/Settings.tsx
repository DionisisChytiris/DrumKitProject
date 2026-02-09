import { useState, useEffect } from 'react';
import { enhancedAudioManager } from '../utils/enhancedAudioManager';
import './Settings.css';

export const SettingsScreen: React.FC = () => {
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [velocitySensitivity, setVelocitySensitivity] = useState(0.5);
  const [globalReverb, setGlobalReverb] = useState(0.2);
  const [globalCompression, setGlobalCompression] = useState(0.3);
  const [lowEQ, setLowEQ] = useState(0);
  const [midEQ, setMidEQ] = useState(0);
  const [highEQ, setHighEQ] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [keyboardShortcuts, setKeyboardShortcuts] = useState(true);
  const [visualFeedback, setVisualFeedback] = useState(true);

  useEffect(() => {
    // Load settings from localStorage
    const savedVolume = localStorage.getItem('masterVolume');
    const savedVelocity = localStorage.getItem('velocitySensitivity');
    const savedReverb = localStorage.getItem('globalReverb');
    const savedCompression = localStorage.getItem('globalCompression');
    const savedTheme = localStorage.getItem('theme');
    const savedShortcuts = localStorage.getItem('keyboardShortcuts');
    const savedFeedback = localStorage.getItem('visualFeedback');

    if (savedVolume) setMasterVolume(parseFloat(savedVolume));
    if (savedVelocity) setVelocitySensitivity(parseFloat(savedVelocity));
    if (savedReverb) setGlobalReverb(parseFloat(savedReverb));
    if (savedCompression) setGlobalCompression(parseFloat(savedCompression));
    if (savedTheme) setTheme(savedTheme as 'light' | 'dark');
    if (savedShortcuts) setKeyboardShortcuts(savedShortcuts === 'true');
    if (savedFeedback) setVisualFeedback(savedFeedback === 'true');
  }, []);

  const handleMasterVolumeChange = (value: number) => {
    setMasterVolume(value);
    enhancedAudioManager.setGlobalSettings({ volume: value });
    localStorage.setItem('masterVolume', value.toString());
  };

  const handleVelocityChange = (value: number) => {
    setVelocitySensitivity(value);
    enhancedAudioManager.setVelocitySensitivity(value);
    localStorage.setItem('velocitySensitivity', value.toString());
  };

  const handleReverbChange = (value: number) => {
    setGlobalReverb(value);
    enhancedAudioManager.setGlobalSettings({ reverb: value });
    localStorage.setItem('globalReverb', value.toString());
  };

  const handleCompressionChange = (value: number) => {
    setGlobalCompression(value);
    enhancedAudioManager.setGlobalSettings({ compression: value });
    localStorage.setItem('globalCompression', value.toString());
  };

  const handleEQChange = (band: 'low' | 'mid' | 'high', value: number) => {
    if (band === 'low') setLowEQ(value);
    if (band === 'mid') setMidEQ(value);
    if (band === 'high') setHighEQ(value);
    
    enhancedAudioManager.setGlobalSettings({
      eq: { low: lowEQ, mid: midEQ, high: highEQ, [band]: value }
    });
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleShortcutsChange = (enabled: boolean) => {
    setKeyboardShortcuts(enabled);
    localStorage.setItem('keyboardShortcuts', enabled.toString());
  };

  const handleFeedbackChange = (enabled: boolean) => {
    setVisualFeedback(enabled);
    localStorage.setItem('visualFeedback', enabled.toString());
  };

  const resetToDefaults = () => {
    handleMasterVolumeChange(0.7);
    handleVelocityChange(0.5);
    handleReverbChange(0.2);
    handleCompressionChange(0.3);
    handleEQChange('low', 0);
    handleEQChange('mid', 0);
    handleEQChange('high', 0);
    handleThemeChange('light');
    handleShortcutsChange(true);
    handleFeedbackChange(true);
  };

  return (
    <div className="settings-screen">
      <div className="screen-content">
        <div className="settings-container">
          <h1>⚙️ Settings</h1>

          <section className="settings-section">
            <h2>🔊 Audio Settings</h2>
            
            <div className="setting-item">
              <label>
                <span>Master Volume</span>
                <span className="setting-value">{Math.round(masterVolume * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={masterVolume}
                onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
              />
            </div>

            <div className="setting-item">
              <label>
                <span>Velocity Sensitivity</span>
                <span className="setting-value">{Math.round(velocitySensitivity * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={velocitySensitivity}
                onChange={(e) => handleVelocityChange(parseFloat(e.target.value))}
              />
            </div>

            <div className="setting-item">
              <label>
                <span>Global Reverb</span>
                <span className="setting-value">{Math.round(globalReverb * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={globalReverb}
                onChange={(e) => handleReverbChange(parseFloat(e.target.value))}
              />
            </div>

            <div className="setting-item">
              <label>
                <span>Global Compression</span>
                <span className="setting-value">{Math.round(globalCompression * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={globalCompression}
                onChange={(e) => handleCompressionChange(parseFloat(e.target.value))}
              />
            </div>
          </section>

          <section className="settings-section">
            <h2>🎚️ Global EQ</h2>
            
            <div className="setting-item">
              <label>
                <span>Low Frequency</span>
                <span className="setting-value">{lowEQ > 0 ? '+' : ''}{lowEQ.toFixed(1)}dB</span>
              </label>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={lowEQ}
                onChange={(e) => handleEQChange('low', parseFloat(e.target.value))}
              />
            </div>

            <div className="setting-item">
              <label>
                <span>Mid Frequency</span>
                <span className="setting-value">{midEQ > 0 ? '+' : ''}{midEQ.toFixed(1)}dB</span>
              </label>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={midEQ}
                onChange={(e) => handleEQChange('mid', parseFloat(e.target.value))}
              />
            </div>

            <div className="setting-item">
              <label>
                <span>High Frequency</span>
                <span className="setting-value">{highEQ > 0 ? '+' : ''}{highEQ.toFixed(1)}dB</span>
              </label>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={highEQ}
                onChange={(e) => handleEQChange('high', parseFloat(e.target.value))}
              />
            </div>
          </section>

          <section className="settings-section">
            <h2>🎨 Appearance</h2>
            
            <div className="setting-item">
              <label>
                <span>Theme</span>
              </label>
              <div className="theme-buttons">
                <button
                  className={`theme-button ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('light')}
                >
                  ☀️ Light
                </button>
                <button
                  className={`theme-button ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('dark')}
                >
                  🌙 Dark
                </button>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h2>⌨️ Controls</h2>
            
            <div className="setting-item">
              <label className="toggle-label">
                <span>Keyboard Shortcuts</span>
                <input
                  type="checkbox"
                  checked={keyboardShortcuts}
                  onChange={(e) => handleShortcutsChange(e.target.checked)}
                />
              </label>
              <p className="setting-description">
                Enable keyboard shortcuts for playing drums (Space, S, H, C, T, M, F, R)
              </p>
            </div>

            <div className="setting-item">
              <label className="toggle-label">
                <span>Visual Feedback</span>
                <input
                  type="checkbox"
                  checked={visualFeedback}
                  onChange={(e) => handleFeedbackChange(e.target.checked)}
                />
              </label>
              <p className="setting-description">
                Show visual feedback when drums are played
              </p>
            </div>
          </section>

          <section className="settings-section">
            <button className="reset-button" onClick={resetToDefaults}>
              🔄 Reset to Defaults
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

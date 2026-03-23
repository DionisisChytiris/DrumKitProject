import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setClickSound, setVolume, type ClickSound } from '@/store/slices/metronomeSlice';

export const MetronomeRightSettingsPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { volume, clickSound } = useAppSelector((state) => state.metronome);

  const clickSounds: ClickSound[] = ['tick', 'beep', 'wood', 'metallic'];

  return (
    <div className="metronome-settings-container">
      <div className="settings-control">
        <label>Volume</label>
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
          <span className="volume-value">{Math.round(volume * 100)}%</span>
        </div>
      </div>

      <div className="settings-control">
        <label>Click Sound</label>
        <div className="click-sound-buttons">
          {clickSounds.map((sound) => (
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
  );
};


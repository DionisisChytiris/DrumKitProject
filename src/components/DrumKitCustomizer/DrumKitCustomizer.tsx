import { useState } from 'react';
import { DrumPiece, DrumSample } from '@/types';
import './DrumKitCustomizer.css';

interface DrumKitCustomizerProps {
  drumKit: DrumPiece[];
  onKitChange: (updatedKit: DrumPiece[]) => void;
}

// Sample library - in a real app, this would come from a database or API
const sampleLibrary: Record<string, DrumSample[]> = {
  kick: [
    { id: 'kick-1', name: 'Classic Kick', type: 'kick' },
    { id: 'kick-2', name: 'Punchy Kick', type: 'kick' },
    { id: 'kick-3', name: 'Deep Kick', type: 'kick' },
  ],
  snare: [
    { id: 'snare-1', name: 'Classic Snare', type: 'snare' },
    { id: 'snare-2', name: 'Crisp Snare', type: 'snare' },
    { id: 'snare-3', name: 'Fat Snare', type: 'snare' },
  ],
  tom: [
    { id: 'tom-1', name: 'Standard Tom', type: 'tom' },
    { id: 'tom-2', name: 'Deep Tom', type: 'tom' },
    { id: 'tom-3', name: 'Bright Tom', type: 'tom' },
  ],
  cymbal: [
    { id: 'cymbal-1', name: 'Bright Crash', type: 'cymbal' },
    { id: 'cymbal-2', name: 'Dark Crash', type: 'cymbal' },
    { id: 'cymbal-3', name: 'Sizzle Ride', type: 'cymbal' },
  ],
  hihat: [
    { id: 'hihat-1', name: 'Closed Hi-Hat', type: 'hihat' },
    { id: 'hihat-2', name: 'Open Hi-Hat', type: 'hihat' },
    { id: 'hihat-3', name: 'Crunchy Hi-Hat', type: 'hihat' },
  ],
};

export const DrumKitCustomizer: React.FC<DrumKitCustomizerProps> = ({
  drumKit,
  onKitChange,
}) => {
  const [selectedDrum, setSelectedDrum] = useState<DrumPiece | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleSampleSelect = (drum: DrumPiece, sample: DrumSample) => {
    const updatedKit = drumKit.map((d) =>
      d.id === drum.id
        ? { ...d, sampleId: sample.id, audioUrl: sample.audioUrl }
        : d
    );
    onKitChange(updatedKit);
    setSelectedDrum(null);
  };

  const getAvailableSamples = (drum: DrumPiece): DrumSample[] => {
    return sampleLibrary[drum.type] || [];
  };

  const getCurrentSample = (drum: DrumPiece): DrumSample | undefined => {
    const samples = getAvailableSamples(drum);
    return samples.find((s) => s.id === drum.sampleId) || samples[0];
  };

  return (
    <div className="drum-kit-customizer">
      <button
        className="customizer-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '▼' : '▶'} Customize Kit
      </button>

      {isOpen && (
        <div className="customizer-panel">
          <h3>🎨 Drum Kit Customization</h3>
          <p className="customizer-description">
            Select a drum to change its sample
          </p>

          <div className="drum-selector-grid">
            {drumKit.map((drum) => {
              const currentSample = getCurrentSample(drum);
              const isSelected = selectedDrum?.id === drum.id;

              return (
                <div key={drum.id} className="drum-selector-item">
                  <button
                    className={`drum-selector-button ${isSelected ? 'selected' : ''}`}
                    onClick={() =>
                      setSelectedDrum(isSelected ? null : drum)
                    }
                  >
                    <span className="drum-selector-name">{drum.name}</span>
                    <span className="drum-selector-sample">
                      {currentSample?.name || 'Default'}
                    </span>
                  </button>

                  {isSelected && (
                    <div className="sample-list">
                      <div className="sample-list-header">Available Samples:</div>
                      {getAvailableSamples(drum).map((sample) => (
                        <button
                          key={sample.id}
                          className={`sample-item ${
                            currentSample?.id === sample.id ? 'active' : ''
                          }`}
                          onClick={() => handleSampleSelect(drum, sample)}
                        >
                          {sample.name}
                          {currentSample?.id === sample.id && ' ✓'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="customizer-info">
            <p>
              💡 Tip: In a full implementation, you would load actual audio
              samples from a library. For now, this demonstrates the UI structure.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

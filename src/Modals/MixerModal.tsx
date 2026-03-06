import React from 'react';
import './MixerModal.css';
import { Mixer } from '@/components/Mixer';
import { useAppSelector } from '@/store/hooks';

interface MixerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MixerModal: React.FC<MixerModalProps> = ({ isOpen, onClose }) => {
  const { drumKit } = useAppSelector((state) => state.drumKit);

  if (!isOpen) return null;

  return (
    <div className="mixer-modal-overlay">
      <div className="mixer-modal-content">
        <div className="mixer-modal-header">
          <h2>Drum Kit Mixer</h2>
          <button className="mixer-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="mixer-modal-body">
          <p>Adjust volume, pan, reverb, compression, and EQ for each drum.</p>
          
          <div className="mixer-panel">
            <h3>🎨 Drum Kit Mixer</h3>
            <Mixer drumKit={drumKit} />
          </div>
        </div>
      
        <div className="mixer-modal-footer">
          <button 
            className="mixer-modal-button reset-button" 
            onClick={() => {
              // Reset functionality can be added here
            }}
            title="Reset all drums to default sounds"
          >
            🔄 Reset to Default Settings
          </button>
        </div>
      </div>
    </div>
  );
};

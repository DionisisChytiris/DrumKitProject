import React from 'react';
import './SequencerModal.css';

interface SequencerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SequencerModal: React.FC<SequencerModalProps> = ({ isOpen, onClose }) => {

  if (!isOpen) return null;

  

  return (
    <div className="sequencer-modal-overlay">
      <div className="sequencer-modal-content">
        <div className="sequencer-modal-header">
          <h2>sequencerModal Kit</h2>
          <button className="sequencer-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="sequencer-modal-body">
          <p>sequencer your drum kit settings here.</p>
          {/* Add your customization options here */}
          
          <div className="sequencer-panel">
          <h3>🎨 Drum Kit Customization</h3>
         

        
          </div>

          
        </div>
      
        <div className="sequencer-modal-footer">
          <button 
            className="sequencer-modal-button reset-button" 
            onClick={()=>{}}
            title="Reset all drums to default sounds"
          >
            🔄 Reset to Default Drum Kit
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import './PracticeSoundSettings.css';

interface PracticeSoundSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PracticeSoundSettingsModal: React.FC<PracticeSoundSettingsModalProps> = ({ isOpen, onClose }) => {

  if (!isOpen) return null;

  

  return (
    <div className="PracticeSoundSettings-modal-overlay">
      <div className="PracticeSoundSettings-modal-content">
        <div className="PracticeSoundSettings-modal-header">
          <h2>PracticeSoundSettings Kit</h2>
          <button className="PracticeSoundSettings-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="PracticeSoundSettings-modal-body">
          <p>PracticeSoundSettings your drum kit settings here.</p>
          {/* Add your customization options here */}
          
          <div className="PracticeSoundSettings-panel">
          <h3>🎨 Drum Kit Customization</h3>
         

        
          </div>

          
        </div>
      
        <div className="PracticeSoundSettings-modal-footer">
          <button 
            className="PracticeSoundSettings-modal-button reset-button" 
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

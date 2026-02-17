import React from 'react';
import './MixerModal.css';

interface MixerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MixerModal: React.FC<MixerModalProps> = ({ isOpen, onClose }) => {

  if (!isOpen) return null;

  

  return (
    <div className="mixer-modal-overlay">
      <div className="mixer-modal-content">
        <div className="mixer-modal-header">
          <h2>MixerModal Kit</h2>
          <button className="mixer-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="mixer-modal-body">
          <p>mixer your drum kit settings here.</p>
          {/* Add your customization options here */}
          
          <div className="mixer-panel">
          <h3>🎨 Drum Kit Customization</h3>
         

        
          </div>

          
        </div>
      
        <div className="mixer-modal-footer">
          <button 
            className="mixer-modal-button reset-button" 
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

import React from 'react';
import {PatternSequencer} from '../components/PatternSequencer/PatternSequencer'
import { useAppSelector } from '@/store/hooks';
import './SequencerModal.css';

interface SequencerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SequencerModal: React.FC<SequencerModalProps> = ({ isOpen, onClose }) => {
  const { drumKit } = useAppSelector((state) => state.drumKit);

  if (!isOpen) return null;

  

  return (
    <div className="sequencer-modal-overlay">
      <div className="sequencer-modal-content">
        <div className="sequencer-modal-header">
          <h2>Create your own Groove</h2>
          <button className="sequencer-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="sequencer-modal-body">
          {/* <p>sequencer your drum kit settings here.</p> */}
          {/* Add your customization options here */}
          
        <PatternSequencer drumKit={drumKit}/>

          
        </div>
      
        {/* <div className="sequencer-modal-footer">
          <button 
            className="sequencer-modal-button reset-button" 
            onClick={()=>{}}
            title="Reset all drums to default sounds"
          >
            🔄 Reset to Default Drum Kit
          </button>
        </div> */}
      </div>
    </div>
  );
};

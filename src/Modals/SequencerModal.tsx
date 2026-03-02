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

  // Debug: Log when modal opens
  console.log('SequencerModal isOpen:', isOpen, 'drumKit length:', drumKit?.length);

  return (
    <div className="sequencer-modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div className="sequencer-modal-content" onClick={(e) => e.stopPropagation()} style={{ zIndex: 10001 }}>
        <div className="sequencer-modal-header">
          <h2>Create your own Groove</h2>
          <button className="sequencer-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="sequencer-modal-body">
          {drumKit && drumKit.length > 0 ? (
            <PatternSequencer drumKit={drumKit} />
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#fff' }}>
              <p>Loading drum kit... (drumKit: {drumKit ? 'exists' : 'null'}, length: {drumKit?.length || 0})</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

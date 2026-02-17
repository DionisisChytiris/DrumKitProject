import React, { useState, useRef } from 'react';
import { DrumPiece } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateDrumPiece } from '@/store/slices/drumKitSlice';
import { defaultDrumKit } from '@/utils/drumConfig';
import './KeyBindingModal.css';

interface KeyBindingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyBindingModal: React.FC<KeyBindingModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const { drumKit } = useAppSelector((state) => state.drumKit);
  const [editingKeyBinding, setEditingKeyBinding] = useState<string | null>(null);
  const [keyBindingInput, setKeyBindingInput] = useState<string>('');
  const keyBindingInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleKeyBindingChange = (drum: DrumPiece, newKey: string) => {
    // Normalize the key (handle special cases)
    let normalizedKey = newKey.trim().toUpperCase();
    
    // Handle special keys
    if (normalizedKey === ' ') {
      normalizedKey = 'Space';
    }
    
    // Validate: must be a single character or "Space"
    if (normalizedKey.length > 1 && normalizedKey !== 'Space') {
      alert('Please enter a single letter or "Space"');
      return;
    }
    
    // Check for duplicate key bindings (excluding the current drum)
    const isDuplicate = drumKit.some(
      (d) => d.id !== drum.id && d.keyBinding?.toUpperCase() === normalizedKey
    );
    
    if (isDuplicate) {
      const conflictingDrum = drumKit.find(
        (d) => d.id !== drum.id && d.keyBinding?.toUpperCase() === normalizedKey
      );
      alert(`Key "${normalizedKey}" is already assigned to "${conflictingDrum?.name}". Please choose a different key.`);
      return;
    }
    
    // Update the key binding
    dispatch(updateDrumPiece({
      id: drum.id,
      updates: { keyBinding: normalizedKey }
    }));
    
    setEditingKeyBinding(null);
    setKeyBindingInput('');
  };

  const handleKeyBindingKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, drum: DrumPiece) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleKeyBindingChange(drum, keyBindingInput);
    } else if (e.key === 'Escape') {
      setEditingKeyBinding(null);
      setKeyBindingInput('');
    } else if (e.key === ' ') {
      // Handle spacebar
      e.preventDefault();
      setKeyBindingInput('Space');
      handleKeyBindingChange(drum, 'Space');
    } else if (e.key.length === 1) {
      // Single character key
      e.preventDefault();
      setKeyBindingInput(e.key.toUpperCase());
      handleKeyBindingChange(drum, e.key.toUpperCase());
    }
  };

  const startEditingKeyBinding = (drum: DrumPiece) => {
    setEditingKeyBinding(drum.id);
    setKeyBindingInput(drum.keyBinding || '');
    // Focus the input after a short delay to ensure it's rendered
    setTimeout(() => {
      keyBindingInputRef.current?.focus();
    }, 10);
  };

  const handleResetToDefault = () => {
    // Reset all drums to their default keyBindings from drumConfig
    defaultDrumKit.forEach((defaultDrum) => {
      dispatch(updateDrumPiece({
        id: defaultDrum.id,
        updates: { keyBinding: defaultDrum.keyBinding }
      }));
    });
  };

  return (
    <div className="key-binding-modal-overlay" onClick={onClose}>
      <div className="key-binding-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="key-binding-modal-header">
          <h2>Customize Keyboard Keys</h2>
          <button className="key-binding-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="key-binding-modal-body">
          <p className="key-binding-description">
            Click on a drum to change its keyboard key binding. Press any letter or Space, then Enter to confirm.
          </p>
          
          <div className="key-binding-list">
            {drumKit.map((drum) => (
              <div key={drum.id} className="key-binding-item">
                <div className="key-binding-drum-name">{drum.name}</div>
                {editingKeyBinding === drum.id ? (
                  <div className="key-binding-input-group">
                    <input
                      ref={keyBindingInputRef}
                      type="text"
                      className="key-binding-input"
                      value={keyBindingInput}
                      onChange={(e) => setKeyBindingInput(e.target.value)}
                      onKeyDown={(e) => handleKeyBindingKeyDown(e, drum)}
                      onBlur={() => {
                        if (keyBindingInput.trim()) {
                          handleKeyBindingChange(drum, keyBindingInput);
                        } else {
                          setEditingKeyBinding(null);
                          setKeyBindingInput('');
                        }
                      }}
                      placeholder="Press a key..."
                      maxLength={5}
                      autoFocus
                    />
                    <button
                      className="key-binding-cancel"
                      onClick={() => {
                        setEditingKeyBinding(null);
                        setKeyBindingInput('');
                      }}
                      title="Cancel"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="key-binding-display">
                    <kbd className="key-binding-key">{drum.keyBinding || 'None'}</kbd>
                    <button
                      className="key-binding-edit"
                      onClick={() => startEditingKeyBinding(drum)}
                      title="Change key binding"
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      
        <div className="key-binding-modal-footer">
          <button 
            className="key-binding-modal-button reset-button" 
            onClick={handleResetToDefault}
            title="Reset all key bindings to defaults"
          >
            🔄 Reset to Default Keys
          </button>
          {/* <button className="key-binding-modal-button" onClick={onClose}>
            Close
          </button> */}
        </div>
      </div>
    </div>
  );
};

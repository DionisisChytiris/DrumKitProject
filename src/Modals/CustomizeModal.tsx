import React, { useState, useRef, useEffect } from 'react';
import { DrumPiece } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateDrumPiece, addCustomSample, DrumSample, setCustomizeKitLinkActive, setHoveredDrumId } from '@/store/slices/drumKitSlice';
import { getAudioFilesForType, getAudioUrlFromConfig } from '@/utils/audioFilesConfig';
import { defaultDrumKit } from '@/utils/drumConfig';
import { audioManager } from '@/utils/audioManager';
import { enhancedAudioManager } from '@/utils/enhancedAudioManager';
import './CustomizeModal.css';

interface CustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomizeModal: React.FC<CustomizeModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const { drumKit, customSamples, hoveredDrumId } = useAppSelector((state) => state.drumKit);
  const [selectedDrum, setSelectedDrum] = useState<DrumPiece | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const drumItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    dispatch(setCustomizeKitLinkActive(isOpen));
    return () => {
      dispatch(setCustomizeKitLinkActive(false));
    };
  }, [dispatch, isOpen]);

  useEffect(() => {
    if (!isOpen || !hoveredDrumId) return;
    const item = drumItemRefs.current[hoveredDrumId];
    item?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [hoveredDrumId, isOpen]);

  if (!isOpen) return null;

  const normalizeAudioUrl = (url?: string): string => {
    if (!url) return '';
    try {
      return new URL(url, window.location.origin).href;
    } catch {
      return url;
    }
  };

  const applySampleToDrum = (drum: DrumPiece, sample: DrumSample) => {
    if (!sample.audioUrl) return;

    dispatch(updateDrumPiece({
      id: drum.id,
      updates: { audioUrl: sample.audioUrl },
    }));

    audioManager.clearSoundCache(drum.id);
    enhancedAudioManager.clearSoundCache(drum.id);
    void audioManager.preloadSounds([{ id: drum.id, url: sample.audioUrl }]);
    void enhancedAudioManager.preloadAudio(drum.id, sample.audioUrl);
    void audioManager.playSound(drum.id, sample.audioUrl);
  };

  const handleSampleSelect = (drum: DrumPiece, sample: DrumSample) => {
    applySampleToDrum(drum, sample);
    setSelectedDrum(drum);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, drum: DrumPiece) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      alert('Please select an audio file');
      return;
    }

    // Convert file to base64 for localStorage persistence
    try {
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to read file as base64'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    
      // Create custom sample with base64 audio URL
      const customSample: DrumSample = {
        id: `custom-${drum.type}-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        type: drum.type,
        audioUrl: base64Audio, // Store as base64 data URL
        isCustom: true,
      };

      // Add to Redux store
      dispatch(addCustomSample({ type: drum.type, sample: customSample }));
      
      // Automatically select the new sample
      applySampleToDrum(drum, customSample);
      
      // Reset file input
      const input = fileInputRefs.current[drum.id];
      if (input) {
        input.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    }
  };

  const getAvailableSamples = (drum: DrumPiece): DrumSample[] => {
    // Get audio files from public/audio/ folder (configured in audioFilesConfig.ts)
    const audioFiles = getAudioFilesForType(drum.type);
    const fileSamples: DrumSample[] = audioFiles.map((fileConfig) => ({
      id: fileConfig.id,
      name: fileConfig.name,
      type: fileConfig.type,
      audioUrl: getAudioUrlFromConfig(fileConfig),
      isCustom: false, // These are developer-provided files, not user uploads
    }));

    // Get user-uploaded custom samples (base64)
    const custom = customSamples[drum.type] || [];

    // Combine both: file-based samples first, then custom uploads
    return [...fileSamples, ...custom];
  };

  const getCurrentSample = (drum: DrumPiece): DrumSample | undefined => {
    const samples = getAvailableSamples(drum);
    const currentUrl = normalizeAudioUrl(drum.audioUrl);
    const matching = samples.find((s) => normalizeAudioUrl(s.audioUrl) === currentUrl);
    if (matching) return matching;
    
    return samples.length > 0 ? samples[0] : undefined;
  };

  const getCurrentSampleName = (drum: DrumPiece): string => {
    const currentSample = getCurrentSample(drum);
    if (currentSample) return currentSample.name;
    
    // If no sample found, try to extract name from audioUrl
    if (drum.audioUrl) {
      const fileName = drum.audioUrl.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
      return fileName || 'Custom';
    }
    
    return 'Default';
  };

  const handleResetToDefault = () => {
    defaultDrumKit.forEach((defaultDrum) => {
      dispatch(updateDrumPiece({
        id: defaultDrum.id,
        updates: { audioUrl: defaultDrum.audioUrl },
      }));
      audioManager.clearSoundCache(defaultDrum.id);
      enhancedAudioManager.clearSoundCache(defaultDrum.id);
      if (defaultDrum.audioUrl) {
        void audioManager.preloadSounds([{ id: defaultDrum.id, url: defaultDrum.audioUrl }]);
        void enhancedAudioManager.preloadAudio(defaultDrum.id, defaultDrum.audioUrl);
      }
    });
    setSelectedDrum(null);
  };


  return (
    <div className="customize-modal-overlay">
      <div className="customize-modal-content">
        <div className="customize-modal-header">
          <h2>Customize Kit</h2>
          <button className="customize-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="customize-modal-body">
          <p>Customize your drum kit settings here.</p>

          <div className="customizer-scroll">
          <div className="customizer-panel">
          <h3>🎨 Drum Kit Customization</h3>
          <p className="customizer-description">
            Hover a drum on the kit or a button below to link them. Click to change its sample.
          </p>

          <div className="drum-selector-grid">
            {drumKit.map((drum: DrumPiece, index: number) => {
              const isSelected = selectedDrum?.id === drum.id;
              const isKitHovered = hoveredDrumId === drum.id;
              const isBottomRow = index >= 6; // Items 7-11 (0-indexed, so 6-10)

              return (
                <div
                  key={drum.id}
                  className="drum-selector-item"
                  ref={(element) => {
                    drumItemRefs.current[drum.id] = element;
                  }}
                >
                  <button
                    type="button"
                    className={`drum-selector-button ${isSelected ? 'selected' : ''}${isKitHovered ? ' drum-selector-button--kit-hover' : ''}`}
                    onClick={() =>
                      setSelectedDrum(isSelected ? null : drum)
                    }
                    onMouseEnter={() => dispatch(setHoveredDrumId(drum.id))}
                    onMouseLeave={() => {
                      if (hoveredDrumId === drum.id) {
                        dispatch(setHoveredDrumId(null));
                      }
                    }}
                  >
                    <span className="drum-selector-name">{drum.name}</span>
                    <span className="drum-selector-sample">
                      {getCurrentSampleName(drum)}
                    </span>
                  </button>

                  {isSelected && (
                    <div className={`sample-list ${isBottomRow ? 'popup-above' : 'popup-below'}`}>
                      <div className="sample-list-header">
                        Available Samples:
                        <button
                          className="upload-sample-button"
                          type="button"
                          onClick={() => fileInputRefs.current[drum.id]?.click()}
                          title="Upload custom sample"
                        >
                          📁 Upload
                        </button>
                      </div>
                      <input
                        ref={(element) => {
                          fileInputRefs.current[drum.id] = element;
                        }}
                        type="file"
                        accept="audio/*"
                        style={{ display: 'none' }}
                        onChange={(e) => void handleFileUpload(e, drum)}
                      />
                      {getAvailableSamples(drum).map((sample) => {
                        const isActive = normalizeAudioUrl(drum.audioUrl) === normalizeAudioUrl(sample.audioUrl);
                        return (
                        <button
                          key={sample.id}
                          type="button"
                          className={`sample-item ${
                            isActive ? 'active' : ''
                          } ${sample.isCustom ? 'custom-sample' : ''}`}
                          onClick={() => handleSampleSelect(drum, sample)}
                        >
                          {sample.isCustom && '🎵 '}
                          {sample.name}
                          {isActive && ' ✓'}
                        </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </div>
          </div>

          
        </div>
      
        <div className="customize-modal-footer">
          <button 
            className="customize-modal-button reset-button" 
            onClick={handleResetToDefault}
            title="Reset all drums to default sounds"
          >
            🔄 Reset to Default Drum Kit
          </button>
        </div>
      </div>
    </div>
  );
};

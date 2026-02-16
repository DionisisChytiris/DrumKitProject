import React, { useState, useRef } from 'react';
import { DrumPiece } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateDrumPiece, addCustomSample, DrumSample } from '@/store/slices/drumKitSlice';
import { getAudioFilesForType, getAudioUrlFromConfig } from '@/utils/audioFilesConfig';
import { defaultDrumKit } from '@/utils/drumConfig';
import './CustomizeModal.css';

interface CustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomizeModal: React.FC<CustomizeModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const { drumKit, customSamples } = useAppSelector((state) => state.drumKit);
  const [selectedDrum, setSelectedDrum] = useState<DrumPiece | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSampleSelect = (drum: DrumPiece, sample: DrumSample) => {
    // Update the drum piece with the selected sample
    dispatch(updateDrumPiece({
      id: drum.id,
      updates: { audioUrl: sample.audioUrl }
    }));
    setSelectedDrum(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, drum: DrumPiece) => {
    const file = event.target.files?.[0];
    if (!file || !selectedDrum) return;

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
      handleSampleSelect(drum, customSample);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setShowUpload(false);
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
    // Find sample that matches the current audioUrl
    const matching = samples.find((s) => s.audioUrl === drum.audioUrl);
    if (matching) return matching;
    
    // If no match found, return first available sample or undefined
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
    // Reset all drums to their default audioUrls from drumConfig
    defaultDrumKit.forEach((defaultDrum) => {
      dispatch(updateDrumPiece({
        id: defaultDrum.id,
        updates: { audioUrl: defaultDrum.audioUrl }
      }));
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
          {/* Add your customization options here */}
          
          <div className="customizer-panel">
          <h3>🎨 Drum Kit Customization</h3>
          <p className="customizer-description">
            Select a drum to change its sample
          </p>

          <div className="drum-selector-grid">
            {drumKit.map((drum: DrumPiece, index: number) => {
              const isSelected = selectedDrum?.id === drum.id;
              const isBottomRow = index >= 6; // Items 7-11 (0-indexed, so 6-10)

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
                      {getCurrentSampleName(drum)}
                    </span>
                  </button>

                  {isSelected && (
                    <div className={`sample-list ${isBottomRow ? 'popup-above' : 'popup-below'}`}>
                      <div className="sample-list-header">
                        Available Samples:
                        <button
                          className="upload-sample-button"
                          onClick={() => {
                            setShowUpload(!showUpload);
                            if (!showUpload && fileInputRef.current) {
                              fileInputRef.current.click();
                            }
                          }}
                          title="Upload custom sample"
                        >
                          📁 Upload
                        </button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(e, drum)}
                      />
                      {getAvailableSamples(drum).map((sample) => (
                        <button
                          key={sample.id}
                          className={`sample-item ${
                            drum.audioUrl === sample.audioUrl ? 'active' : ''
                          } ${sample.isCustom ? 'custom-sample' : ''}`}
                          onClick={() => handleSampleSelect(drum, sample)}
                        >
                          {sample.isCustom && '🎵 '}
                          {sample.name}
                          {drum.audioUrl === sample.audioUrl && ' ✓'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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

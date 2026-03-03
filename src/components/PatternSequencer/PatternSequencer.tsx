import { useState, useEffect, useCallback, useRef } from 'react';
import { Pattern, PatternStep, DrumPiece } from '@/types';
import { enhancedAudioManager } from '@/utils/enhancedAudioManager';
import './PatternSequencer.css';

interface PatternSequencerProps {
  drumKit: DrumPiece[];
  bpm?: number;
}

const STORAGE_KEY = 'drumKitSequencerPatterns';
const CURRENT_PATTERN_KEY = 'drumKitSequencerCurrentPattern';

// Helper functions for localStorage
const savePatterns = (patterns: Pattern[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
  } catch (error) {
    console.error('Error saving patterns:', error);
  }
};

const loadPatterns = (): Pattern[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading patterns:', error);
  }
  return [];
};

const saveCurrentPattern = (patternId: string) => {
  try {
    localStorage.setItem(CURRENT_PATTERN_KEY, patternId);
  } catch (error) {
    console.error('Error saving current pattern:', error);
  }
};

const loadCurrentPatternId = (): string | null => {
  try {
    return localStorage.getItem(CURRENT_PATTERN_KEY);
  } catch (error) {
    console.error('Error loading current pattern:', error);
    return null;
  }
};

const createEmptyPattern = (drumKit: DrumPiece[], bpm: number): Pattern => ({
  id: `pattern-${Date.now()}`,
  name: 'New Pattern',
  steps: Array(16).fill(null).map(() => 
    drumKit.map(drum => ({ drumId: drum.id, velocity: 0.8, active: false }))
  ),
  bpm,
  length: 16,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Normalize pattern to match current drumKit structure
const normalizePattern = (p: Pattern, kit: DrumPiece[]): Pattern => {
  const normalizedSteps = p.steps.map(step => {
    return kit.map(drum => {
      const existingStep = step.find(s => s.drumId === drum.id);
      return existingStep || { drumId: drum.id, velocity: 0.8, active: false };
    });
  });
  
  return {
    ...p,
    steps: normalizedSteps,
    length: normalizedSteps.length,
  };
};

export const PatternSequencer: React.FC<PatternSequencerProps> = ({ drumKit, bpm = 120 }) => {
  const [pattern, setPattern] = useState<Pattern>(() => {
    // Try to load saved pattern on mount
    const savedPatterns = loadPatterns();
    const currentPatternId = loadCurrentPatternId();
    
    if (currentPatternId && savedPatterns.length > 0) {
      const savedPattern = savedPatterns.find(p => p.id === currentPatternId);
      if (savedPattern) {
        // Ensure pattern matches current drumKit structure
        const normalizedPattern = normalizePattern(savedPattern, drumKit);
        return normalizedPattern;
      }
    }
    
    // Create new pattern if none saved
    return createEmptyPattern(drumKit, bpm);
  });
  
  const [savedPatterns, setSavedPatterns] = useState<Pattern[]>(loadPatterns());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [playbackInterval, setPlaybackInterval] = useState<number | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [patternName, setPatternName] = useState(pattern.name);

  // Auto-save pattern when it changes (but not on initial mount)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (pattern.id && pattern.id !== 'pattern-1') {
      const currentSavedPatterns = loadPatterns();
      const updatedPattern = {
        ...pattern,
        updatedAt: new Date().toISOString(),
      };
      
      const updatedPatterns = currentSavedPatterns.map(p => 
        p.id === pattern.id ? updatedPattern : p
      );
      
      // If pattern doesn't exist in saved patterns, add it
      if (!currentSavedPatterns.find(p => p.id === pattern.id)) {
        updatedPatterns.push(updatedPattern);
      }
      
      setSavedPatterns(updatedPatterns);
      savePatterns(updatedPatterns);
      saveCurrentPattern(pattern.id);
    }
  }, [pattern.steps, pattern.bpm, pattern.name, pattern.id]);

  // Update pattern name when it changes
  useEffect(() => {
    setPatternName(pattern.name);
  }, [pattern.name]);

  // Update pattern structure when drumKit changes (only if structure differs)
  const prevDrumKitIds = useRef<string>(drumKit.map(d => d.id).join(','));
  useEffect(() => {
    const currentDrumKitIds = drumKit.map(d => d.id).join(',');
    if (prevDrumKitIds.current !== currentDrumKitIds) {
      prevDrumKitIds.current = currentDrumKitIds;
      const normalizedPattern = normalizePattern(pattern, drumKit);
      setPattern(normalizedPattern);
    }
  }, [drumKit, pattern]);

  const toggleStep = (stepIndex: number, drumId: string) => {
    const newSteps = pattern.steps.map(step => [...step]);
    const step = newSteps[stepIndex].find(s => s.drumId === drumId);
    if (step) {
      step.active = !step.active;
      setPattern({ ...pattern, steps: newSteps, updatedAt: new Date().toISOString() });
    }
  };

  const playStep = useCallback((stepIndex: number) => {
    const step = pattern.steps[stepIndex];
    step.forEach((patternStep: PatternStep) => {
      if (patternStep.active) {
        const drum = drumKit.find(d => d.id === patternStep.drumId);
        if (drum) {
          enhancedAudioManager.playSound(
            drum.id,
            drum.audioUrl,
            patternStep.velocity
          );
        }
      }
    });
  }, [pattern.steps, drumKit]);

  const startPlayback = () => {
    if (isPlaying) {
      if (playbackInterval) {
        clearInterval(playbackInterval);
        setPlaybackInterval(null);
      }
      setIsPlaying(false);
      setCurrentStep(0);
      return;
    }

    setIsPlaying(true);
    let step = 0;

    const interval = setInterval(() => {
      playStep(step);
      setCurrentStep(step);
      step = (step + 1) % pattern.length;
    }, (60 / pattern.bpm) * 1000 * 4 / pattern.length); // 4/4 time

    setPlaybackInterval(interval);
  };

  useEffect(() => {
    return () => {
      if (playbackInterval) {
        clearInterval(playbackInterval);
      }
    };
  }, [playbackInterval]);

  const clearPattern = () => {
    const clearedSteps = pattern.steps.map(step =>
      step.map(s => ({ ...s, active: false }))
    );
    setPattern({ ...pattern, steps: clearedSteps, updatedAt: new Date().toISOString() });
  };

  const setBPM = (newBPM: number) => {
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      startPlayback(); // Stop
    }
    setPattern({ ...pattern, bpm: newBPM, updatedAt: new Date().toISOString() });
    if (wasPlaying) {
      setTimeout(() => startPlayback(), 100); // Restart
    }
  };

  const handleSavePattern = () => {
    if (!patternName.trim()) {
      alert('Please enter a pattern name');
      return;
    }

    const patternToSave: Pattern = {
      ...pattern,
      name: patternName.trim(),
      updatedAt: new Date().toISOString(),
      createdAt: pattern.createdAt || new Date().toISOString(),
    };

    const updatedPatterns = savedPatterns.filter(p => p.id !== pattern.id);
    updatedPatterns.push(patternToSave);
    
    setSavedPatterns(updatedPatterns);
    savePatterns(updatedPatterns);
    saveCurrentPattern(pattern.id);
    setPattern(patternToSave);
    setShowSaveDialog(false);
  };

  const handleLoadPattern = (patternToLoad: Pattern) => {
    if (isPlaying) {
      startPlayback(); // Stop if playing
    }
    
    const normalizedPattern = normalizePattern(patternToLoad, drumKit);
    setPattern(normalizedPattern);
    setPatternName(normalizedPattern.name);
    saveCurrentPattern(normalizedPattern.id);
    setShowLoadDialog(false);
  };

  const handleDeletePattern = (patternId: string) => {
    if (window.confirm('Are you sure you want to delete this pattern?')) {
      const updatedPatterns = savedPatterns.filter(p => p.id !== patternId);
      setSavedPatterns(updatedPatterns);
      savePatterns(updatedPatterns);
      
      // If deleted pattern was current, create new one
      if (pattern.id === patternId) {
        const newPattern = createEmptyPattern(drumKit, bpm);
        setPattern(newPattern);
        setPatternName(newPattern.name);
        saveCurrentPattern(newPattern.id);
      }
    }
  };

  const handleNewPattern = () => {
    if (isPlaying) {
      startPlayback(); // Stop if playing
    }
    
    const newPattern = createEmptyPattern(drumKit, bpm);
    setPattern(newPattern);
    setPatternName(newPattern.name);
    saveCurrentPattern(newPattern.id);
  };

  return (
    <div className="pattern-sequencer">
      <div className="sequencer-header">
        <h3>🎵 Pattern Sequencer</h3>
        <div className="sequencer-controls">
          <button
            className={`play-button ${isPlaying ? 'playing' : ''}`}
            onClick={startPlayback}
            data-tooltip={isPlaying ? 'Stop' : 'Play'}
          >
            <span className="button-icon">{isPlaying ? '⏸' : '▶'}</span>
          </button>
          <button className="clear-button" onClick={clearPattern} data-tooltip="Clear">
            <span className="button-icon">🗑</span>
          </button>
          <button className="save-button" onClick={() => setShowSaveDialog(true)} data-tooltip="Save">
            <span className="button-icon">💾</span>
          </button>
          <button className="load-button" onClick={() => setShowLoadDialog(true)} data-tooltip="Load">
            <span className="button-icon">📂</span>
          </button>
          <button className="new-button" onClick={handleNewPattern} data-tooltip="New">
            <span className="button-icon">➕</span>
          </button>
          <div className="bpm-control">
            <label>BPM: </label>
            <input
              type="number"
              min="60"
              max="200"
              value={pattern.bpm}
              onChange={(e) => setBPM(parseInt(e.target.value) || 120)}
            />
          </div>
        </div>
      </div>

      {/* Pattern Name Display/Edit */}
      <div className="pattern-name-section">
        <input
          type="text"
          className="pattern-name-input"
          value={patternName}
          onChange={(e) => setPatternName(e.target.value)}
          onBlur={() => {
            if (patternName.trim()) {
              setPattern({ ...pattern, name: patternName.trim(), updatedAt: new Date().toISOString() });
            } else {
              setPatternName(pattern.name);
            }
          }}
          placeholder="Pattern Name"
        />
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="sequencer-dialog-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="sequencer-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Save Pattern</h3>
            <input
              type="text"
              className="dialog-input"
              value={patternName}
              onChange={(e) => setPatternName(e.target.value)}
              placeholder="Enter pattern name"
              autoFocus
            />
            <div className="dialog-buttons">
              <button className="dialog-button save" onClick={handleSavePattern}>
                Save
              </button>
              <button className="dialog-button cancel" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="sequencer-dialog-overlay" onClick={() => setShowLoadDialog(false)}>
          <div className="sequencer-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Load Pattern</h3>
            {savedPatterns.length === 0 ? (
              <p className="no-patterns">No saved patterns. Create and save a pattern first!</p>
            ) : (
              <div className="pattern-list">
                {savedPatterns.map((p) => (
                  <div key={p.id} className="pattern-list-item">
                    <div className="pattern-list-info">
                      <span className="pattern-list-name">{p.name}</span>
                      <span className="pattern-list-meta">
                        BPM: {p.bpm} • {p.length} steps
                        {p.updatedAt && (
                          <span className="pattern-list-date">
                            {' • '}
                            {new Date(p.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="pattern-list-actions">
                      <button
                        className="pattern-list-button load"
                        onClick={() => handleLoadPattern(p)}
                      >
                        Load
                      </button>
                      <button
                        className="pattern-list-button delete"
                        onClick={() => handleDeletePattern(p.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="dialog-buttons">
              <button className="dialog-button cancel" onClick={() => setShowLoadDialog(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sequencer-grid">
        <div className="sequencer-row-header">
          <div className="step-numbers">
            {pattern.steps.map((_, index) => (
              <div key={index} className={`step-number ${currentStep === index && isPlaying ? 'active' : ''}`}>
                {index + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="sequencer-rows">
          {drumKit.map((drum) => (
            <div key={drum.id} className="sequencer-row">
              <div className="drum-label">{drum.name}</div>
              <div className="step-buttons">
                {pattern.steps.map((step, stepIndex) => {
                  const patternStep = step.find(s => s.drumId === drum.id);
                  const isActive = patternStep?.active || false;
                  const isCurrent = currentStep === stepIndex && isPlaying;

                  return (
                    <button
                      key={stepIndex}
                      className={`step-button ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
                      onClick={() => toggleStep(stepIndex, drum.id)}
                    >
                      {isActive && '●'}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

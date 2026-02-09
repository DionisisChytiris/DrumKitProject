import { useState, useEffect, useCallback } from 'react';
import { Pattern, PatternStep, DrumPiece } from '@/types';
import { enhancedAudioManager } from '@/utils/enhancedAudioManager';
import './PatternSequencer.css';

interface PatternSequencerProps {
  drumKit: DrumPiece[];
  bpm?: number;
}

export const PatternSequencer: React.FC<PatternSequencerProps> = ({ drumKit, bpm = 120 }) => {
  const [pattern, setPattern] = useState<Pattern>({
    id: 'pattern-1',
    name: 'Pattern 1',
    steps: Array(16).fill(null).map(() => 
      drumKit.map(drum => ({ drumId: drum.id, velocity: 0.8, active: false }))
    ),
    bpm,
    length: 16,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [playbackInterval, setPlaybackInterval] = useState<NodeJS.Timeout | null>(null);

  const toggleStep = (stepIndex: number, drumId: string) => {
    const newSteps = [...pattern.steps];
    const step = newSteps[stepIndex].find(s => s.drumId === drumId);
    if (step) {
      step.active = !step.active;
      setPattern({ ...pattern, steps: newSteps });
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
    setPattern({ ...pattern, steps: clearedSteps });
  };

  const setBPM = (newBPM: number) => {
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      startPlayback(); // Stop
    }
    setPattern({ ...pattern, bpm: newBPM });
    if (wasPlaying) {
      setTimeout(() => startPlayback(), 100); // Restart
    }
  };

  return (
    <div className="pattern-sequencer">
      <div className="sequencer-header">
        <h3>🎵 Pattern Sequencer</h3>
        <div className="sequencer-controls">
          <button
            className={`play-button ${isPlaying ? 'playing' : ''}`}
            onClick={startPlayback}
          >
            {isPlaying ? '⏸ Stop' : '▶ Play'}
          </button>
          <button className="clear-button" onClick={clearPattern}>
            Clear
          </button>
          <div className="bpm-control">
            <label>BPM:</label>
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

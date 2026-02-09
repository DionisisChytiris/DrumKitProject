import { useState } from 'react';
import { VirtualDrumKit } from '../components/VirtualDrumKit/VirtualDrumKit';
import { ExerciseDisplay } from '../components/ExerciseDisplay/ExerciseDisplay';
import { Mixer } from '../components/Mixer/Mixer';
import { PatternSequencer } from '../components/PatternSequencer/PatternSequencer';
import { DrumKitCustomizer } from '../components/DrumKitCustomizer/DrumKitCustomizer';
import DrumExercise from './DrumExercise';
import DrumTest from './DrumTest'
import { DrumPiece } from '../types';
import { defaultDrumKit } from '../utils/drumConfig';
import { sampleExercises } from '../utils/drumConfig';

type TabType = 'kit' | 'mixer' | 'sequencer' | 'customize';

export const HomeScreen: React.FC = () => {
  const [currentExerciseId, setCurrentExerciseId] = useState<string>(
    sampleExercises[0]?.id || ''
  );
  const [drumKit, setDrumKit] = useState<DrumPiece[]>(defaultDrumKit);
  const [activeTab, setActiveTab] = useState<TabType>('kit');

  const handleDrumHit = (_drumPieceId: string) => {
    // Can be used for analytics or feedback in the future
  };

  const handleExerciseSelect = (exerciseId: string) => {
    setCurrentExerciseId(exerciseId);
  };

  const handleKitChange = (updatedKit: DrumPiece[]) => {
    setDrumKit(updatedKit);
  };

  return (
    <div className="home-screen">
      <div className="screen-content">
        <div className="app-top-section">
          <ExerciseDisplay
            exercises={sampleExercises}
            currentExerciseId={currentExerciseId}
            onExerciseSelect={handleExerciseSelect}
          />
        </div>

        {/* <DrumExercise/> */}
        <DrumTest/>

        <div className="app-bottom-section">
          <div className="tab-container">
            <div className="tab-buttons">
              <button
                className={`tab-button ${activeTab === 'kit' ? 'active' : ''}`}
                onClick={() => setActiveTab('kit')}
              >
                🥁 Drum Kit
              </button>
              <button
                className={`tab-button ${activeTab === 'mixer' ? 'active' : ''}`}
                onClick={() => setActiveTab('mixer')}
              >
                🎛️ Mixer
              </button>
              <button
                className={`tab-button ${activeTab === 'sequencer' ? 'active' : ''}`}
                onClick={() => setActiveTab('sequencer')}
              >
                🎵 Sequencer
              </button>
              <button
                className={`tab-button ${activeTab === 'customize' ? 'active' : ''}`}
                onClick={() => setActiveTab('customize')}
              >
                🎨 Customize
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'kit' && (
                <>
                  <DrumKitCustomizer
                    drumKit={drumKit}
                    onKitChange={handleKitChange}
                  />
                  <VirtualDrumKit
                    drumKit={drumKit}
                    onDrumHit={handleDrumHit}
                  />
                </>
              )}

              {activeTab === 'mixer' && (
                <div className="mixer-tab-content">
                  <Mixer drumKit={drumKit} />
                </div>
              )}

              {activeTab === 'sequencer' && (
                <div className="sequencer-tab-content">
                  <PatternSequencer drumKit={drumKit} />
                </div>
              )}

              {activeTab === 'customize' && (
                <div className="customize-tab-content">
                  <DrumKitCustomizer
                    drumKit={drumKit}
                    onKitChange={handleKitChange}
                  />
                  <div className="customize-info-panel">
                    <h3>Kit Customization</h3>
                    <p>
                      Use the customization panel above to swap drum samples. In a full
                      implementation, you would be able to:
                    </p>
                    <ul>
                      <li>Load samples from a library</li>
                      <li>Preview samples before applying</li>
                      <li>Save custom kit configurations</li>
                      <li>Import/export kit presets</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

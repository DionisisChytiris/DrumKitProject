import React, { useState } from 'react';
import { NavBarHome } from '@/components/Navigation/NavBarHome';
import VexFlowExercise from '@/components/VexFlowExercise/VexFlowExercise';
import { exercises } from '@/data/exercises';
import './styles/Exercises.css';

const Exercises: React.FC = () => {
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);

    const totalExercises = exercises.length;
    const currentExercise = exercises[currentExerciseIndex];

    const handlePreviousExercise = () => {
        setCurrentExerciseIndex((prev) => (prev > 0 ? prev - 1 : totalExercises - 1));
    };

    const handleNextExercise = () => {
        setCurrentExerciseIndex((prev) => (prev < totalExercises - 1 ? prev + 1 : 0));
    };


    return (
        <div className="exercises-container">
            <div className="exercises-background"></div>
            <div className="exercises-content">
                <NavBarHome />
                <div className="exercises-main">
                    <div className="exercises-title">Exercises</div>

                    {/* Navigation Buttons */}
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        gap: '20px', 
                        marginBottom: '20px',
                        marginTop: '20px'
                    }}>
                        <button 
                            onClick={handlePreviousExercise}
                            style={{
                                padding: '10px 20px',
                                fontSize: '16px',
                                cursor: 'pointer',
                                backgroundColor: '#4a90e2',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                transition: 'background-color 0.3s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#357abd'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4a90e2'}
                        >
                            ← Previous
                        </button>
                        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                            Exercise {currentExercise.id} of {totalExercises}
                        </span>
                        <button 
                            onClick={handleNextExercise}
                            style={{
                                padding: '10px 20px',
                                fontSize: '16px',
                                cursor: 'pointer',
                                backgroundColor: '#4a90e2',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                transition: 'background-color 0.3s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#357abd'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4a90e2'}
                        >
                            Next →
                        </button>
                    </div>

                    {/* Exercise Content */}
                    <div style={{
                        backgroundColor: 'gray', 
                        marginRight: '30%', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        display: 'flex', 
                        width: '100%',
                        minHeight: '300px'
                    }}>
                        {currentExercise && <VexFlowExercise exercise={currentExercise} />}
                    </div>
                    
                    {/* <div className="exercise-card">
                        <div className="exercise-header">
                            <h2>Exercise 1: Basic 4/4 Beat</h2>
                            <div className="exercise-difficulty beginner">Beginner</div>
                        </div>
                        
                        <div className="exercise-description">
                            <p>Learn the fundamental rock beat pattern:</p>
                            <ul>
                                <li><strong>Kick</strong> on beats 1 and 3 (use <kbd>Space</kbd>)</li>
                                <li><strong>Snare</strong> on beats 2 and 4 (use <kbd>S</kbd>)</li>
                                <li><strong>Hi-Hat</strong> on all beats (use <kbd>H</kbd>)</li>
                            </ul>
                        </div>

                        <div className="exercise-pattern">
                            <h3>Pattern:</h3>
                            <div className="pattern-visualization">
                                {exercise1Pattern.map((step, index) => {
                                    const isActive = currentStep === index;
                                    const isHit = userHits.has(index);
                                    const drum = drumKit.find(d => d.id === step.drumId);
                                    
                                    return (
                                        <div
                                            key={index}
                                            className={`pattern-step ${isActive ? 'active' : ''} ${isHit ? 'hit' : ''}`}
                                        >
                                            <div className="step-beat">{step.beat}</div>
                                            <div className="step-drum">{step.drumName}</div>
                                            {step.keyBinding && (
                                                <div className="step-key"><kbd>{step.keyBinding}</kbd></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="exercise-controls">
                            <button 
                                className={`play-button ${isPlaying ? 'playing' : ''}`}
                                onClick={playExercise}
                            >
                                {isPlaying ? '⏸ Stop' : '▶ Play Pattern'}
                            </button>
                            
                            {isPlaying && (
                                <div className="exercise-stats">
                                    <div className="stat">
                                        <span className="stat-label">Accuracy:</span>
                                        <span className="stat-value">{accuracy}%</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-label">Hits:</span>
                                        <span className="stat-value">{userHits.size}/{exercise1Pattern.length}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="exercise-instructions">
                            <h3>How to Practice:</h3>
                            <ol>
                                <li>Click "Play Pattern" to hear the exercise</li>
                                <li>Try to play along with the pattern using your keyboard (Space for Kick, S for Snare, H for Hi-Hat)</li>
                                <li>Watch the pattern visualization - green highlights show correct hits</li>
                                <li>Keep practicing until you can play it smoothly!</li>
                            </ol>
                        </div>
                    </div> */}
                </div>
            </div>
        </div>
    );
};

export default Exercises;
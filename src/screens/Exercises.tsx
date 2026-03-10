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
                    {/* <div className="exercises-title">Exercises</div> */}

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
                        backgroundColor: 'rgba(128, 128, 128, 0.8)', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        display: 'flex', 
                        flexDirection: 'column',
                        width: '100%',
                        minHeight: '300px',
                        margin: 'auto',
                        padding: '20px',
                        position: 'relative',
                        zIndex: 10
                    }}>
                        {currentExercise && <VexFlowExercise exercise={currentExercise} />}
                    </div>
                </div>
                    
            </div>
        </div>
    );
};

export default Exercises;
import { useState } from 'react';
import { Exercise } from '@/types';
import { MusicScore } from '../MusicScore/MusicScore';
import './ExerciseDisplay.css';

interface ExerciseDisplayProps {
  exercises: Exercise[];
  currentExerciseId?: string;
  onExerciseSelect?: (exerciseId: string) => void;
}

export const ExerciseDisplay: React.FC<ExerciseDisplayProps> = ({
  exercises,
  currentExerciseId,
  onExerciseSelect,
}) => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    exercises.find((ex) => ex.id === currentExerciseId) || exercises[0] || null
  );

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    onExerciseSelect?.(exercise.id);
  };

  const getDifficultyColor = (difficulty: Exercise['difficulty']): string => {
    switch (difficulty) {
      case 'beginner':
        return '#4caf50';
      case 'intermediate':
        return '#ff9800';
      case 'advanced':
        return '#f44336';
      default:
        return '#666';
    }
  };

  if (!selectedExercise) {
    return (
      <div className="exercise-display">
        <div className="exercise-empty">
          <p>No exercises available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="exercise-display">
      <div className="exercise-main">
        <div className="exercise-header">
          <h2 className="exercise-title">{selectedExercise.title}</h2>
          <span
            className="exercise-difficulty"
            style={{ backgroundColor: getDifficultyColor(selectedExercise.difficulty) }}
          >
            {selectedExercise.difficulty}
          </span>
        </div>
        <p className="exercise-description">{selectedExercise.description}</p>
        
        {selectedExercise.bpm && (
          <div className="exercise-bpm">
            <span className="bpm-label">BPM:</span>
            <span className="bpm-value">{selectedExercise.bpm}</span>
          </div>
        )}

        <div className="exercise-pattern">
          <h3>Pattern:</h3>
          <div className="pattern-visualization">
            {selectedExercise.pattern.map((drum, index) => (
              <div key={index} className="pattern-step">
                <span className="pattern-drum">{drum}</span>
                <span className="pattern-number">{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="music-score-section">
        <MusicScore exercise={selectedExercise} />
      </div>

      <div className="exercise-list">
        <h3>Available Exercises</h3>
        <div className="exercise-items">
          {exercises.map((exercise) => (
            <button
              key={exercise.id}
              className={`exercise-item ${
                selectedExercise.id === exercise.id ? 'exercise-item-active' : ''
              }`}
              onClick={() => handleExerciseSelect(exercise)}
            >
              <div className="exercise-item-header">
                <span className="exercise-item-title">{exercise.title}</span>
                <span
                  className="exercise-item-difficulty"
                  style={{
                    backgroundColor: getDifficultyColor(exercise.difficulty),
                  }}
                >
                  {exercise.difficulty}
                </span>
              </div>
              <p className="exercise-item-description">{exercise.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

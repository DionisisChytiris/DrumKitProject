import React, { useMemo, useState } from 'react';
import { NavBarHome } from '@/components/Navigation/NavBarHome';
import VexFlowExercise from '@/components/VexFlowExercise/VexFlowExercise';
import { MusicXmlPlayAlong } from '@/components/MusicXmlPlayAlong/MusicXmlPlayAlong';
import { exercises } from '@/data/exercises';
import { playAlongExercises } from '@/data/playAlongExercises';
import './styles/Exercises.css';

type ExerciseSelection =
  | { kind: 'vexflow'; index: number }
  | { kind: 'playalong'; id: string };

function selectionKey(selection: ExerciseSelection): string {
  return selection.kind === 'vexflow'
    ? `vexflow-${selection.index}`
    : `playalong-${selection.id}`;
}

const Exercises: React.FC = () => {
  const [selection, setSelection] = useState<ExerciseSelection | null>(null);

  const selectedPlayAlong = useMemo(() => {
    if (selection?.kind !== 'playalong') return null;
    return playAlongExercises.find((item) => item.id === selection.id) ?? null;
  }, [selection]);

  const selectedVexFlow =
    selection?.kind === 'vexflow' ? exercises[selection.index] : null;

  const isMenu = selection === null;

  return (
    <div className="exercises-container">
      <div className="exercises-background" aria-hidden="true" />
      <div className="exercises-content">
        <NavBarHome />
        <div
          className={`exercises-main${isMenu ? ' exercises-main--menu' : ' exercises-main--active'}`}
        >
          {isMenu ? (
            <header className="exercises-picker exercises-picker--menu">
              <h1 className="exercises-page-title">Exercises</h1>
              <p className="exercises-page-desc">Choose an exercise to open it full screen.</p>

              <div className="exercises-picker-group">
                <span className="exercises-picker-label">Rhythm</span>
                <div className="exercises-picker-buttons" role="list">
                  {exercises.map((exercise, index) => {
                    const item: ExerciseSelection = { kind: 'vexflow', index };
                    return (
                      <button
                        key={selectionKey(item)}
                        type="button"
                        role="listitem"
                        className="exercises-pick"
                        onClick={() => setSelection(item)}
                      >
                        {exercise.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              {playAlongExercises.length > 0 && (
                <div className="exercises-picker-group">
                  <span className="exercises-picker-label">Play-along</span>
                  <div className="exercises-picker-buttons" role="list">
                    {playAlongExercises.map((item) => {
                      const pick: ExerciseSelection = { kind: 'playalong', id: item.id };
                      return (
                        <button
                          key={selectionKey(pick)}
                          type="button"
                          role="listitem"
                          className="exercises-pick exercises-pick--playalong"
                          onClick={() => setSelection(pick)}
                        >
                          {item.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </header>
          ) : (
            <>
              <button
                type="button"
                className="exercises-back"
                onClick={() => setSelection(null)}
              >
                ← All exercises
              </button>

              <div className="exercises-stage" aria-live="polite">
                {selection.kind === 'vexflow' && selectedVexFlow && (
                  <div className="exercises-vexflow-stage" key={selectionKey(selection)}>
                    <VexFlowExercise exercise={selectedVexFlow} />
                  </div>
                )}

                {selection.kind === 'playalong' && selectedPlayAlong && (
                  <MusicXmlPlayAlong
                    key={selectedPlayAlong.id}
                    exercise={selectedPlayAlong}
                    layout="embedded"
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Exercises;

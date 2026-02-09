import { useEffect, useRef } from 'react';
import { Exercise } from '@/types';
import './MusicScore.css';

// Import VexFlow
import VF from 'vexflow';
const { Renderer, Stave, StaveNote, Voice, Formatter, Annotation } = VF;

interface MusicScoreProps {
  exercise: Exercise | null;
  currentBeat?: number; // For playback following
  isPlaying?: boolean;
}

export const MusicScore: React.FC<MusicScoreProps> = ({ 
  exercise, 
  currentBeat = -1,
  isPlaying = false 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !exercise) return;

    // Clear previous render
    containerRef.current.innerHTML = '';

    // Create renderer
    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(1200, 300);
    const ctx = renderer.getContext();

    // Create 8 bars (measures)
    const bars = 8;
    const beatsPerBar = 4;
    const staveWidth = 1100;
    const staveX = 50;
    const staveY = 80;
    const barWidth = staveWidth / bars;

    const staves: any[] = [];

    // Create staves for each bar
    for (let i = 0; i < bars; i++) {
      const stave = new Stave(staveX + (i * barWidth), staveY, barWidth);

      // Add clef and time signature to first stave only
      if (i === 0) {
        stave.addClef('percussion');
        stave.addTimeSignature('4/4');
      }

      stave.setContext(ctx).draw();
      staves.push(stave);
    }

    // Map drum IDs to staff positions (standard drum notation)
    const getNotePosition = (drumId: string): string => {
      const positions: Record<string, string> = {
        'kick': 'B/4',        // Bottom space
        'snare': 'D/4',       // Middle space
        'hihat': 'G/4',       // Top space
        'crash': 'A/5',       // Above staff
        'ride': 'G/4',        // Top space (will be open note)
        'high-tom': 'E/4',    // Second space
        'mid-tom': 'F/4',     // Third space
        'floor-tom': 'C/4',   // Fourth space
      };
      return positions[drumId] ?? 'D/4';
    };

    const getNoteType = (drumId: string): { noteHead: number; stem: boolean } => {
      // VexFlow note head types: 0=normal, 1=slash, 2=hollow
      if (drumId.includes('cymbal') || drumId === 'crash' || drumId === 'hihat') {
        return { noteHead: 1, stem: true }; // Slash for cymbals
      }
      if (drumId === 'ride') {
        return { noteHead: 2, stem: true }; // Hollow for ride
      }
      return { noteHead: 0, stem: true }; // Normal filled for drums
    };

    // Expand pattern to fill 8 bars
    const totalBeats = bars * beatsPerBar;
    const expandedPattern: string[] = [];
    for (let i = 0; i < totalBeats; i++) {
      const patternIndex = i % exercise.pattern.length;
      expandedPattern.push(exercise.pattern[patternIndex]);
    }

    // Create notes for each bar
    const allNotes: any[] = [];

    for (let barIndex = 0; barIndex < bars; barIndex++) {
      const barNotes: any[] = [];
      const barStartBeat = barIndex * beatsPerBar;

      for (let beatInBar = 0; beatInBar < beatsPerBar; beatInBar++) {
        const beatIndex = barStartBeat + beatInBar;
        const drumId = expandedPattern[beatIndex];
        const position = getNotePosition(drumId);
        const { noteHead } = getNoteType(drumId);

        // Create note
        const note = new StaveNote({
          clef: 'percussion',
          keys: [position],
          duration: '4', // Quarter note
        });

        // Set note head type based on drum type
        if (noteHead === 1) {
          // Slash note head for cymbals - use annotation
          const annotation = new Annotation('x');
          annotation.setFont('Arial', 10);
          note.addModifier(annotation, 0);
        } else if (noteHead === 2) {
          // Hollow note head for ride - try to set via internal API
          try {
            (note as any).setNoteHeadType(0, 2);
          } catch (e) {
            // If method doesn't exist, use annotation
            const annotation = new Annotation('o');
            annotation.setFont('Arial', 10);
            note.addModifier(annotation, 0);
          }
        }

        // Set stem direction (up)
        note.setStemDirection(1);

        // Store beat index for highlighting
        (note as any).beatIndex = beatIndex;
        barNotes.push(note);
        allNotes.push(note);
      }

      // Create voice and format
      const voice = new Voice({ num_beats: beatsPerBar, beat_value: 4 });
      voice.addTickables(barNotes);

      new Formatter()
        .joinVoices([voice])
        .format([voice], barWidth - 20);

      voice.draw(ctx, staves[barIndex]);
    }

    // Highlight current beat if playing
    if (isPlaying && currentBeat >= 0 && currentBeat < allNotes.length) {
      const currentNote = allNotes[currentBeat];
      if (currentNote) {
        try {
          const bbox = currentNote.getBoundingBox();
          if (bbox) {
            ctx.save();
            ctx.setFillStyle('rgba(255, 215, 0, 0.4)');
            ctx.setStrokeStyle('#FFA500');
            ctx.setLineWidth(3);
            ctx.fillRect(
              bbox.x - 10,
              bbox.y - 10,
              bbox.w + 20,
              bbox.h + 20
            );
            ctx.rect(
              bbox.x - 10,
              bbox.y - 10,
              bbox.w + 20,
              bbox.h + 20
            );
            ctx.stroke();
            ctx.restore();
          }
        } catch (e) {
          // Bounding box might not be available, skip highlighting
        }
      }
    }

  }, [exercise, currentBeat, isPlaying]);

  if (!exercise) {
    return (
      <div className="music-score-container">
        <p className="no-exercise">Select an exercise to view the music score</p>
      </div>
    );
  }

  return (
    <div className="music-score-container">
      <div className="music-score-header">
        <h3>📜 Music Score</h3>
        <span className="time-signature">4/4</span>
      </div>
      
      <div className="music-score-content">
        <div ref={containerRef} className="vexflow-container"></div>
        
        {/* Legend */}
        <div className="music-legend">
          <div className="legend-item">
            <span className="legend-symbol">●</span>
            <span>Drums (Kick, Snare, Toms)</span>
          </div>
          <div className="legend-item">
            <span className="legend-symbol">○</span>
            <span>Ride Cymbal</span>
          </div>
          <div className="legend-item">
            <span className="legend-symbol">✕</span>
            <span>Cymbals (Hi-Hat, Crash)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

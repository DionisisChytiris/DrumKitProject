import React, { useEffect, useRef } from "react";
import {
  Renderer,
  Stave,
  StaveNote,
  Voice,
  Formatter,
  Beam,
  SVGContext,
  Tuplet,
} from "vexflow";
import * as Tone from "tone";
import { ExerciseDefinition } from "@/types/exerciseTypes";
import { audioManager } from "@/utils/audioManager";

interface VexFlowExerciseProps {
  exercise: ExerciseDefinition;
}

const VexFlowExercise: React.FC<VexFlowExerciseProps> = ({ exercise }) => {
  const ref = useRef<HTMLDivElement>(null);
  const allNotesRef = useRef<StaveNote[]>([]);
  const barXPositionsRef = useRef<number[]>([]);
  const ctxRef = useRef<SVGContext | null>(null);

  // Using audioManager directly instead of Tone.js synths for better reliability

  useEffect(() => {
    // Add global error handler for AudioContext errors
    const handleAudioContextError = (event: ErrorEvent) => {
      if (event.message && event.message.includes('AudioContext')) {
        console.error('[VexFlowExercise] AudioContext error detected:', event.message);
        // Try to recover by using audioManager only
        console.log('[VexFlowExercise] Will use audioManager fallback for all sounds');
      }
    };
    
    window.addEventListener('error', handleAudioContextError);
    
    if (!ref.current) {
      return () => {
        window.removeEventListener('error', handleAudioContextError);
      };
    }
    ref.current.innerHTML = "";

    const renderer = new Renderer(ref.current, Renderer.Backends.SVG);
    renderer.resize(990, 220);
    const ctx = renderer.getContext() as SVGContext;
    ctxRef.current = ctx;

    const stave = new Stave(10, 40, 880);
    stave.addClef("percussion").addTimeSignature(`${exercise.timeSignature}/4`);
    stave.setContext(ctx).draw();

    // Calculate total notes based on note duration
    // For 8th notes: 8 per bar, for 8th note triplets (8t): 12 per bar
    const notesPerBar = exercise.noteDuration === "8t" ? 12 : 8;
    const totalNotes = exercise.bars * notesPerBar;
    const notes: StaveNote[] = [];

    for (let i = 0; i < totalNotes; i++) {
      const beat = exercise.noteDuration === "8t" 
        ? Math.floor(i % 12 / 3) + 1  // For triplets: 3 notes per beat, 12 per bar
        : (i % 8) / 2 + 1;  // For 8th notes: 2 notes per beat, 8 per bar
      const position = i % notesPerBar;
      const totalPosition = i;

      // Get drums for this position from the pattern function
      const drumNotes = exercise.pattern(beat, position, totalPosition);

      // For triplets, use "8" duration but we'll add Tuplet notation later
      const isTriplet = exercise.noteDuration === "8t";
      const noteDuration = isTriplet ? "8" : exercise.noteDuration;

      if (drumNotes.length === 0) {
        // Create a rest note if no drums
        const note = new StaveNote({
          keys: ["b/4"],
          duration: noteDuration,
          clef: "percussion",
        });
        notes.push(note);
        continue;
      }

      const keys = drumNotes.map(dn => dn.key);
      const note = new StaveNote({
        keys,
        duration: noteDuration,
        clef: "percussion",
      });

      // Set line positions
      note.keys.forEach((k, idx) => {
        const drumNote = drumNotes.find(dn => dn.key === k);
        if (drumNote) {
          note.setKeyLine(idx, drumNote.line);
        }
      });

      // Custom noteheads (like X for hi-hat)
      note.keys.forEach((k, idx) => {
        const drumNote = drumNotes.find(dn => dn.key === k);
        if (drumNote?.customNoteHead) {
          note.setKeyStyle(idx, {
            customNoteHead: (ctx: any, x: number, y: number, w: number, h: number) => {
              ctx.moveTo(x - w / 2, y - h / 2);
              ctx.lineTo(x + w / 2, y + h / 2);
              ctx.moveTo(x + w / 2, y - h / 2);
              ctx.lineTo(x - w / 2, y + h / 2);
              ctx.stroke();
            },
          } as any);
        }
      });

      notes.push(note);
    }

    allNotesRef.current = notes;

    // Create tuplets for triplets (group 3 notes together)
    const tuplets: Tuplet[] = [];
    const isTriplet = exercise.noteDuration === "8t";
    if (isTriplet) {
      // Group notes into triplets (3 notes per group)
      for (let i = 0; i < notes.length; i += 3) {
        if (i + 2 < notes.length) {
          const tuplet = new Tuplet([notes[i], notes[i + 1], notes[i + 2]], {
            num_notes: 3,
            notes_occupied: 2, // 3 eighth notes occupy the space of 2 eighth notes
          });
          tuplets.push(tuplet);
        }
      }
    }

    // Beams for hi-hat groups
    const hiHatNotes = notes.filter((n) => n.keys.some((k) => k === "x/5"));
    const beams: Beam[] = [];
    if (isTriplet) {
      // For triplets, beam groups of 3
      for (let i = 0; i < hiHatNotes.length; i += 3) {
        if (i + 2 < hiHatNotes.length) {
          beams.push(new Beam(hiHatNotes.slice(i, i + 3)));
        }
      }
    } else {
      // For regular 8th notes, beam groups of 2
      for (let i = 0; i < hiHatNotes.length; i += 2) {
        beams.push(new Beam(hiHatNotes.slice(i, i + 2)));
      }
    }

    const voice = new Voice({ num_beats: exercise.bars * exercise.timeSignature, beat_value: 4 });
    voice.addTickables(notes);
    const formatWidth = 810;
    new Formatter().joinVoices([voice]).format([voice], formatWidth);
    voice.draw(ctx, stave);
    beams.forEach((b) => b.setContext(ctx).draw());
    
    // Draw tuplets if any
    tuplets.forEach(tuplet => tuplet.setContext(ctx).draw());

    // Bar lines - calculate based on note duration
    const staveStartX = 10;
    const barBoundaryNoteIndices: number[] = [];
    // Use the same notesPerBar calculated earlier (line 46)
    // Place bar line before the first note of the next bar (not after the last note of current bar)
    for (let bar = 1; bar < exercise.bars; bar++) {
      barBoundaryNoteIndices.push(bar * notesPerBar); // First note index of the next bar
    }
    const barXPositions: number[] = [];
    const offset = -2; // Negative offset to place bar line before the first note

    barBoundaryNoteIndices.forEach((noteIndex) => {
      const note = notes[noteIndex];
      const boundingBox = note.getBoundingBox();
      if (boundingBox) {
        // Place bar line slightly before the first note of the bar
        barXPositions.push(boundingBox.getX() + offset);
      } else {
        // Fallback calculation if bounding box not available
        const noteSpacing = formatWidth / (totalNotes - 1);
        barXPositions.push(staveStartX + noteIndex * noteSpacing + offset);
      }
    });

    barXPositions.forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, 80);
      ctx.lineTo(x, 120);
      ctx.stroke();
    });

    barXPositionsRef.current = barXPositions;

    // Initialize Tone.js synths (will be re-initialized in play() with user interaction)
    // Don't initialize here to avoid browser autoplay restrictions
    // Synths will be created when user clicks play

    return () => {
      // Cleanup interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
  }, [exercise]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentNoteIndexRef = useRef<number>(0);

  const scheduleNotes = () => {
    if (!allNotesRef.current.length || !ctxRef.current) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    Tone.Transport.cancel();
    Tone.Transport.stop();

    const ctx = ctxRef.current;
    const stave = new Stave(10, 40, 880);
    stave.addClef("percussion").addTimeSignature(`${exercise.timeSignature}/4`);
    const voice = new Voice({ num_beats: exercise.bars * exercise.timeSignature, beat_value: 4 });
    voice.addTickables(allNotesRef.current);
    new Formatter().joinVoices([voice]).format([voice], 810);

    // Beams for hi-hat groups
    const isTriplet = exercise.noteDuration === "8t";
    const hiHatNotes = allNotesRef.current.filter((n) => n.keys.some((k) => k === "x/5"));
    const beams: Beam[] = [];
    if (isTriplet) {
      // For triplets, beam groups of 3
      for (let i = 0; i < hiHatNotes.length; i += 3) {
        if (i + 2 < hiHatNotes.length) {
          beams.push(new Beam(hiHatNotes.slice(i, i + 3)));
        }
      }
    } else {
      // For regular 8th notes, beam groups of 2
      for (let i = 0; i < hiHatNotes.length; i += 2) {
        beams.push(new Beam(hiHatNotes.slice(i, i + 2)));
      }
    }

    // BPM = 120, calculate interval based on note duration
    const BPM = 120;
    let intervalMs: number;
    if (exercise.noteDuration === "8t") {
      // For triplets: 3 notes per beat, so each note is 1/3 of a beat
      const tripletNoteDuration = (60 / BPM) / 3; // ~0.167 seconds per triplet note
      intervalMs = tripletNoteDuration * 1000;
    } else {
      // For 8th notes: 2 notes per beat, so each note is 0.5 beats
      const eighthNoteDuration = (60 / BPM) / 2; // 0.25 seconds per eighth note
      intervalMs = eighthNoteDuration * 1000;
    }

    currentNoteIndexRef.current = 0;

    // Use setInterval for more reliable timing
    intervalRef.current = setInterval(() => {
      const i = currentNoteIndexRef.current;
      
      if (i >= allNotesRef.current.length) {
        // Finished playing
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      // Calculate beat and position based on note duration
      const isTriplet = exercise.noteDuration === "8t";
      let beat: number;
      let position: number;
      
      if (isTriplet) {
        // For triplets: 12 positions per bar, 3 per beat
        const notesPerBar = 12;
        position = i % notesPerBar;
        beat = Math.floor(position / 3) + 1;
      } else {
        // For 8th notes: 8 positions per bar, 2 per beat
        const notesPerBar = 8;
        position = i % notesPerBar;
        beat = (position / 2) + 1;
      }
      
      const drumNotes = exercise.pattern(beat, position, i);

      console.log(`Playing note ${i} at ${new Date().toISOString()}, drums:`, drumNotes.map(d => d.key));

      // Play drums based on pattern - use audioManager directly for reliability
      drumNotes.forEach(drumNote => {
        try {
          // Use audioManager directly - it handles AudioContext properly and has fallbacks
          if (drumNote.key === "x/5") {
            // Hi-hat
            audioManager.playSound("hihat");
            console.log("  ✓ Playing hi-hat via audioManager");
          } else if (drumNote.key === "f/2") {
            // Kick
            audioManager.playSound("kick");
            console.log("  ✓ Playing kick via audioManager");
          } else if (drumNote.key === "c/3") {
            // Snare
            audioManager.playSound("snare");
            console.log("  ✓ Playing snare via audioManager");
          } else if (drumNote.key === "d/4") {
            // Tom
            audioManager.playSound("tom");
            console.log("  ✓ Playing tom via audioManager");
          } else {
            console.warn("  ⚠️ No handler for drum key:", drumNote.key);
          }
        } catch (err) {
          console.error("Error playing sound:", err, drumNote);
        }
      });

      // Highlight note
      allNotesRef.current.forEach((note, idx) => {
        note.setStyle({ fillStyle: idx === i ? "red" : "black", strokeStyle: "black" });
      });

      ctx.clear();
      stave.setContext(ctx).draw();
      voice.draw(ctx, stave);
      beams.forEach((b) => b.setContext(ctx).draw());
      barXPositionsRef.current.forEach((x) => {
        ctx.beginPath();
        ctx.moveTo(x, 80);
        ctx.lineTo(x, 120);
        ctx.stroke();
      });

      currentNoteIndexRef.current++;
    }, intervalMs);

    console.log(`Started interval-based playback, ${allNotesRef.current.length} notes, interval: ${intervalMs}ms`);
  };

  const play = async () => {
    try {
      console.log("Starting audio...");
      
      // Use audioManager directly - it's more reliable and handles AudioContext properly
      console.log("Using audioManager for all sounds");
      
      // Test audioManager immediately to verify it works
      console.log("Testing audioManager sounds...");
      audioManager.playSound("kick");
      setTimeout(() => {
        audioManager.playSound("snare");
        console.log("✓ Test snare via audioManager");
      }, 200);
      setTimeout(() => {
        audioManager.playSound("hihat");
        console.log("✓ Test hi-hat via audioManager");
      }, 400);
      console.log("✓ Test kick via audioManager");
      
      // Start the exercise playback
      scheduleNotes();
      console.log("Exercise playback scheduled");
      
    } catch (error) {
      console.error("Error starting audio:", error);
    }
  };

  const stop = () => {
    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    Tone.Transport.stop();
    Tone.Transport.cancel();
    currentNoteIndexRef.current = 0;

    if (!ctxRef.current) return;
    const ctx = ctxRef.current;

    // Reset note colors
    allNotesRef.current.forEach((note) => note.setStyle({ fillStyle: "black", strokeStyle: "black" }));

    const stave = new Stave(10, 40, 880);
    stave.addClef("percussion").addTimeSignature(`${exercise.timeSignature}/4`);
    stave.setContext(ctx).draw();

    const voice = new Voice({ num_beats: exercise.bars * exercise.timeSignature, beat_value: 4 });
    voice.addTickables(allNotesRef.current);
    new Formatter().joinVoices([voice]).format([voice], 810);
    voice.draw(ctx, stave);

    // Recreate and redraw tuplets for triplets
    const isTriplet = exercise.noteDuration === "8t";
    if (isTriplet) {
      const tuplets: Tuplet[] = [];
      // Group notes into triplets (3 notes per group)
      for (let i = 0; i < allNotesRef.current.length; i += 3) {
        if (i + 2 < allNotesRef.current.length) {
          const tuplet = new Tuplet([allNotesRef.current[i], allNotesRef.current[i + 1], allNotesRef.current[i + 2]], {
            num_notes: 3,
            notes_occupied: 2, // 3 eighth notes occupy the space of 2 eighth notes
          });
          tuplets.push(tuplet);
        }
      }
      tuplets.forEach(tuplet => tuplet.setContext(ctx).draw());
    }

    // redraw bar lines
    barXPositionsRef.current.forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, 80);
      ctx.lineTo(x, 120);
      ctx.stroke();
    });

    // redraw beams
    const hiHatNotes = allNotesRef.current.filter((n) => n.keys.some((k) => k === "x/5"));
    const beams: Beam[] = [];
    if (isTriplet) {
      // For triplets, beam groups of 3
      for (let i = 0; i < hiHatNotes.length; i += 3) {
        if (i + 2 < hiHatNotes.length) {
          beams.push(new Beam(hiHatNotes.slice(i, i + 3)));
        }
      }
    } else {
      // For regular 8th notes, beam groups of 2
      for (let i = 0; i < hiHatNotes.length; i += 2) {
        beams.push(new Beam(hiHatNotes.slice(i, i + 2)));
      }
    }
    beams.forEach((b) => b.setContext(ctx).draw());
  };

  return (
    <div style={{ position: 'relative', zIndex: 10 }}>
      <h2 style={{ color: 'white', marginBottom: 10 }}>{exercise.title}</h2>
      {exercise.description && <p style={{ marginTop: 10, marginBottom: 10, fontStyle: 'italic', color: 'white' }}>{exercise.description}</p>}
      <div ref={ref} />
      <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button 
          onClick={play} 
          style={{ 
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#4a90e2',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontWeight: 'bold',
            position: 'relative',
            zIndex: 1000,
            pointerEvents: 'auto'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#357abd'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4a90e2'}
        >
          ▶ Play
        </button>
        <button 
          onClick={stop} 
          style={{ 
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#e24a4a',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontWeight: 'bold',
            position: 'relative',
            zIndex: 1000,
            pointerEvents: 'auto'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#bd3535'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e24a4a'}
        >
          ■ Stop
        </button>
      </div>
    </div>
  );
};

export default VexFlowExercise;

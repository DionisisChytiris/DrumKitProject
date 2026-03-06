import React, { useEffect, useRef } from "react";
import {
  Renderer,
  Stave,
  StaveNote,
  Voice,
  Formatter,
  Beam,
  SVGContext,
} from "vexflow";
import * as Tone from "tone";
import { ExerciseDefinition } from "@/types/exerciseTypes";

interface VexFlowExerciseProps {
  exercise: ExerciseDefinition;
}

const VexFlowExercise: React.FC<VexFlowExerciseProps> = ({ exercise }) => {
  const ref = useRef<HTMLDivElement>(null);
  const allNotesRef = useRef<StaveNote[]>([]);
  const barXPositionsRef = useRef<number[]>([]);
  const ctxRef = useRef<SVGContext | null>(null);

  // Tone.js synths
  const kickRef = useRef<Tone.MembraneSynth>();
  const snareRef = useRef<Tone.NoiseSynth>();
  const hatRef = useRef<Tone.MetalSynth>();
  const tomRef = useRef<Tone.MembraneSynth>();

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";

    const renderer = new Renderer(ref.current, Renderer.Backends.SVG);
    renderer.resize(990, 220);
    const ctx = renderer.getContext() as SVGContext;
    ctxRef.current = ctx;

    const stave = new Stave(10, 40, 880);
    stave.addClef("percussion").addTimeSignature(`${exercise.timeSignature}/4`);
    stave.setContext(ctx).draw();

    const totalNotes = exercise.bars * 8; // 8 eighth notes per bar
    const notes: StaveNote[] = [];

    for (let i = 0; i < totalNotes; i++) {
      const beat = (i % 8) / 2 + 1;
      const position = i % 8;
      const totalPosition = i;

      // Get drums for this position from the pattern function
      const drumNotes = exercise.pattern(beat, position, totalPosition);

      if (drumNotes.length === 0) {
        // Create a rest note if no drums
        const note = new StaveNote({
          keys: ["b/4"],
          duration: exercise.noteDuration,
          clef: "percussion",
        });
        notes.push(note);
        continue;
      }

      const keys = drumNotes.map(dn => dn.key);
      const note = new StaveNote({
        keys,
        duration: exercise.noteDuration,
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

    // Beams for hi-hat 2-note groups
    const hiHatNotes = notes.filter((n) => n.keys.some((k) => k === "x/5"));
    const beams: Beam[] = [];
    for (let i = 0; i < hiHatNotes.length; i += 2) {
      beams.push(new Beam(hiHatNotes.slice(i, i + 2)));
    }

    const voice = new Voice({ num_beats: exercise.bars * exercise.timeSignature, beat_value: 4 });
    voice.addTickables(notes);
    const formatWidth = 810;
    new Formatter().joinVoices([voice]).format([voice], formatWidth);
    voice.draw(ctx, stave);
    beams.forEach((b) => b.setContext(ctx).draw());

    // Bar lines
    const staveStartX = 10;
    const barBoundaryNoteIndices: number[] = [];
    for (let bar = 1; bar < exercise.bars; bar++) {
      barBoundaryNoteIndices.push(bar * 8 - 1);
    }
    const barXPositions: number[] = [];
    const offset = 6;

    barBoundaryNoteIndices.forEach((noteIndex) => {
      const note = notes[noteIndex];
      const boundingBox = note.getBoundingBox();
      if (boundingBox) {
        barXPositions.push(boundingBox.getX() + boundingBox.getW() + offset);
      } else {
        const noteSpacing = formatWidth / (totalNotes - 1);
        const noteWidth = 15;
        barXPositions.push(staveStartX + (noteIndex + 1) * noteSpacing + noteWidth / 2 + offset);
      }
    });

    barXPositions.forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, 80);
      ctx.lineTo(x, 120);
      ctx.stroke();
    });

    barXPositionsRef.current = barXPositions;

    // Initialize Tone.js synths
    kickRef.current = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 10,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
    }).toDestination();
    kickRef.current.volume.value = -5;
    
    snareRef.current = new Tone.NoiseSynth({ 
      envelope: { attack: 0.001, decay: 0.2, sustain: 0 },
      volume: -5
    }).toDestination();
    
    hatRef.current = new Tone.MetalSynth({ 
      envelope: { attack: 0.001, decay: 0.1 },
      volume: -8
    }).toDestination();
    
    tomRef.current = new Tone.MembraneSynth({ 
      pitchDecay: 0.05, 
      octaves: 4,
      volume: -3
    }).toDestination();

    return () => {
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
  }, [exercise]);

  const scheduleNotes = () => {
    if (!allNotesRef.current.length || !ctxRef.current) return;

    Tone.Transport.cancel();

    const ctx = ctxRef.current;
    const stave = new Stave(10, 40, 880);
    stave.addClef("percussion").addTimeSignature(`${exercise.timeSignature}/4`);
    const voice = new Voice({ num_beats: exercise.bars * exercise.timeSignature, beat_value: 4 });
    voice.addTickables(allNotesRef.current);
    new Formatter().joinVoices([voice]).format([voice], 810);

    // Beams for hi-hat 2-note groups
    const hiHatNotes = allNotesRef.current.filter((n) => n.keys.some((k) => k === "x/5"));
    const beams: Beam[] = [];
    for (let i = 0; i < hiHatNotes.length; i += 2) {
      beams.push(new Beam(hiHatNotes.slice(i, i + 2)));
    }

    allNotesRef.current.forEach((_note, i) => {
      const beat = (i % 8) / 2 + 1;
      const position = i % 8;
      const time = i * 0.5;
      
      // Get drums for this position
      const drumNotes = exercise.pattern(beat, position, i);
      
      Tone.Transport.schedule((t) => {
        // Play drums based on pattern
        drumNotes.forEach(drumNote => {
          if (drumNote.key === "x/5") {
            hatRef.current?.triggerAttackRelease("16n", t);
          } else if (drumNote.key === "f/2") {
            kickRef.current?.triggerAttackRelease("C1", "8n", t);
          } else if (drumNote.key === "c/3") {
            snareRef.current?.triggerAttackRelease("16n", t);
          } else if (drumNote.key === "d/4") {
            tomRef.current?.triggerAttackRelease("C2", "8n", t);
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
      }, time);
    });
  };

  const play = async () => {
    try {
      await Tone.start();
      // Ensure synths are initialized
      if (!kickRef.current || !snareRef.current || !hatRef.current || !tomRef.current) {
        kickRef.current = new Tone.MembraneSynth({
          pitchDecay: 0.05,
          octaves: 10,
          oscillator: { type: "sine" },
          envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
        }).toDestination();
        kickRef.current.volume.value = -5;
        
        snareRef.current = new Tone.NoiseSynth({ 
          envelope: { attack: 0.001, decay: 0.2, sustain: 0 },
          volume: -5
        }).toDestination();
        
        hatRef.current = new Tone.MetalSynth({ 
          envelope: { attack: 0.001, decay: 0.1 },
          volume: -8
        }).toDestination();
        
        tomRef.current = new Tone.MembraneSynth({ 
          pitchDecay: 0.05, 
          octaves: 4,
          volume: -3
        }).toDestination();
      }
      scheduleNotes();
      Tone.Transport.start();
    } catch (error) {
      console.error("Error starting audio:", error);
    }
  };

  const stop = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();

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
    for (let i = 0; i < hiHatNotes.length; i += 2) {
      beams.push(new Beam(hiHatNotes.slice(i, i + 2)));
    }
    beams.forEach((b) => b.setContext(ctx).draw());
  };

  return (
    <div>
      <h2>{exercise.title}</h2>
      {exercise.description && <p style={{ marginTop: 10, marginBottom: 10, fontStyle: 'italic' }}>{exercise.description}</p>}
      <div ref={ref} />
      <button onClick={play} style={{ marginTop: 20, marginRight: 10 }}>▶ Play</button>
      <button onClick={stop} style={{ marginTop: 20 }}>■ Stop</button>
    </div>
  );
};

export default VexFlowExercise;

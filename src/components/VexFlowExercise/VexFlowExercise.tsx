import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { DrumPiece } from "@/types";
import { useAppSelector } from "@/store/hooks";
import { ClickSound } from "@/store/slices/metronomeSlice";

interface VexFlowExerciseProps {
  exercise: ExerciseDefinition;
}

const VexFlowExercise: React.FC<VexFlowExerciseProps> = ({ exercise }) => {
  const { drumKit } = useAppSelector((state) => state.drumKit);
  const { clickSound, volume: metronomeVolume } = useAppSelector((state) => state.metronome);
  const ref = useRef<HTMLDivElement>(null);
  const allNotesRef = useRef<StaveNote[]>([]);
  const barXPositionsRef = useRef<number[]>([]);
  const ctxRef = useRef<SVGContext | null>(null);

  const getExerciseDrum = useCallback((vexKey: string): DrumPiece | undefined => {
    if (vexKey === "x/5") return drumKit.find((drum) => drum.id === "hihat");
    if (vexKey === "f/2") return drumKit.find((drum) => drum.id === "kick");
    if (vexKey === "c/3") return drumKit.find((drum) => drum.id === "snare");
    if (vexKey === "d/4") {
      const tomPriority = ["high-tom", "mid-tom", "floor-tom", "low-floor-tom", "tom"];
      for (const tomId of tomPriority) {
        const matchedTom = drumKit.find((drum) => drum.id === tomId);
        if (matchedTom) return matchedTom;
      }
    }
    return undefined;
  }, [drumKit]);

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
    // For 8th notes: 8 per bar, for 8th note triplets (8t): 12 per bar, for 16th notes: 16 per bar
    const notesPerBar = exercise.noteDuration === "8t" ? 12 : exercise.noteDuration === "16" ? 16 : 8;
    const totalNotes = exercise.bars * notesPerBar;
    const notes: StaveNote[] = [];

    for (let i = 0; i < totalNotes; i++) {
      let beat: number;
      if (exercise.noteDuration === "8t") {
        // For triplets: 3 notes per beat, 12 per bar
        beat = Math.floor(i % 12 / 3) + 1;
      } else if (exercise.noteDuration === "16") {
        // For 16th notes: 4 notes per beat, 16 per bar
        beat = Math.floor(i % 16 / 4) + 1;
      } else {
        // For 8th notes: 2 notes per beat, 8 per bar
        beat = Math.floor(i % 8 / 2) + 1;
      }
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
    } else if (exercise.noteDuration === "16") {
      // For 16th notes, beam groups of 4
      for (let i = 0; i < hiHatNotes.length; i += 4) {
        if (i + 3 < hiHatNotes.length) {
          beams.push(new Beam(hiHatNotes.slice(i, i + 4)));
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
      if (countInIntervalRef.current) {
        clearInterval(countInIntervalRef.current);
        countInIntervalRef.current = null;
      }
      if (countInStartTimeoutRef.current) {
        clearTimeout(countInStartTimeoutRef.current);
        countInStartTimeoutRef.current = null;
      }
      if (countInStartTimeoutRef.current) {
        clearTimeout(countInStartTimeoutRef.current);
        countInStartTimeoutRef.current = null;
      }
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
  }, [exercise]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentNoteIndexRef = useRef<number>(0);
  const countInIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countInStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countInAudioContextRef = useRef<AudioContext | null>(null);
  const [exerciseTempos, setExerciseTempos] = useState<Record<number, number>>({});
  const defaultTempo = exercise.bpm ?? 120;
  const exerciseTempo = exerciseTempos[exercise.id] ?? defaultTempo;
  const [isLoopEnabled, setIsLoopEnabled] = useState(false);

  const playMetronomeStyleClick = useCallback((isDownbeat: boolean) => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!countInAudioContextRef.current) {
      countInAudioContextRef.current = new AudioContextClass();
    }
    const audioContext = countInAudioContextRef.current;
    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {
        // If resume fails, we simply skip this click.
      });
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    let frequency = isDownbeat ? 880 : 640;
    let baseVolume = isDownbeat ? 0.35 : 0.22;
    let oscillatorType: OscillatorType = "sine";

    switch (clickSound as ClickSound) {
      case "tick":
        oscillatorType = "sine";
        break;
      case "beep":
        oscillatorType = "square";
        frequency *= 1.2;
        baseVolume += 0.03;
        break;
      case "wood":
        oscillatorType = "sawtooth";
        frequency *= 0.82;
        break;
      case "metallic":
        oscillatorType = "triangle";
        frequency *= 1.45;
        break;
    }

    oscillator.frequency.value = frequency;
    oscillator.type = oscillatorType;

    const finalVolume = Math.max(0.05, Math.min(1, baseVolume * metronomeVolume));
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(finalVolume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.11);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.11);
  }, [clickSound, metronomeVolume]);

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
    } else if (exercise.noteDuration === "16") {
      // For 16th notes, beam groups of 4
      for (let i = 0; i < hiHatNotes.length; i += 4) {
        if (i + 3 < hiHatNotes.length) {
          beams.push(new Beam(hiHatNotes.slice(i, i + 4)));
        }
      }
    } else {
      // For regular 8th notes, beam groups of 2
      for (let i = 0; i < hiHatNotes.length; i += 2) {
        beams.push(new Beam(hiHatNotes.slice(i, i + 2)));
      }
    }

    // Use exercise BPM, falling back to 120 when not specified.
    const BPM = exerciseTempo;
    let intervalMs: number;
    if (exercise.noteDuration === "8t") {
      // For triplets: 3 notes per beat, so each note is 1/3 of a beat
      const tripletNoteDuration = (60 / BPM) / 3; // ~0.167 seconds per triplet note
      intervalMs = tripletNoteDuration * 1000;
    } else if (exercise.noteDuration === "16") {
      // For 16th notes: 4 notes per beat, so each note is 1/4 of a beat
      const sixteenthNoteDuration = (60 / BPM) / 4; // 0.125 seconds per 16th note
      intervalMs = sixteenthNoteDuration * 1000;
    } else {
      // For 8th notes: 2 notes per beat, so each note is 0.5 beats
      const eighthNoteDuration = (60 / BPM) / 2; // 0.25 seconds per eighth note
      intervalMs = eighthNoteDuration * 1000;
    }

    currentNoteIndexRef.current = 0;

    const playScheduledStep = () => {
      let i = currentNoteIndexRef.current;
      
      if (i >= allNotesRef.current.length) {
        if (!isLoopEnabled) {
          // Finished playing (loop disabled)
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }
        // Restart from the beginning when loop is enabled.
        currentNoteIndexRef.current = 0;
        i = 0;
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
      } else if (exercise.noteDuration === "16") {
        // For 16th notes: 16 positions per bar, 4 per beat
        const notesPerBar = 16;
        position = i % notesPerBar;
        beat = Math.floor(position / 4) + 1;
      } else {
        // For 8th notes: 8 positions per bar, 2 per beat
        const notesPerBar = 8;
        position = i % notesPerBar;
        beat = Math.floor(position / 2) + 1;
      }
      
      const drumNotes = exercise.pattern(beat, position, i);

      console.log(`Playing note ${i} at ${new Date().toISOString()}, drums:`, drumNotes.map(d => d.key));

      // Play drums based on pattern - use audioManager directly for reliability
      drumNotes.forEach(drumNote => {
        try {
          // Use audioManager directly - it handles AudioContext properly and has fallbacks
          const mappedDrum = getExerciseDrum(drumNote.key);
          if (mappedDrum) {
            // Use the currently customized kit sound (audioUrl) for exercise playback.
            audioManager.playSound(mappedDrum.id, mappedDrum.audioUrl);
            console.log(`  ✓ Playing ${mappedDrum.id} via customized kit audio`);
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
    };

    // Play the first exercise step immediately so it aligns with the count-in downbeat.
    playScheduledStep();
    // Then continue at regular interval.
    intervalRef.current = setInterval(playScheduledStep, intervalMs);

    console.log(`Started interval-based playback, ${allNotesRef.current.length} notes, interval: ${intervalMs}ms`);
  };

  const play = async () => {
    try {
      console.log("Starting audio...");
      
      // Use audioManager directly - it's more reliable and handles AudioContext properly
      console.log("Using audioManager for all sounds");

      // Ensure we are not running previous timers before starting a new count-in.
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (countInIntervalRef.current) {
        clearInterval(countInIntervalRef.current);
        countInIntervalRef.current = null;
      }

      // One bar count-in (quarter-note clicks) before the exercise starts.
      const BPM = exerciseTempo;
      const beatIntervalMs = (60 / BPM) * 1000;
      const beatsInBar = Math.max(1, exercise.timeSignature);
      let countInBeat = 1;

      // Immediate first click gives better feedback when pressing Play.
      playMetronomeStyleClick(true);
      console.log(`[VexFlowExercise] Count-in beat ${countInBeat}/${beatsInBar}`);

      if (beatsInBar === 1) {
        countInStartTimeoutRef.current = setTimeout(() => {
          scheduleNotes();
          console.log("Exercise playback scheduled after count-in");
        }, beatIntervalMs);
        return;
      }

      countInIntervalRef.current = setInterval(() => {
        countInBeat += 1;
        playMetronomeStyleClick(false);
        console.log(`[VexFlowExercise] Count-in beat ${countInBeat}/${beatsInBar}`);

        if (countInBeat >= beatsInBar) {
          if (countInIntervalRef.current) {
            clearInterval(countInIntervalRef.current);
            countInIntervalRef.current = null;
          }
          // Start exactly one beat after the final count-in click.
          countInStartTimeoutRef.current = setTimeout(() => {
            scheduleNotes();
            console.log("Exercise playback scheduled after count-in");
          }, beatIntervalMs);
        }
      }, beatIntervalMs);
      
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
    if (countInIntervalRef.current) {
      clearInterval(countInIntervalRef.current);
      countInIntervalRef.current = null;
    }
    if (countInStartTimeoutRef.current) {
      clearTimeout(countInStartTimeoutRef.current);
      countInStartTimeoutRef.current = null;
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
    } else if (exercise.noteDuration === "16") {
      // For 16th notes, beam groups of 4
      for (let i = 0; i < hiHatNotes.length; i += 4) {
        if (i + 3 < hiHatNotes.length) {
          beams.push(new Beam(hiHatNotes.slice(i, i + 4)));
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

  const handleTempoChange = (tempo: number) => {
    const safeTempo = Math.max(30, Math.min(300, Math.round(tempo)));
    setExerciseTempos((prev) => ({
      ...prev,
      [exercise.id]: safeTempo,
    }));
  };

  const resetTempo = () => {
    setExerciseTempos((prev) => {
      const next = { ...prev };
      delete next[exercise.id];
      return next;
    });
  };

  return (
    <div style={{ position: 'relative', zIndex: 10 }}>
      <h2 style={{ color: 'white', marginBottom: 10 }}>{exercise.title}</h2>
      {exercise.description && <p style={{ marginTop: 10, marginBottom: 10, fontStyle: 'italic', color: 'white' }}>{exercise.description}</p>}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'white' }}>
        <span style={{ fontWeight: 600 }}>Tempo:</span>
        <button
          onClick={() => handleTempoChange(exerciseTempo - 5)}
          style={{
            padding: '6px 10px',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: '#444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
          title="Decrease tempo by 5 BPM"
        >
          -5
        </button>
        <input
          type="number"
          min={30}
          max={300}
          value={exerciseTempo}
          onChange={(e) => handleTempoChange(Number(e.target.value))}
          style={{
            width: '78px',
            padding: '6px 8px',
            borderRadius: '4px',
            border: '1px solid #888',
            fontSize: '14px',
            textAlign: 'center',
          }}
        />
        <span style={{ minWidth: 32 }}>BPM</span>
        <button
          onClick={() => handleTempoChange(exerciseTempo + 5)}
          style={{
            padding: '6px 10px',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: '#444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
          title="Increase tempo by 5 BPM"
        >
          +5
        </button>
        <button
          onClick={resetTempo}
          style={{
            padding: '6px 10px',
            fontSize: '14px',
            cursor: 'pointer',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
          title={`Reset to default tempo (${defaultTempo} BPM)`}
        >
          Reset
        </button>
      </div>
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
        <button
          onClick={() => setIsLoopEnabled((prev) => !prev)}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: isLoopEnabled ? '#2d8a45' : '#666666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontWeight: 'bold',
            position: 'relative',
            zIndex: 1000,
            pointerEvents: 'auto'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isLoopEnabled ? '#236b35' : '#545454'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isLoopEnabled ? '#2d8a45' : '#666666'}
          title="Toggle looping for this exercise"
        >
          {isLoopEnabled ? '🔁 Loop: ON' : '🔁 Loop: OFF'}
        </button>
      </div>
    </div>
  );
};

export default VexFlowExercise;

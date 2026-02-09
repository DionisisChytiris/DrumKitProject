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

const DrumExercise: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const allNotesRef = useRef<StaveNote[]>([]);
  const barXPositionsRef = useRef<number[]>([]);
  const notesScheduledRef = useRef(false);

  // Tone.js synths
  const kickRef = useRef<Tone.MembraneSynth>();
  const snareRef = useRef<Tone.NoiseSynth>();
  const hatRef = useRef<Tone.MetalSynth>();

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";

    const renderer = new Renderer(ref.current, Renderer.Backends.SVG);
    renderer.resize(990, 220);
    const ctx = renderer.getContext() as SVGContext;

    const stave = new Stave(10, 40, 880);
    stave.addClef("percussion").addTimeSignature("4/4");
    stave.setContext(ctx).draw();

    const totalNotes = 32; // 4 bars * 8 eighth notes
    const notes: StaveNote[] = [];

    for (let i = 0; i < totalNotes; i++) {
      const beat = (i % 8) / 2 + 1;

      const keys: string[] = ["x/5"];
      if (beat === 1 || beat === 3) keys.push("f/2"); // kick
      if (beat === 2 || beat === 4) keys.push("c/3"); // snare

      const note = new StaveNote({
        keys,
        duration: "8",
        clef: "percussion",
      });

      note.keys.forEach((k, idx) => {
        if (k === "x/5") note.setKeyLine(idx, 5); // Hi-hat
        if (k === "c/3") note.setKeyLine(idx, 3.5); // Snare
        if (k === "f/2") note.setKeyLine(idx, 1.5); // Kick
      });

      // Hi-hat X noteheads
      note.keys.forEach((k, idx) => {
        if (k === "x/5") {
          note.setKeyStyle(idx, {
            customNoteHead: (ctx: any, x, y, w, h) => {
              ctx.moveTo(x - w / 2, y - h / 2);
              ctx.lineTo(x + w / 2, y + h / 2);
              ctx.moveTo(x + w / 2, y - h / 2);
              ctx.lineTo(x - w / 2, y + h / 2);
              ctx.stroke();
            },
          });
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

    const voice = new Voice({ num_beats: 16, beat_value: 4 });
    voice.addTickables(notes);
    const formatWidth = 810;
    new Formatter().joinVoices([voice]).format([voice], formatWidth);
    voice.draw(ctx, stave);
    beams.forEach((b) => b.setContext(ctx).draw());

    // Bar lines after notes 7, 15, 23
    const staveStartX = 10;
    const barBoundaryNoteIndices = [7, 15, 23];
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

    // --- Tone.js synths ---
    kickRef.current = new Tone.MembraneSynth().toDestination();
    snareRef.current = new Tone.NoiseSynth({ envelope: { attack: 0.001, decay: 0.2, sustain: 0 } }).toDestination();
    hatRef.current = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.1 } }).toDestination();

    // Highlight function
    function highlight(index: number) {
      allNotesRef.current.forEach((note, i) => {
        note.setStyle({ fillStyle: i === index ? "red" : "black", strokeStyle: "black" });
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
    }

    // Store highlight function for reuse
    notesScheduledRef.current = false;

    return () => {
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
  }, []);

  // Function to schedule notes
  const scheduleNotes = () => {
    if (!allNotesRef.current.length) return;
    Tone.Transport.cancel();

    allNotesRef.current.forEach((_, i) => {
      const beat = (i % 8) / 2 + 1;
      const time = i * 0.5;

      Tone.Transport.schedule((t) => {
        hatRef.current?.triggerAttackRelease("16n", t);
        if (beat === 1 || beat === 3) kickRef.current?.triggerAttackRelease("C1", "8n", t);
        if (beat === 2 || beat === 4) snareRef.current?.triggerAttackRelease("16n", t);
        // Highlight notes
        const ctx = (ref.current?.querySelector("svg") as any)?.getContext?.();
        if (!ctx) return;

        // Redraw notes
        allNotesRef.current.forEach((note, idx) => {
          note.setStyle({ fillStyle: idx === i ? "red" : "black", strokeStyle: "black" });
        });
      }, time);
    });
  };

  const play = async () => {
    await Tone.start();
    scheduleNotes();
    Tone.Transport.start();
  };

  const stop = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();

    // reset note colors
    allNotesRef.current.forEach((note) => note.setStyle({ fillStyle: "black", strokeStyle: "black" }));

    // Redraw stave and notes
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    const ctx = (svg as any).getContext?.();
    if (!ctx) return;

    const stave = new Stave(10, 0, 880);
    stave.addClef("percussion").addTimeSignature("4/4");
    stave.setContext(ctx).draw();

    const voice = new Voice({ num_beats: 16, beat_value: 4 });
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
  };

  return (
    <div>
      <h2>4-Bar Drum Kit Groove</h2>
      <div ref={ref} />
      <button onClick={play} style={{ marginTop: 20, marginRight: 10 }}>▶ Play</button>
      <button onClick={stop} style={{ marginTop: 20 }}>■ Stop</button>
    </div>
  );
};

export default DrumExercise;

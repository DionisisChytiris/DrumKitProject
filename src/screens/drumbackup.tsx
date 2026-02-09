import React, { useEffect, useRef } from "react";
import {
  Renderer,
  Stave,
  StaveNote,
  Voice,
  Formatter,
  Beam,
  SVGContext,
  BarlineType,
} from "vexflow";
import * as Tone from "tone";

const DrumExercise: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const allNotesRef = useRef<StaveNote[]>([]);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";

    const renderer = new Renderer(ref.current, Renderer.Backends.SVG);
    renderer.resize(990, 220);
    const ctx = renderer.getContext() as SVGContext;

    const stave = new Stave(10, 40, 880);
    stave.addClef("percussion").addTimeSignature("4/4");

    // Add intermediate bar lines for 4 bars
    const totalNotes = 32; // 4 bars * 8 eighth notes
    const barLength = totalNotes / 4; // notes per bar

    stave.setContext(ctx).draw();

    const notes: StaveNote[] = [];

    // Generate notes: 8th-note hi-hat, kick 1/3, snare 2/4
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

      // Vertical positions
      note.keys.forEach((k, idx) => {
        if (k === "x/5") note.setKeyLine(idx, 5); // Hi-hat
        if (k === "c/3") note.setKeyLine(idx, 3.5); // Snare
        if (k === "f/2") note.setKeyLine(idx, 1.5); // Kick
      });

      // Hi-hat X
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
    new Formatter().joinVoices([voice]).format([voice], 810);
    voice.draw(ctx, stave);

    beams.forEach((b) => b.setContext(ctx).draw());

    // Draw vertical bar lines manually
    const barXPositions = [0.25, 0.5, 0.75]; // fractions of stave width
    barXPositions.forEach((frac) => {
      const x = 62 + 880 * frac;
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x, 120);
      ctx.stroke();
    });

    // --- AUDIO ---
    const kick = new Tone.MembraneSynth().toDestination();
    const snare = new Tone.NoiseSynth({ envelope: { attack: 0.001, decay: 0.2, sustain: 0 } }).toDestination();
    const hat = new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.1 } }).toDestination();

    Tone.Transport.cancel();
    Tone.Transport.bpm.value = 90;

    notes.forEach((note, i) => {
      const beat = (i % 8) / 2 + 1;
      const time = i * 0.5;
      Tone.Transport.schedule((t) => {
        hat.triggerAttackRelease("16n", t);
        if (beat === 1 || beat === 3) kick.triggerAttackRelease("C1", "8n", t);
        if (beat === 2 || beat === 4) snare.triggerAttackRelease("16n", t);
        highlight(i);
      }, time);
    });

    function highlight(index: number) {
      allNotesRef.current.forEach((note, i) => {
        note.setStyle({ fillStyle: i === index ? "red" : "black", strokeStyle: "black" });
      });
      ctx.clear();
      stave.setContext(ctx).draw();
      voice.draw(ctx, stave);
      beams.forEach((b) => b.setContext(ctx).draw());
      // Draw bar lines again
      barXPositions.forEach((frac) => {
        const x = 10 + 880 * frac;
        ctx.beginPath();
        ctx.moveTo(x, 40);
        ctx.lineTo(x, 120);
        ctx.stroke();
      });
    }

    return () => {
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
  }, []);

  const play = async () => {
    await Tone.start();
    Tone.Transport.start();
  };

  return (
    <div>
      <h2>4-Bar Drum Kit Groove</h2>
      <div ref={ref} />
      <button onClick={play} style={{ marginTop: 20 }}>▶ Play</button>
    </div>
  );
};

export default DrumExercise;

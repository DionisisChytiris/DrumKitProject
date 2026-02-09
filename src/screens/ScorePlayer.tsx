import React, { useEffect, useRef } from "react";
import { Renderer, Stave, StaveNote, Voice, Formatter } from "vexflow";
import * as Tone from "tone";
import { Transport } from "tone";

const ScorePlayer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const notesRef = useRef<StaveNote[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // 🔥 IMPORTANT: clear previous SVGs
  containerRef.current.innerHTML = "";

    // ---------- VEXFLOW SETUP ----------
    const renderer = new Renderer(
      containerRef.current,
      Renderer.Backends.SVG
    );
    renderer.resize(600, 200);

    const context = renderer.getContext();
    context.clear();

    const stave = new Stave(10, 40, 580);
    stave.addClef("treble").addTimeSignature("4/4");
    stave.setContext(context).draw();

    const notes = [
      new StaveNote({ keys: ["c/4"], duration: "q" }),
      new StaveNote({ keys: ["d/4"], duration: "q" }),
      new StaveNote({ keys: ["e/4"], duration: "q" }),
      new StaveNote({ keys: ["f/4"], duration: "q" }),
    ];

    notesRef.current = notes;

    const voice = new Voice({ num_beats: 4, beat_value: 4 });
    voice.addTickables(notes);

    new Formatter().joinVoices([voice]).format([voice], 500);
    voice.draw(context, stave);

    // ---------- TONE.JS SETUP ----------
    const synth = new Tone.Synth().toDestination();
    Transport.bpm.value = 90;
    Transport.cancel();

    const score = [
      { note: "C4", time: 0 },
      { note: "G4", time: 1 },
      { note: "E4", time: 2 },
      { note: "F4", time: 3 },
    ];

    score.forEach((n, index) => {
      Transport.schedule((time) => {
        synth.triggerAttackRelease(n.note, "4n", time);
        highlightNote(index);
      }, n.time);
    });

    function highlightNote(activeIndex: number) {
      notes.forEach((note, i) => {
        note.setStyle({
          fillStyle: i === activeIndex ? "red" : "black",
          strokeStyle: "black",
        });
      });

      context.clear();
      stave.draw();
      voice.draw(context, stave);
    }

    return () => {
      Transport.stop();
      Transport.cancel();
    };
  }, []);

  const startPlayback = async () => {
    await Tone.start(); // required by browser
    Transport.start();
  };

  return (
    <div>
      <h2>Music Score Player</h2>
      <div ref={containerRef} />
      <button onClick={startPlayback} style={{ marginTop: "20px" }}>
        ▶ Play
      </button>
    </div>
  );
};

export default ScorePlayer;

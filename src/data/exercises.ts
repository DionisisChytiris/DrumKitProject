import { ExerciseDefinition } from '@/types/exerciseTypes';

/**
 * Exercise definitions
 * Add new exercises here - no need to create new component files!
 */

export const exercises: ExerciseDefinition[] = [
  // Exercise 1: Basic 4/4 Beat
  {
    id: 1,
    title: "4-Bar Drum Kit Groove",
    description: "Basic rock beat: Kick on 1 & 3, Snare on 2 & 4, Hi-hat on all beats",
    timeSignature: 4,
    bars: 4,
    noteDuration: "8",
    pattern: (beat, position) => {
      const keys: string[] = ["x/5"]; // Hi-hat always
      if (beat === 1 || beat === 3) keys.push("f/2"); // kick
      if (beat === 2 || beat === 4) keys.push("c/3"); // snare
      
      return keys.map(key => {
        if (key === "x/5") return { key, line: 5, customNoteHead: true };
        if (key === "c/3") return { key, line: 3.5 };
        if (key === "f/2") return { key, line: 1.5 };
        return { key, line: 4 };
      });
    }
  },

  // Exercise 2: Tom Fill Pattern
  {
    id: 2,
    title: "Exercise 2: Tom Fill Pattern",
    description: "Kick on 1, Snare on 2 & 4, Hi-hat on all beats, Tom fills on beat 3",
    timeSignature: 4,
    bars: 4,
    noteDuration: "8",
    pattern: (beat, position) => {
      const keys: string[] = ["x/5"]; // Hi-hat always
      
      // Kick on beat 1
      if (beat === 1 && position === 0) keys.push("f/2");
      
      // Snare on beats 2 and 4
      if (beat === 2 && position === 2) keys.push("c/3");
      if (beat === 4 && position === 6) keys.push("c/3");
      
      // Tom on beat 3
      if (beat === 3 && position === 4) keys.push("d/4");

      return keys.map(key => {
        if (key === "x/5") return { key, line: 5, customNoteHead: true };
        if (key === "c/3") return { key, line: 3.5 };
        if (key === "f/2") return { key, line: 1.5 };
        if (key === "d/4") return { key, line: 4.5 };
        return { key, line: 4 };
      });
    }
  },

  // Exercise 3: Syncopated Snare
  {
    id: 3,
    title: "Exercise 3: Syncopated Snare",
    description: "Kick on 1 & 3, Snare on off-beats, Hi-hat steady",
    timeSignature: 4,
    bars: 4,
    noteDuration: "8",
    pattern: (beat, position) => {
      const keys: string[] = ["x/5"]; // Hi-hat always
      if (beat === 1 || beat === 3) keys.push("f/2"); // kick
      // Snare on off-beats (positions 1, 3, 5, 7)
      if (position === 1 || position === 3 || position === 5 || position === 7) {
        keys.push("c/3");
      }
      
      return keys.map(key => {
        if (key === "x/5") return { key, line: 5, customNoteHead: true };
        if (key === "c/3") return { key, line: 3.5 };
        if (key === "f/2") return { key, line: 1.5 };
        return { key, line: 4 };
      });
    }
  },

  // Exercise 4: Double Kick Pattern
  {
    id: 4,
    title: "Exercise 4: Double Kick Pattern",
    description: "Double kicks on beat 1, Snare on 2 & 4, Hi-hat steady",
    timeSignature: 4,
    bars: 4,
    noteDuration: "8",
    pattern: (beat, position) => {
      const keys: string[] = ["x/5"]; // Hi-hat always
      // Double kick on beat 1 (positions 0 and 1)
      if (beat === 1 && (position === 0 || position === 1)) keys.push("f/2");
      if (beat === 2 || beat === 4) keys.push("c/3"); // snare
      
      return keys.map(key => {
        if (key === "x/5") return { key, line: 5, customNoteHead: true };
        if (key === "c/3") return { key, line: 3.5 };
        if (key === "f/2") return { key, line: 1.5 };
        return { key, line: 4 };
      });
    }
  },

  // Exercise 5: Hi-Hat Variations
  {
    id: 5,
    title: "Exercise 5: Hi-Hat Variations",
    description: "Kick on 1 & 3, Snare on 2 & 4, Hi-hat with variations",
    timeSignature: 4,
    bars: 4,
    noteDuration: "8",
    pattern: (beat, position) => {
      // Hi-hat on all beats except some variations
      const keys: string[] = [];
      if (!(beat === 2 && position === 3)) keys.push("x/5"); // Skip one hi-hat
      if (beat === 1 || beat === 3) keys.push("f/2"); // kick
      if (beat === 2 || beat === 4) keys.push("c/3"); // snare
      
      return keys.map(key => {
        if (key === "x/5") return { key, line: 5, customNoteHead: true };
        if (key === "c/3") return { key, line: 3.5 };
        if (key === "f/2") return { key, line: 1.5 };
        return { key, line: 4 };
      });
    }
  },

  // Exercise 6: Hi-Hat Triplets
  {
    id: 6,
    title: "Exercise 6: Hi-Hat Triplets",
    description: "Simple hi-hat triplet pattern - three notes per beat",
    timeSignature: 4,
    bars: 4,
    noteDuration: "8t", // 8th note triplets
    pattern: (beat, position) => {
      const keys: string[] = [];
      
      // Hi-hat on all triplet positions (every position in triplet subdivision)
      // For triplets: 12 positions per bar (0-11), 3 per beat
      keys.push("x/5");
      
      // Optional: Add kick on beat 1 and snare on beat 3 for reference
      // For triplets: beat 1 = positions 0,1,2; beat 3 = positions 6,7,8
      if (beat === 1 && position === 0) keys.push("f/2"); // kick on beat 1, first triplet
      if (beat === 3 && position === 6) keys.push("c/3"); // snare on beat 3, first triplet
      
      return keys.map(key => {
        if (key === "x/5") return { key, line: 5, customNoteHead: true };
        if (key === "c/3") return { key, line: 3.5 };
        if (key === "f/2") return { key, line: 1.5 };
        return { key, line: 4 };
      });
    }
  },

  // Exercise 7: 16th Note Hi-Hat Pattern
  {
    id: 7,
    title: "Exercise 7: 16th Note Hi-Hat Pattern",
    description: "16th note hi-hat pattern with kick and snare accents - four notes per beat",
    timeSignature: 4,
    bars: 4,
    noteDuration: "16", // 16th notes
    pattern: (beat, position) => {
      const keys: string[] = [];
      
      // Hi-hat on all 16th note positions (every position in 16th note subdivision)
      // For 16th notes: 16 positions per bar (0-15), 4 per beat
      keys.push("x/5");
      
      // Kick on beat 1 (positions 0, 1, 2, 3) - accent on first 16th
      if (beat === 1 && position === 0) keys.push("f/2");
      
      // Snare on beats 2 and 4 (positions 4, 5, 6, 7 and 12, 13, 14, 15) - accent on first 16th
      if (beat === 2 && position === 4) keys.push("c/3");
      if (beat === 4 && position === 12) keys.push("c/3");
      
      return keys.map(key => {
        if (key === "x/5") return { key, line: 5, customNoteHead: true };
        if (key === "c/3") return { key, line: 3.5 };
        if (key === "f/2") return { key, line: 1.5 };
        return { key, line: 4 };
      });
    }
  },
];

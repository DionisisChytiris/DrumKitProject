export interface DrumPiece {
  id: string;
  name: string;
  type: 'tom' | 'cymbal' | 'snare' | 'kick' | 'hihat';
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  keyBinding?: string;
  audioUrl?: string;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  pattern: string[];
  bpm?: number;
}

export interface DrumHit {
  drumPieceId: string;
  timestamp: number;
}

export interface PatternStep {
  drumId: string;
  velocity: number;
  active: boolean;
}

export interface Pattern {
  id: string;
  name: string;
  steps: PatternStep[][];
  bpm: number;
  length: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DrumMixerSettings {
  volume: number;
  pan: number;
  reverb: number;
  compression: number;
  eq: {
    low: number;
    mid: number;
    high: number;
  };
}

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

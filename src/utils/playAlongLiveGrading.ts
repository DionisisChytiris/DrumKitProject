import type { PlaybackStep } from '@/utils/osmdPlaybackMap';
import { expectedStepAudioSeconds } from '@/utils/playAlongScoring';
import type { TimingGrade } from '@/utils/playAlongScoring';

export type LivePracticeGrade = TimingGrade;

export const KIT_PRACTICE_GRADE_COLORS: Record<LivePracticeGrade, string> = {
  'on-time': '#4CAF50',
  early: '#FF9800',
  late: '#FF9800',
  miss: '#F44336',
};

export interface LivePracticeGradingOptions {
  referenceBpm: number;
  offsetSeconds?: number;
  matchWindowMs?: number;
  onTimeWindowMs?: number;
}

const DEFAULT_MATCH_WINDOW_MS = 125;
const DEFAULT_ON_TIME_WINDOW_MS = 65;

function gradeFromDelta(deltaMs: number, onTimeWindowMs: number): LivePracticeGrade {
  if (Math.abs(deltaMs) <= onTimeWindowMs) return 'on-time';
  return deltaMs < 0 ? 'early' : 'late';
}

/** Tracks per-step timing grades while an exercise is playing. */
export class LivePracticeGrader {
  private readonly grades = new Map<number, LivePracticeGrade>();

  reset(): void {
    this.grades.clear();
  }

  getGrade(stepIndex: number): LivePracticeGrade | undefined {
    return this.grades.get(stepIndex);
  }

  isGraded(stepIndex: number): boolean {
    return this.grades.has(stepIndex);
  }

  getGradedStepIndices(): number[] {
    return [...this.grades.keys()].sort((a, b) => a - b);
  }

  syncFromStepGrades(stepGrades: Array<{ stepIndex: number; grade: LivePracticeGrade }>): void {
    this.grades.clear();
    for (const stepGrade of stepGrades) {
      this.grades.set(stepGrade.stepIndex, stepGrade.grade);
    }
  }

  /** Match a pad hit to the closest ungraded step within the timing window. */
  tryGradeHit(
    steps: PlaybackStep[],
    hitTimeSeconds: number,
    options: LivePracticeGradingOptions,
  ): number | null {
    const matchWindowSec = (options.matchWindowMs ?? DEFAULT_MATCH_WINDOW_MS) / 1000;
    const onTimeWindowMs = options.onTimeWindowMs ?? DEFAULT_ON_TIME_WINDOW_MS;
    const offsetSeconds = options.offsetSeconds ?? 0;

    let bestIndex = -1;
    let bestAbsDelta = Number.POSITIVE_INFINITY;
    let bestDeltaMs = 0;

    for (const step of steps) {
      if (this.grades.has(step.stepIndex)) continue;

      const expected = expectedStepAudioSeconds(step, options.referenceBpm, offsetSeconds);
      const deltaMs = (hitTimeSeconds - expected) * 1000;
      const absDelta = Math.abs(deltaMs);

      if (absDelta <= matchWindowSec * 1000 && absDelta < bestAbsDelta) {
        bestAbsDelta = absDelta;
        bestIndex = step.stepIndex;
        bestDeltaMs = deltaMs;
      }
    }

    if (bestIndex < 0) return null;

    this.grades.set(bestIndex, gradeFromDelta(bestDeltaMs, onTimeWindowMs));
    return bestIndex;
  }

  /** Mark steps as missed once playback has passed their match window. */
  finalizeElapsedSteps(
    steps: PlaybackStep[],
    audioTimeSeconds: number,
    options: LivePracticeGradingOptions,
  ): void {
    const matchWindowSec = (options.matchWindowMs ?? DEFAULT_MATCH_WINDOW_MS) / 1000;
    const offsetSeconds = options.offsetSeconds ?? 0;

    for (const step of steps) {
      if (this.grades.has(step.stepIndex)) continue;

      const expected = expectedStepAudioSeconds(step, options.referenceBpm, offsetSeconds);
      if (audioTimeSeconds > expected + matchWindowSec) {
        this.grades.set(step.stepIndex, 'miss');
      }
    }
  }
}

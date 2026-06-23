import type { PlaybackStep } from '@/utils/osmdPlaybackMap';
import { wholeNotesToSeconds } from '@/utils/osmdPlaybackMap';

export type TimingGrade = 'on-time' | 'early' | 'late' | 'miss';

export interface RecordedPlayAlongHit {
  /** Position on the backing-track timeline (`HTMLMediaElement.currentTime`). */
  audioTimeSeconds: number;
  note: number;
  velocity: number;
}

export interface PlayAlongStepGrade {
  stepIndex: number;
  measureNumber: number;
  beatInMeasure: number;
  expectedTimeSeconds: number;
  grade: TimingGrade;
  hitTimeSeconds?: number;
  deltaMs?: number;
}

export interface PlayAlongScoreResult {
  stepGrades: PlayAlongStepGrade[];
  onTime: number;
  early: number;
  late: number;
  missed: number;
  extraHits: number;
  totalSteps: number;
  /** Share of steps graded on-time (0–100). */
  accuracyPercent: number;
}

export interface ScorePlayAlongTimingOptions {
  /** Half-width of the match window in milliseconds (default 125). */
  matchWindowMs?: number;
  /** Hits within this many ms of expected count as on-time (default 65). */
  onTimeWindowMs?: number;
  /**
   * Estimate a constant timing shift from the hit cloud (handles output latency and
   * small score/audio offsets). Applied on top of `offsetSeconds`.
   */
  autoAlignOffset?: boolean;
}

export function expectedStepAudioSeconds(
  step: PlaybackStep,
  referenceBpm: number,
  offsetSeconds = 0,
): number {
  return wholeNotesToSeconds(step.timestampWholeNotes, referenceBpm) + offsetSeconds;
}

function gradeDelta(deltaMs: number, onTimeWindowMs: number): TimingGrade {
  if (Math.abs(deltaMs) <= onTimeWindowMs) return 'on-time';
  return deltaMs < 0 ? 'early' : 'late';
}

/**
 * Median (hit − expected) for nearest steps — corrects consistent late/early bias.
 */
export function estimateMedianHitOffsetSeconds(
  steps: PlaybackStep[],
  hits: RecordedPlayAlongHit[],
  referenceBpm: number,
  baseOffsetSeconds = 0,
): number {
  if (hits.length === 0 || steps.length === 0) return 0;

  const deltas: number[] = [];
  for (const hit of hits) {
    let bestAbs = Number.POSITIVE_INFINITY;
    let bestDelta = 0;

    for (const step of steps) {
      const expected = expectedStepAudioSeconds(step, referenceBpm, baseOffsetSeconds);
      const delta = hit.audioTimeSeconds - expected;
      if (Math.abs(delta) < bestAbs) {
        bestAbs = Math.abs(delta);
        bestDelta = delta;
      }
    }

    if (bestAbs < 2.5) {
      deltas.push(bestDelta);
    }
  }

  if (deltas.length === 0) return 0;

  deltas.sort((a, b) => a - b);
  const mid = Math.floor(deltas.length / 2);
  return deltas.length % 2 === 0 ? (deltas[mid - 1] + deltas[mid]) / 2 : deltas[mid];
}

/**
 * Match recorded pad hits to score steps on the backing-track timeline.
 * One hit can satisfy at most one step; closest unused hit within the window wins.
 */
export function scorePlayAlongTiming(
  steps: PlaybackStep[],
  hits: RecordedPlayAlongHit[],
  referenceBpm: number,
  offsetSeconds = 0,
  options: ScorePlayAlongTimingOptions = {},
): PlayAlongScoreResult {
  const matchWindowMs = options.matchWindowMs ?? 125;
  const onTimeWindowMs = options.onTimeWindowMs ?? 65;
  const alignedOffset =
    offsetSeconds +
    (options.autoAlignOffset
      ? estimateMedianHitOffsetSeconds(steps, hits, referenceBpm, offsetSeconds)
      : 0);
  const matchWindowSec = matchWindowMs / 1000;

  const usedHitIndices = new Set<number>();
  const stepGrades: PlayAlongStepGrade[] = [];

  let onTime = 0;
  let early = 0;
  let late = 0;
  let missed = 0;

  for (const step of steps) {
    const expectedTimeSeconds = expectedStepAudioSeconds(step, referenceBpm, alignedOffset);

    let bestHitIndex = -1;
    let bestAbsDelta = Number.POSITIVE_INFINITY;

    for (let i = 0; i < hits.length; i++) {
      if (usedHitIndices.has(i)) continue;
      const deltaSec = hits[i].audioTimeSeconds - expectedTimeSeconds;
      const absDelta = Math.abs(deltaSec);
      if (absDelta <= matchWindowSec && absDelta < bestAbsDelta) {
        bestAbsDelta = absDelta;
        bestHitIndex = i;
      }
    }

    if (bestHitIndex < 0) {
      missed += 1;
      stepGrades.push({
        stepIndex: step.stepIndex,
        measureNumber: step.measureNumber,
        beatInMeasure: step.beatInMeasure,
        expectedTimeSeconds,
        grade: 'miss',
      });
      continue;
    }

    usedHitIndices.add(bestHitIndex);
    const hit = hits[bestHitIndex];
    const deltaMs = (hit.audioTimeSeconds - expectedTimeSeconds) * 1000;
    const grade = gradeDelta(deltaMs, onTimeWindowMs);

    if (grade === 'on-time') onTime += 1;
    else if (grade === 'early') early += 1;
    else late += 1;

    stepGrades.push({
      stepIndex: step.stepIndex,
      measureNumber: step.measureNumber,
      beatInMeasure: step.beatInMeasure,
      expectedTimeSeconds,
      grade,
      hitTimeSeconds: hit.audioTimeSeconds,
      deltaMs: Math.round(deltaMs),
    });
  }

  const totalSteps = steps.length;
  const extraHits = hits.length - usedHitIndices.size;
  const accuracyPercent =
    totalSteps > 0 ? Math.round((onTime / totalSteps) * 100) : 0;

  return {
    stepGrades,
    onTime,
    early,
    late,
    missed,
    extraHits,
    totalSteps,
    accuracyPercent,
  };
}

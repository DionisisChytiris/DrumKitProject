import { GraphicalNote } from 'opensheetmusicdisplay';
import type { Note } from 'opensheetmusicdisplay';
import type { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

export interface PlaybackStep {
  stepIndex: number;
  timestampWholeNotes: number;
  timestampSeconds: number;
  measureNumber: number;
  beatInMeasure: number;
  beatsPerMeasure: number;
  bpm: number;
  sourceNotes: Note[];
}

export const OSMD_NOTE_COLOR_ON_DARK = '#b8c4d4';
export const OSMD_NOTE_COLOR_ON_LIGHT = '#3d4451';
export const OSMD_NOTE_COLOR_ACTIVE = '#FF9800';

export type ScoreThemeMode = 'dark' | 'light';

export interface ScoreThemeColors {
  pageBackground: string;
  noteColor: string;
  activeNoteColor: string;
}

/** Soft studio dark — charcoal page, muted blue-gray notation */
export const SCORE_THEME_DARK: ScoreThemeColors = {
  pageBackground: '#252932',
  noteColor: OSMD_NOTE_COLOR_ON_DARK,
  activeNoteColor: '#FFAB40',
};

/** Warm paper light — cream page, soft ink notation */
export const SCORE_THEME_LIGHT: ScoreThemeColors = {
  pageBackground: '#f6f4f0',
  noteColor: OSMD_NOTE_COLOR_ON_LIGHT,
  activeNoteColor: '#E65100',
};

export function getScoreThemeColors(mode: ScoreThemeMode): ScoreThemeColors {
  return mode === 'dark' ? SCORE_THEME_DARK : SCORE_THEME_LIGHT;
}

/** Custom palette — avoids OSMD's harsh pure black / white darkMode preset. */
export function applyOsmdScoreTheme(osmd: OpenSheetMusicDisplay, mode: ScoreThemeMode): void {
  const theme = getScoreThemeColors(mode);

  osmd.setOptions({
    darkMode: false,
    defaultColorMusic: theme.noteColor,
    defaultColorLabel: theme.noteColor,
    defaultColorNotehead: theme.noteColor,
    defaultColorStem: theme.noteColor,
    defaultColorRest: theme.noteColor,
  });

  osmd.EngravingRules.PageBackgroundColor = theme.pageBackground;
  osmd.EngravingRules.DefaultColorMusic = theme.noteColor;

  if (typeof osmd.EngravingRules.applyDefaultColorMusic === 'function') {
    osmd.EngravingRules.applyDefaultColorMusic(theme.noteColor);
  }
}

const highlightColorOptions = {
  applyToStem: true,
  applyToBeams: true,
  applyToNoteheads: true,
};

/** Convert OSMD whole-note timestamps to seconds at a given BPM (quarter-note based). */
export function wholeNotesToSeconds(wholeNotes: number, bpm: number): number {
  if (bpm <= 0) return 0;
  return wholeNotes * (240 / bpm);
}

export function computeBeatInMeasure(relativeWholeNotes: number, beatsPerMeasure: number): number {
  if (beatsPerMeasure <= 0) return 1;
  const beatIndex = Math.floor(relativeWholeNotes * beatsPerMeasure + 1e-6);
  return Math.min(beatIndex + 1, beatsPerMeasure);
}

function collectAudibleNotesFromContainer(container: {
  StaffEntries?: Array<{
    VoiceEntries?: Array<{ Notes?: Note[] }>;
  } | undefined>;
}): Note[] {
  const notes: Note[] = [];

  for (const staffEntry of container.StaffEntries ?? []) {
    if (!staffEntry) continue;

    for (const voiceEntry of staffEntry.VoiceEntries ?? []) {
      for (const note of voiceEntry.Notes ?? []) {
        if (!note.isRest()) {
          notes.push(note);
        }
      }
    }
  }

  return notes;
}

/** Build beat steps from parsed MusicXML — avoids OSMD cursor StaffEntries crashes on drum scores. */
export function buildPlaybackMap(osmd: OpenSheetMusicDisplay): PlaybackStep[] {
  const sheet = osmd.Sheet;
  const defaultBpm = sheet.DefaultStartTempoInBpm || 120;
  const rawSteps: PlaybackStep[] = [];
  const seenTimestamps = new Set<string>();

  for (const measure of sheet.SourceMeasures) {
    const measureNumber = measure.MeasureNumber ?? measure.MeasureNumberXML ?? 1;
    const beatsPerMeasure = measure.ActiveTimeSignature?.Numerator ?? 4;
    const bpm = measure.TempoInBPM || defaultBpm;

    for (const container of measure.VerticalSourceStaffEntryContainers) {
      const sourceNotes = collectAudibleNotesFromContainer(container);
      if (sourceNotes.length === 0) continue;

      const absoluteTimestamp = container.getAbsoluteTimestamp()?.RealValue ?? 0;
      const timestampKey = absoluteTimestamp.toFixed(8);
      if (seenTimestamps.has(timestampKey)) continue;
      seenTimestamps.add(timestampKey);

      const relativeWholeNotes = container.Timestamp?.RealValue ?? 0;

      rawSteps.push({
        stepIndex: 0,
        timestampWholeNotes: absoluteTimestamp,
        timestampSeconds: wholeNotesToSeconds(absoluteTimestamp, bpm),
        measureNumber,
        beatInMeasure: computeBeatInMeasure(relativeWholeNotes, beatsPerMeasure),
        beatsPerMeasure,
        bpm,
        sourceNotes,
      });
    }
  }

  rawSteps.sort((a, b) => a.timestampWholeNotes - b.timestampWholeNotes);
  return rawSteps.map((step, index) => ({ ...step, stepIndex: index }));
}

/** Beat-perfect lookup: map audio file time to steps using the score/backing reference BPM. */
export function findPlaybackStepIndex(
  steps: PlaybackStep[],
  audioTimeSeconds: number,
  /** BPM the score and backing track were authored at (not the live playbackRate tempo). */
  referenceBpm: number,
  offsetSeconds = 0,
): number {
  if (steps.length === 0) return 0;

  const time = Math.max(0, audioTimeSeconds - offsetSeconds);
  let low = 0;
  let high = steps.length - 1;
  let result = 0;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const stepSeconds = wholeNotesToSeconds(steps[mid].timestampWholeNotes, referenceBpm);
    if (stepSeconds <= time) {
      result = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result;
}

export function clampPlaybackBpm(bpm: number): number {
  return Math.min(240, Math.max(40, Math.round(bpm)));
}

export function playbackRateForTempo(manualBpm: number, scoreBpm: number): number {
  if (scoreBpm <= 0) return 1;
  return Math.min(2, Math.max(0.25, manualBpm / scoreBpm));
}

export function resolveGraphicalNotes(
  osmd: OpenSheetMusicDisplay,
  sourceNotes: Note[],
): GraphicalNote[] {
  const rules = osmd.EngravingRules;
  const graphicalNotes: GraphicalNote[] = [];

  for (const note of sourceNotes) {
    try {
      const graphicalNote = GraphicalNote.FromNote(note, rules);
      if (graphicalNote) {
        graphicalNotes.push(graphicalNote);
      }
    } catch {
      // Some notes may not have graphical counterparts after render.
    }
  }

  return graphicalNotes;
}

export function applyStepHighlight(
  osmd: OpenSheetMusicDisplay,
  step: PlaybackStep,
  previousNotes: GraphicalNote[],
  defaultNoteColor: string = OSMD_NOTE_COLOR_ON_LIGHT,
  activeNoteColor: string = OSMD_NOTE_COLOR_ACTIVE,
): GraphicalNote[] {
  clearNoteHighlights(previousNotes, defaultNoteColor);

  const activeNotes = resolveGraphicalNotes(osmd, step.sourceNotes);
  for (const note of activeNotes) {
    note.setColor(activeNoteColor, highlightColorOptions);
  }

  return activeNotes;
}

/** Set all graphical notes for a step to a single color (e.g. live kit-practice grades). */
export function applyStepColor(
  osmd: OpenSheetMusicDisplay,
  step: PlaybackStep,
  color: string,
): GraphicalNote[] {
  const graphicalNotes = resolveGraphicalNotes(osmd, step.sourceNotes);
  for (const note of graphicalNotes) {
    note.setColor(color, highlightColorOptions);
  }
  return graphicalNotes;
}

export function clearNoteHighlights(
  notes: GraphicalNote[],
  defaultNoteColor: string = OSMD_NOTE_COLOR_ON_LIGHT,
): void {
  for (const note of notes) {
    try {
      note.setColor(defaultNoteColor, highlightColorOptions);
    } catch {
      // Ignore stale graphical notes after re-render.
    }
  }
}

export function scrollToStepNotes(
  osmd: OpenSheetMusicDisplay,
  step: PlaybackStep,
  scrollContainer: HTMLElement,
): void {
  const graphicalNotes = resolveGraphicalNotes(osmd, step.sourceNotes);
  if (graphicalNotes.length === 0) return;

  const padding = 56;
  const zoom = osmd.Zoom || 1;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;

  for (const note of graphicalNotes) {
    const position = note.PositionAndShape?.AbsolutePosition;
    if (!position) continue;
    minX = Math.min(minX, position.x);
    minY = Math.min(minY, position.y);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return;

  const targetLeft = Math.max(0, minX * zoom - padding);
  const targetTop = Math.max(0, minY * zoom - padding);

  if (Math.abs(scrollContainer.scrollLeft - targetLeft) > 4) {
    scrollContainer.scrollLeft = targetLeft;
  }
  if (Math.abs(scrollContainer.scrollTop - targetTop) > 4) {
    scrollContainer.scrollTop = targetTop;
  }
}

export function countMeasures(steps: PlaybackStep[]): number {
  if (steps.length === 0) return 0;
  return steps.reduce((max, step) => Math.max(max, step.measureNumber), 0);
}

/** Media time (seconds) when the last scored note finishes — one beat after the final step. */
export function getExerciseEndMediaSeconds(
  steps: PlaybackStep[],
  referenceBpm: number,
  offsetSeconds = 0,
): number {
  if (steps.length === 0) return 0;

  const last = steps[steps.length - 1];
  const lastNoteTime =
    wholeNotesToSeconds(last.timestampWholeNotes, referenceBpm) + offsetSeconds;
  const beatDuration = wholeNotesToSeconds(0.25, referenceBpm);
  return lastNoteTime + beatDuration;
}

/** Scale OSMD so the full rendered score fits inside the viewport element. */
export function fitOsmdToContainer(
  osmd: OpenSheetMusicDisplay,
  viewportEl: HTMLElement,
  paddingPx = 12,
): number {
  osmd.Zoom = 1;
  osmd.render();

  const svg = viewportEl.querySelector('svg');
  if (!svg) return 1;

  const scoreWidth = svg.getBoundingClientRect().width;
  const scoreHeight = svg.getBoundingClientRect().height;
  if (scoreWidth <= 0 || scoreHeight <= 0) return 1;

  const availableWidth = Math.max(viewportEl.clientWidth - paddingPx * 2, 1);
  const availableHeight = Math.max(viewportEl.clientHeight - paddingPx * 2, 1);
  const scale = Math.min(availableWidth / scoreWidth, availableHeight / scoreHeight);
  const nextZoom = Math.max(0.12, Math.min(2, scale));

  osmd.Zoom = nextZoom;
  osmd.render();
  return nextZoom;
}

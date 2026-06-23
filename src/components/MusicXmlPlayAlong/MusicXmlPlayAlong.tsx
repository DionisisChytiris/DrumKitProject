import { useCallback, useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import type { GraphicalNote } from 'opensheetmusicdisplay';
import type { PlayAlongExerciseDefinition } from '@/types/playAlongTypes';
import type { MidiNoteEvent } from '@/types/midiTypes';
import { useMetronomeClicks } from '@/hooks/useMetronomeClicks';
import { useMidiInput } from '@/hooks/useMidiInput';
import { PLAY_ALONG_COUNT_IN_BEATS, usePlayAlongCountIn } from '@/hooks/usePlayAlongCountIn';
import { useAppSelector } from '@/store/hooks';
import { mapMidiNoteToDrumId } from '@/utils/midi/midiNoteToDrumId';
import {
  scorePlayAlongTiming,
  estimateMedianHitOffsetSeconds,
  type PlayAlongScoreResult,
  type RecordedPlayAlongHit,
} from '@/utils/playAlongScoring';
import {
  KIT_PRACTICE_GRADE_COLORS,
  LivePracticeGrader,
} from '@/utils/playAlongLiveGrading';
import {
  applyOsmdScoreTheme,
  applyStepColor,
  applyStepHighlight,
  buildPlaybackMap,
  clampPlaybackBpm,
  clearNoteHighlights,
  findPlaybackStepIndex,
  fitOsmdToContainer,
  getExerciseEndMediaSeconds,
  getScoreThemeColors,
  playbackRateForTempo,
  type PlaybackStep,
  type ScoreThemeMode,
} from '@/utils/osmdPlaybackMap';
import {
  attachBackingTrackGain,
  backingPercentToGain,
  measureBackingTrackPeak,
  resumeBackingTrackContext,
  setBackingTrackGain,
} from '@/utils/backingTrackAudio';
import { PlayAlongKnob } from './PlayAlongKnob';
import './PlayAlongKnob.css';
import './MusicXmlPlayAlong.css';

const SCORE_THEME_STORAGE_KEY = 'drumkit.playalongScoreTheme';
const METRONOME_STORAGE_KEY = 'drumkit.playalongMetronome';
const BACKING_VOLUME_STORAGE_KEY = 'drumkit.playalongBackingVolume';
const MIN_PLAYBACK_BPM = 40;
const MAX_PLAYBACK_BPM = 240;

const DEFAULT_BACKING_VOLUME = 50;

function readStoredBackingVolume(): number {
  if (typeof window === 'undefined') return DEFAULT_BACKING_VOLUME;
  const stored = localStorage.getItem(BACKING_VOLUME_STORAGE_KEY);
  if (stored === null) return DEFAULT_BACKING_VOLUME;
  const parsed = Number.parseInt(stored, 10);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : DEFAULT_BACKING_VOLUME;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function ScoreThemeToggleIcon({ targetTheme }: { targetTheme: ScoreThemeMode }) {
  if (targetTheme === 'light') {
    return (
      <svg
        className="musicxml-playalong-toolbar-icon"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path
          d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      className="musicxml-playalong-toolbar-icon"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MetronomeToggleIcon({ enabled }: { enabled: boolean }) {
  return (
    <svg
      className="musicxml-playalong-toolbar-icon"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 2v4" strokeLinecap="round" />
      <path
        d="M8 20h8M7 20l5-14 5 14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {enabled && <circle cx="12" cy="9" r="1.5" fill="currentColor" stroke="none" />}
    </svg>
  );
}

function FullscreenToggleIcon({ isFullscreen }: { isFullscreen: boolean }) {
  if (isFullscreen) {
    return (
      <svg
        className="musicxml-playalong-toolbar-icon"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path
          d="M8 3v3H5M16 3v3h3M8 21v-3H5M16 21v-3h3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      className="musicxml-playalong-toolbar-icon"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        d="M8 3H5v3M16 3h3V5M8 21H5v-3M16 21v-3h3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface MusicXmlPlayAlongProps {
  exercise: PlayAlongExerciseDefinition;
  /** page = full viewport panel (About-style); embedded = inside Exercises scroll area */
  layout?: 'page' | 'embedded';
  /** Starting score theme before the user toggles (localStorage wins when set) */
  defaultScoreTheme?: ScoreThemeMode;
}

export const MusicXmlPlayAlong: React.FC<MusicXmlPlayAlongProps> = ({
  exercise,
  layout = 'embedded',
  defaultScoreTheme = 'dark',
}) => {
  const playbackOffsetSeconds = exercise.playbackOffsetSeconds ?? 0;
  const isKitPractice = exercise.kitPractice === true;
  const kitPracticeDrumId = exercise.kitPracticeDrumId ?? 'snare';
  const {
    clickSound,
    volume,
    accentPattern,
    timeSignatureDenom,
  } = useAppSelector((state) => state.metronome);

  const [scoreTheme, setScoreTheme] = useState<ScoreThemeMode>(() => {
    if (typeof window === 'undefined') return defaultScoreTheme;
    const stored = localStorage.getItem(SCORE_THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return defaultScoreTheme;
  });

  const themeColors = getScoreThemeColors(scoreTheme);
  const { noteColor: defaultNoteColor, activeNoteColor: activeNoteColor } = themeColors;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const backingGainRef = useRef<GainNode | null>(null);
  const backingAudioContextRef = useRef<AudioContext | null>(null);
  const sourcePeakRef = useRef(0.1);
  const panelRef = useRef<HTMLElement | null>(null);
  const scoreViewportRef = useRef<HTMLDivElement | null>(null);
  const scoreContainerRef = useRef<HTMLDivElement | null>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const playbackStepsRef = useRef<PlaybackStep[]>([]);
  const currentStepRef = useRef(-1);
  const highlightedNotesRef = useRef<GraphicalNote[]>([]);
  const recordedHitsRef = useRef<RecordedPlayAlongHit[]>([]);
  const isRecordingHitsRef = useRef(false);
  const isFinishingPlaybackRef = useRef(false);
  const handleMidiNoteRef = useRef<(event: MidiNoteEvent) => void>(() => {});
  const liveGraderRef = useRef(new LivePracticeGrader());
  const timingAlignOffsetRef = useRef(0);
  const persistedStepGradesRef = useRef<PlayAlongScoreResult['stepGrades'] | null>(null);

  const KIT_PRACTICE_MATCH_WINDOW_MS = 125;
  const KIT_PRACTICE_ON_TIME_WINDOW_MS = 65;

  const [practiceScore, setPracticeScore] = useState<PlayAlongScoreResult | null>(null);

  const [scoreStatus, setScoreStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [scoreError, setScoreError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scoreBpm, setScoreBpm] = useState(exercise.defaultBpm ?? 120);
  const [manualBpm, setManualBpm] = useState(exercise.defaultBpm ?? 120);
  const [tempoSliderBpm, setTempoSliderBpm] = useState(exercise.defaultBpm ?? 120);
  const [beatProgress, setBeatProgress] = useState(0);
  const manualBpmRef = useRef(manualBpm);
  const scoreBpmRef = useRef(scoreBpm);
  const tempoCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackPhaseAnchorRef = useRef<number | null>(null);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [metronomeEnabled, setMetronomeEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(METRONOME_STORAGE_KEY) === 'true';
  });
  const [backingVolumePercent, setBackingVolumePercent] = useState(readStoredBackingVolume);
  const [volumeSliderPercent, setVolumeSliderPercent] = useState(readStoredBackingVolume);

  manualBpmRef.current = manualBpm;
  scoreBpmRef.current = scoreBpm;

  const {
    supported: midiSupported,
    status: midiStatus,
    selectedInputName,
  } = useMidiInput({
    autoConnect: isKitPractice,
    trackLastNote: false,
    onNoteOn: (event) => handleMidiNoteRef.current(event),
  });

  const isMidiConnected = midiSupported && midiStatus === 'connected';

  const getLiveGradingOptions = useCallback(
    () => ({
      referenceBpm: scoreBpmRef.current,
      offsetSeconds: playbackOffsetSeconds + timingAlignOffsetRef.current,
      matchWindowMs: KIT_PRACTICE_MATCH_WINDOW_MS,
      onTimeWindowMs: KIT_PRACTICE_ON_TIME_WINDOW_MS,
    }),
    [playbackOffsetSeconds],
  );

  const applyPracticeScoreColors = useCallback(
    (stepGrades: PlayAlongScoreResult['stepGrades']) => {
      const osmd = osmdRef.current;
      const steps = playbackStepsRef.current;
      if (!osmd || !isKitPractice) return;

      liveGraderRef.current.syncFromStepGrades(stepGrades);
      for (const stepGrade of stepGrades) {
        const step = steps[stepGrade.stepIndex];
        if (!step) continue;
        applyStepColor(osmd, step, KIT_PRACTICE_GRADE_COLORS[stepGrade.grade]);
      }
    },
    [isKitPractice],
  );

  const reapplyGradedStepColors = useCallback(() => {
    const osmd = osmdRef.current;
    const steps = playbackStepsRef.current;
    if (!osmd || !isKitPractice) return;

    for (const stepIndex of liveGraderRef.current.getGradedStepIndices()) {
      const step = steps[stepIndex];
      const grade = liveGraderRef.current.getGrade(stepIndex);
      if (!step || !grade) continue;
      applyStepColor(osmd, step, KIT_PRACTICE_GRADE_COLORS[grade]);
    }
  }, [isKitPractice]);

  const reapplyPersistedPracticeColors = useCallback(() => {
    if (!isKitPractice) return;

    const persisted = persistedStepGradesRef.current;
    if (persisted && persisted.length > 0) {
      applyPracticeScoreColors(persisted);
      return;
    }

    reapplyGradedStepColors();
  }, [applyPracticeScoreColors, isKitPractice, reapplyGradedStepColors]);

  const resetKitPracticeGrades = useCallback(() => {
    liveGraderRef.current.reset();
    timingAlignOffsetRef.current = 0;
    persistedStepGradesRef.current = null;
    const osmd = osmdRef.current;
    const steps = playbackStepsRef.current;
    if (!osmd) return;

    for (const step of steps) {
      applyStepColor(osmd, step, defaultNoteColor);
    }
  }, [defaultNoteColor]);

  const reconcileLiveGrades = useCallback(
    (audioTimeSeconds: number) => {
      if (!isKitPractice) return;

      const steps = playbackStepsRef.current;
      const hits = recordedHitsRef.current;
      if (steps.length === 0) return;

      timingAlignOffsetRef.current = estimateMedianHitOffsetSeconds(
        steps,
        hits,
        scoreBpmRef.current,
        playbackOffsetSeconds,
      );

      const options = getLiveGradingOptions();
      liveGraderRef.current.reset();
      const sortedHits = [...hits].sort((a, b) => a.audioTimeSeconds - b.audioTimeSeconds);
      for (const hit of sortedHits) {
        liveGraderRef.current.tryGradeHit(steps, hit.audioTimeSeconds, options);
      }
      if (isRecordingHitsRef.current) {
        liveGraderRef.current.finalizeElapsedSteps(steps, audioTimeSeconds, options);
      }
      reapplyGradedStepColors();
    },
    [getLiveGradingOptions, isKitPractice, playbackOffsetSeconds, reapplyGradedStepColors],
  );

  const gradeLiveKitHit = useCallback(
    (hitTimeSeconds: number) => {
      if (!isKitPractice || !isRecordingHitsRef.current) return;
      reconcileLiveGrades(hitTimeSeconds);
    },
    [isKitPractice, reconcileLiveGrades],
  );

  const finalizePracticeScore = useCallback(() => {
    if (!isKitPractice) return;

    isRecordingHitsRef.current = false;
    const steps = playbackStepsRef.current;
    if (steps.length === 0) return;

    const result = scorePlayAlongTiming(
      steps,
      recordedHitsRef.current,
      scoreBpmRef.current,
      playbackOffsetSeconds,
      {
        autoAlignOffset: true,
        matchWindowMs: KIT_PRACTICE_MATCH_WINDOW_MS,
        onTimeWindowMs: KIT_PRACTICE_ON_TIME_WINDOW_MS,
      },
    );
    timingAlignOffsetRef.current = estimateMedianHitOffsetSeconds(
      steps,
      recordedHitsRef.current,
      scoreBpmRef.current,
      playbackOffsetSeconds,
    );
    persistedStepGradesRef.current = result.stepGrades;
    applyPracticeScoreColors(result.stepGrades);
    setPracticeScore(result);
    return result;
  }, [applyPracticeScoreColors, isKitPractice, playbackOffsetSeconds]);

  useEffect(() => {
    handleMidiNoteRef.current = (event: MidiNoteEvent) => {
      if (!isKitPractice || !isRecordingHitsRef.current) return;

      const drumId = mapMidiNoteToDrumId(event.note);
      if (drumId !== kitPracticeDrumId) return;

      const audio = audioRef.current;
      if (!audio || audio.ended) return;

      recordedHitsRef.current.push({
        audioTimeSeconds: audio.currentTime,
        note: event.note,
        velocity: event.velocity,
      });
      gradeLiveKitHit(audio.currentTime);
    };
  }, [gradeLiveKitHit, isKitPractice, kitPracticeDrumId]);

  const resolveBackingGain = useCallback((percent: number) => {
    return backingPercentToGain(percent, sourcePeakRef.current);
  }, []);

  const applyVolumeGain = useCallback(
    (percent: number) => {
      setBackingTrackGain(
        audioRef.current,
        backingGainRef.current,
        resolveBackingGain(percent),
        backingAudioContextRef.current,
      );
    },
    [resolveBackingGain],
  );

  const ensureBackingAudioGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return false;

    const graph = attachBackingTrackGain(audio, resolveBackingGain(backingVolumePercent));
    if (graph) {
      backingGainRef.current = graph.gain;
      backingAudioContextRef.current = graph.context;
      return true;
    }
    return false;
  }, [backingVolumePercent, resolveBackingGain]);

  const getPlayAlongAudioContext = useCallback(
    () => backingAudioContextRef.current,
    [],
  );

  const getMetronomeMediaTime = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.paused || audio.ended) return null;
    return audio.currentTime;
  }, []);

  const getPlaybackRate = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.playbackRate > 0) {
      return audio.playbackRate;
    }
    return playbackRateForTempo(manualBpmRef.current, scoreBpmRef.current);
  }, []);

  const {
    isCountingIn,
    countInBeat,
    startCountIn,
    cancelCountIn,
  } = usePlayAlongCountIn({
    bpm: manualBpm,
    volume,
    clickSound,
    accentPattern,
    getAudioContext: getPlayAlongAudioContext,
  });

  const isTransportActive = isPlaying || isCountingIn;

  useMetronomeClicks({
    bpm: manualBpm,
    scoreBpm,
    enabled: metronomeEnabled,
    isRunning: isPlaying && !isCountingIn,
    timeSignature: beatsPerMeasure,
    timeSignatureDenom,
    subdivision: 'quarters',
    volume,
    clickSound,
    accentPattern,
    playbackOffsetSeconds,
    getAudioContext: getPlayAlongAudioContext,
    getMediaTime: getMetronomeMediaTime,
    getPlaybackRate,
    phaseAnchorRef: playbackPhaseAnchorRef,
  });

  const syncHighlightAtTime = useCallback(
    (audioTime: number) => {
      const osmd = osmdRef.current;
      const steps = playbackStepsRef.current;
      const referenceBpm = scoreBpmRef.current;
      if (!osmd || steps.length === 0 || referenceBpm <= 0) return;

      if (isKitPractice && isRecordingHitsRef.current) {
        liveGraderRef.current.finalizeElapsedSteps(steps, audioTime, getLiveGradingOptions());
      }

      const stepIndex = findPlaybackStepIndex(
        steps,
        audioTime,
        referenceBpm,
        playbackOffsetSeconds,
      );
      const step = steps[stepIndex];
      if (!step) return;

      currentStepRef.current = stepIndex;

      if (isKitPractice && isRecordingHitsRef.current) {
        if (!liveGraderRef.current.isGraded(stepIndex)) {
          highlightedNotesRef.current = applyStepHighlight(
            osmd,
            step,
            highlightedNotesRef.current,
            defaultNoteColor,
            activeNoteColor,
          );
        } else {
          clearNoteHighlights(highlightedNotesRef.current, defaultNoteColor);
          highlightedNotesRef.current = [];
        }
        reapplyGradedStepColors();
      } else if (isKitPractice && liveGraderRef.current.getGradedStepIndices().length > 0) {
        reapplyGradedStepColors();
      } else {
        highlightedNotesRef.current = applyStepHighlight(
          osmd,
          step,
          highlightedNotesRef.current,
          defaultNoteColor,
          activeNoteColor,
        );
      }

      setBeatProgress(Math.round((stepIndex / Math.max(steps.length - 1, 1)) * 100));
    },
    [
      activeNoteColor,
      defaultNoteColor,
      getLiveGradingOptions,
      isKitPractice,
      playbackOffsetSeconds,
      reapplyGradedStepColors,
    ],
  );

  const fitScoreToViewport = useCallback(() => {
    const osmd = osmdRef.current;
    const viewport = scoreViewportRef.current;
    if (!osmd || !viewport || scoreStatus !== 'ready') return;

    fitOsmdToContainer(osmd, viewport);
    currentStepRef.current = -1;

    const audio = audioRef.current;
    if (audio && !audio.paused) {
      syncHighlightAtTime(audio.currentTime);
    } else {
      reapplyPersistedPracticeColors();
    }
  }, [reapplyPersistedPracticeColors, scoreStatus, syncHighlightAtTime]);

  const resetPlaybackVisuals = useCallback(() => {
    clearNoteHighlights(highlightedNotesRef.current, defaultNoteColor);
    highlightedNotesRef.current = [];
    currentStepRef.current = -1;
    setBeatProgress(0);
    reapplyPersistedPracticeColors();
  }, [defaultNoteColor, reapplyPersistedPracticeColors]);

  const finishPlayback = useCallback(
    (reason: 'manual' | 'complete' = 'manual') => {
      if (isFinishingPlaybackRef.current) return;
      isFinishingPlaybackRef.current = true;

      try {
        const wasRecording = isRecordingHitsRef.current;
        cancelCountIn();
        playbackPhaseAnchorRef.current = null;

        if (isKitPractice && wasRecording) {
          finalizePracticeScore();
        }

        const audio = audioRef.current;
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }

        setIsPlaying(false);
        setTime(0);
        isRecordingHitsRef.current = false;
        resetPlaybackVisuals();
        requestAnimationFrame(() => {
          reapplyPersistedPracticeColors();
        });

        if (reason === 'complete') {
          setMetronomeEnabled(false);
          localStorage.setItem(METRONOME_STORAGE_KEY, 'false');
        }
      } finally {
        isFinishingPlaybackRef.current = false;
      }
    },
    [cancelCountIn, finalizePracticeScore, isKitPractice, reapplyPersistedPracticeColors, resetPlaybackVisuals],
  );

  const tryAutoFinishAtExerciseEnd = useCallback(
    (audioTime: number) => {
      const audio = audioRef.current;
      if (!audio || audio.paused || audio.ended) return;

      const steps = playbackStepsRef.current;
      if (steps.length === 0) return;

      const endTime = getExerciseEndMediaSeconds(
        steps,
        scoreBpmRef.current,
        playbackOffsetSeconds,
      );
      if (audioTime >= endTime - 0.001) {
        finishPlayback('complete');
      }
    },
    [finishPlayback, playbackOffsetSeconds],
  );

  useEffect(() => {
    const container = scoreContainerRef.current;
    if (!container) return;

    let cancelled = false;
    setScoreStatus('loading');
    setScoreError('');
    setPracticeScore(null);
    liveGraderRef.current.reset();
    timingAlignOffsetRef.current = 0;
    persistedStepGradesRef.current = null;

    const osmd = new OpenSheetMusicDisplay(container, {
      autoResize: false,
      drawTitle: false,
      drawPartNames: false,
      drawMeasureNumbers: true,
      backend: 'svg',
      disableCursor: true,
      darkMode: false,
    });

    osmdRef.current = osmd;

    osmd
      .load(exercise.scoreUrl)
      .then(() => {
        if (cancelled) return;
        applyOsmdScoreTheme(osmd, scoreTheme);
        osmd.render();

        const steps = buildPlaybackMap(osmd);
        if (steps.length === 0) {
          throw new Error('No playable notes found in the score.');
        }

        playbackStepsRef.current = steps;
        setBeatsPerMeasure(steps[0]?.beatsPerMeasure ?? 4);

        const sheet = osmd.Sheet;
        const hasScoreTempo =
          (sheet.DefaultStartTempoInBpm ?? 0) > 0 ||
          sheet.SourceMeasures.some((measure) => (measure.TempoInBPM ?? 0) > 0);
        const mapBpm = steps[0]?.bpm ?? exercise.defaultBpm ?? 120;
        const loadedBpm = clampPlaybackBpm(
          hasScoreTempo ? mapBpm : (exercise.defaultBpm ?? mapBpm),
        );
        setScoreBpm(loadedBpm);
        setManualBpm(loadedBpm);
        setTempoSliderBpm(loadedBpm);
        setScoreStatus('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setScoreStatus('error');
        setScoreError(error instanceof Error ? error.message : 'Could not load the score file.');
      });

    return () => {
      cancelled = true;
      clearNoteHighlights(highlightedNotesRef.current, defaultNoteColor);
      osmdRef.current = null;
      playbackStepsRef.current = [];
      container.innerHTML = '';
    };
    // scoreTheme is applied in a separate effect after load
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when exercise assets change
  }, [exercise.id, exercise.scoreUrl, exercise.defaultBpm]);

  useEffect(() => {
    const osmd = osmdRef.current;
    const viewport = scoreViewportRef.current;
    if (!osmd || !viewport || scoreStatus !== 'ready') return;

    applyOsmdScoreTheme(osmd, scoreTheme);
    fitOsmdToContainer(osmd, viewport);

    clearNoteHighlights(highlightedNotesRef.current, themeColors.noteColor);
    highlightedNotesRef.current = [];
    currentStepRef.current = -1;

    const audio = audioRef.current;
    if (audio && !audio.paused) {
      syncHighlightAtTime(audio.currentTime);
    } else {
      reapplyPersistedPracticeColors();
    }
  }, [reapplyPersistedPracticeColors, scoreStatus, scoreTheme, syncHighlightAtTime, themeColors.noteColor]);

  useEffect(() => {
    if (!isKitPractice || !practiceScore || scoreStatus !== 'ready') return;
    const frame = requestAnimationFrame(() => {
      reapplyPersistedPracticeColors();
    });
    return () => cancelAnimationFrame(frame);
  }, [isKitPractice, practiceScore, scoreStatus, reapplyPersistedPracticeColors]);

  useEffect(() => {
    if (scoreStatus !== 'ready') return;
    const frame = requestAnimationFrame(() => fitScoreToViewport());
    return () => cancelAnimationFrame(frame);
  }, [scoreStatus, fitScoreToViewport]);

  useEffect(() => {
    const viewport = scoreViewportRef.current;
    if (!viewport || scoreStatus !== 'ready') return;

    const observer = new ResizeObserver(() => fitScoreToViewport());
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [scoreStatus, fitScoreToViewport]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === panelRef.current);
      requestAnimationFrame(() => fitScoreToViewport());
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [fitScoreToViewport]);

  const syncScoreToAudio = useCallback(
    (audioTime: number) => {
      const osmd = osmdRef.current;
      const steps = playbackStepsRef.current;
      if (!osmd || steps.length === 0) return;

      try {
        const stepIndex = findPlaybackStepIndex(
          steps,
          audioTime,
          scoreBpmRef.current,
          playbackOffsetSeconds,
        );
        if (stepIndex === currentStepRef.current) return;

        syncHighlightAtTime(audioTime);
      } catch (error) {
        console.error('[MusicXmlPlayAlong] Score sync failed:', error);
      }
    },
    [playbackOffsetSeconds, syncHighlightAtTime],
  );

  useEffect(() => {
    let cancelled = false;
    sourcePeakRef.current = 0.1;

    measureBackingTrackPeak(exercise.audioUrl).then((peak) => {
      if (cancelled) return;
      sourcePeakRef.current = peak;
      ensureBackingAudioGraph();
      applyVolumeGain(backingVolumePercent);
    });

    return () => {
      cancelled = true;
    };
  }, [applyVolumeGain, backingVolumePercent, ensureBackingAudioGraph, exercise.audioUrl]);

  useEffect(() => {
    ensureBackingAudioGraph();
  }, [ensureBackingAudioGraph]);

  useEffect(() => {
    applyVolumeGain(backingVolumePercent);
    setVolumeSliderPercent(backingVolumePercent);
  }, [applyVolumeGain, backingVolumePercent]);

  const applyPlaybackRate = useCallback((bpm: number) => {
    const audio = audioRef.current;
    const baseBpm = scoreBpmRef.current;
    if (!audio || baseBpm <= 0) return;
    audio.volume = 1;
    audio.playbackRate = playbackRateForTempo(clampPlaybackBpm(bpm), baseBpm);
  }, []);

  useEffect(() => {
    applyPlaybackRate(manualBpm);
  }, [manualBpm, scoreBpm, applyPlaybackRate]);

  useEffect(() => {
    currentStepRef.current = -1;
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      syncScoreToAudio(audio.currentTime);
    }
  }, [manualBpm, syncScoreToAudio]);

  const beginExerciseAtDownbeat = useCallback(
    (downbeatTime: number) => {
      playbackPhaseAnchorRef.current = downbeatTime;

      if (isKitPractice) {
        isRecordingHitsRef.current = true;
      }

      const audio = audioRef.current;
      const ctx = backingAudioContextRef.current;
      const gain = backingGainRef.current;

      if (audio && ctx) {
        audio.currentTime = 0;
        applyPlaybackRate(manualBpmRef.current);

        const targetGain = resolveBackingGain(volumeSliderPercent);
        const now = ctx.currentTime;
        if (gain) {
          gain.gain.cancelScheduledValues(now);
          if (now >= downbeatTime - 0.005) {
            gain.gain.setValueAtTime(targetGain, now);
          } else {
            gain.gain.setValueAtTime(0, now);
            gain.gain.setValueAtTime(targetGain, downbeatTime);
          }
        }

        void audio.play().then(() => {
          syncScoreToAudio(0);
          setIsPlaying(true);
        }).catch((err) => {
          console.error('Audio failed to play:', err);
          playbackPhaseAnchorRef.current = null;
        });
      } else {
        setIsPlaying(true);
      }
    },
    [applyPlaybackRate, isKitPractice, resolveBackingGain, syncScoreToAudio, volumeSliderPercent],
  );

  const play = () => {
    if (!audioRef.current || scoreStatus !== 'ready' || isCountingIn) return;

    if (isKitPractice) {
      recordedHitsRef.current = [];
      setPracticeScore(null);
      isRecordingHitsRef.current = false;
      resetKitPracticeGrades();
    }

    ensureBackingAudioGraph();
    void resumeBackingTrackContext(backingAudioContextRef.current);

    startCountIn(beginExerciseAtDownbeat);
  };

  const stop = useCallback(() => {
    finishPlayback('manual');
  }, [finishPlayback]);

  const togglePlayback = () => {
    if (isTransportActive) {
      stop();
      return;
    }
    play();
  };

  const toggleMetronome = () => {
    setMetronomeEnabled((current) => {
      const next = !current;
      localStorage.setItem(METRONOME_STORAGE_KEY, String(next));
      return next;
    });
  };

  const toggleScoreTheme = () => {
    setScoreTheme((current) => {
      const next: ScoreThemeMode = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(SCORE_THEME_STORAGE_KEY, next);
      return next;
    });
  };

  const toggleFullscreen = async () => {
    const panel = panelRef.current;
    if (!panel) return;

    try {
      if (document.fullscreenElement === panel) {
        await document.exitFullscreen();
      } else {
        await panel.requestFullscreen();
      }
    } catch (error) {
      console.error('[MusicXmlPlayAlong] Fullscreen failed:', error);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setTime(audio.currentTime);
      if (!audio.paused) {
        syncScoreToAudio(audio.currentTime);
        tryAutoFinishAtExerciseEnd(audio.currentTime);
      }
    };
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      ensureBackingAudioGraph();
      applyVolumeGain(volumeSliderPercent);
    };
    const onEnded = () => {
      finishPlayback('complete');
    };
    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);

    if (audio.readyState >= 1) {
      setDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
    };
  }, [
    applyVolumeGain,
    ensureBackingAudioGraph,
    finishPlayback,
    resetPlaybackVisuals,
    syncScoreToAudio,
    tryAutoFinishAtExerciseEnd,
    volumeSliderPercent,
  ]);

  useEffect(() => {
    if (!isPlaying) return;

    let frame = 0;
    const loop = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        syncScoreToAudio(audio.currentTime);
        tryAutoFinishAtExerciseEnd(audio.currentTime);
      }
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, syncScoreToAudio, tryAutoFinishAtExerciseEnd]);

  useEffect(
    () => () => {
      if (tempoCommitTimerRef.current) {
        clearTimeout(tempoCommitTimerRef.current);
      }
    },
    [],
  );

  const commitManualBpm = useCallback(
    (next: number) => {
      const clamped = clampPlaybackBpm(next);
      manualBpmRef.current = clamped;
      setTempoSliderBpm(clamped);
      setManualBpm(clamped);
      applyPlaybackRate(clamped);
    },
    [applyPlaybackRate],
  );

  const handleTempoSliderInput = (raw: number) => {
    const clamped = clampPlaybackBpm(raw);
    manualBpmRef.current = clamped;
    setTempoSliderBpm(clamped);
    applyPlaybackRate(clamped);

    if (tempoCommitTimerRef.current) {
      clearTimeout(tempoCommitTimerRef.current);
    }
    tempoCommitTimerRef.current = setTimeout(() => {
      setManualBpm(clamped);
    }, 100);
  };

  const handleTempoSliderCommit = (raw: number) => {
    if (tempoCommitTimerRef.current) {
      clearTimeout(tempoCommitTimerRef.current);
      tempoCommitTimerRef.current = null;
    }
    commitManualBpm(raw);
  };

  const handleVolumeSliderInput = (raw: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(raw)));
    setVolumeSliderPercent(clamped);
    applyVolumeGain(clamped);
  };

  const handleVolumeSliderCommit = (raw: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(raw)));
    setVolumeSliderPercent(clamped);
    setBackingVolumePercent(clamped);
    localStorage.setItem(BACKING_VOLUME_STORAGE_KEY, String(clamped));
    applyVolumeGain(clamped);
  };

  const handleTempoKnobInput = (raw: number) => {
    handleTempoSliderInput(raw);
  };

  const handleTempoKnobCommit = (raw: number) => {
    handleTempoSliderCommit(raw);
  };

  const handleVolumeKnobInput = (raw: number) => {
    handleVolumeSliderInput(raw);
  };

  const handleVolumeKnobCommit = (raw: number) => {
    handleVolumeSliderCommit(raw);
  };

  const layoutClass = layout === 'page' ? 'musicxml-playalong--page' : 'musicxml-playalong--embedded';
  const themeClass = scoreTheme === 'dark' ? ' musicxml-playalong--dark' : ' musicxml-playalong--light';
  const nextScoreTheme: ScoreThemeMode = scoreTheme === 'dark' ? 'light' : 'dark';
  const nextThemeLabel = nextScoreTheme === 'light' ? 'light score' : 'dark score';

  return (
    <section
      ref={panelRef}
      className={`musicxml-playalong ${layoutClass}${themeClass}${isFullscreen ? ' musicxml-playalong--fullscreen' : ''}`}
      aria-label={`Play-along: ${exercise.title}`}
    >
      <header className="musicxml-playalong-header">
        <div className="musicxml-playalong-heading">
          <h2 className="musicxml-playalong-title">{exercise.title}</h2>
          <p className="musicxml-playalong-meta">{exercise.subtitle}</p>
          {isKitPractice && (
            <p className="musicxml-playalong-kit-badge" role="status">
              Practice with kit
              {isMidiConnected && selectedInputName ? ` · ${selectedInputName}` : ''}
            </p>
          )}
        </div>
      </header>

      {isKitPractice && midiSupported && !isMidiConnected && scoreStatus === 'ready' && (
        <p className="musicxml-playalong-kit-hint" role="status">
          Connect your e-drum kit on the Connect MIDI page, then press Play to practice along and
          get timing feedback.
        </p>
      )}

      {isKitPractice && scoreStatus === 'ready' && (
        <p className="musicxml-playalong-kit-legend" role="note">
          Live timing colors:{' '}
          <span className="musicxml-playalong-kit-legend-item musicxml-playalong-kit-legend-item--ontime">
            green = on time
          </span>
          <span className="musicxml-playalong-kit-legend-sep" aria-hidden="true">
            ·
          </span>
          <span className="musicxml-playalong-kit-legend-item musicxml-playalong-kit-legend-item--close">
            orange = close
          </span>
          <span className="musicxml-playalong-kit-legend-sep" aria-hidden="true">
            ·
          </span>
          <span className="musicxml-playalong-kit-legend-item musicxml-playalong-kit-legend-item--miss">
            red = missed
          </span>
        </p>
      )}

      {practiceScore && (
        <div
          className="musicxml-playalong-practice-results"
          role="region"
          aria-label="Practice timing results"
        >
          <h3 className="musicxml-playalong-practice-results-title">Your timing</h3>
          <p className="musicxml-playalong-practice-results-summary">
            <strong>{practiceScore.accuracyPercent}%</strong> on time ·{' '}
            {practiceScore.onTime}/{practiceScore.totalSteps} notes
          </p>
          <ul className="musicxml-playalong-practice-results-breakdown">
            <li>
              <span className="musicxml-playalong-grade musicxml-playalong-grade--ontime">On time</span>
              {practiceScore.onTime}
            </li>
            <li>
              <span className="musicxml-playalong-grade musicxml-playalong-grade--early">Early</span>
              {practiceScore.early}
            </li>
            <li>
              <span className="musicxml-playalong-grade musicxml-playalong-grade--late">Late</span>
              {practiceScore.late}
            </li>
            <li>
              <span className="musicxml-playalong-grade musicxml-playalong-grade--miss">Missed</span>
              {practiceScore.missed}
            </li>
            {practiceScore.extraHits > 0 && (
              <li>
                <span className="musicxml-playalong-grade musicxml-playalong-grade--extra">Extra hits</span>
                {practiceScore.extraHits}
              </li>
            )}
          </ul>
          <button
            type="button"
            className="musicxml-playalong-practice-results-dismiss"
            onClick={() => setPracticeScore(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div
        className="musicxml-playalong-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={beatProgress}
        aria-label="Score playback progress"
      >
        <div className="musicxml-playalong-progress-fill" style={{ width: `${beatProgress}%` }} />
      </div>

      <div ref={scoreViewportRef} className="musicxml-playalong-score-viewport">
        {isCountingIn && (
          <div
            className="musicxml-playalong-count-in"
            role="status"
            aria-live="polite"
            aria-label={`Count-in beat ${countInBeat} of ${PLAY_ALONG_COUNT_IN_BEATS}`}
          >
            <p className="musicxml-playalong-count-in-label">Count-in</p>
            <div className="musicxml-playalong-count-in-dots" aria-hidden="true">
              {Array.from({ length: PLAY_ALONG_COUNT_IN_BEATS }, (_, index) => {
                const beatNumber = index + 1;
                const isActive = beatNumber <= countInBeat;
                const isDownbeat = beatNumber === 1 && isActive;
                return (
                  <span
                    key={beatNumber}
                    className={`musicxml-playalong-count-in-dot${isActive ? ' musicxml-playalong-count-in-dot--active' : ''}${isDownbeat ? ' musicxml-playalong-count-in-dot--downbeat' : ''}`}
                  />
                );
              })}
            </div>
            <p className="musicxml-playalong-count-in-beat">{countInBeat}</p>
            <p className="musicxml-playalong-count-in-hint">Synced with metronome · exercise starts on the next beat</p>
          </div>
        )}
        {scoreStatus === 'loading' && (
          <p className="musicxml-playalong-score-status" role="status">
            Loading score…
          </p>
        )}
        {scoreStatus === 'error' && (
          <p className="musicxml-playalong-score-status musicxml-playalong-score-status--error" role="alert">
            {scoreError}
          </p>
        )}
        <div
          ref={scoreContainerRef}
          className={`musicxml-playalong-score-canvas${scoreStatus === 'ready' ? ' musicxml-playalong-score-canvas--ready' : ''}`}
          aria-hidden={scoreStatus !== 'ready'}
        />
      </div>

      <div className="musicxml-playalong-controls">
        <div className="musicxml-playalong-controls-left">
          <div className="musicxml-playalong-knobs">
            <PlayAlongKnob
              label="Tempo"
              value={tempoSliderBpm}
              min={MIN_PLAYBACK_BPM}
              max={MAX_PLAYBACK_BPM}
              step={1}
              disabled={scoreStatus !== 'ready'}
              displayValue={String(tempoSliderBpm)}
              variant="tempo"
              ariaLabel="Tempo"
              onInput={handleTempoKnobInput}
              onCommit={handleTempoKnobCommit}
            />
            <PlayAlongKnob
              label="Volume"
              value={volumeSliderPercent}
              min={0}
              max={100}
              step={1}
              disabled={scoreStatus !== 'ready'}
              displayValue={`${volumeSliderPercent}%`}
              variant="volume"
              ariaLabel="Backing track volume"
              onInput={handleVolumeKnobInput}
              onCommit={handleVolumeKnobCommit}
            />
          </div>
        </div>

        <div className="musicxml-playalong-controls-center">
          <button
            type="button"
            className={`musicxml-playalong-transport-btn musicxml-playalong-transport-btn--toggle${isTransportActive ? ' musicxml-playalong-transport-btn--stop' : ' musicxml-playalong-transport-btn--play'}`}
            onClick={togglePlayback}
            disabled={scoreStatus !== 'ready'}
            aria-label={isTransportActive ? 'Stop backing track' : 'Play backing track'}
          >
            {isCountingIn ? '…' : isTransportActive ? 'Stop' : 'Play'}
          </button>
        </div>

        <div className="musicxml-playalong-controls-right">
          <button
            type="button"
            className={`musicxml-playalong-metronome-btn${metronomeEnabled ? ' musicxml-playalong-metronome-btn--active' : ''}`}
            onClick={toggleMetronome}
            disabled={scoreStatus !== 'ready'}
            aria-label={metronomeEnabled ? 'Turn metronome off' : 'Turn metronome on'}
            aria-pressed={metronomeEnabled}
            title={metronomeEnabled ? 'Metronome on (synced to tempo)' : 'Metronome off'}
          >
            <MetronomeToggleIcon enabled={metronomeEnabled} />
          </button>
          <button
            type="button"
            className="musicxml-playalong-theme-btn"
            onClick={toggleScoreTheme}
            disabled={scoreStatus !== 'ready'}
            aria-label={`Switch to ${nextThemeLabel}`}
            title={`Switch to ${nextThemeLabel}`}
          >
            <ScoreThemeToggleIcon targetTheme={nextScoreTheme} />
          </button>
          <button
            type="button"
            className="musicxml-playalong-fullscreen-btn"
            onClick={toggleFullscreen}
            disabled={scoreStatus !== 'ready'}
            aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
            title={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
          >
            <FullscreenToggleIcon isFullscreen={isFullscreen} />
          </button>
          <span className="musicxml-playalong-transport-time" aria-live="polite">
            {formatTime(time)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      <audio ref={audioRef} src={exercise.audioUrl} preload="metadata" />
    </section>
  );
};

export default MusicXmlPlayAlong;

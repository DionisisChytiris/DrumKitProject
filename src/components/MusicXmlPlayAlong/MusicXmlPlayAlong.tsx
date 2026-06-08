import { useCallback, useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import type { GraphicalNote } from 'opensheetmusicdisplay';
import type { PlayAlongExerciseDefinition } from '@/types/playAlongTypes';
import { useMetronomeClicks } from '@/hooks/useMetronomeClicks';
import { useAppSelector } from '@/store/hooks';
import {
  applyOsmdScoreTheme,
  applyStepHighlight,
  buildPlaybackMap,
  clampPlaybackBpm,
  clearNoteHighlights,
  findPlaybackStepIndex,
  fitOsmdToContainer,
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
  const { clickSound, volume, accentPattern } = useAppSelector((state) => state.metronome);

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
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [metronomeEnabled, setMetronomeEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(METRONOME_STORAGE_KEY) === 'true';
  });
  const [backingVolumePercent, setBackingVolumePercent] = useState(readStoredBackingVolume);
  const [volumeSliderPercent, setVolumeSliderPercent] = useState(readStoredBackingVolume);

  manualBpmRef.current = manualBpm;
  scoreBpmRef.current = scoreBpm;

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

  useMetronomeClicks({
    bpm: manualBpm,
    enabled: metronomeEnabled,
    isRunning: isPlaying,
    timeSignature: beatsPerMeasure,
    volume,
    clickSound,
    accentPattern,
  });

  const syncHighlightAtTime = useCallback(
    (audioTime: number, tempoBpm: number) => {
      const osmd = osmdRef.current;
      const steps = playbackStepsRef.current;
      if (!osmd || steps.length === 0) return;

      const stepIndex = findPlaybackStepIndex(
        steps,
        audioTime,
        tempoBpm,
        playbackOffsetSeconds,
      );
      const step = steps[stepIndex];
      if (!step) return;

      currentStepRef.current = stepIndex;
      highlightedNotesRef.current = applyStepHighlight(
        osmd,
        step,
        highlightedNotesRef.current,
        defaultNoteColor,
        activeNoteColor,
      );
      setBeatProgress(Math.round((stepIndex / Math.max(steps.length - 1, 1)) * 100));
    },
    [activeNoteColor, defaultNoteColor, playbackOffsetSeconds],
  );

  const fitScoreToViewport = useCallback(() => {
    const osmd = osmdRef.current;
    const viewport = scoreViewportRef.current;
    if (!osmd || !viewport || scoreStatus !== 'ready') return;

    fitOsmdToContainer(osmd, viewport);
    currentStepRef.current = -1;

    const audio = audioRef.current;
    if (audio && !audio.paused) {
      syncHighlightAtTime(audio.currentTime, manualBpm);
    }
  }, [manualBpm, scoreStatus, syncHighlightAtTime]);

  const resetPlaybackVisuals = useCallback(() => {
    clearNoteHighlights(highlightedNotesRef.current, defaultNoteColor);
    highlightedNotesRef.current = [];
    currentStepRef.current = -1;
    setBeatProgress(0);
  }, [defaultNoteColor]);

  useEffect(() => {
    const container = scoreContainerRef.current;
    if (!container) return;

    let cancelled = false;
    setScoreStatus('loading');
    setScoreError('');
    resetPlaybackVisuals();

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
        const loadedBpm = clampPlaybackBpm(steps[0]?.bpm ?? exercise.defaultBpm ?? 120);
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
      syncHighlightAtTime(audio.currentTime, manualBpm);
    }
  }, [scoreTheme, scoreStatus, themeColors.noteColor, manualBpm, syncHighlightAtTime]);

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
    (audioTime: number, tempoBpm: number) => {
      const osmd = osmdRef.current;
      const steps = playbackStepsRef.current;
      if (!osmd || steps.length === 0) return;

      try {
        const stepIndex = findPlaybackStepIndex(
          steps,
          audioTime,
          tempoBpm,
          playbackOffsetSeconds,
        );
        if (stepIndex === currentStepRef.current) return;

        syncHighlightAtTime(audioTime, tempoBpm);
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
      syncScoreToAudio(audio.currentTime, manualBpmRef.current);
    }
  }, [manualBpm, syncScoreToAudio]);

  const play = async () => {
    if (!audioRef.current || scoreStatus !== 'ready') return;

    try {
      ensureBackingAudioGraph();
      await resumeBackingTrackContext(backingAudioContextRef.current);
      await audioRef.current.play();
      setIsPlaying(true);
      syncScoreToAudio(audioRef.current.currentTime, manualBpm);
    } catch (err) {
      console.error('Audio failed to play:', err);
    }
  };

  const stop = () => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setTime(0);
    resetPlaybackVisuals();
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stop();
      return;
    }
    void play();
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
        syncScoreToAudio(audio.currentTime, manualBpmRef.current);
      }
    };
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      ensureBackingAudioGraph();
      applyVolumeGain(volumeSliderPercent);
    };
    const onEnded = () => {
      setIsPlaying(false);
      resetPlaybackVisuals();
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
  }, [applyVolumeGain, ensureBackingAudioGraph, resetPlaybackVisuals, syncScoreToAudio, volumeSliderPercent]);

  useEffect(() => {
    if (!isPlaying) return;

    let frame = 0;
    const loop = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        syncScoreToAudio(audio.currentTime, manualBpmRef.current);
      }
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, syncScoreToAudio]);

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
        </div>
      </header>

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
            className={`musicxml-playalong-transport-btn musicxml-playalong-transport-btn--toggle${isPlaying ? ' musicxml-playalong-transport-btn--stop' : ' musicxml-playalong-transport-btn--play'}`}
            onClick={togglePlayback}
            disabled={scoreStatus !== 'ready'}
            aria-label={isPlaying ? 'Stop backing track' : 'Play backing track'}
          >
            {isPlaying ? 'Stop' : 'Play'}
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

import { useCallback, useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import type { GraphicalNote } from 'opensheetmusicdisplay';
import type { PlayAlongExerciseDefinition } from '@/types/playAlongTypes';
import {
  applyStepHighlight,
  buildPlaybackMap,
  clampPlaybackBpm,
  clearNoteHighlights,
  findPlaybackStepIndex,
  fitOsmdToContainer,
  playbackRateForTempo,
  type PlaybackStep,
} from '@/utils/osmdPlaybackMap';
import './MusicXmlPlayAlong.css';

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export interface MusicXmlPlayAlongProps {
  exercise: PlayAlongExerciseDefinition;
  /** page = full viewport panel (About-style); embedded = inside Exercises scroll area */
  layout?: 'page' | 'embedded';
}

export const MusicXmlPlayAlong: React.FC<MusicXmlPlayAlongProps> = ({
  exercise,
  layout = 'embedded',
}) => {
  const playbackOffsetSeconds = exercise.playbackOffsetSeconds ?? 0;

  const audioRef = useRef<HTMLAudioElement | null>(null);
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
  const [beatProgress, setBeatProgress] = useState(0);

  const fitScoreToViewport = useCallback(() => {
    const osmd = osmdRef.current;
    const viewport = scoreViewportRef.current;
    if (!osmd || !viewport || scoreStatus !== 'ready') return;

    fitOsmdToContainer(osmd, viewport);
    currentStepRef.current = -1;

    const audio = audioRef.current;
    if (audio && !audio.paused) {
      const stepIndex = findPlaybackStepIndex(
        playbackStepsRef.current,
        audio.currentTime,
        manualBpm,
        playbackOffsetSeconds,
      );
      const step = playbackStepsRef.current[stepIndex];
      if (step) {
        highlightedNotesRef.current = applyStepHighlight(osmd, step, highlightedNotesRef.current);
        currentStepRef.current = stepIndex;
      }
    }
  }, [manualBpm, playbackOffsetSeconds, scoreStatus]);

  const resetPlaybackVisuals = useCallback(() => {
    clearNoteHighlights(highlightedNotesRef.current);
    highlightedNotesRef.current = [];
    currentStepRef.current = -1;
    setBeatProgress(0);
  }, []);

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
    });

    osmdRef.current = osmd;

    osmd
      .load(exercise.scoreUrl)
      .then(() => {
        if (cancelled) return;
        osmd.render();

        const steps = buildPlaybackMap(osmd);
        if (steps.length === 0) {
          throw new Error('No playable notes found in the score.');
        }

        playbackStepsRef.current = steps;
        const loadedBpm = clampPlaybackBpm(steps[0]?.bpm ?? exercise.defaultBpm ?? 120);
        setScoreBpm(loadedBpm);
        setManualBpm(loadedBpm);
        setScoreStatus('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setScoreStatus('error');
        setScoreError(error instanceof Error ? error.message : 'Could not load the score file.');
      });

    return () => {
      cancelled = true;
      clearNoteHighlights(highlightedNotesRef.current);
      osmdRef.current = null;
      playbackStepsRef.current = [];
      container.innerHTML = '';
    };
  }, [exercise.id, exercise.scoreUrl, exercise.defaultBpm, resetPlaybackVisuals]);

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

        const step = steps[stepIndex];
        currentStepRef.current = stepIndex;
        highlightedNotesRef.current = applyStepHighlight(osmd, step, highlightedNotesRef.current);
        setBeatProgress(Math.round((stepIndex / Math.max(steps.length - 1, 1)) * 100));
      } catch (error) {
        console.error('[MusicXmlPlayAlong] Score sync failed:', error);
      }
    },
    [playbackOffsetSeconds],
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || scoreBpm <= 0) return;
    audio.playbackRate = playbackRateForTempo(manualBpm, scoreBpm);
  }, [manualBpm, scoreBpm]);

  useEffect(() => {
    currentStepRef.current = -1;
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      syncScoreToAudio(audio.currentTime, manualBpm);
    }
  }, [manualBpm, syncScoreToAudio]);

  const play = async () => {
    if (!audioRef.current || scoreStatus !== 'ready') return;

    try {
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
        syncScoreToAudio(audio.currentTime, manualBpm);
      }
    };
    const onLoadedMetadata = () => setDuration(audio.duration);
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
  }, [manualBpm, resetPlaybackVisuals, syncScoreToAudio]);

  useEffect(() => {
    if (!isPlaying) return;

    let frame = 0;
    const loop = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        syncScoreToAudio(audio.currentTime, manualBpm);
      }
      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, manualBpm, syncScoreToAudio]);

  const changeManualBpm = (next: number) => {
    setManualBpm(clampPlaybackBpm(next));
  };

  const layoutClass = layout === 'page' ? 'musicxml-playalong--page' : 'musicxml-playalong--embedded';

  return (
    <section
      ref={panelRef}
      className={`musicxml-playalong ${layoutClass}${isFullscreen ? ' musicxml-playalong--fullscreen' : ''}`}
      aria-label={`Play-along: ${exercise.title}`}
    >
      <div className="musicxml-playalong-toolbar">
        <div className="musicxml-playalong-heading">
          <h2 className="musicxml-playalong-title">{exercise.title}</h2>
          <p className="musicxml-playalong-meta">{exercise.subtitle}</p>
        </div>

        <div className="musicxml-playalong-transport">
          <div className="musicxml-playalong-tempo" aria-label="Tempo control">
            <button
              type="button"
              className="musicxml-playalong-tempo-btn"
              onClick={() => changeManualBpm(manualBpm - 1)}
              disabled={scoreStatus !== 'ready' || manualBpm <= 40}
              aria-label="Decrease tempo"
            >
              −
            </button>
            <span className="musicxml-playalong-tempo-value" aria-live="polite">
              {manualBpm}
            </span>
            <button
              type="button"
              className="musicxml-playalong-tempo-btn"
              onClick={() => changeManualBpm(manualBpm + 1)}
              disabled={scoreStatus !== 'ready' || manualBpm >= 240}
              aria-label="Increase tempo"
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="musicxml-playalong-transport-btn musicxml-playalong-transport-btn--play"
            onClick={play}
            disabled={isPlaying || scoreStatus !== 'ready'}
            aria-label="Play backing track"
          >
            Play
          </button>
          <button
            type="button"
            className="musicxml-playalong-transport-btn musicxml-playalong-transport-btn--stop"
            onClick={stop}
            aria-label="Stop backing track"
          >
            Stop
          </button>
          <button
            type="button"
            className="musicxml-playalong-fullscreen-btn"
            onClick={toggleFullscreen}
            disabled={scoreStatus !== 'ready'}
            aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
          >
            {isFullscreen ? 'Exit full screen' : 'Full screen'}
          </button>
          <span className="musicxml-playalong-transport-time" aria-live="polite">
            {formatTime(time)} / {formatTime(duration)}
          </span>
        </div>
      </div>

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

      <audio ref={audioRef} src={exercise.audioUrl} preload="metadata" />
    </section>
  );
};

export default MusicXmlPlayAlong;

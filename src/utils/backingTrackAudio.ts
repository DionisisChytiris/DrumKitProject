/** Perceived-loudness target after auto-normalization (100% knob) */
const TARGET_PEAK = 1;
const MAX_NORMALIZE_GAIN = 32;

interface BackingTrackGraph {
  context: AudioContext;
  gain: GainNode;
  compressor: DynamicsCompressorNode;
}

const graphByAudio = new WeakMap<HTMLAudioElement, BackingTrackGraph>();
const peakByUrl = new Map<string, number>();

export function getMaxBackingGain(): number {
  return MAX_NORMALIZE_GAIN;
}

export function getCachedSourcePeak(url: string): number | undefined {
  return peakByUrl.get(url);
}

/** Scan the WAV peak so quiet exports can be boosted automatically. */
export async function measureBackingTrackPeak(url: string): Promise<number> {
  const cached = peakByUrl.get(url);
  if (cached !== undefined) return cached;

  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      peakByUrl.set(url, 0.12);
      return 0.12;
    }

    const context = new AudioContextClass();
    const buffer = await context.decodeAudioData(arrayBuffer);
    await context.close();

    const channel = buffer.getChannelData(0);
    let peak = 0;
    const step = Math.max(1, Math.floor(channel.length / 60000));
    for (let i = 0; i < channel.length; i += step) {
      const sample = Math.abs(channel[i]);
      if (sample > peak) peak = sample;
    }

    const safePeak = Math.max(peak, 0.0001);
    peakByUrl.set(url, safePeak);
    return safePeak;
  } catch (error) {
    console.warn('[BackingTrack] Peak measure failed, using default boost', error);
    peakByUrl.set(url, 0.08);
    return 0.08;
  }
}

export function backingPercentToGain(percent: number, sourcePeak = 0.1): number {
  const slider = Math.max(0, Math.min(100, percent)) / 100;
  const normalize = Math.min(MAX_NORMALIZE_GAIN, TARGET_PEAK / Math.max(sourcePeak, 0.0001));
  return slider * normalize;
}

function createGraph(audio: HTMLAudioElement): BackingTrackGraph {
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('Web Audio not supported');
  }

  const context = new AudioContextClass();
  const source = context.createMediaElementSource(audio);
  const gain = context.createGain();
  const compressor = context.createDynamicsCompressor();

  compressor.threshold.setValueAtTime(-18, context.currentTime);
  compressor.knee.setValueAtTime(12, context.currentTime);
  compressor.ratio.setValueAtTime(4, context.currentTime);
  compressor.attack.setValueAtTime(0.003, context.currentTime);
  compressor.release.setValueAtTime(0.2, context.currentTime);

  source.connect(gain);
  gain.connect(compressor);
  compressor.connect(context.destination);

  return { context, gain, compressor };
}

/** Attach (or reuse) gain + compressor for boosted backing-track playback. */
export function attachBackingTrackGain(
  audio: HTMLAudioElement,
  gainValue: number,
): BackingTrackGraph | null {
  let graph = graphByAudio.get(audio);
  if (!graph) {
    try {
      graph = createGraph(audio);
      graphByAudio.set(audio, graph);
    } catch (error) {
      console.warn('[BackingTrack] Web Audio graph unavailable, using native volume', error);
      audio.volume = Math.min(1, gainValue / MAX_NORMALIZE_GAIN);
      return null;
    }
  }

  audio.volume = 1;
  graph.gain.gain.setValueAtTime(gainValue, graph.context.currentTime);
  return graph;
}

export function setBackingTrackGain(
  audio: HTMLAudioElement | null,
  gainNode: GainNode | null,
  gainValue: number,
  context: AudioContext | null = null,
): void {
  if (gainNode) {
    const ctx = context ?? gainNode.context;
    gainNode.gain.setValueAtTime(gainValue, ctx.currentTime);
    return;
  }
  if (audio) {
    audio.volume = Math.min(1, gainValue / MAX_NORMALIZE_GAIN);
  }
}

export async function resumeBackingTrackContext(context: AudioContext | null): Promise<void> {
  if (context?.state === 'suspended') {
    await context.resume();
  }
}

export function detachBackingTrackGraph(audio: HTMLAudioElement): void {
  const graph = graphByAudio.get(audio);
  if (!graph) return;

  try {
    graph.gain.disconnect();
    graph.compressor.disconnect();
    graph.context.close();
  } catch {
    // Ignore teardown errors.
  }

  graphByAudio.delete(audio);
}

/**
 * Audio Manager for handling drum sounds
 * Optimized for low-latency Practice / MIDI playback via Web Audio API.
 */

interface CachedSample {
  buffer: AudioBuffer;
  /** Seconds into the file where the transient begins (skips leading silence). */
  startOffset: number;
}

const ATTACK_SCAN_THRESHOLD = 0.008;

/** Closed hi-hat: cut the previous voice and cap length so fast 8ths stay clean. */
const CHOKEABLE_SOUND_IDS = new Set(['hihat']);
const HI_HAT_MAX_DURATION_SEC = 0.1;

function findAttackOffset(buffer: AudioBuffer): number {
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < channel.length; i++) {
    if (Math.abs(channel[i]) > ATTACK_SCAN_THRESHOLD) {
      return i / buffer.sampleRate;
    }
  }
  return 0;
}

class AudioManager {
  private audioBufferCache: Map<string, CachedSample> = new Map();
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private resumePromise: Promise<void> | null = null;
  private volume: number = 0.7;
  /** One active voice per chokeable drum (e.g. closed hi-hat). */
  private chokeVoices = new Map<string, AudioBufferSourceNode>();

  private getCacheKey(soundId: string, audioUrl?: string): string {
    return audioUrl ? `${soundId}::${audioUrl}` : soundId;
  }

  private purgeSoundCache(soundId: string): void {
    for (const key of [...this.audioBufferCache.keys()]) {
      if (key === soundId || key.startsWith(`${soundId}::`)) {
        this.audioBufferCache.delete(key);
      }
    }
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioContextClass({ latencyHint: 'interactive' });
      this.masterGain = null;
    }
    return this.audioContext;
  }

  private getMasterGain(audioContext: AudioContext): GainNode {
    if (!this.masterGain) {
      this.masterGain = audioContext.createGain();
      this.masterGain.gain.value = this.getSafeVolume();
      this.masterGain.connect(audioContext.destination);
    }
    return this.masterGain;
  }

  /** Resume suspended context (must be called from a user-gesture handler chain). */
  private ensureRunning(): Promise<void> {
    const audioContext = this.getAudioContext();
    if (audioContext.state === 'running') {
      return Promise.resolve();
    }
    if (!this.resumePromise) {
      this.resumePromise = audioContext.resume().finally(() => {
        this.resumePromise = null;
      });
    }
    return this.resumePromise;
  }

  /**
   * Resume the audio context and prime the output path (call on user gesture / fullscreen).
   */
  async warmUp(): Promise<void> {
    await this.ensureRunning();
    const audioContext = this.getAudioContext();
    const gain = this.getMasterGain(audioContext);
    const buffer = audioContext.createBuffer(1, 1, audioContext.sampleRate);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    const t = audioContext.currentTime;
    source.start(t);
    source.stop(t + 0.001);
  }

  /** True when every listed sound has a decoded AudioBuffer ready. */
  areSamplesReady(sounds: Array<{ id: string; url: string }>): boolean {
    return sounds.every(({ id, url }) =>
      this.audioBufferCache.has(this.getCacheKey(id, url)),
    );
  }

  private async decodeAudioData(audioUrl: string): Promise<AudioBuffer> {
    const audioContext = this.getAudioContext();
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${audioUrl}: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return audioContext.decodeAudioData(arrayBuffer);
  }

  private cacheDecodedSample(cacheKey: string, audioBuffer: AudioBuffer): void {
    this.audioBufferCache.set(cacheKey, {
      buffer: audioBuffer,
      startOffset: findAttackOffset(audioBuffer),
    });
  }

  /**
   * Play a drum sound — uses pre-decoded buffers when available (lowest latency).
   */
  playSound(soundId: string, audioUrl?: string): void {
    try {
      if (!audioUrl) {
        void this.ensureRunning().then(() => this.generateTone(soundId));
        return;
      }

      const audioContext = this.getAudioContext();
      const cacheKey = this.getCacheKey(soundId, audioUrl);
      const cached = this.audioBufferCache.get(cacheKey);

      if (cached) {
        this.playCachedSample(soundId, cached, audioContext);
        return;
      }

      // Buffer not ready — decode in background; use instant tone so hits are not silent.
      void this.decodeAndCacheAudio(cacheKey, audioUrl);
      void this.ensureRunning().then(() => this.generateTone(soundId));
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  private stopChokeVoice(soundId: string): void {
    const existing = this.chokeVoices.get(soundId);
    if (!existing) return;

    try {
      const audioContext = this.getAudioContext();
      existing.stop(audioContext.currentTime + 0.002);
    } catch {
      // Already stopped.
    }
    try {
      existing.disconnect();
    } catch {
      // Ignore cleanup errors.
    }
    this.chokeVoices.delete(soundId);
  }

  private getPlaybackDuration(soundId: string, cached: CachedSample): number | undefined {
    if (!CHOKEABLE_SOUND_IDS.has(soundId)) {
      return undefined;
    }

    const remaining = cached.buffer.duration - cached.startOffset;
    if (soundId === 'hihat') {
      return Math.min(remaining, HI_HAT_MAX_DURATION_SEC);
    }
    return remaining;
  }

  private playCachedSample(
    soundId: string,
    cached: CachedSample,
    audioContext: AudioContext,
  ): void {
    const start = () => {
      try {
        if (CHOKEABLE_SOUND_IDS.has(soundId)) {
          this.stopChokeVoice(soundId);
        }

        const source = audioContext.createBufferSource();
        const output = this.getMasterGain(audioContext);
        source.buffer = cached.buffer;
        source.connect(output);

        const when = audioContext.currentTime;
        const duration = this.getPlaybackDuration(soundId, cached);
        if (duration !== undefined) {
          source.start(when, cached.startOffset, duration);
        } else {
          source.start(when, cached.startOffset);
        }

        if (CHOKEABLE_SOUND_IDS.has(soundId)) {
          this.chokeVoices.set(soundId, source);
        }

        source.onended = () => {
          if (this.chokeVoices.get(soundId) === source) {
            this.chokeVoices.delete(soundId);
          }
          try {
            source.disconnect();
          } catch {
            // Ignore cleanup errors.
          }
        };
      } catch (error) {
        console.error('[AudioManager] Error playing sample:', error);
      }
    };

    if (audioContext.state === 'running') {
      start();
    } else {
      void this.ensureRunning().then(start);
    }
  }

  private getSafeVolume(): number {
    if (!Number.isFinite(this.volume) || Number.isNaN(this.volume)) {
      this.volume = 0.7;
      return 0.7;
    }
    return Math.max(0, Math.min(1, this.volume));
  }

  private async decodeAndCacheAudio(cacheKey: string, audioUrl: string): Promise<void> {
    if (this.audioBufferCache.has(cacheKey)) {
      return;
    }

    try {
      const audioBuffer = await this.decodeAudioData(audioUrl);
      this.cacheDecodedSample(cacheKey, audioBuffer);
    } catch (error) {
      console.warn(`Failed to decode audio for ${cacheKey}:`, error);
    }
  }

  clearSoundCache(soundId: string): void {
    this.purgeSoundCache(soundId);
  }

  private generateTone(soundId: string): void {
    try {
      if (CHOKEABLE_SOUND_IDS.has(soundId)) {
        this.stopChokeVoice(soundId);
      }

      const audioContext = this.getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      const frequencies: Record<string, number> = {
        kick: 60,
        snare: 200,
        hihat: 800,
        'high-tom': 180,
        'mid-tom': 150,
        'floor-tom': 120,
        tom: 150,
        crash: 1000,
        ride: 800,
        cymbal: 1000,
      };

      const baseType = soundId.includes('tom') ? soundId : soundId.split('-')[0];
      const frequency = frequencies[soundId] || frequencies[baseType] || 200;

      oscillator.connect(gainNode);
      gainNode.connect(this.getMasterGain(audioContext));

      oscillator.frequency.value = frequency;
      oscillator.type =
        soundId.includes('cymbal') || soundId === 'crash' || soundId === 'ride'
          ? 'sawtooth'
          : 'sine';

      const now = audioContext.currentTime;
      const peak = this.getSafeVolume() * 0.35;
      gainNode.gain.setValueAtTime(peak, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      oscillator.start(now);
      oscillator.stop(now + 0.07);
    } catch (error) {
      console.error('Error generating tone:', error);
    }
  }

  setVolume(volume: number): void {
    if (!Number.isFinite(volume) || Number.isNaN(volume)) {
      this.volume = 0.7;
      return;
    }
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  getVolume(): number {
    return this.volume;
  }

  async preloadSounds(sounds: Array<{ id: string; url: string }>): Promise<void> {
    await this.ensureRunning();

    const decodePromises = sounds.map(({ id, url }) =>
      this.decodeAndCacheAudio(this.getCacheKey(id, url), url).catch(() => {
        // Individual sample failure is logged in decodeAndCacheAudio.
      }),
    );

    await Promise.allSettled(decodePromises);
  }
}

export const audioManager = new AudioManager();

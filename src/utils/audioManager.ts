/**
 * Audio Manager for handling drum sounds
 * Can be expanded to support multiple sound libraries, effects, etc.
 */

class AudioManager {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private audioBufferCache: Map<string, AudioBuffer> = new Map();
  private audioContext: AudioContext | null = null;
  private volume: number = 0.7;

  /**
   * Get or create AudioContext - optimized for low latency
   */
  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      // Use low latency settings for interactive audio
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({
        latencyHint: 'interactive', // Lowest latency setting
        sampleRate: 44100, // Standard sample rate
      });
    }
    // Resume context if suspended (required by some browsers)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  /**
   * Decode audio file into AudioBuffer for low-latency playback
   */
  private async decodeAudioData(audioUrl: string): Promise<AudioBuffer> {
    const audioContext = this.getAudioContext();
    
    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (error) {
      console.error('Error decoding audio data:', error);
      throw error;
    }
  }

  /**
   * Play a drum sound - optimized for ultra-low latency using Web Audio API
   */
  playSound(soundId: string, audioUrl?: string): void {
    try {
      if (audioUrl) {
        const audioContext = this.getAudioContext();
        const audioBuffer = this.audioBufferCache.get(soundId);

        if (audioBuffer) {
          // Use pre-decoded AudioBuffer for instant playback (lowest latency)
          this.playAudioBuffer(audioBuffer, audioContext);
        } else {
          // Fallback to HTML Audio if buffer not ready yet
          let audio = this.audioCache.get(soundId);
          
          // Check if cached audio URL matches the new URL, if not, create new audio
          if (!audio || (audio.src && audio.src !== audioUrl && !audioUrl.startsWith('blob:'))) {
            if (audio && audioUrl.startsWith('blob:')) {
              audio = new Audio(audioUrl);
              audio.preload = 'auto';
              this.audioCache.set(soundId, audio);
            } else if (!audio || audio.src !== audioUrl) {
              audio = new Audio(audioUrl);
              audio.preload = 'auto';
              this.audioCache.set(soundId, audio);
            }
          }

          // Ensure audio is ready
          if (audio.readyState < 2) {
            audio.load();
          }

          // Play HTML Audio as fallback
          if (!audio.paused && audio.currentTime > 0) {
            const audioClone = audio.cloneNode() as HTMLAudioElement;
            audioClone.volume = this.volume;
            audioClone.play().catch((error) => {
              console.error(`[AudioManager] Audio play failed for ${soundId}:`, error);
              this.generateTone(soundId);
            });
          } else {
            audio.currentTime = 0;
            audio.volume = this.volume;
            audio.play().catch((error) => {
              console.error(`[AudioManager] Audio play failed for ${soundId}:`, error);
              this.generateTone(soundId);
            });
          }

          // Try to decode and cache for next time (async, non-blocking)
          this.decodeAndCacheAudio(soundId, audioUrl).catch(() => {
            // Silent fail - will use HTML Audio fallback
          });
        }
      } else {
        // Generate a simple tone using Web Audio API
        this.generateTone(soundId);
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  /**
   * Play AudioBuffer with Web Audio API - ultra-low latency
   */
  private playAudioBuffer(audioBuffer: AudioBuffer, audioContext: AudioContext): void {
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    
    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    gainNode.gain.value = this.volume;
    
    // Start immediately with no delay
    source.start(0);
  }

  /**
   * Decode and cache audio file asynchronously
   */
  private async decodeAndCacheAudio(soundId: string, audioUrl: string): Promise<void> {
    // Skip if already cached
    if (this.audioBufferCache.has(soundId)) {
      return;
    }

    try {
      const audioBuffer = await this.decodeAudioData(audioUrl);
      this.audioBufferCache.set(soundId, audioBuffer);
    } catch (error) {
      // Silent fail - will continue using HTML Audio
      console.warn(`Failed to decode audio for ${soundId}, using HTML Audio fallback`);
    }
  }

  /**
   * Clear cache for a specific sound (useful when audioUrl changes)
   */
  clearSoundCache(soundId: string): void {
    this.audioCache.delete(soundId);
  }

  /**
   * Generate a simple tone as fallback using Web Audio API
   */
  private generateTone(soundId: string): void {
    try {
      const audioContext = this.getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Different frequencies for different drum types
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

      // Extract base type for frequency lookup
      const baseType = soundId.includes('tom') ? soundId : soundId.split('-')[0];
      const frequency = frequencies[soundId] || frequencies[baseType] || 200;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = soundId.includes('cymbal') || soundId === 'crash' || soundId === 'ride' 
        ? 'sawtooth' 
        : 'sine';

      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      oscillator.start(now);
      oscillator.stop(now + 0.1);
    } catch (error) {
      console.error('Error generating tone:', error);
    }
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Preload audio files - optimized for immediate playback
   * Decodes audio files into AudioBuffers for ultra-low latency
   */
  async preloadSounds(sounds: Array<{ id: string; url: string }>): Promise<void> {
    // Preload HTML Audio as fallback
    sounds.forEach(({ id, url }) => {
      if (!this.audioCache.has(id)) {
        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.load();
        this.audioCache.set(id, audio);
      } else {
        const audio = this.audioCache.get(id)!;
        if (audio.readyState < 2) {
          audio.load();
        }
      }
    });

    // Decode all audio files into AudioBuffers for low-latency playback
    const decodePromises = sounds.map(({ id, url }) => 
      this.decodeAndCacheAudio(id, url).catch(() => {
        // Silent fail - HTML Audio will be used as fallback
      })
    );

    await Promise.allSettled(decodePromises);
  }
}

export const audioManager = new AudioManager();

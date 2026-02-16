/**
 * Audio Manager for handling drum sounds
 * Can be expanded to support multiple sound libraries, effects, etc.
 */

class AudioManager {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private audioContext: AudioContext | null = null;
  private volume: number = 0.7;

  /**
   * Get or create AudioContext
   */
  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume context if suspended (required by some browsers)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  /**
   * Play a drum sound
   */
  playSound(soundId: string, audioUrl?: string): void {
    try {
      if (audioUrl) {
        console.log(`[AudioManager] Playing ${soundId} from: ${audioUrl}`); // Debug log
        // Use audio file if provided
        let audio = this.audioCache.get(soundId);
        
        // Check if cached audio URL matches the new URL, if not, create new audio
        if (!audio || (audio.src && audio.src !== audioUrl && !audioUrl.startsWith('blob:'))) {
          // For blob URLs, we need to check differently since they're unique
          if (audio && audioUrl.startsWith('blob:')) {
            // Always create new audio for blob URLs (custom uploads)
            audio = new Audio(audioUrl);
            this.audioCache.set(soundId, audio);
          } else if (!audio || audio.src !== audioUrl) {
            audio = new Audio(audioUrl);
            this.audioCache.set(soundId, audio);
          }
        }

        // Add error handler to detect loading failures
        audio.addEventListener('error', (e) => {
          console.error(`[AudioManager] Failed to load audio for ${soundId} from ${audioUrl}:`, e);
          console.warn(`[AudioManager] Falling back to generated tone for ${soundId}`);
          // Fall back to generated tone if audio fails to load
          this.generateTone(soundId);
        });

        // Clone and play to allow overlapping sounds
        const audioClone = audio.cloneNode() as HTMLAudioElement;
        audioClone.volume = this.volume;
        audioClone.play().catch((error) => {
          console.error(`[AudioManager] Audio play failed for ${soundId}:`, error);
          console.warn(`[AudioManager] Falling back to generated tone for ${soundId}`);
          // Fall back to generated tone if play fails
          this.generateTone(soundId);
        });
      } else {
        console.log(`[AudioManager] No audioUrl provided for ${soundId}, using generated tone`); // Debug log
        // Generate a simple tone using Web Audio API
        this.generateTone(soundId);
      }
    } catch (error) {
      console.error('Error playing sound:', error);
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
   * Preload audio files
   */
  preloadSounds(sounds: Array<{ id: string; url: string }>): void {
    sounds.forEach(({ id, url }) => {
      if (!this.audioCache.has(id)) {
        const audio = new Audio(url);
        audio.preload = 'auto';
        this.audioCache.set(id, audio);
      }
    });
  }
}

export const audioManager = new AudioManager();

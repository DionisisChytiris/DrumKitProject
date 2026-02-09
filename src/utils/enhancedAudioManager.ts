/**
 * Enhanced Audio Manager with effects support
 * Supports reverb, compression, EQ, pan, and velocity sensitivity
 */

interface EffectSettings {
  reverb: number;
  compression: number;
  eq: {
    low: number;
    mid: number;
    high: number;
  };
  pan: number;
  volume: number;
}

class EnhancedAudioManager {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterReverb: ConvolverNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private masterEQ: {
    low: BiquadFilterNode | null;
    mid: BiquadFilterNode | null;
    high: BiquadFilterNode | null;
  } = {
    low: null,
    mid: null,
    high: null,
  };

  private globalSettings: EffectSettings = {
    reverb: 0.2,
    compression: 0.3,
    eq: { low: 0, mid: 0, high: 0 },
    pan: 0,
    volume: 0.7,
  };

  private drumSettings: Map<string, EffectSettings> = new Map();
  private velocitySensitivity: number = 0.5;

  /**
   * Initialize audio context and effects
   */
  private initializeAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create master gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.globalSettings.volume;
      this.masterGain.connect(this.audioContext.destination);

      // Create master compressor
      this.masterCompressor = this.audioContext.createDynamicsCompressor();
      this.masterCompressor.threshold.value = -24;
      this.masterCompressor.knee.value = 30;
      this.masterCompressor.ratio.value = 12;
      this.masterCompressor.attack.value = 0.003;
      this.masterCompressor.release.value = 0.25;

      // Create master EQ
      this.masterEQ.low = this.audioContext.createBiquadFilter();
      this.masterEQ.low.type = 'lowshelf';
      this.masterEQ.low.frequency.value = 200;
      this.masterEQ.low.gain.value = 0;

      this.masterEQ.mid = this.audioContext.createBiquadFilter();
      this.masterEQ.mid.type = 'peaking';
      this.masterEQ.mid.frequency.value = 1000;
      this.masterEQ.mid.gain.value = 0;
      this.masterEQ.mid.Q.value = 1;

      this.masterEQ.high = this.audioContext.createBiquadFilter();
      this.masterEQ.high.type = 'highshelf';
      this.masterEQ.high.frequency.value = 5000;
      this.masterEQ.high.gain.value = 0;

      // Connect EQ chain
      this.masterEQ.low.connect(this.masterEQ.mid);
      this.masterEQ.mid.connect(this.masterEQ.high);
      this.masterEQ.high.connect(this.masterCompressor);
      this.masterCompressor.connect(this.masterGain);

      // Create reverb (using impulse response simulation)
      this.masterReverb = this.audioContext.createConvolver();
      this.createReverbImpulse();
      this.masterReverb.connect(this.masterEQ.low);
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    return this.audioContext;
  }

  /**
   * Create a simple reverb impulse response
   */
  private createReverbImpulse(): void {
    if (!this.audioContext || !this.masterReverb) return;

    const length = this.audioContext.sampleRate * 2;
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = length - i;
      impulseL[i] = (Math.random() * 2 - 1) * Math.pow(n / length, 2);
      impulseR[i] = (Math.random() * 2 - 1) * Math.pow(n / length, 2);
    }

    this.masterReverb.buffer = impulse;
  }

  /**
   * Play a drum sound with effects
   */
  playSound(
    soundId: string,
    audioUrl?: string,
    velocity: number = 1.0,
    settings?: Partial<EffectSettings>
  ): void {
    try {
      const audioContext = this.initializeAudioContext();
      const drumSettings = this.drumSettings.get(soundId) || { ...this.globalSettings };
      const finalSettings = settings ? { ...drumSettings, ...settings } : drumSettings;

      // Apply velocity sensitivity
      const velocityMultiplier = 0.3 + (velocity * (0.4 + this.velocitySensitivity * 0.3));

      if (audioUrl) {
        this.playAudioFile(soundId, audioUrl, velocityMultiplier, finalSettings, audioContext);
      } else {
        this.generateTone(soundId, velocityMultiplier, finalSettings, audioContext);
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  /**
   * Play audio file with effects
   */
  private playAudioFile(
    soundId: string,
    audioUrl: string,
    velocity: number,
    settings: EffectSettings,
    audioContext: AudioContext
  ): void {
    // Use Web Audio API for full effects support
    let audio = this.audioCache.get(soundId);
    
    if (!audio) {
      audio = new Audio(audioUrl);
      this.audioCache.set(soundId, audio);
    }

    // Create a new audio element for this playback instance
    const audioElement = new Audio(audioUrl);
    
    // Create Web Audio API source from the audio element
    const source = audioContext.createMediaElementSource(audioElement);
    
    // Build effects chain
    const gainNode = audioContext.createGain();
    const panNode = audioContext.createStereoPanner();
    
    // Apply volume (combines drum volume, velocity, and global volume)
    const finalVolume = settings.volume * velocity * this.globalSettings.volume;
    gainNode.gain.value = finalVolume;
    
    // Apply pan
    panNode.pan.value = settings.pan;
    
    // Connect: source -> gain -> pan -> master chain
    source.connect(gainNode);
    gainNode.connect(panNode);
    panNode.connect(this.masterEQ.low!);
    
    // Play the audio
    audioElement.play().catch(console.warn);
    
    // Clean up when finished (optional, helps with memory)
    audioElement.addEventListener('ended', () => {
      source.disconnect();
      gainNode.disconnect();
      panNode.disconnect();
    });
  }

  /**
   * Generate tone with effects
   */
  private generateTone(
    soundId: string,
    velocity: number,
    settings: EffectSettings,
    audioContext: AudioContext
  ): void {
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

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const panNode = audioContext.createStereoPanner();
    panNode.pan.value = settings.pan;

    oscillator.type = soundId.includes('cymbal') || soundId === 'crash' || soundId === 'ride' 
      ? 'sawtooth' 
      : 'sine';
    oscillator.frequency.value = frequency;

    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(settings.volume * velocity * 0.3, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(panNode);
    panNode.connect(this.masterEQ.low!);

    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }

  /**
   * Set global settings
   */
  setGlobalSettings(settings: Partial<EffectSettings>): void {
    this.globalSettings = { ...this.globalSettings, ...settings };
    
    if (this.masterGain) {
      this.masterGain.gain.value = this.globalSettings.volume;
    }

    if (this.masterEQ.low) {
      this.masterEQ.low.gain.value = this.globalSettings.eq.low;
    }
    if (this.masterEQ.mid) {
      this.masterEQ.mid.gain.value = this.globalSettings.eq.mid;
    }
    if (this.masterEQ.high) {
      this.masterEQ.high.gain.value = this.globalSettings.eq.high;
    }
  }

  /**
   * Set drum-specific settings
   */
  setDrumSettings(drumId: string, settings: Partial<EffectSettings>): void {
    const current = this.drumSettings.get(drumId) || { ...this.globalSettings };
    this.drumSettings.set(drumId, { ...current, ...settings });
  }

  /**
   * Get drum settings
   */
  getDrumSettings(drumId: string): EffectSettings {
    return this.drumSettings.get(drumId) || { ...this.globalSettings };
  }

  /**
   * Set velocity sensitivity
   */
  setVelocitySensitivity(sensitivity: number): void {
    this.velocitySensitivity = Math.max(0, Math.min(1, sensitivity));
  }

  /**
   * Get velocity sensitivity
   */
  getVelocitySensitivity(): number {
    return this.velocitySensitivity;
  }

  /**
   * Preload sounds
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

export const enhancedAudioManager = new EnhancedAudioManager();

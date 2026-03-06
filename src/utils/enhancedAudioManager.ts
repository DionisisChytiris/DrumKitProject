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
  private audioBufferCache: Map<string, AudioBuffer> = new Map();
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
    reverb: 0.1,
    compression: 0.3,
    eq: { low: 0, mid: 0, high: 0 },
    pan: 0,
    volume: 1.0, // Set to 1.0 - individual drum volumes from mixer control the output
  };

  private drumSettings: Map<string, EffectSettings> = new Map();
  private velocitySensitivity: number = 0.5;

  /**
   * Initialize audio context and effects
   */
  private initializeAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({
        latencyHint: 'interactive', // Low latency for real-time playback
        sampleRate: 44100,
      });
      
      // Create master gain - set to 1.0 so individual drum volumes control the output
      // Individual drum volumes in the mixer should be the primary volume control
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 1.0; // Always 1.0 - let individual drum volumes control output
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
   * @param reverbAmount - Amount of reverb (0-1), uses globalSettings.reverb if not provided
   */
  private createReverbImpulse(reverbAmount?: number): void {
    if (!this.audioContext || !this.masterReverb) return;

    const amount = reverbAmount !== undefined ? reverbAmount : this.globalSettings.reverb;
    // Longer reverb for higher values (1s to 3s)
    const length = this.audioContext.sampleRate * (1 + amount * 2);
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = length - i;
      const decay = Math.pow(n / length, 2);
      // Scale by reverb amount
      impulseL[i] = (Math.random() * 2 - 1) * decay * amount;
      impulseR[i] = (Math.random() * 2 - 1) * decay * amount;
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
      // Get drum-specific settings - ALWAYS get fresh from the Map
      let drumSettings = this.drumSettings.get(soundId);
      
      // Debug: check what's in the Map - THIS IS CRITICAL FOR DEBUGGING
      console.log(`[EnhancedAudioManager] playSound for ${soundId} - RETRIEVING SETTINGS:`, {
        'hasSettings': !!drumSettings,
        'settings from Map': drumSettings,
        'settings.volume (if exists)': drumSettings?.volume,
        'allDrumIds in Map': Array.from(this.drumSettings.keys()),
        'snareSettings': this.drumSettings.get('snare'),
        'kickSettings': this.drumSettings.get('kick'),
        'ALL SETTINGS IN MAP': Array.from(this.drumSettings.entries()).map(([id, s]) => ({ id, volume: s.volume }))
      });
      
      if (soundId === 'snare') {
        console.log(`[EnhancedAudioManager] 🔍 SNARE - playSound called, retrieving settings:`, {
          'soundId': soundId,
          'hasSettings in Map?': !!drumSettings,
          'settings from Map': drumSettings,
          'settings.volume': drumSettings?.volume,
          'Map has snare?': this.drumSettings.has('snare'),
          'All entries in Map': Array.from(this.drumSettings.entries()).map(([id, s]) => ({ id, volume: s.volume }))
        });
      }
      
      // If no drum settings exist, create default with volume 0.8 (audible by default)
      if (!drumSettings) {
        console.warn(`[EnhancedAudioManager] ⚠️ No settings found for ${soundId} in Map! Creating defaults with volume 0.8`);
        drumSettings = {
          volume: 0.8, // Start at 0.8 so drums are audible by default
          pan: 0,
          reverb: 0.1,
          compression: 0.2,
          eq: { low: 0, mid: 0, high: 0 },
        };
        this.drumSettings.set(soundId, drumSettings);
        console.log(`[EnhancedAudioManager] Created default settings for ${soundId}:`, drumSettings);
      }
      
      // Use drum settings, merge with provided settings if any
      const finalSettings: EffectSettings = settings 
        ? { ...drumSettings, ...settings }
        : drumSettings;
      
      // Debug: verify we're using the correct settings - THIS IS THE VOLUME THAT WILL BE USED
      console.log(`[EnhancedAudioManager] playSound for ${soundId} - FINAL SETTINGS TO USE:`, {
        'drumSettings from Map': drumSettings,
        'finalSettings': finalSettings,
        'VOLUME FROM MAP': drumSettings.volume,
        'FINAL VOLUME TO USE': finalSettings.volume,
        'pan': finalSettings.pan,
        '⚠️ THIS VOLUME WILL BE APPLIED TO GAIN NODE': finalSettings.volume
      });

      // Apply velocity sensitivity - this affects the volume
      // velocity is typically 1.0, so velocityMultiplier will be around 0.7-1.0
      const velocityMultiplier = 0.3 + (velocity * (0.4 + this.velocitySensitivity * 0.3));
      
      console.log(`[EnhancedAudioManager] playSound for ${soundId} - Volume Debug:`, {
        'drumSettings.volume (from Map)': drumSettings.volume,
        'finalSettings.volume': finalSettings.volume,
        'velocity': velocity,
        'velocitySensitivity': this.velocitySensitivity,
        'velocityMultiplier': velocityMultiplier,
        'final volume will be': finalSettings.volume * velocityMultiplier,
        'VOLUME SHOULD BE': finalSettings.volume
      });

      if (audioUrl) {
        this.playAudioFile(soundId, audioUrl, velocityMultiplier, finalSettings, audioContext);
      } else {
        this.generateTone(soundId, velocityMultiplier, finalSettings, audioContext);
      }
      
      // Debug: log what settings were used
      console.log(`[EnhancedAudioManager] playSound completed for ${soundId} with volume:`, finalSettings.volume);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  /**
   * Decode audio file into AudioBuffer for low-latency playback
   */
  private async decodeAudioData(audioUrl: string): Promise<AudioBuffer> {
    const audioContext = this.initializeAudioContext();
    
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
   * Decode and cache audio buffer
   */
  private async decodeAndCacheAudio(soundId: string, audioUrl: string): Promise<void> {
    if (this.audioBufferCache.has(soundId)) {
      return;
    }
    try {
      const audioBuffer = await this.decodeAudioData(audioUrl);
      this.audioBufferCache.set(soundId, audioBuffer);
    } catch (error) {
      console.warn(`Failed to decode audio for ${soundId}:`, error);
    }
  }

  /**
   * Play audio file with effects using AudioBuffer for low latency
   */
  private playAudioFile(
    soundId: string,
    audioUrl: string,
    velocity: number,
    settings: EffectSettings,
    audioContext: AudioContext
  ): void {
    const audioBuffer = this.audioBufferCache.get(soundId);
    
    if (audioBuffer) {
      // Use pre-decoded AudioBuffer for instant playback (lowest latency)
      this.playAudioBufferWithEffects(soundId, audioBuffer, velocity, settings, audioContext);
    } else {
      // Fallback to HTML Audio if buffer not ready yet
      let audio = this.audioCache.get(soundId);
      
      if (!audio || (audio.src && audio.src !== audioUrl && !audioUrl.startsWith('blob:'))) {
        audio = new Audio(audioUrl);
        audio.preload = 'auto';
        this.audioCache.set(soundId, audio);
      }

      if (audio.readyState < 2) {
        audio.load();
      }

      // Create Web Audio API source from the audio element
      const source = audioContext.createMediaElementSource(audio);
      
      // Build effects chain
      const gainNode = audioContext.createGain();
      const panNode = audioContext.createStereoPanner();
      
      // Apply volume (drum volume is the PRIMARY control)
      // settings.volume is 0-1 from the mixer slider - THIS IS THE INDIVIDUAL DRUM VOLUME
      // velocity is a multiplier (typically 0.7-1.0) for velocity sensitivity
      const safeVolume = this.getSafeVolume(settings.volume);
      const safeVelocity = Number.isFinite(velocity) && !isNaN(velocity) ? velocity : 1.0;
      const finalVolume = safeVolume * safeVelocity;
      
      // CRITICAL: Set the gain value - this controls the actual volume for this individual drum
      // If settings.volume is 0, this drum should be SILENT
      gainNode.gain.value = finalVolume;
      
      // Verify the gain was set correctly
      const actualGainValue = gainNode.gain.value;
      
      // Debug: verify volume is being set correctly
      console.log(`[EnhancedAudioManager] playAudioFile VOLUME for ${soundId}:`, {
        'settings.volume (INDIVIDUAL DRUM VOLUME from mixer)': settings.volume,
        'safeVolume': safeVolume,
        'velocity (multiplier)': velocity,
        'safeVelocity': safeVelocity,
        'finalVolume (calculated)': finalVolume,
        'gainNode.gain.value (ACTUAL - THIS CONTROLS INDIVIDUAL DRUM)': actualGainValue,
        'WILL BE AUDIBLE?': actualGainValue > 0.001,
        'VOLUME IS ZERO?': actualGainValue === 0,
        'MASTER GAIN VALUE': this.masterGain?.gain.value,
        'FINAL OUTPUT WILL BE': actualGainValue * (this.masterGain?.gain.value || 1.0)
      });
      
      // TEST: If volume is 0, the sound should be completely silent
      if (settings.volume === 0) {
        console.warn(`[EnhancedAudioManager] ⚠️ VOLUME IS 0 for ${soundId} - sound should be SILENT!`);
      }
      
      // If volume is 0, the sound should be silent
      if (settings.volume === 0) {
        console.warn(`[EnhancedAudioManager] WARNING: Volume is 0 for ${soundId} - sound should be SILENT!`);
      }
      
      // Apply pan
      panNode.pan.value = settings.pan;
      
      // Create individual drum effects chain (same as AudioBuffer path)
      const drumEQ = {
        low: audioContext.createBiquadFilter(),
        mid: audioContext.createBiquadFilter(),
        high: audioContext.createBiquadFilter(),
      };
      
      drumEQ.low.type = 'lowshelf';
      drumEQ.low.frequency.value = 200;
      drumEQ.low.gain.value = settings.eq.low;
      
      drumEQ.mid.type = 'peaking';
      drumEQ.mid.frequency.value = 1000;
      drumEQ.mid.gain.value = settings.eq.mid;
      drumEQ.mid.Q.value = 1;
      
      drumEQ.high.type = 'highshelf';
      drumEQ.high.frequency.value = 5000;
      drumEQ.high.gain.value = settings.eq.high;
      
      drumEQ.low.connect(drumEQ.mid);
      drumEQ.mid.connect(drumEQ.high);
      
      // Apply reverb and compression if enabled
      let lastNode: AudioNode = drumEQ.high;
      if (settings.reverb > 0) {
        const drumReverb = audioContext.createConvolver();
        const reverbGain = audioContext.createGain();
        const dryGain = audioContext.createGain();
        
        const reverbLength = audioContext.sampleRate * (0.5 + settings.reverb * 1.5);
        const reverbImpulse = audioContext.createBuffer(2, reverbLength, audioContext.sampleRate);
        const reverbL = reverbImpulse.getChannelData(0);
        const reverbR = reverbImpulse.getChannelData(1);
        
        for (let i = 0; i < reverbLength; i++) {
          const n = reverbLength - i;
          reverbL[i] = (Math.random() * 2 - 1) * Math.pow(n / reverbLength, 2) * settings.reverb;
          reverbR[i] = (Math.random() * 2 - 1) * Math.pow(n / reverbLength, 2) * settings.reverb;
        }
        
        drumReverb.buffer = reverbImpulse;
        reverbGain.gain.value = settings.reverb * 0.5;
        dryGain.gain.value = 1 - (settings.reverb * 0.3);
        
        lastNode.connect(dryGain);
        lastNode.connect(reverbGain);
        reverbGain.connect(drumReverb);
        drumReverb.connect(dryGain);
        
        const mergeGain = audioContext.createGain();
        dryGain.connect(mergeGain);
        lastNode = mergeGain;
      }
      
      if (settings.compression > 0) {
        const drumCompressor = audioContext.createDynamicsCompressor();
        drumCompressor.threshold.value = -24 - (settings.compression * 20);
        drumCompressor.knee.value = 30;
        drumCompressor.ratio.value = 4 + (settings.compression * 8);
        drumCompressor.attack.value = 0.003;
        drumCompressor.release.value = 0.25;
        
        lastNode.connect(drumCompressor);
        lastNode = drumCompressor;
      }
      
      // Connect: source -> gain -> pan -> drumEQ -> (drumReverb) -> (drumCompressor) -> master chain
      source.connect(gainNode);
      gainNode.connect(panNode);
      panNode.connect(drumEQ.low);
      lastNode.connect(this.masterEQ.low!);
      
      // Play the audio
      audio.currentTime = 0;
      audio.play().catch(console.warn);
      
      // Try to decode and cache for next time (async, non-blocking)
      this.decodeAndCacheAudio(soundId, audioUrl).catch(() => {
        // Silent fail - will use HTML Audio fallback
      });
    }
  }

  /**
   * Play AudioBuffer with effects - ultra-low latency
   */
  private playAudioBufferWithEffects(
    soundId: string,
    audioBuffer: AudioBuffer,
    velocity: number,
    settings: EffectSettings,
    audioContext: AudioContext
  ): void {
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    const panNode = audioContext.createStereoPanner();
    
    source.buffer = audioBuffer;
    
    // Apply volume (drum volume is the PRIMARY control)
    // settings.volume is 0-1 from the mixer slider - THIS IS THE INDIVIDUAL DRUM VOLUME
    // velocity is a multiplier (typically 0.7-1.0) for velocity sensitivity
    // The final volume = settings.volume * velocity
    // IMPORTANT: Individual drum volume should directly control the gain node
    const safeVolume = this.getSafeVolume(settings.volume);
    const safeVelocity = Number.isFinite(velocity) && !isNaN(velocity) ? velocity : 1.0;
    const finalVolume = safeVolume * safeVelocity;
    
    // CRITICAL: Set the gain value BEFORE connecting
    // This is the ACTUAL volume that will be heard for this individual drum
    // If settings.volume is 0, this drum should be SILENT
    gainNode.gain.value = finalVolume;
    
    // Verify the gain was set correctly
    const actualGain = gainNode.gain.value;
    
    // Debug: Log volume application - this is CRITICAL for debugging
    const masterGainValue = this.masterGain?.gain.value || 1.0;
    const finalOutputVolume = actualGain * masterGainValue;
    
    console.log(`[EnhancedAudioManager] playAudioBufferWithEffects VOLUME for ${soundId}:`, {
      'settings.volume (INDIVIDUAL DRUM VOLUME from mixer)': settings.volume,
      'safeVolume': safeVolume,
      'velocity (multiplier)': velocity,
      'safeVelocity': safeVelocity,
      'finalVolume (calculated)': finalVolume,
      'gainNode.gain.value (ACTUAL - THIS CONTROLS INDIVIDUAL DRUM)': actualGain,
      'MASTER GAIN VALUE (GLOBAL VOLUME)': masterGainValue,
      'FINAL OUTPUT VOLUME (individual * global)': finalOutputVolume,
      'WILL BE AUDIBLE?': finalOutputVolume > 0.001,
      'VOLUME IS ZERO?': actualGain === 0 || finalOutputVolume === 0,
      '⚠️ IF GLOBAL VOLUME IS LOW, INDIVIDUAL CHANGES WON\'T BE AUDIBLE!': masterGainValue < 0.5
    });
    
    // TEST: If volume is 0, the sound should be completely silent
    if (settings.volume === 0) {
      console.warn(`[EnhancedAudioManager] ⚠️ VOLUME IS 0 for ${soundId} - sound should be SILENT!`);
    }
    
    // WARNING: If global volume is very low, individual volume changes won't be noticeable
    if (masterGainValue < 0.3 && settings.volume > 0) {
      console.warn(`[EnhancedAudioManager] ⚠️ WARNING: Global volume is ${masterGainValue} (${Math.round(masterGainValue * 100)}%) - individual volume changes may not be audible!`);
    }
    
    // Apply pan
    panNode.pan.value = settings.pan;
    
    // Create individual drum effects chain
    // Build: source -> gain -> pan -> drumEQ -> drumReverb -> drumCompressor -> master chain
    
    // Create drum-specific EQ
    const drumEQ = {
      low: audioContext.createBiquadFilter(),
      mid: audioContext.createBiquadFilter(),
      high: audioContext.createBiquadFilter(),
    };
    
    drumEQ.low.type = 'lowshelf';
    drumEQ.low.frequency.value = 200;
    drumEQ.low.gain.value = settings.eq.low;
    
    drumEQ.mid.type = 'peaking';
    drumEQ.mid.frequency.value = 1000;
    drumEQ.mid.gain.value = settings.eq.mid;
    drumEQ.mid.Q.value = 1;
    
    drumEQ.high.type = 'highshelf';
    drumEQ.high.frequency.value = 5000;
    drumEQ.high.gain.value = settings.eq.high;
    
    // Connect EQ chain
    drumEQ.low.connect(drumEQ.mid);
    drumEQ.mid.connect(drumEQ.high);
    
    // Create drum-specific reverb (if enabled)
    let lastNode: AudioNode = drumEQ.high;
    if (settings.reverb > 0) {
      const drumReverb = audioContext.createConvolver();
      const reverbGain = audioContext.createGain();
      const dryGain = audioContext.createGain();
      
      // Create simple reverb impulse
      const reverbLength = audioContext.sampleRate * (0.5 + settings.reverb * 1.5);
      const reverbImpulse = audioContext.createBuffer(2, reverbLength, audioContext.sampleRate);
      const reverbL = reverbImpulse.getChannelData(0);
      const reverbR = reverbImpulse.getChannelData(1);
      
      for (let i = 0; i < reverbLength; i++) {
        const n = reverbLength - i;
        reverbL[i] = (Math.random() * 2 - 1) * Math.pow(n / reverbLength, 2) * settings.reverb;
        reverbR[i] = (Math.random() * 2 - 1) * Math.pow(n / reverbLength, 2) * settings.reverb;
      }
      
      drumReverb.buffer = reverbImpulse;
      reverbGain.gain.value = settings.reverb * 0.5; // Mix reverb
      dryGain.gain.value = 1 - (settings.reverb * 0.3); // Keep dry signal
      
      // Split signal: dry and wet (reverb)
      lastNode.connect(dryGain);
      lastNode.connect(reverbGain);
      reverbGain.connect(drumReverb);
      drumReverb.connect(dryGain);
      
      // Merge dry and wet
      const mergeGain = audioContext.createGain();
      dryGain.connect(mergeGain);
      lastNode = mergeGain;
    }
    
    // Create drum-specific compressor (if enabled)
    if (settings.compression > 0) {
      const drumCompressor = audioContext.createDynamicsCompressor();
      drumCompressor.threshold.value = -24 - (settings.compression * 20);
      drumCompressor.knee.value = 30;
      drumCompressor.ratio.value = 4 + (settings.compression * 8);
      drumCompressor.attack.value = 0.003;
      drumCompressor.release.value = 0.25;
      
      lastNode.connect(drumCompressor);
      lastNode = drumCompressor;
    }
    
    // Connect: source -> gain -> pan -> drumEQ -> (drumReverb) -> (drumCompressor) -> master chain
    source.connect(gainNode);
    gainNode.connect(panNode);
    panNode.connect(drumEQ.low);
    lastNode.connect(this.masterEQ.low!);
    
    // Debug: verify all settings are being applied
    console.log(`[EnhancedAudioManager] playAudioBufferWithEffects for ${soundId}:`, {
      'settings.volume': settings.volume,
      'settings.pan': settings.pan,
      'settings.reverb': settings.reverb,
      'settings.compression': settings.compression,
      'settings.eq': settings.eq,
      'velocity': velocity,
      'calculated finalVolume': finalVolume,
      'gainNode.gain.value (actual)': actualGain,
      'WILL BE AUDIBLE?': actualGain > 0.01
    });
    
    // Start playback
    source.start(0);
    source.start(0);
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
   * Set global volume (separate from EffectSettings)
   * This is the master volume that affects all drums
   */
  setGlobalVolume(volume: number): void {
    if (!Number.isFinite(volume) || isNaN(volume)) {
      console.warn(`[EnhancedAudioManager] Invalid global volume: ${volume}`);
      return;
    }
    const safeVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      const oldValue = this.masterGain.gain.value;
      this.masterGain.gain.value = safeVolume;
      console.log(`[EnhancedAudioManager] Set global volume (master gain): ${oldValue} -> ${safeVolume} (${Math.round(safeVolume * 100)}%)`);
      
      // WARNING: If global volume is low, individual drum volumes won't be noticeable
      if (safeVolume < 0.5) {
        console.warn(`[EnhancedAudioManager] ⚠️ WARNING: Global volume is ${safeVolume} (${Math.round(safeVolume * 100)}%) - individual drum volume changes may not be audible!`);
        console.warn(`[EnhancedAudioManager] ⚠️ SUGGESTION: Increase global volume to hear individual drum volume changes`);
      }
    }
  }

  /**
   * Set global settings
   */
  setGlobalSettings(settings: Partial<EffectSettings>): void {
    this.globalSettings = { ...this.globalSettings, ...settings };
    
    // Note: Global volume is now controlled separately via setGlobalVolume()
    // Master gain is set by setGlobalVolume(), not here

    // Update master EQ
    if (this.masterEQ.low) {
      this.masterEQ.low.gain.value = this.globalSettings.eq.low;
    }
    if (this.masterEQ.mid) {
      this.masterEQ.mid.gain.value = this.globalSettings.eq.mid;
    }
    if (this.masterEQ.high) {
      this.masterEQ.high.gain.value = this.globalSettings.eq.high;
    }

    // Update master reverb - recreate impulse response based on global reverb amount
    if (settings.reverb !== undefined && this.masterReverb && this.audioContext) {
      const reverbAmount = this.globalSettings.reverb;
      const length = this.audioContext.sampleRate * (1 + reverbAmount * 2); // Longer reverb for higher values
      const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
      const impulseL = impulse.getChannelData(0);
      const impulseR = impulse.getChannelData(1);

      for (let i = 0; i < length; i++) {
        const n = length - i;
        const decay = Math.pow(n / length, 2);
        impulseL[i] = (Math.random() * 2 - 1) * decay * reverbAmount;
        impulseR[i] = (Math.random() * 2 - 1) * decay * reverbAmount;
      }

      this.masterReverb.buffer = impulse;
      console.log(`[EnhancedAudioManager] Updated master reverb:`, { reverbAmount, length });
    }

    // Update master compressor based on global compression amount
    if (settings.compression !== undefined && this.masterCompressor) {
      const compressionAmount = this.globalSettings.compression;
      // Adjust compressor parameters based on compression amount
      // Higher compression = lower threshold, higher ratio
      this.masterCompressor.threshold.value = -24 - (compressionAmount * 20); // -24 to -44 dB
      this.masterCompressor.knee.value = 30;
      this.masterCompressor.ratio.value = 4 + (compressionAmount * 8); // 4:1 to 12:1
      this.masterCompressor.attack.value = 0.003;
      this.masterCompressor.release.value = 0.25;
      console.log(`[EnhancedAudioManager] Updated master compressor:`, {
        compressionAmount,
        threshold: this.masterCompressor.threshold.value,
        ratio: this.masterCompressor.ratio.value,
      });
    }
  }

  /**
   * Set drum-specific settings
   */
  setDrumSettings(drumId: string, settings: Partial<EffectSettings>): void {
    console.log(`[EnhancedAudioManager] setDrumSettings called for ${drumId}:`, {
      'incoming settings': settings,
      'has volume?': settings.volume !== undefined,
      'volume value': settings.volume
    });
    
    if (drumId === 'snare') {
      console.log(`[EnhancedAudioManager] 🔍 SNARE - setDrumSettings called:`, {
        drumId,
        'incoming settings': settings,
        'settings.volume': settings.volume,
        'typeof volume': typeof settings.volume,
        'isFinite?': settings.volume !== undefined ? Number.isFinite(settings.volume) : 'N/A'
      });
    }
    
    // Get current settings or use defaults
    const current = this.drumSettings.get(drumId) || {
      volume: 0.8, // Default to 0.8 so drums are audible
      pan: 0,
      reverb: 0.1,
      compression: 0.2,
      eq: { low: 0, mid: 0, high: 0 },
    };
    
    console.log(`[EnhancedAudioManager] Current settings for ${drumId}:`, current);
    
    // Always create a new object to avoid mutating read-only Redux state
    // If settings object has all properties, create a copy (from Redux)
    // Otherwise merge with current settings
    let mergedSettings: EffectSettings;
    
    // Check if we have a complete settings object (from Redux)
    const hasAllProperties = settings.volume !== undefined && 
                             settings.pan !== undefined && 
                             settings.reverb !== undefined && 
                             settings.compression !== undefined && 
                             settings.eq !== undefined;
    
    if (hasAllProperties) {
      // Complete settings object from Redux - create a new object (don't use Redux object directly)
      mergedSettings = {
        volume: settings.volume!,
        pan: settings.pan!,
        reverb: settings.reverb!,
        compression: settings.compression!,
        eq: { ...settings.eq! }, // Create new eq object too
      };
      console.log(`[EnhancedAudioManager] Using complete settings from Redux for ${drumId}`);
    } else {
      // Partial settings - merge with current
      mergedSettings = {
        volume: settings.volume !== undefined ? settings.volume : current.volume,
        pan: settings.pan !== undefined ? settings.pan : current.pan,
        reverb: settings.reverb !== undefined ? settings.reverb : current.reverb,
        compression: settings.compression !== undefined ? settings.compression : current.compression,
        eq: settings.eq ? { ...current.eq, ...settings.eq } : { ...current.eq },
      };
      console.log(`[EnhancedAudioManager] Merged partial settings for ${drumId}`);
    }
    
    console.log(`[EnhancedAudioManager] Merged settings for ${drumId}:`, mergedSettings);
    
    // Validate volume is finite before storing - create a new object to avoid mutating read-only Redux state
    let validatedSettings: EffectSettings;
    if (!Number.isFinite(mergedSettings.volume) || isNaN(mergedSettings.volume)) {
      console.warn(`[EnhancedAudioManager] Invalid volume for ${drumId}: ${mergedSettings.volume}, resetting to 0.8`);
      validatedSettings = {
        ...mergedSettings,
        volume: 0.8,
      };
    } else {
      // Clamp volume between 0 and 1 - create new object
      const clampedVolume = Math.max(0, Math.min(1, mergedSettings.volume));
      validatedSettings = {
        ...mergedSettings,
        volume: clampedVolume,
      };
      if (clampedVolume !== mergedSettings.volume) {
        console.log(`[EnhancedAudioManager] Clamped volume for ${drumId} from ${mergedSettings.volume} to ${clampedVolume}`);
      }
    }
    
    // Store the validated settings (new object, not the read-only one from Redux)
    this.drumSettings.set(drumId, validatedSettings);
    
    // Verify it was stored correctly
    const stored = this.drumSettings.get(drumId);
    console.log(`[EnhancedAudioManager] Stored settings for ${drumId}:`, {
      'stored': stored,
      'volume': stored?.volume,
      'VERIFICATION - stored volume matches?': stored?.volume === validatedSettings.volume
    });
    
    if (drumId === 'snare') {
      console.log(`[EnhancedAudioManager] 🔍 SNARE - Settings stored:`, {
        'stored volume': stored?.volume,
        'validated volume': validatedSettings.volume,
        'MATCH?': stored?.volume === validatedSettings.volume,
        'Map has snare?': this.drumSettings.has('snare'),
        'All keys in Map': Array.from(this.drumSettings.keys())
      });
    }
  }

  /**
   * Get a safe volume value (ensures it's finite and between 0-1)
   */
  private getSafeVolume(volume: number): number {
    // Check if volume is a valid finite number
    if (!Number.isFinite(volume) || isNaN(volume)) {
      console.warn(`[EnhancedAudioManager] Invalid volume value: ${volume}, using 0.8`);
      return 0.8;
    }
    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, volume));
  }

  /**
   * Get drum settings
   */
  getDrumSettings(drumId: string): EffectSettings {
    const settings = this.drumSettings.get(drumId);
    if (settings) {
      return settings;
    }
    // Return default settings with volume 0.8 (audible by default)
    return {
      volume: 0.8, // Default to 0.8 so drums are audible
      pan: 0,
      reverb: 0.1,
      compression: 0.2,
      eq: { low: 0, mid: 0, high: 0 },
    };
  }

  /**
   * Check if drum has custom settings
   */
  hasDrumSettings(drumId: string): boolean {
    return this.drumSettings.has(drumId);
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
   * Preload sounds - decodes to AudioBuffer for low latency
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

export const enhancedAudioManager = new EnhancedAudioManager();

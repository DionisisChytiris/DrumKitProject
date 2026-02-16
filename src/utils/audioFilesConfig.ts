/**
 * Audio Files Configuration
 * 
 * Add your audio files to public/audio/ and list them here.
 * The system will automatically make them available in the customization modal.
 * 
 * Format: { id: string, name: string, file: string, type: string }
 * - id: unique identifier
 * - name: display name shown to users
 * - file: filename in public/audio/ (e.g., "snare1.wav")
 * - type: drum type (kick, snare, tom, cymbal, hihat)
 */

export interface AudioFileConfig {
  id: string;
  name: string;
  file: string; // filename in public/audio/
  type: string;
}

/**
 * Available audio files organized by drum type
 * 
 * TO ADD MORE SOUNDS:
 * 1. Add your audio file to public/audio/ (e.g., kick1.wav)
 * 2. Add an entry below with the format:
 *    { id: 'unique-id', name: 'Display Name', file: 'filename.wav', type: 'drum-type' }
 * 3. The file will automatically appear in the customization modal!
 * 
 * DRUM TYPES:
 * - 'kick' - for kick drums
 * - 'snare' - for snare drums
 * - 'tom' - for all toms (high-tom, mid-tom, floor-tom, low-floor-tom)
 * - 'cymbal' - for all cymbals (crash, crash-2, ride, china)
 * - 'hihat' - for hi-hats
 */
export const audioFilesConfig: Record<string, AudioFileConfig[]> = {
  kick: [
    { id: 'kick-1', name: 'Kick 1', file: 'kick 1.wav', type: 'kick' },
    { id: 'kick-2', name: 'Kick 2', file: 'kick 2.wav', type: 'kick' },
    // Example: { id: 'kick-1', name: 'Kick 1', file: 'kick1.wav', type: 'kick' },
    // Example: { id: 'kick-2', name: 'Kick 2', file: 'kick2.wav', type: 'kick' },
  ],
  snare: [
    { id: 'snare-1', name: 'Snare 1', file: 'snare1.wav', type: 'snare' },
    // Add more snare files here:
    // { id: 'snare-2', name: 'Snare 2', file: 'snare2.wav', type: 'snare' },
    // { id: 'snare-3', name: 'Snare 3', file: 'snare3.wav', type: 'snare' },
  ],
  tom: [
    // Add tom files here (works for high-tom, mid-tom, floor-tom, low-floor-tom):
    // { id: 'tom-1', name: 'Tom 1', file: 'tom1.wav', type: 'tom' },
    // { id: 'tom-2', name: 'Tom 2', file: 'tom2.wav', type: 'tom' },
  ],
  cymbal: [
    // Add cymbal files here (works for crash, crash-2, ride, china):
    // { id: 'crash-1', name: 'Crash 1', file: 'crash1.wav', type: 'cymbal' },
    // { id: 'ride-1', name: 'Ride 1', file: 'ride1.wav', type: 'cymbal' },
  ],
  hihat: [
    // Add hihat files here:
    // { id: 'hihat-1', name: 'Hi-Hat 1', file: 'hihat1.wav', type: 'hihat' },
    // { id: 'hihat-2', name: 'Hi-Hat 2', file: 'hihat2.wav', type: 'hihat' },
  ],
};

/**
 * Get audio URL from file config
 */
export const getAudioUrlFromConfig = (config: AudioFileConfig): string => {
  return `/audio/${config.file}`;
};

/**
 * Get all available audio files for a specific drum type
 */
export const getAudioFilesForType = (type: string): AudioFileConfig[] => {
  return audioFilesConfig[type] || [];
};

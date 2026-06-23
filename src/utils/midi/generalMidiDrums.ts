/** Common General MIDI percussion note numbers (channel 10 convention). */
const GM_DRUM_NAMES: Record<number, string> = {
  35: 'Acoustic bass drum',
  36: 'Bass drum 1',
  37: 'Side stick',
  38: 'Acoustic snare',
  39: 'Hand clap',
  40: 'Electric snare',
  41: 'Low floor tom',
  42: 'Closed hi-hat',
  43: 'High floor tom',
  44: 'Pedal hi-hat',
  45: 'Low tom',
  46: 'Open hi-hat',
  47: 'Low-mid tom',
  48: 'Hi-mid tom',
  49: 'Crash cymbal 1',
  50: 'High tom',
  51: 'Ride cymbal 1',
  52: 'Chinese cymbal',
  53: 'Ride bell',
  54: 'Tambourine',
  55: 'Splash cymbal',
  56: 'Cowbell',
  57: 'Crash cymbal 2',
  59: 'Ride cymbal 2',
};

export function getGeneralMidiDrumLabel(note: number): string {
  return GM_DRUM_NAMES[note] ?? `MIDI note ${note}`;
}

export type MidiConnectionStatus = 'idle' | 'requesting' | 'connected' | 'error' | 'unsupported';

export interface MidiInputSummary {
  id: string;
  name: string;
  manufacturer: string;
  state: MIDIPortDeviceState;
}

/** A single drum pad hit parsed from a MIDI Note On message. */
export interface MidiNoteEvent {
  note: number;
  velocity: number;
  /** DOMHighResTimeStamp from the Web MIDI API (ms, monotonic). */
  timestamp: number;
  channel: number;
}

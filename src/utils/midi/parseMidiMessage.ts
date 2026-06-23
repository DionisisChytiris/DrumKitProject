import type { MidiNoteEvent } from '@/types/midiTypes';

const NOTE_ON = 0x90;

function dataBytesForCommand(command: number): number {
  // Program change and channel pressure carry one data byte; others carry two.
  return command === 0xc0 || command === 0xd0 ? 1 : 2;
}

/**
 * Parse every Note On in a MIDI packet (handles running status and multi-message bursts).
 * E-drum modules often send simultaneous pad hits in one `MIDIMessageEvent.data` array.
 */
export function parseAllMidiNoteOns(data: Uint8Array, timestamp: number): MidiNoteEvent[] {
  const events: MidiNoteEvent[] = [];
  let runningStatus = 0;
  let i = 0;

  while (i < data.length) {
    const byte = data[i];

    // Real-time messages (clock, tick, …) — single byte, no data.
    if (byte >= 0xf8) {
      i += 1;
      continue;
    }

    // SysEx — skip until end byte or buffer end.
    if (byte === 0xf0) {
      i += 1;
      while (i < data.length && data[i] !== 0xf7) {
        i += 1;
      }
      if (i < data.length) {
        i += 1;
      }
      continue;
    }

    if (byte >= 0x80) {
      runningStatus = byte;
      i += 1;
    } else if (!runningStatus) {
      i += 1;
      continue;
    }

    const command = runningStatus & 0xf0;
    const channel = runningStatus & 0x0f;
    const dataLen = dataBytesForCommand(command);

    if (i + dataLen > data.length) {
      break;
    }

    if (command === NOTE_ON) {
      const note = data[i];
      const velocity = dataLen === 2 ? data[i + 1] : 0;
      if (velocity > 0) {
        events.push({ note, velocity, timestamp, channel });
      }
    }

    i += dataLen;
  }

  return events;
}

/**
 * Parse a single MIDI message into a note-on hit, or null if not a playable note-on.
 * Handles velocity-0 note-on (common note-off alias on some modules).
 */
export function parseMidiNoteOn(data: Uint8Array, timestamp: number): MidiNoteEvent | null {
  const events = parseAllMidiNoteOns(data, timestamp);
  return events[0] ?? null;
}

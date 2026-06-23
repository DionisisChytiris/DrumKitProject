import type { MidiNoteEvent } from '@/types/midiTypes';

/** GM notes that all map to the app hi-hat. Modules often fire several per stroke. */
const HIHAT_GM_NOTES = new Set([42, 44, 46]);

function hihatNotePriority(note: number): number {
  if (note === 42) return 3;
  if (note === 44) return 2;
  if (note === 46) return 1;
  return 0;
}

function pickBestHihatEvent(events: MidiNoteEvent[]): MidiNoteEvent {
  return events.reduce((best, event) => {
    const bestRank = hihatNotePriority(best.note);
    const eventRank = hihatNotePriority(event.note);
    if (eventRank > bestRank) return event;
    if (eventRank < bestRank) return best;
    return event.velocity > best.velocity ? event : best;
  });
}

/**
 * Collapse multiple hi-hat note-ons in one MIDI packet into a single hit.
 * E-drum brains often send closed pad (42) + pedal (44) together for one stroke.
 */
export function coalescePadBurstNoteOns(events: MidiNoteEvent[]): MidiNoteEvent[] {
  if (events.length <= 1) return events;

  const result: MidiNoteEvent[] = [];
  const hihatBurst: MidiNoteEvent[] = [];

  for (const event of events) {
    if (HIHAT_GM_NOTES.has(event.note)) {
      hihatBurst.push(event);
    } else {
      result.push(event);
    }
  }

  if (hihatBurst.length === 1) {
    result.push(hihatBurst[0]);
  } else if (hihatBurst.length > 1) {
    result.push(pickBestHihatEvent(hihatBurst));
  }

  return result;
}

/** Minimum wall-clock gap between MIDI hi-hat triggers (filters double-fire / pedal echo). */
export const MIDI_HIHAT_MIN_INTERVAL_MS = 28;

/**
 * Returns true when the hi-hat hit should play. Filters double-fire within one stroke.
 * Uses wall-clock time because Web MIDI timestamps can repeat inside one packet.
 */
export function acceptMidiHihatHit(lastHitWallMs: { current: number }): boolean {
  const now = performance.now();
  if (now - lastHitWallMs.current < MIDI_HIHAT_MIN_INTERVAL_MS) {
    return false;
  }
  lastHitWallMs.current = now;
  return true;
}

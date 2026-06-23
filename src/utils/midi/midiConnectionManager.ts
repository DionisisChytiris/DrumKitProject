import type { MidiConnectionStatus, MidiInputSummary, MidiNoteEvent } from '@/types/midiTypes';
import { parseAllMidiNoteOns } from '@/utils/midi/parseMidiMessage';
import { coalescePadBurstNoteOns } from '@/utils/midi/midiHitCoalescing';
import { isWebMidiSupported } from '@/utils/midi/midiSupport';

const SELECTED_INPUT_STORAGE_KEY = 'drumkit.midi.selectedInputId';
const USER_DISCONNECTED_STORAGE_KEY = 'drumkit.midi.userDisconnected';

export interface MidiConnectionSnapshot {
  supported: boolean;
  status: MidiConnectionStatus;
  errorMessage: string;
  inputs: MidiInputSummary[];
  selectedInputId: string | null;
}

function summarizeInput(input: MIDIInput): MidiInputSummary {
  return {
    id: input.id,
    name: input.name || 'Unnamed device',
    manufacturer: input.manufacturer || 'Unknown',
    state: input.state,
  };
}

function readStoredInputId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SELECTED_INPUT_STORAGE_KEY);
}

function storeInputId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (id) {
    localStorage.setItem(SELECTED_INPUT_STORAGE_KEY, id);
  } else {
    localStorage.removeItem(SELECTED_INPUT_STORAGE_KEY);
  }
}

/** Single shared Web MIDI connection for the whole app. */
class MidiConnectionManager {
  private access: MIDIAccess | null = null;
  private activeInput: MIDIInput | null = null;
  private messageHandler: ((event: MIDIMessageEvent) => void) | null = null;
  private readonly noteListeners = new Set<(event: MidiNoteEvent) => void>();
  private readonly stateListeners = new Set<() => void>();
  private snapshot: MidiConnectionSnapshot;

  constructor() {
    const supported = isWebMidiSupported();
    this.snapshot = {
      supported,
      status: supported ? 'idle' : 'unsupported',
      errorMessage: '',
      inputs: [],
      selectedInputId: null,
    };
  }

  getSnapshot(): MidiConnectionSnapshot {
    return this.snapshot;
  }

  isUserDisconnected(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(USER_DISCONNECTED_STORAGE_KEY) === 'true';
  }

  subscribeState(listener: () => void): () => void {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  subscribeNote(listener: (event: MidiNoteEvent) => void): () => void {
    this.noteListeners.add(listener);
    return () => {
      this.noteListeners.delete(listener);
    };
  }

  private emitState(): void {
    for (const listener of this.stateListeners) {
      listener();
    }
  }

  private emitNote(event: MidiNoteEvent): void {
    for (const listener of this.noteListeners) {
      listener(event);
    }
  }

  private setSnapshot(partial: Partial<MidiConnectionSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial };
    this.emitState();
  }

  private detachActiveInput(): void {
    const input = this.activeInput;
    const handler = this.messageHandler;
    if (input && handler) {
      input.onmidimessage = null;
    }
    this.activeInput = null;
    this.messageHandler = null;
  }

  private attachStoredOrFirstInput(): void {
    const access = this.access;
    if (!access) return;

    const storedId = readStoredInputId();
    if (storedId && access.inputs.has(storedId)) {
      this.attachInput(access.inputs.get(storedId)!);
      return;
    }

    const firstInput = access.inputs.values().next().value as MIDIInput | undefined;
    if (firstInput) {
      this.attachInput(firstInput);
      return;
    }

    this.setSnapshot({
      selectedInputId: null,
      status: 'idle',
      errorMessage:
        'MIDI access granted, but no input devices were found. Plug in your kit and refresh.',
    });
  }

  private attachInput(input: MIDIInput): void {
    this.detachActiveInput();

    const onMessage = (event: MIDIMessageEvent) => {
      const data = event.data;
      if (!data) return;

      const parsedEvents = coalescePadBurstNoteOns(
        parseAllMidiNoteOns(data, event.timeStamp),
      );
      if (parsedEvents.length === 0) return;

      for (const parsed of parsedEvents) {
        this.emitNote(parsed);
      }
    };

    input.onmidimessage = onMessage;
    this.activeInput = input;
    this.messageHandler = onMessage;
    storeInputId(input.id);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_DISCONNECTED_STORAGE_KEY);
    }
    this.setSnapshot({
      selectedInputId: input.id,
      status: 'connected',
      errorMessage: '',
    });
  }

  private refreshInputs(access: MIDIAccess): void {
    const next = Array.from(access.inputs.values()).map(summarizeInput);
    this.setSnapshot({ inputs: next });
  }

  async requestAccess(): Promise<void> {
    if (!this.snapshot.supported) {
      this.setSnapshot({ status: 'unsupported' });
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_DISCONNECTED_STORAGE_KEY);
    }

    if (this.access) {
      this.refreshInputs(this.access);
      if (!this.activeInput) {
        this.attachStoredOrFirstInput();
      }
      return;
    }

    this.setSnapshot({ status: 'requesting', errorMessage: '' });

    try {
      const access = await navigator.requestMIDIAccess({ sysex: false });
      this.access = access;
      access.onstatechange = () => {
        this.refreshInputs(access);
      };

      this.refreshInputs(access);
      this.attachStoredOrFirstInput();
    } catch (error) {
      this.setSnapshot({
        status: 'error',
        errorMessage:
          error instanceof Error ? error.message : 'Could not access MIDI devices.',
      });
    }
  }

  selectInput(inputId: string): void {
    const access = this.access;
    if (!access) return;

    const input = access.inputs.get(inputId);
    if (!input) {
      this.setSnapshot({
        errorMessage: 'That MIDI device is no longer available. Try reconnecting your kit.',
        status: 'error',
      });
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_DISCONNECTED_STORAGE_KEY);
    }
    this.attachInput(input);
  }

  disconnect(): void {
    this.detachActiveInput();
    storeInputId(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_DISCONNECTED_STORAGE_KEY, 'true');
    }
    this.setSnapshot({
      selectedInputId: null,
      status: this.access ? 'idle' : this.snapshot.status,
      errorMessage: '',
    });
  }

  teardown(): void {
    this.detachActiveInput();
    if (this.access) {
      this.access.onstatechange = null;
      this.access = null;
    }
  }
}

export const midiConnectionManager = new MidiConnectionManager();

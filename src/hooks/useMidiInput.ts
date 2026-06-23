import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { MidiConnectionStatus, MidiInputSummary, MidiNoteEvent } from '@/types/midiTypes';
import { getGeneralMidiDrumLabel } from '@/utils/midi/generalMidiDrums';
import {
  midiConnectionManager,
  type MidiConnectionSnapshot,
} from '@/utils/midi/midiConnectionManager';

export interface UseMidiInputOptions {
  /** Called on each parsed Note On (velocity &gt; 0). */
  onNoteOn?: (event: MidiNoteEvent) => void;
  /** Request MIDI access on mount when supported (reuses stored device when possible). */
  autoConnect?: boolean;
  /**
   * When false, skips React state updates for each hit (lower latency on Practice).
   * Pad test on Connect MIDI should leave this enabled (default).
   */
  trackLastNote?: boolean;
}

export interface UseMidiInputResult {
  supported: boolean;
  status: MidiConnectionStatus;
  errorMessage: string;
  inputs: MidiInputSummary[];
  selectedInputId: string | null;
  selectedInputName: string | null;
  lastNoteEvent: MidiNoteEvent | null;
  lastNoteLabel: string | null;
  requestAccess: () => Promise<void>;
  selectInput: (inputId: string) => void;
  disconnect: () => void;
}

function subscribeMidiState(onStoreChange: () => void): () => void {
  return midiConnectionManager.subscribeState(onStoreChange);
}

function getMidiSnapshot(): MidiConnectionSnapshot {
  return midiConnectionManager.getSnapshot();
}

export function useMidiInput(options: UseMidiInputOptions = {}): UseMidiInputResult {
  const { onNoteOn, autoConnect = false, trackLastNote = true } = options;
  const onNoteOnRef = useRef(onNoteOn);
  onNoteOnRef.current = onNoteOn;

  const snapshot = useSyncExternalStore(subscribeMidiState, getMidiSnapshot, getMidiSnapshot);
  const [lastNoteEvent, setLastNoteEvent] = useState<MidiNoteEvent | null>(null);

  useEffect(() => {
    if (!onNoteOn) return undefined;
    return midiConnectionManager.subscribeNote((event) => {
      onNoteOnRef.current?.(event);
    });
  }, [onNoteOn]);

  useEffect(() => {
    if (!trackLastNote) return undefined;
    return midiConnectionManager.subscribeNote((event) => {
      setLastNoteEvent(event);
    });
  }, [trackLastNote]);

  useEffect(() => {
    if (snapshot.status !== 'connected') {
      setLastNoteEvent(null);
    }
  }, [snapshot.status]);

  const autoConnectAttemptedRef = useRef(false);
  useEffect(() => {
    if (!autoConnect || !snapshot.supported) return;
    if (midiConnectionManager.isUserDisconnected()) return;
    if (autoConnectAttemptedRef.current) return;
    autoConnectAttemptedRef.current = true;
    void midiConnectionManager.requestAccess();
  }, [autoConnect, snapshot.supported]);

  const requestAccess = useCallback(() => midiConnectionManager.requestAccess(), []);
  const selectInput = useCallback((inputId: string) => {
    midiConnectionManager.selectInput(inputId);
  }, []);
  const disconnect = useCallback(() => {
    midiConnectionManager.disconnect();
  }, []);

  const selectedInput = snapshot.inputs.find((input) => input.id === snapshot.selectedInputId) ?? null;

  return {
    supported: snapshot.supported,
    status: snapshot.status,
    errorMessage: snapshot.errorMessage,
    inputs: snapshot.inputs,
    selectedInputId: snapshot.selectedInputId,
    selectedInputName: selectedInput?.name ?? null,
    lastNoteEvent: trackLastNote ? lastNoteEvent : null,
    lastNoteLabel: lastNoteEvent ? getGeneralMidiDrumLabel(lastNoteEvent.note) : null,
    requestAccess,
    selectInput,
    disconnect,
  };
}

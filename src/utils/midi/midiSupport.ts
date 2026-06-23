const RECOMMENDED_BROWSERS = 'Google Chrome or Microsoft Edge';

export function isWebMidiSupported(): boolean {
  return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
}

export function getWebMidiUnsupportedMessage(): string {
  return `Web MIDI is not available in this browser. Open this app in ${RECOMMENDED_BROWSERS} on a desktop or laptop for electric drum kit support.`;
}

export interface BrowserMidiHint {
  id: 'chromium' | 'firefox' | 'safari' | 'other';
  label: string;
  status: 'supported' | 'limited' | 'unsupported';
  detail: string;
}

/** Best-effort browser label for the Connect MIDI setup UI (not used for security). */
export function detectBrowserMidiHint(): BrowserMidiHint {
  if (typeof navigator === 'undefined') {
    return {
      id: 'other',
      label: 'Unknown browser',
      status: 'unsupported',
      detail: getWebMidiUnsupportedMessage(),
    };
  }

  const ua = navigator.userAgent;
  const webMidi = isWebMidiSupported();

  if (/firefox/i.test(ua)) {
    return {
      id: 'firefox',
      label: 'Firefox',
      status: webMidi ? 'limited' : 'unsupported',
      detail: webMidi
        ? 'Web MIDI is enabled in this Firefox build, but Chrome or Edge are still more reliable for drum kits.'
        : 'Firefox does not enable Web MIDI by default. Use Chrome or Edge, or enable dom.webmidi.enabled in about:config (advanced).',
    };
  }

  if (/safari/i.test(ua) && !/chrome|chromium|crios|edg/i.test(ua)) {
    return {
      id: 'safari',
      label: 'Safari',
      status: 'unsupported',
      detail:
        'Safari on Mac and iOS does not support Web MIDI for this app. Use Chrome or Edge on a laptop or desktop.',
    };
  }

  if (/edg/i.test(ua)) {
    return {
      id: 'chromium',
      label: 'Microsoft Edge',
      status: webMidi ? 'supported' : 'unsupported',
      detail: webMidi
        ? 'Edge supports Web MIDI — you can connect your kit here.'
        : getWebMidiUnsupportedMessage(),
    };
  }

  if (/chrome|chromium|crios/i.test(ua)) {
    return {
      id: 'chromium',
      label: 'Google Chrome',
      status: webMidi ? 'supported' : 'unsupported',
      detail: webMidi
        ? 'Chrome supports Web MIDI — you can connect your kit here.'
        : getWebMidiUnsupportedMessage(),
    };
  }

  return {
    id: 'other',
    label: 'This browser',
    status: webMidi ? 'limited' : 'unsupported',
    detail: webMidi
      ? 'Web MIDI appears available, but Chrome or Edge on desktop are tested and recommended.'
      : `${getWebMidiUnsupportedMessage()} Firefox and Safari usually do not work without extra steps.`,
  };
}

export const MIDI_BROWSER_COMPAT_ROWS = [
  {
    name: 'Google Chrome',
    status: 'Recommended',
    note: 'Full Web MIDI support on desktop.',
  },
  {
    name: 'Microsoft Edge',
    status: 'Recommended',
    note: 'Full Web MIDI support on desktop (Chromium-based).',
  },
  {
    name: 'Opera',
    status: 'Usually works',
    note: 'Chromium-based; similar to Chrome.',
  },
  {
    name: 'Firefox',
    status: 'Often unsupported',
    note: 'Web MIDI is off by default; Chrome or Edge is easier.',
  },
  {
    name: 'Safari (Mac / iPhone / iPad)',
    status: 'Not supported',
    note: 'Use Chrome or Edge on a computer instead.',
  },
] as const;

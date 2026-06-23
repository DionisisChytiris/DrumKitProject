# Drum Kit Learning Platform

## Overview

An interactive, browser-based drum kit learning platform that lets users practice rhythm, timing, and drum patterns directly in the browser using a virtual drum kit, a metronome, notation-based exercises, and a pattern sequencer. It is aimed at people who are learning or practicing drums — often at a keyboard or with mouse/touch input, with or without access to a real kit — and solves the problem of stitching together a kit, a metronome, and reading material into one focused practice surface that runs without a backend.

## Goals

1. Allow users to immediately begin drum practice directly in the browser with minimal setup.
2. Help users improve timing and rhythm accuracy through exercises and metronome-based practice.
3. Provide an accessible practice environment for users without a physical drum kit, with optional electric drum kit support via Web MIDI.

## Core User Flow

1. User opens the application homepage.
2. User sees the main learning areas as tiles: Practice, Exercises, Connect MIDI, Metronome, Progress, and Settings.
3. User optionally selects "Sign up" or "Log in" using the demo authentication modal.
4. Demo credentials are entered and the logged-in flag is stored locally in the browser.
5. User navigates to one of the core practice experiences:
     - Practice (interactive virtual drum kit)
     - Exercises (notation and rhythm patterns)
     - Metronome (timing practice)
6. User begins interacting with the learning tools:
     - Plays the virtual drum kit via mouse, touch, keyboard, or connected e-drum pads (MIDI)
     - Follows rhythmic exercises rendered with notation
     - Practices with the metronome
7. User receives immediate audio and visual feedback from the interface.
8. Logged-in users can additionally access gated features such as the Advanced Metronome and the Pattern Sequencer.

## Features

### Interactive Drum Practice (Working)
- Browser-based virtual drum kit with keyboard, mouse/touch, and MIDI pad input (fullscreen)
- Immediate drum sample playback via the shared low-latency Web Audio engine
- Visual hit feedback over a drum-studio background image
- Fullscreen practice mode with on-screen key hints
- MIDI device auto-connect on Practice when previously authorized; connected-device badge in fullscreen

### Connect MIDI (Working)
- Web MIDI API device access (Chrome / Edge desktop recommended)
- MIDI input device list and selection with `localStorage` persistence (`drumkit.midi.selectedInputId`)
- Pad test panel showing note number, GM label, and velocity per hit
- Setup and browser-compatibility help content on the Connect MIDI screen

### Drum Kit Customization (Working)
- Per-piece sample assignment via the Customize modal
- Custom sample data persisted in browser state (no server uploads)
- Default kit configuration merged with user customizations on load

### Key Bindings (Working)
- User-configurable keyboard mapping for drum pieces
- Bindings persisted in localStorage and restored on refresh

### Exercises & Rhythm Reading (Working)
- Curriculum-style exercise list driven by static data
- Notation rendered in the browser using VexFlow
- Prev/next navigation through the exercise set
- MusicXML + WAV play-along exercises (listen mode with score highlight sync)

### Metronome & Timing (Working)
- Configurable BPM, time signature, and subdivision
- Visual beat dots and downbeat emphasis synchronized with audio
- Basic mode always available; Advanced mode (e.g. tempo automation) gated behind demo login
- Compact MetronomeDisplay overlay reusable inside the Practice screen

### Pattern Sequencer (Working, gated)
- Step-grid pattern editor with playback and groove presets
- Patterns saved to and reloaded from localStorage
- Entry gated behind demo login

### Mixer & Practice Sound Settings (Working)
- Mixer with channel and master controls, persisted to localStorage
- Practice sound settings modal for tuning playback behavior inside Practice

### Authentication (Demo / Client-Side)
- Single AuthModal handles both sign-up and login UI states
- Accepts only the fixed demo credentials shown in the modal
- Successful login sets `drumkitAuth.loggedIn` and `drumkitAuth.email` in localStorage
- No backend, network call, password hashing, token, or session

### Placeholder Screens (Not yet implemented)
- Progress — placeholder screen, no tracking or analytics implementation
- Settings — placeholder screen beyond what individual modals already expose
- About — placeholder screen (includes an experimental OSMD play-along prototype, not a product feature)

## Scope

### In Scope
- Interactive browser-based drum practice
- Virtual drum kit with keyboard, mouse, touch, and MIDI pad input (Practice, fullscreen)
- Web MIDI connect flow, pad test, and General MIDI note → drum mapping
- Drum notation and rhythm exercises via VexFlow
- MusicXML play-along exercises (listen mode)
- Metronome with basic and advanced modes
- Drum kit customization, key bindings, mixer, and practice sound settings
- Pattern sequencer with localStorage-persisted patterns
- Client-side demo authentication for gating advanced UI
- Local state persistence via localStorage
- Static asset delivery of drum samples and images

### Out of Scope (current build)
- Real backend authentication, user accounts, or server sessions
- Cloud-based progress syncing or remote storage
- Play-along MIDI scoring / “practice with kit” grading (Phase B)
- Custom per-pad MIDI note mapping UI (planned; default GM table ships today)
- Progress tracking, analytics, or performance scoring (Phase C)
- Social or community features
- Multiplayer or live collaboration
- Marketplace or paid exercise content
- Full music production or DAW functionality
- Teacher / student management or assignment systems
- Native mobile applications
- Offline / service-worker support

## Success Criteria

1. A user can open the application and reach a working practice surface (Practice, Exercises, or Metronome) without signing in.
2. Users can interact with the virtual drum kit via keyboard, mouse, touch, or MIDI pads (after Connect MIDI setup) and hear immediate sound feedback.
3. Users can cycle through rhythm or notation exercises and see VexFlow notation render reliably.
4. The metronome functions reliably across the supported BPM range with adjustable time signature and subdivisions, and the visual beat indicator stays in sync with audio under normal load.
5. Demo login successfully unlocks gated features (Advanced Metronome, Pattern Sequencer) using localStorage flags, and logout clears them.
6. Drum kit customization, key bindings, mixer settings, and sequencer patterns persist across refresh via localStorage and fall back safely to defaults when stored data is missing or invalid.
7. A user with a connected e-drum kit can authorize Web MIDI, confirm hits on Connect MIDI, and trigger matching Practice sounds in fullscreen.
8. `npm run build` and `npm run lint` (zero warnings) pass after substantive changes.

# Architecture Context

## Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Framework | React 18 + TypeScript | Component-based SPA architecture for interactive drum learning features and strongly typed application logic |
| Build Tool | Vite 5 | Fast development server, HMR, and optimized frontend bundling |
| Routing | React Router DOM v6 | Client-side navigation between Practice, Exercises, Metronome, Settings, and other screens |
| State Management | Redux Toolkit + React Redux | Centralized global state for drum kit configuration, metronome settings, mixer state, and UI synchronization |
| Audio Engine | Tone.js + Web Audio API | Metronome scheduling, drum sample playback (decoded `AudioBuffer`s), and backing-track graphs |
| MIDI Input | Web MIDI API (browser built-in) | Electric drum kit pad input on Connect MIDI and Practice — no extra npm package |
| Music Notation | VexFlow | Rendering drum notation and rhythm exercises directly in the browser |
| Styling | Plain CSS | Screen-level and component-level styling using custom CSS files |
| Persistence | localStorage | Client-side persistence for auth flags, drum settings, mixer state, sequencer patterns, and saved configuration |
| Authentication | Client-side demo auth | Demo-only login gating using localStorage without backend authentication |
| Tooling | ESLint + TypeScript strict mode | Enforces code quality, React hook rules, and type safety |
| Assets | Static assets in `/public` and `/src/assets` | Drum samples, images, and visual resources |

---

## System Boundaries

- `src/screens/` — Owns route-level pages and screen composition for Practice, Metronome, Exercises, Settings, About, Progress, and ConnectMIDI
- `src/components/` — Owns reusable UI components such as VirtualDrumKit, PatternSequencer, MusicXmlPlayAlong, Navigation, Mixer, and notation components
- `src/Modals/` — Owns modal-based workflows including authentication, mixer controls, sequencer, customization, and settings overlays
- `src/store/` — Owns Redux store configuration, slices, typed hooks, and localStorage persistence logic
- `src/utils/` — Owns shared non-UI utilities such as audio managers, drum configuration, OSMD playback mapping, metronome click helpers, and MIDI parsing/mapping (`src/utils/midi/`)
- `src/hooks/` — Owns shared React hooks (`useMidiInput`, play-along count-in, metronome clicks, etc.)
- `src/data/` — Owns static curriculum, play-along catalog, and exercise definitions
- `src/types/` — Owns shared TypeScript types and interfaces across the application
- `src/assets/` — Owns bundled static assets and images used by the UI
- `public/` — Owns publicly served static assets such as drum audio samples and large media files
- `src/screens/Metronome/` — Owns metronome-specific timing logic, engine hooks, and visualization helpers

---

## Storage Model

- **Redux Store (In-Memory State)**: Active runtime state for drum kits, metronome controls, mixer settings, playback flags, UI state, and sequencer data
- **localStorage**: Persistent browser storage for drumKitState, mixerState, authentication flags, sequencer patterns, selected MIDI input id (`drumkit.midi.selectedInputId`), and user configuration
- **Static Asset Storage**: Drum samples, background images, and media files stored inside `/public` and `/src/assets`
- **Browser Memory / Audio Buffers**: Decoded audio buffers and temporary playback state used during active sessions
- **No Database**: The application currently has no backend database or ORM layer
- **No Cloud File Storage**: User-generated uploads are serialized into browser state instead of stored as external files

---

## Auth and Access Model

- Authentication is fully client-side and uses demo credentials only
- Successful login stores `drumkitAuth.loggedIn` and `drumkitAuth.email` inside localStorage
- No backend authentication, sessions, tokens, cookies, or password hashing exist in the current architecture
- Authentication acts only as a UI gating mechanism for limited features such as Advanced Metronome and Sequencer access
- Most core learning features (Practice, Exercises, Metronome) are accessible without login
- Logout removes authentication flags from localStorage and immediately updates gated UI
- Access control exists only at the frontend UI layer and does not protect server resources

---

## Invariants

1. The application must remain fully functional as a client-side SPA without requiring a backend server
2. Redux state and localStorage persistence must never corrupt or crash the application when invalid data is encountered
3. Audio playback and metronome timing must remain synchronized during active practice sessions
4. Core learning tools (Practice, Exercises, Metronome) must remain usable without authentication
5. TypeScript strict mode and ESLint rules must pass before production builds
6. React hooks must follow Rules of Hooks and maintain valid dependency management
7. UI interactions must fail gracefully when audio files, samples, or localStorage data are missing or invalid
8. Route-level screens must not directly own shared global state logic outside Redux slices
9. Audio scheduling and playback logic must remain isolated from presentation-layer UI components
10. Static asset URLs (drum samples, images) and `@/` path-aliased imports must continue to resolve identically in dev and production builds

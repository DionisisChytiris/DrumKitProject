# Code Standards

## General

- Keep modules small, focused, and single-purpose
- Separate UI, audio, state management, and persistence concerns clearly
- Prefer composition over deeply nested component hierarchies
- Fix root causes instead of layering temporary workarounds
- Avoid duplicating business logic across screens or components
- Shared logic belongs in reusable hooks, utilities, or Redux slices
- Route-level screens should compose features, not implement low-level logic
- Components should remain predictable and easy to reason about
- Avoid premature abstraction until patterns repeat naturally
- All new features must preserve low-latency interaction for drum playback and metronome timing
- Prefer explicit state transitions over implicit side effects
- Keep audio scheduling isolated from presentation-layer rendering
- Avoid unnecessary re-renders during active playback sessions
- Any browser storage interaction must fail safely without crashing the application
- Accessibility and keyboard interaction should be considered part of feature completeness

---

## TypeScript

- TypeScript strict mode is required across the entire project
- Do not disable strict compiler rules without documented justification
- Avoid `any` whenever possible
- Prefer explicit interfaces and discriminated unions over loosely typed objects
- Shared domain types belong in `src/types/`
- Validate unknown external data before using it
- localStorage data must always be parsed defensively with fallback defaults
- Prefer readonly data structures where mutation is not intended
- Use typed Redux hooks instead of raw `useDispatch` and `useSelector`
- Component props must always use explicit interfaces or type aliases
- Avoid large “god types” that represent unrelated concerns
- Use narrow types for drum pieces, metronome states, and sequencer events
- Exhaustive switch handling is required for union types
- Avoid nullable state when explicit state machines or enums are clearer

---

## React

- Use functional components only
- Use hooks instead of class components
- Follow React Hooks rules without exception
- Keep components focused on a single UI responsibility
- Extract reusable logic into custom hooks when complexity grows
- Avoid deeply nested JSX trees inside a single component
- Keep route-level screens responsible for composition only
- Avoid business logic directly inside JSX rendering blocks
- Use memoization only when measurable performance issues exist
- Cleanup all event listeners, timers, and audio subscriptions on unmount
- Avoid triggering unnecessary global Redux updates from highly interactive UI
- Keep fullscreen and keyboard interaction logic isolated and testable
- Avoid direct DOM manipulation unless browser APIs require it
- Prefer controlled state flows over hidden mutable variables

---

## Redux and State Management

- Global cross-feature state belongs in Redux slices
- Temporary UI-only state should remain local to components
- Redux slices must remain domain-focused and predictable
- Reducers must remain pure and serializable
- Non-serializable objects such as File references must never be persisted directly into Redux storage
- localStorage persistence must tolerate corrupted or missing data
- State hydration must always fall back safely to defaults
- Avoid storing derived UI values when they can be computed
- Audio engine runtime objects should not live directly in Redux state
- Persist only meaningful user configuration and reusable session data

---

## Audio and Timing

- Audio scheduling must prioritize timing stability over visual effects
- Metronome timing and beat indicators must remain synchronized
- Avoid creating duplicate audio contexts unnecessarily
- Audio playback failures must fail gracefully without crashing the UI
- Long-running audio loops must clean up correctly when screens unmount
- Browser autoplay restrictions must always be handled safely
- Audio loading should be asynchronous and non-blocking
- Avoid expensive calculations during active playback loops
- UI rendering must never directly drive audio timing precision

---

## Styling

- Use plain CSS files colocated with the feature, component, or screen they style (the project does not use CSS Modules, Tailwind, or any CSS-in-JS library)
- Follow the existing dark studio-style visual language consistently
- Prefer reusable utility classes and shared patterns over duplicated CSS
- Avoid inline styles unless values are dynamic or animation-specific
- Use rem-based spacing for scalable layouts
- Maintain consistent spacing rhythm across screens
- Use glassmorphism surfaces consistently for overlays and panels
- Keep typography hierarchy consistent between screens
- Avoid introducing competing visual systems or UI frameworks
- Responsive behavior is required for primary learning screens
- Avoid horizontal overflow on supported screen sizes
- Preserve readable contrast over background imagery
- Use meaningful class names tied to feature responsibility

---

## Routing and Navigation

- Each route must map to a single screen-level responsibility
- Routes should remain lightweight and delegate logic to components/hooks
- Navigation must remain consistent across all inner screens
- Route transitions must never interrupt active cleanup logic
- Protected or gated UI must fail safely when auth state changes
- Avoid route-specific duplication of shared layout patterns

---

## Persistence and Storage

- localStorage is the only persistent user storage layer in the current architecture
- All persisted data must support safe fallback restoration
- Never assume stored JSON is valid
- Large binary assets should remain static files, not embedded in Redux state
- Persist only data that improves user continuity between sessions
- Do not persist temporary runtime playback state
- Audio sample uploads must be validated before persistence
- Avoid excessive localStorage writes during high-frequency interactions

---

## API and Backend Boundaries

- The current application is frontend-only and must not assume backend availability
- Authentication is UI gating only and must not be treated as secure authorization
- Future backend integrations must remain isolated behind service boundaries
- External integrations must validate all incoming data
- Network logic should be isolated from presentation components
- Backend assumptions must not leak into purely client-side features

---

## File Organization

- `src/screens/` — Route-level pages and feature composition
- `src/components/` — Reusable UI components shared across screens
- `src/Modals/` — Overlay workflows and dialog interactions
- `src/store/` — Redux store configuration, slices, persistence, and typed hooks
- `src/utils/` — Shared utilities, audio managers, configuration helpers, and non-UI logic
- `src/types/` — Shared TypeScript types and interfaces
- `src/data/` — Static exercises, rhythm definitions, and curriculum content
- `src/assets/` — Bundled images and static frontend assets
- `public/` — Publicly served media files such as drum samples and large assets
- `src/screens/styles/` — Screen-specific styling files
- `src/hooks/` — Shared reusable React hooks (`useMidiInput`, play-along count-in, metronome clicks)
- `src/services/` — Reserved for future backend or integration service layers

---

## Quality Gates

- `npm run build` must pass before merging
- `npm run lint` must pass with zero warnings
- No TypeScript errors are allowed in production builds
- No React Hooks rule violations are allowed
- New features must not introduce console errors during normal operation
- Critical playback flows must remain functional after refactors
- All persisted state changes must be backward-safe where possible
- Features are not complete until cleanup behavior is verified
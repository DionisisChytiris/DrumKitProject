# UI Context

## Theme

The application uses a **dark, studio-style visual language** inspired by rehearsal rooms and live performance environments. The UI is cinematic rather than minimal or corporate: most screens use full-viewport layouts that layer a background photograph, a darkening overlay, and frosted-glass panels carrying the interactive content.

The product is currently designed as a **dark-theme-only** experience. There is no light mode and no theme switcher.

Core visual characteristics:

- Near-black backgrounds and dark overlays over background imagery (e.g. `DrumStudio.png`)
- Frosted glass panels with `backdrop-filter: blur(...)` for tiles, panels, and modals
- Bright rhythmic accent colors for timing, downbeats, and active state
- Large, readable typography with strong hierarchy
- Full-screen immersive layouts on home, practice, and metronome screens
- Visual emphasis on rhythm, timing, and beat feedback
- Layouts optimized primarily for desktop and laptop browsers

> **Current reality:** the codebase does not yet have a shared design-token layer. Colors are repeated as literal `rgba(...)` / `#hex` values across `index.css`, `App.css`, and screen CSS in `src/screens/styles/`. The token table below is the recommended target — new screens should prefer CSS custom properties over inline literals so the palette can be unified later.

---

## Colors

Recommended CSS custom properties for the studio palette. Values are drawn from the patterns already present in `index.css`, `App.css`, and `src/screens/styles/*.css`.

| Role | CSS Variable | Value |
| --- | --- | --- |
| Page background | `--bg-base` | `#000000` |
| Secondary background | `--bg-secondary` | `#111111` |
| Surface / glass panel | `--bg-surface` | `rgba(255, 255, 255, 0.10)` |
| Surface border | `--border-default` | `rgba(255, 255, 255, 0.18)` |
| Overlay tint over imagery | `--bg-overlay` | `rgba(0, 0, 0, 0.35)` |
| Primary text | `--text-primary` | `#ffffff` |
| Secondary text | `--text-secondary` | `rgba(255, 255, 255, 0.75)` |
| Muted text | `--text-muted` | `rgba(255, 255, 255, 0.60)` |
| Primary accent (active / "go") | `--accent-primary` | `#4caf50` |
| Accent hover | `--accent-primary-hover` | `#66bb6a` |
| Downbeat / emphasis accent | `--accent-beat` | `#ff9800` |
| Error / stop state | `--state-error` | `#f44336` |
| Success state | `--state-success` | `#4caf50` |
| Warning state | `--state-warning` | `#ff9800` |
| Focus ring | `--focus-ring` | `#4a90e2` |
| Heavy shadow | `--shadow-dark` | `rgba(0, 0, 0, 0.5)` |
| Glass highlight | `--glass-highlight` | `rgba(255, 255, 255, 0.08)` |

### CSS Root Example

```css
:root {
  --bg-base: #000000;
  --bg-secondary: #111111;
  --bg-surface: rgba(255, 255, 255, 0.10);
  --border-default: rgba(255, 255, 255, 0.18);
  --bg-overlay: rgba(0, 0, 0, 0.35);

  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.75);
  --text-muted: rgba(255, 255, 255, 0.60);

  --accent-primary: #4caf50;
  --accent-primary-hover: #66bb6a;
  --accent-beat: #ff9800;

  --state-error: #f44336;
  --state-success: #4caf50;
  --state-warning: #ff9800;

  --focus-ring: #4a90e2;

  --shadow-dark: rgba(0, 0, 0, 0.5);
  --glass-highlight: rgba(255, 255, 255, 0.08);
}
```

### Color Rules

- Prefer CSS custom properties over hardcoded hex / rgba literals in new components.
- Use `--accent-primary` (green) for active timing, success, and "playing" states.
- Use `--accent-beat` (orange) for downbeat emphasis and rhythmic focus.
- Reserve `--state-error` (red) for stop / failure / destructive UI only.
- Preserve readable contrast over background photography by layering `--bg-overlay` between image and content.

---

## Typography

| Role | Font Stack | Recommended Variable |
| --- | --- | --- |
| Primary UI text | `Inter, system-ui, Avenir, Helvetica, Arial, sans-serif` | `--font-sans` |
| System fallback | `-apple-system, "Segoe UI", Roboto, sans-serif` | `--font-system` |
| Monospace / timing values | `SFMono-Regular, Consolas, "Liberation Mono", monospace` | `--font-mono` |

> **Current reality:** `index.css` sets the Inter-based stack on `:root`, while `App.css` re-declares a system stack on `body`. New screens should not re-declare `font-family` on `body`; rely on the stack from `index.css` instead so cascade conflicts disappear.

### Typography Rules

- Use bold weights (600–800) for major timing values, BPM, and beat counters.
- Reserve uppercase + increased `letter-spacing` (≥ 0.1em) for small rhythm-related labels.
- Apply `text-shadow` for text laid directly over background photography.
- Prefer `font-family: inherit` on buttons and form controls so they follow the active stack.
- Avoid mixing more than two font families on a single screen.

### Typography Scale

| Usage | Size |
| --- | --- |
| Hero titles | `3rem` – `4rem` |
| Section headings | `2rem` – `2.5rem` |
| Card / panel titles | `1.25rem` – `1.5rem` |
| Standard body text | `1rem` |
| Secondary labels | `0.875rem` |
| Tiny helper text | `0.75rem` |

---

## Spacing

The app uses a `rem`-based spacing rhythm with a few `px` values reserved for fine UI details (borders, scrollbars).

| Context | Recommended scale |
| --- | --- |
| Tight inline gaps | `0.25rem`, `0.5rem` |
| Standard control padding | `0.75rem`, `1rem` |
| Section padding / gaps | `1.5rem`, `2rem`, `2.5rem`, `3rem` |
| Page edge padding | `1.5rem` – `3rem` depending on breakpoint |

### Spacing Rules

- Use `gap` on flex/grid containers rather than per-child margins where possible.
- Keep the spacing scale consistent within a single screen.
- Centered content columns commonly use `max-width: 1200px` (e.g. home tiles).

---

## Border Radius

| Context | Recommended Value |
| --- | --- |
| Small controls / chips | `8px` |
| Buttons | `10px` |
| Cards / panels | `14px` |
| Glass surfaces | `16px` |
| Modals / overlays | `18px` |
| Pills / capsules | `999px` |

### Radius Rules

- Panels and tiles should feel soft and modern.
- Reserve full-pill shapes (`999px`) for badges, chips, and compact toggles.
- Do not mix more than two or three radius scales within one screen.

---

## Responsive Breakpoints

The codebase already uses these breakpoints in `App.css` and `Metronome.css`; new screens should align with them.

| Breakpoint | Target |
| --- | --- |
| `≤ 768px` | Small / portrait screens |
| `≤ 1024px` | Tablet / small laptop |
| `≤ 1440px` | Standard desktop |
| `≥ 1920px` | Large / external displays |

Responsive behavior is required for the primary learning screens (Home, Practice, Metronome, Exercises). Horizontal overflow on supported widths is treated as a bug.

---

## Component Library

**No external UI component library is used.** Dependencies (`package.json`) are limited to React, React DOM, React Router DOM, Redux Toolkit, React Redux, Tone.js, and VexFlow. No Tailwind, no shadcn/ui, no Material UI, no Chakra, no Radix.

The interface is built from:

- **React functional components** (no class components anywhere in the app)
- **Plain CSS files** colocated with the component or screen (no CSS Modules, no CSS-in-JS)
- **Custom reusable components** under `src/components/`
- **VexFlow** for music notation rendering only — it is not a general UI kit

### Component Organization

- Shared reusable components live in `src/components/<FeatureName>/`
- Each component folder commonly contains a `.tsx` + `.css` pair (e.g. `VirtualDrumKit.tsx` + `VirtualDrumKit.css`)
- Modal workflows live in `src/Modals/`
- Screen-specific styles live in `src/screens/styles/` (one CSS file per screen)
- Metronome subcomponents and timing helpers live in `src/screens/Metronome/`

### Component Principles

- Components stay visually consistent with the studio aesthetic across screens.
- Shared interaction patterns (focus ring, glass panel, accent button) should be reused rather than recreated.
- Visual behavior must not compromise low-latency drum playback or metronome timing.
- Complex controls (mixer, sequencer, metronome panels) prioritize clarity over decoration.

---

## Layout Patterns

### Full-Screen Studio Layout

Used by most routes (Home, Practice, Metronome, Exercises, Connect MIDI, Progress, Settings, About):

- Full viewport width and height (`100vw` × `100vh`)
- Stacked layers: background photo → dark overlay → foreground content
- Foreground content stays centered and readable over the imagery

### Home Screen Layout

- Full-screen background photo + overlay
- Top `Navigation` bar (brand, About, Settings, auth)
- Responsive grid of large navigation tiles centered in the viewport (Practice, Exercises, Connect MIDI, Metronome, Progress, Settings)
- `max-width` around `1200px` for the tile grid

### Practice Screen Layout

- Full-viewport background image of a drum kit
- Hit zones positioned absolutely over the image using percent / viewport units
- Pre-fullscreen: simple "back to home" control plus a fullscreen-gate overlay
- In fullscreen: `NavBarHome` at the top, optional `MetronomeDisplay` overlay, the interactive kit layer, and a bottom strip of key hints
- Modals (Key Bindings, Customize, Mixer, Practice Sound Settings) overlay the kit when invoked

### Metronome Screen Layout

- Same full-bleed background + overlay
- `NavBarHome` at the top
- Beat-dots row + optional time-signature sequence summary
- Three-column control band below the beat row:
  - Left: subdivision controls; basic vs advanced panel (advanced is auth-gated)
  - Center: BPM display, large beat circle, bar counter / auto-BPM ramp
  - Right: settings panel

### Exercises Screen Layout

- Full-viewport background + overlay
- `NavBarHome` at the top
- Centered notation canvas rendered by VexFlow
- Prev / next navigation across the static exercise list

### Modal Layout

- Centered overlay with darkened backdrop
- Glass-style surface (semi-transparent white fill, blurred backdrop, soft border)
- Modal radius is the largest in the scale (`16px`–`18px`)
- Escape should close; focus should remain trapped while open

### Shared Layout Patterns

- Inner routes share `NavBarHome` for consistent navigation chrome.
- A persistent `footer.app-footer` is rendered by `App.tsx` under `main.app-main` on every route.
- All screens that show content over an image use the same background → overlay → content layering pattern.

---

## Icons

The project currently uses **emoji glyphs and plain CSS shapes** rather than an icon library. No `lucide-react`, `react-icons`, or similar dependency is installed.

If an icon library is introduced later, it should be added as a single canonical dependency (avoid mixing icon families), and icons should be sized in `rem` to follow the typography scale.

---

## Accessibility

- Focus visibility: `outline: 2px solid var(--focus-ring); outline-offset: 2px` on `button:focus-visible` is the baseline (from `index.css`). Components may add their own focus styles but must not remove a visible focus indicator.
- Keyboard reach: every primary action (drum hit, metronome start/stop, modal open/close) must be reachable from the keyboard.
- Color contrast: text over background imagery must use the overlay + shadow pattern to stay legible.
- Modals: Escape closes the modal; focus stays within the modal while open.

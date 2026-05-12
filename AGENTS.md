# AGENTS.md

Instructions for any AI coding agent (Cursor, Claude Code, Codex CLI, GitHub Copilot Workspace, etc.) working in this repository.

## Project at a glance

This is the **Drum Kit Learning Platform**: a client-side React + TypeScript SPA built with Vite, Redux Toolkit, Tone.js, and VexFlow.

- No backend, no database, no service worker
- Persistence is `localStorage` only
- Plain CSS files only (no Tailwind, no CSS Modules, no CSS-in-JS, no UI library)
- Demo authentication is a `localStorage` flag, not a server identity layer

## Read before planning or coding any change

The `templates/` folder is the project's source of truth. Read the relevant files before answering questions, planning work, or writing code.

| When the task is about… | Read |
| --- | --- |
| What the app does, goals, scope, success criteria, audience | [`templates/project-overview.md`](templates/project-overview.md) |
| Stack, folder ownership, storage model, auth model, invariants | [`templates/architecture.md`](templates/architecture.md) |
| TypeScript, React, Redux, audio, styling, persistence rules, quality gates | [`templates/code-standards.md`](templates/code-standards.md) |
| Colors, typography, spacing, layout patterns, components, accessibility | [`templates/ui-content.md`](templates/ui-content.md) |

For deeper rationale, the prose Q&A in [`wExplanationFiles/ImportantQuestions.txt`](wExplanationFiles/ImportantQuestions.txt) and [`wExplanationFiles/ImportantTechnicalQuestions.txt`](wExplanationFiles/ImportantTechnicalQuestions.txt) explains why the templates say what they say.

## Rules of engagement

1. **Honor the templates.** If a request conflicts with `templates/architecture.md` (e.g. introduces a backend, a database, a service worker, or offline support) or `templates/code-standards.md` (e.g. adds CSS Modules, Tailwind, or a UI component library), surface the conflict before doing the work and ask how to proceed.
2. **Match what actually ships.** Do not describe placeholder screens (Connect MIDI, Progress, Settings, About) or MIDI hardware support as working features — they are placeholders per `templates/project-overview.md`. The Practice screen takes keyboard, mouse, and touch input only; there is no Web MIDI integration.
3. **No new dependencies without asking.** The stack in `templates/architecture.md` is fixed. Adding a UI library, icon library, CSS framework, test runner, or auth provider requires explicit user approval.
4. **Use existing folder ownership.** Place new code in the folders documented in `templates/architecture.md`: `src/screens/`, `src/components/`, `src/Modals/`, `src/store/`, `src/utils/`, `src/types/`, `src/data/`, `src/screens/styles/`, `src/screens/Metronome/`. Do not invent new top-level folders without asking. `src/hooks/` and `src/services/` are intentionally empty placeholders.
5. **Keep the studio visual language.** Follow the dark / glass / green–orange–red accent system documented in `templates/ui-content.md`. Prefer CSS custom properties over new hardcoded color literals in new files.
6. **Quality gates are non-negotiable.** `npm run build` (TypeScript strict mode, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`) and `npm run lint` (ESLint with `--max-warnings 0`) must still pass after any change.
7. **When the templates are wrong, fix the templates.** If the codebase has moved on, propose an edit to the relevant template alongside the code change so the source of truth stays accurate.
8. **Do not commit unless explicitly asked.** Do not run `git commit`, `git push`, or create branches / PRs unless the user requests it.

## Run scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Type-check (`tsc`) and produce a production bundle |
| `npm run lint` | Run ESLint with zero-warning enforcement |
| `npm run preview` | Preview a built bundle locally |

## Cursor users

Cursor reads this file as a fallback for AGENTS-style instructions, but the canonical Cursor mechanism is `.cursor/rules/project-context.mdc`. The two files are kept in sync.

# templates/

This folder is the **source of truth** for what the Drum Kit Learning Platform is, how it is built, and what it looks like. Code, docs, and any AI agent working in this repository should defer to these files when in doubt.

## Files

| File | What it answers |
| --- | --- |
| [`project-overview.md`](project-overview.md) | What the application does, who it is for, what problem it solves, the core user flow, the full feature list, what is in / out of scope, and the success criteria. |
| [`architecture.md`](architecture.md) | The technology stack, which folder owns what, the storage model, the demo-auth and access model, and the invariants that must not be broken. |
| [`code-standards.md`](code-standards.md) | TypeScript, React, Redux, audio, styling, routing, persistence, and API rules, plus the quality gates (`npm run build` / `npm run lint`). |
| [`ui-content.md`](ui-content.md) | The visual language: theme, colour tokens, typography, spacing, border radius, breakpoints, layout patterns, components, icons, and accessibility. |

## How AI agents use these files

Two mechanisms wire these templates into the agent workflow:

1. **Cursor** — `.cursor/rules/project-context.mdc` is configured with `alwaysApply: true`, which injects a short instruction into every Cursor agent / chat session telling the AI to read the relevant template before planning or coding.
2. **Other AI tools** (Claude Code, Codex CLI, Copilot Workspace, etc.) — the root-level [`AGENTS.md`](../AGENTS.md) mirrors that instruction in a format those tools auto-detect.

Both pointers are intentionally short. The long-form content stays here in `templates/` so updating a template updates what the AI follows — without editing the rule files.

## Maintenance

- **Edit the templates whenever the project changes.** If a new feature ships, update `project-overview.md`. If a new folder convention emerges, update `architecture.md`. If a design token changes, update `ui-content.md`.
- **Keep the templates honest.** Do not document features, integrations, or constraints that are not actually present in the codebase. The previous draft incorrectly listed working MIDI integration, offline support, and CSS Modules — none of which existed. If you are unsure, grep / read the codebase first.
- **Prose rationale lives elsewhere.** The Q&A in [`../wExplanationFiles/ImportantQuestions.txt`](../wExplanationFiles/ImportantQuestions.txt) and [`../wExplanationFiles/ImportantTechnicalQuestions.txt`](../wExplanationFiles/ImportantTechnicalQuestions.txt) explains *why* the templates say what they say. Keep the templates declarative and let those files carry the long-form reasoning.
- **If you rename or move a template file**, update the paths in [`.cursor/rules/project-context.mdc`](../.cursor/rules/project-context.mdc) and [`../AGENTS.md`](../AGENTS.md) too — those are the only two places that hardcode the paths.

## Quick reference: what is *not* in this project

These come up often enough that it is worth listing them once. Each is intentionally excluded; treat any request that assumes them as a stack change that needs explicit approval.

- No backend, no Node server, no REST / GraphQL API
- No database, no ORM, no cloud file storage
- No real authentication — auth is a `localStorage` flag accepting fixed demo credentials
- Web MIDI connect + Practice pad playback (General MIDI default map). Play-along MIDI scoring is not implemented yet.
- No service worker, PWA manifest, or offline support
- No Tailwind, CSS Modules, styled-components, or any CSS-in-JS
- No UI component library (no shadcn/ui, Material UI, Chakra, Radix, etc.)
- No icon library (no Lucide, Heroicons, react-icons, etc.)
- No test runner (no Jest, Vitest, Playwright, Testing Library)

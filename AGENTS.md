# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Non-obvious information

### Dependencies
- `lucide-react` and `recharts` are installed as dependencies but are not imported anywhere in the code. They are reserved for future use (see README).

### UI Language
- The entire user interface (button text, logs, headings) is written in Russian (Cyrillic). This is important when adding new UI elements.

### Battle Logic
- In the `Attack` interface, the `damage` field can be negative – this indicates healing (restores HP).
- The AI (in PvC mode) automatically makes a move after a 1-second delay (timer in `useEffect`). Changing the delay requires editing the `setTimeout`.
- After victory, the game reloads via `window.location.reload()` instead of resetting React state.

### Game Stages
- The `stage` state follows a strict order: `'mode_select' → 'p1_char' → 'p1_attacks' → 'p2_char' → 'p2_attacks' → 'battle' → 'winner'`.
- When selecting a character for P2 in PvC mode, the AI automatically picks attacks and immediately proceeds to `battle`.

### Styling
- `index.css` defines light/dark theme support via `prefers-color-scheme`, but `App.css` does not use it. Component styles only use a dark theme.
- The `#root` width is capped at 1126px and centered.

### TypeScript
- `tsconfig.app.json` enables `verbatimModuleSyntax`, which affects imports/exports.
- Strict linting settings: `noUnusedLocals`, `noUnusedParameters`, etc.

### Linting
- ESLint is configured with React Hooks and Refresh plugins. Running `npm run lint` checks all files.

### Testing
- The project has no tests and no `test` script. Testing infrastructure is not set up.

### Known Artifacts
- In `src/App.tsx` line 193 there is an extra `//` comment (does not affect functionality).
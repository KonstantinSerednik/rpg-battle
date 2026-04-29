# Project Architecture Rules (Non-Obvious Only)

- The game state is managed by a single React component (`App.tsx`) with no external state management.
- Stage transitions are linear and hardcoded; adding new stages requires updating the union type and transition logic.
- AI logic is embedded in `useEffect` with a fixed delay; consider extracting to a custom hook for flexibility.
- Victory condition triggers a page reload, which is a non‑React pattern; any architectural change should replace this with state reset.
- The UI is monolingual (Russian); internationalization would require a significant refactor.
- Styling is split: `index.css` defines theme variables, `App.css` provides component‑specific dark‑theme styles.
- The root container has a fixed max‑width (1126px); responsive adjustments are via media queries in `index.css`.
- Unused dependencies (`lucide‑react`, `recharts`) are reserved for future features; architecture should accommodate their integration.
- TypeScript strictness (`verbatimModuleSyntax`, `noUnusedLocals`) enforces clean imports but may complicate prototyping.
- No testing infrastructure; adding tests would require setting up a test framework (Vitest/Jest) and configuring Vite.
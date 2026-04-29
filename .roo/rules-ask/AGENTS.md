# Project Documentation Rules (Non-Obvious Only)

- The UI is entirely in Russian; documentation should note that translations are not required.
- The `Attack` interface's `damage` field: positive = damage, negative = healing.
- Game flow: strict stage order; PvC mode skips manual attack selection for P2.
- Victory triggers a page reload, not a state reset.
- Styling: dark theme is enforced; light theme variables exist but are unused.
- The project uses Vite + React 19 with TypeScript; `verbatimModuleSyntax` is enabled.
- Dependencies `lucide-react` and `recharts` are installed but unused (reserved).
- Testing: no test suite; manual testing required.
- Known artifact: extra `//` comment in `src/App.tsx` line 193.
- The `#root` width is capped at 1126px; responsive design uses media queries in `index.css`.
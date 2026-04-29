# Project Debug Rules (Non-Obvious Only)

- The AI move timer (1000ms) can cause unexpected behavior if the component unmounts before timeout; ensure cleanup.
- Negative `damage` values are healing; debugging damage calculations must account for sign.
- The game state `stage` transitions automatically in PvC mode; breakpoints may be skipped.
- Victory condition uses `hp <= 0`; check both players' HP values.
- The `log` state updates with Russian messages; console logs may be in Cyrillic.
- Styling issues: `index.css` has light/dark theme but `App.css` overrides with dark theme only.
- The `#root` width constraint (1126px) may cause layout overflow; inspect element dimensions.
- Unused dependencies (`lucide-react`, `recharts`) may cause confusion in bundle analysis.
- The `verbatimModuleSyntax` in tsconfig can cause import/export errors if not followed.
- ESLint strict rules (`noUnusedLocals`, `noUnusedParameters`) may flag temporary variables during debugging.
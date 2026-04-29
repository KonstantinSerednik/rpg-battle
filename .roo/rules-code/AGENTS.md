# Project Coding Rules (Non-Obvious Only)

- The entire UI is in Russian (Cyrillic) – any new UI text must also be in Russian.
- In the `Attack` interface, negative `damage` values represent healing, not damage.
- The AI timer delay is hardcoded to 1000ms in `useEffect`; modify the `setTimeout` value to change it.
- After victory, the game uses `window.location.reload()`; consider resetting React state if modifying.
- Character selection for P2 in PvC mode automatically triggers AI attack selection and jumps to battle stage.
- The `stage` state must follow the exact sequence: mode_select → p1_char → p1_attacks → p2_char → p2_attacks → battle → winner.
- Styling uses a dark theme only; light theme variables exist in `index.css` but are unused.
- The root container width is fixed at 1126px; ensure new components respect this limit.
- Unused dependencies `lucide-react` and `recharts` are reserved for future features; do not remove them.
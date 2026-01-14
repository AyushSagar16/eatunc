## 2026-01-14 - Semantic Roles in Custom Components
**Learning:** Custom dropdowns built with divs and animations need explicit ARIA roles (`menu`, `menuitemradio`) to be accessible to screen readers, as they lack the native semantics of `<select>`.
**Action:** Always verify that interactive custom components have appropriate ARIA roles and state attributes (`aria-expanded`, `aria-checked`) to communicate their behavior and state.

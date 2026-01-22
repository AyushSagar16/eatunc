## 2026-01-14 - Semantic Roles in Custom Components
**Learning:** Custom dropdowns built with divs and animations need explicit ARIA roles (`menu`, `menuitemradio`) to be accessible to screen readers, as they lack the native semantics of `<select>`.
**Action:** Always verify that interactive custom components have appropriate ARIA roles and state attributes (`aria-expanded`, `aria-checked`) to communicate their behavior and state.

## 2026-01-15 - Focus Management in Animated Menus
**Learning:** When opening custom menus (especially with animation libraries like Framer Motion), immediate focus calls may fail if the element isn't yet in the DOM.
**Action:** Use `setTimeout(() => el.focus(), 0)` or `requestAnimationFrame` to ensure the element is rendered before attempting to move focus.

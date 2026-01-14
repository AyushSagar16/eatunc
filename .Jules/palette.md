## 2026-01-14 - Semantic Roles in Custom Components
**Learning:** Custom dropdowns built with divs and animations need explicit ARIA roles (`menu`, `menuitemradio`) to be accessible to screen readers, as they lack the native semantics of `<select>`.
**Action:** Always verify that interactive custom components have appropriate ARIA roles and state attributes (`aria-expanded`, `aria-checked`) to communicate their behavior and state.

## 2026-01-14 - Keyboard Navigation in Custom Dropdowns
**Learning:** Custom 'select' components using `role="menu"` were missing standard keyboard navigation (Arrows, Home/End), forcing users to Tab through all options.
**Action:** Implement `onKeyDown` handlers on both trigger and items to support standard menu keyboard patterns, including focus management.

## 2026-01-14 - Nested Interactive Elements in Cards
**Learning:** `FoodCard` is a large clickable button containing other interactive elements (icons). Standard nested buttons are invalid.
**Action:** Use `div` with `role="button"` and `tabIndex={0}` for nested interactives, ensuring `stopPropagation` is handled for both Click and KeyDown events to prevent parent activation.

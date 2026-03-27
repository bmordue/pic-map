## 2025-05-15 - [SVG Accessibility for Maps]
**Learning:** For complex SVG compositions like maps, root metadata (title, desc, role="img", aria-label) is essential for screen readers to identify the overall purpose. Individual interactive elements (markers, picture frames) should have their own accessible names using titles and ARIA roles (graphics-symbol, img) to provide context for what they represent.
**Action:** Always include semantic metadata and ARIA roles in SVG rendering logic, prioritizing descriptive fields like altText, caption, or location names over technical details like file paths.

## 2025-05-20 - [Avoid Redundant Nested ARIA Groups in SVG]
**Learning:** Placing ARIA roles and labels on empty, nested `<g>` elements within a component group is less effective and more semantically confusing than applying them directly to the primary container group. Assistive technologies are more reliable when the role and label are on the element that actually contains the component's primitives.
**Action:** Apply `role="graphics-symbol"` (or `role="img"`) and `aria-label` to the outermost logical container of a visual component, and ensure a `<title>` element is the first child of that container.

## 2025-05-24 - [Enhance SVG Accessibility with Focus and Hide]
**Learning:** For interactive SVG items like map markers and photo frames, `tabindex="0"` is essential for keyboard navigation. Combining item names with link labels (e.g., "Big Ben (marker A)") in `aria-label` provides much better context. Conversely, marking decorative groups like scale bars, grid lines, and water features with `aria-hidden="true"` declutters the accessibility tree significantly.
**Action:** Add `tabindex="0"` to interactive SVG groups and use descriptive labels that correlate items. Always hide decorative or redundant groups with `aria-hidden="true"`.

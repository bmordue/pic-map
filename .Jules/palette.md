## 2025-05-15 - [SVG Accessibility for Maps]
**Learning:** For complex SVG compositions like maps, root metadata (title, desc, role="img", aria-label) is essential for screen readers to identify the overall purpose. Individual interactive elements (markers, picture frames) should have their own accessible names using titles and ARIA roles (graphics-symbol, img) to provide context for what they represent.
**Action:** Always include semantic metadata and ARIA roles in SVG rendering logic, prioritizing descriptive fields like altText, caption, or location names over technical details like file paths.

## 2025-05-20 - [Avoid Redundant Nested ARIA Groups in SVG]
**Learning:** Placing ARIA roles and labels on empty, nested `<g>` elements within a component group is less effective and more semantically confusing than applying them directly to the primary container group. Assistive technologies are more reliable when the role and label are on the element that actually contains the component's primitives.
**Action:** Apply `role="graphics-symbol"` (or `role="img"`) and `aria-label` to the outermost logical container of a visual component, and ensure a `<title>` element is the first child of that container.

## 2025-05-24 - [Enhance SVG Accessibility with Focus and Hide]
**Learning:** For interactive SVG items like map markers and photo frames, `tabindex="0"` is essential for keyboard navigation. Combining item names with link labels (e.g., "Big Ben (marker A)") in `aria-label` provides much better context. Conversely, marking decorative groups like scale bars, grid lines, and water features with `aria-hidden="true"` declutters the accessibility tree significantly.
**Action:** Add `tabindex="0"` to interactive SVG groups and use descriptive labels that correlate items. Always hide decorative or redundant groups with `aria-hidden="true"`.

## 2025-06-05 - [Positional ARIA Context for SVG Collections]
**Learning:** For interactive SVG items that form a logical collection (like map markers or a picture border), screen reader users benefit from knowing the total count and their current position. Standard `aria-posinset` and `aria-setsize` attributes, when combined with `role="graphics-symbol"`, provide this missing navigation context.
**Action:** Always include `aria-posinset` and `aria-setsize` on items in a generated list or collection within an SVG to improve orientation for assistive technology users.

## 2025-06-12 - [Interactive Focus and Hover Styles for SVG]
**Learning:** Visual feedback for interactive SVG elements is crucial for both mouse and keyboard users. Providing a `cursor: pointer` on hover and a clear, high-contrast `outline` for focused elements (using the `:focus-visible` pseudo-class) ensures that users can easily identify and navigate interactive items within a complex graphic.
**Action:** Include a `<style>` block in generated SVGs to define interactive states for core classes like `.marker` and `.picture`, ensuring focus visibility is not lost when elements are navigated via keyboard.

## 2025-06-20 - [Restoring SVG Metadata after Composition]
**Learning:** When embedding external SVG content by stripping its root `<svg>` tags (as done in the `Compositor`), all accessibility metadata (role, aria-label, title) from that root is lost. This leaves the embedded content "anonymous" to screen readers.
**Action:** Always re-apply semantic roles and descriptive `aria-label`s to the container group (e.g., `.map-area`) that holds the embedded SVG content to maintain accessibility context.

## 2025-06-21 - [Prioritize Descriptive Labels over Technical Data]
**Learning:** For geographic components like maps, raw coordinates in an `aria-label` provide very little value to most users. Using a human-readable location name (like "Map of London") as the primary label significantly improves the immediate understanding of the component's purpose.
**Action:** In `MapEngine` and similar components, prioritize high-level descriptive fields (like location names or titles) for `aria-label`s, falling back to technical data (like coordinates) only when necessary.

## 2025-04-09 - [Accessible Map Scale and Harmonized Interactive Feedback]
**Learning:** Map scales, often overlooked, should be accessible graphics rather than hidden decorative elements. Using `role="img"` and `aria-label` provides screen reader users with essential map context. Additionally, consistent interactive feedback across different engine modules (e.g., matching hover/focus shadows) creates a more unified and professional user experience.
**Action:** Always ensure informational graphics like scale bars have appropriate ARIA roles and labels. Maintain visual parity for interactive states across the entire application to ensure a cohesive UX.

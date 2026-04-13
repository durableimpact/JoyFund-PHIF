# Design System Strategy: The Radiant Guardian

## 1. Overview & Creative North Star
The design system is anchored by a Creative North Star we call **"The Radiant Guardian."** In the context of maternal health in Cameroon, we must balance the high-stakes reliability of a fintech platform with the nurturing warmth of a community-driven initiative. 

We break the "generic template" look by utilizing **Organic Asymmetry** and **Tonal Depth**. This system rejects rigid, boxed-in layouts in favor of flowing, layered surfaces that mimic the natural curves of human life. By combining sharp, editorial typography scales with soft, pill-shaped containers, we create a high-end experience that feels both authoritative and deeply accessible.

---

## 2. Color & Atmospheric Tones
The palette is a sophisticated blend of aquatic cyans and deep oceanic blues, designed to evoke trust (Blue) and vitality (Teal).

### The "No-Line" Rule
**Explicit Instruction:** Prohibit the use of 1px solid borders for sectioning or containment. 
Boundaries must be defined solely through background color shifts or subtle tonal transitions. For example, a `surface-container-low` card sitting on a `surface` background creates a natural edge. This forces a cleaner, more editorial aesthetic that feels premium rather than "engineered."

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, physical layers—like fine paper or frosted glass.
- **Surface (Base):** `#fcf8ff` - The canvas.
- **Surface-Container-Low:** `#f5f2ff` - Use for large background sections to define "zones."
- **Surface-Container-Highest:** `#e2e0fc` - Use for interactive elements or high-importance cards.
- **Nesting Logic:** To highlight a specific piece of data within a card, place a `surface-container-lowest` (#ffffff) element inside a `surface-container-high` (#e8e5ff) container. This creates depth without visual clutter.

### Signature Textures & Glassmorphism
- **The Radiant Gradient:** For primary CTAs and Hero backgrounds, use a linear gradient: `primary` (#006781) to `primary_container` (#1db1db) at a 135° angle.
- **Glassmorphism:** Use for floating navigation bars or mobile overlays. Apply `surface_container_low` at 80% opacity with a `24px` backdrop-blur.

---

## 3. Typography: The Editorial Voice
We use a dual-typeface strategy to separate "The Message" from "The Utility."

- **Display & Headlines (Plus Jakarta Sans):** Chosen for its modern, geometric warmth. Use `display-lg` (3.5rem) with `-0.02em` letter spacing for hero sections to create a bold, editorial impact.
- **Body & Labels (Inter):** The workhorse. Inter provides exceptional legibility for financial data and maternal health resources.
- **Hierarchy as Identity:** Use extreme scale contrast. A `display-sm` headline paired with a `body-md` description creates a "magazine" feel that elevates the platform’s perceived value.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often a crutch for poor layout. In this system, depth is achieved through **Tonal Layering**.

- **The Layering Principle:** Stack `surface-container` tiers to create lift. A card should be one step higher in the hierarchy than the surface it sits upon.
- **Ambient Shadows:** Only use shadows for "active" floating elements (e.g., a donation modal). Shadows must be: `0px 20px 40px rgba(26, 26, 46, 0.06)`. This mimics soft, natural sunlight.
- **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., input fields), use `outline_variant` at **15% opacity**. Never use 100% opaque borders.

---

## 5. Components

### Buttons: The Pill Shape
All buttons utilize the `full` (9999px) border-radius.
- **Primary:** `primary` background with `on_primary` text. Use the "Radiant Gradient" on hover.
- **Secondary:** `secondary` (#2e46e6) background. Reserved for high-priority admin or premium actions.
- **Tertiary:** No background. Use `primary` text with an underline that only appears on hover.

### Cards & Content Sections
- **Rule:** Forbid divider lines. 
- Use vertical white space (`spacing-xl` / 24px) to separate content blocks. 
- Cards should use `radius-lg` (24px) or `radius-xl` (32px) to maintain the "human-centric" softness.

### Input Fields
- Background: `surface_container_low`.
- Shape: `radius-sm` (12px) to provide a structural "anchor" against the rounder buttons.
- On Focus: Transition the "Ghost Border" from 15% to 100% opacity of the `primary` color.

### Progress Radiant (Specific to Crowdfunding)
Instead of a standard flat progress bar, use a thick (12px) bar with `radius-full`. The "filled" portion should use the `tertiary_container` (#00b7a8) to `primary` (#006781) gradient to signify growth and health.

---

## 6. Do’s and Don’ts

### Do:
- **Do** use generous white space. If a layout feels "crowded," double the spacing tokens.
- **Do** use `plusJakartaSans` for all numerical data in headlines to make financial goals feel celebratory.
- **Do** overlap elements slightly (e.g., a photo breaking the edge of a card) to create a custom, non-templated feel.

### Don’t:
- **Don’t** use pure black (#000000). Use `on_surface` (#1a1a2e) for all text to maintain the soft, premium feel.
- **Don’t** use "Standard Blue" for links. Use the `secondary` or `primary` tokens to ensure they feel integrated into the brand.
- **Don’t** use sharp 90-degree corners. Everything must have a minimum of `radius-sm` (12px) to remain "human-centric."
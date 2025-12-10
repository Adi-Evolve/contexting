# Comic Book Theme UI/UX Design Spec

## 1. High-Level Concept & Mood
**Theme:** "The Hero's Archive"
**Mood:** Energetic, Bold, Fun, yet Organized.
**Visual Style:**
- **Pop Art / Silver Age Comics:** Thick black outlines, vibrant primary colors, and halftone patterns.
- **UI Metaphor:** The interface is a high-tech gadget or a comic book page where panels represent data.
- **Motion:** Snappy, "pow" effects on click, sliding panels like turning a page.

## 2. Color Palette

| Role | Name | HEX | Usage |
|------|------|-----|-------|
| **Primary** | **Hero Blue** | `#3D5AFE` | Main actions, active states, headers. |
| **Secondary** | **Zap Yellow** | `#FFD600` | Highlights, accents, "star" elements. |
| **Background** | **Paper White** | `#F8F9FA` | Main background (light mode). |
| **Panel BG** | **Pure White** | `#FFFFFF` | Card/Panel backgrounds. |
| **Dark BG** | **Ink Black** | `#121212` | Main background (dark mode). |
| **Dark Panel** | **Midnight** | `#1E1E1E` | Card/Panel backgrounds (dark mode). |
| **Text** | **Comic Black** | `#000000` | Primary text, borders. |
| **Text Inv** | **Speech White** | `#FFFFFF` | Text on dark backgrounds. |
| **Border** | **Outline Black**| `#000000` | 2px-3px borders for all elements. |
| **Success** | **Power Green** | `#00E676` | Success messages, "safe" status. |
| **Warning** | **Alert Orange** | `#FF9100` | Warnings, storage limits. |
| **Error** | **Villain Red** | `#FF1744` | Errors, delete actions. |

## 3. Typography System
**Headings:** `Bangers` (Google Font) or similar display font.
- **H1:** 28px, Uppercase, Letter-spacing 1px.
- **H2:** 24px, Uppercase.
- **H3:** 18px, Uppercase.

**Body:** `Roboto` or `Open Sans` (Google Fonts).
- **Body:** 14px, Regular.
- **Caption:** 12px, Italic.
- **Code:** `Fira Code` or `Consolas`.

## 4. Layout

### A) Extension Popup
- **Header:** "Hero Blue" background with halftone pattern overlay. Title in "Bangers" font. Theme toggle as a circular icon.
- **Stats Panel:** A "Comic Panel" box with thick borders. Stats displayed as "Power Levels".
- **Storage Bar:** Styled like a health bar or energy meter.
- **Actions:** Stacked buttons with "3D" hard shadows.

### B) Sidebar (In-Page)
- **Container:** Slides in from right. "Ink Black" border on the left edge.
- **Search:** Input field looks like a speech bubble or a gadget display.
- **List:** Cards for each conversation.
- **Scrollbar:** Custom thick scrollbar.

## 5. Components

### Buttons
- **Style:** Rectangular, 2px solid black border, 0px border-radius (or slightly rounded 4px).
- **Shadow:** `box-shadow: 4px 4px 0px #000000;` (Hard shadow).
- **Hover:** Translate -2px -2px, Shadow grows to `6px 6px 0px`.
- **Active:** Translate 2px 2px, Shadow disappears (`0px 0px`).

### Cards / Panels
- **Style:** White background, 2px black border.
- **Effect:** "Halftone" dots in the corners or background.
- **Hover:** Slight lift and shadow increase.

### Inputs
- **Style:** 2px black border, flat background.
- **Focus:** "Hero Blue" glow or thick outline.

### Badges
- **Style:** Pill shape, solid black border, bold uppercase text.

## 6. Interaction & State Design
- **Hover:** Elements "pop" up (translate Y -2px).
- **Click:** Elements "press" down (translate Y 2px).
- **Focus:** High-contrast dashed outline or thick colored ring.
- **Micro-interactions:**
    - Success: A small "Boom!" or "Check!" comic bubble appears.
    - Delete: A "Trash" icon that shakes before confirming.

## 7. Accessibility
- **Contrast:** All text must pass AA standards (Black on White, White on Blue/Black).
- **Focus:** Visible focus states for keyboard navigation.
- **Motion:** Respect `prefers-reduced-motion`.

## 8. Implementation Details (CSS Variables)
```css
:root {
    --comic-primary: #3D5AFE;
    --comic-secondary: #FFD600;
    --comic-bg: #F8F9FA;
    --comic-text: #000000;
    --comic-border: 2px solid #000000;
    --comic-shadow: 4px 4px 0px #000000;
    --comic-font-header: 'Bangers', cursive;
    --comic-font-body: 'Roboto', sans-serif;
}
```

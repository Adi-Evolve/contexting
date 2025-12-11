# VOID: Visual Identity & Frontend Implementation Specification

## 1. Brand & Logo Design

### Concept
**VOID** is a "portal into a comic universe for your workflow." The brand identity balances the energetic, dynamic nature of comic books with the sleek, dark aesthetic of modern developer tools. It's not just a tool; it's an entry point to a narrative where the user is the hero fixing bugs and shipping code.

**Mood:**
- **Energetic:** High contrast, dynamic angles, motion lines.
- **Dark Sci-Fi:** Deep blacks, void-like purples/blues, neon accents.
- **Comic Accents:** Halftone patterns, bold strokes, speech bubbles.

### Logo Design
The logo consists of the word "VOID" in a custom, heavy, angular typeface, reminiscent of comic book title headers.

**SVG Implementation:**
```xml
<svg width="200" height="60" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background Shape / Portal Frame -->
  <path d="M10 10 L190 5 L195 55 L5 50 Z" fill="#0F0F0F" stroke="#7C3AED" stroke-width="3"/>
  
  <!-- Text: VOID -->
  <!-- V -->
  <path d="M30 15 L45 45 L60 15" stroke="white" stroke-width="6" stroke-linecap="square" stroke-linejoin="round"/>
  <!-- O -->
  <rect x="70" y="15" width="25" height="30" stroke="white" stroke-width="6"/>
  <!-- I -->
  <line x1="110" y1="15" x2="110" y2="45" stroke="white" stroke-width="6"/>
  <!-- D -->
  <path d="M130 15 H145 C155 15 155 45 145 45 H130 V15 Z" stroke="white" stroke-width="6" fill="none"/>
  
  <!-- Comic Accent: Halftone Dots (Simplified) -->
  <circle cx="180" cy="20" r="2" fill="#7C3AED"/>
  <circle cx="185" cy="25" r="2" fill="#7C3AED"/>
  <circle cx="180" cy="30" r="2" fill="#7C3AED"/>
</svg>
```

**Usage:**
- **Primary:** Header, Splash Screen. White text on dark background with purple accent.
- **Monochrome:** Solid black or white for print/high-contrast modes.
- **Icon:** The "V" shape inside the jagged portal frame.

---

## 2. Color Palette & Typography System

### A. Color Palette

| Name | Role | HEX | Usage Notes |
| :--- | :--- | :--- | :--- |
| **Void Black** | Background | `#09090B` | Main page background. Deep, almost black. |
| **Panel Grey** | Surface | `#18181B` | Card backgrounds, comic panels. |
| **Hero Purple** | Primary | `#7C3AED` | Primary buttons, active states, glows. |
| **Action Cyan** | Secondary | `#06B6D4` | Secondary actions, highlights, links. |
| **Comic White** | Text | `#F4F4F5` | Primary text. Slightly off-white for comfort. |
| **Ink Black** | Border/Text | `#000000` | Borders, strokes (used with white outlines). |
| **Alert Red** | Error | `#EF4444` | Error messages, "Villain" elements. |
| **Power Green** | Success | `#22C55E` | Success states, "System Online". |
| **Warning Yellow**| Warning | `#EAB308` | Alerts, "Cliffhanger" moments. |

**Theme Rules:**
- **Borders:** All containers have a `2px` or `3px` solid border (often `#27272A` or `#7C3AED` on hover).
- **Shadows:** Hard, non-blurred shadows (e.g., `box-shadow: 4px 4px 0px #000`).

### B. Typography

**Headings: "Bangers" or "Komika Axis" (Google Fonts equivalent)**
- **Font Family:** `'Bangers', cursive` or `'Chakra Petch', sans-serif` (for a sci-fi comic look).
- **Style:** Uppercase, bold, slight letter spacing.

**Body: "Inter" or "Roboto"**
- **Font Family:** `'Inter', sans-serif`.
- **Style:** Clean, legible, high x-height.

**Type Scale:**
- **H1:** 3.5rem (Display) - Heavy stroke.
- **H2:** 2.5rem (Section Headers).
- **H3:** 1.75rem (Card Titles).
- **Body:** 1rem (16px) - Line height 1.6.
- **Small:** 0.875rem - Captions, metadata.

---

## 3. Component System (Comic Style)

### Navigation Bar
- **Style:** Fixed top, `Void Black` background, bottom border `2px solid #27272A`.
- **Content:** Logo left, Links center, "Get Started" CTA right.
- **Effect:** Links have a thick underline that slides in on hover.

### Buttons
**Primary Button (The "Hero" Action):**
```css
.btn-primary {
  background-color: #7C3AED;
  color: white;
  border: 2px solid white;
  box-shadow: 4px 4px 0px #000;
  font-family: 'Chakra Petch', sans-serif;
  text-transform: uppercase;
  font-weight: bold;
  transition: transform 0.1s, box-shadow 0.1s;
}
.btn-primary:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px #000;
}
.btn-primary:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px #000;
}
```

### Cards / Panels
- **Concept:** Each card is a "Panel" in the comic page.
- **Style:**
  - Background: `#18181B`
  - Border: `2px solid #3F3F46`
  - Corner: Sharp or slightly rounded (2px).
  - **Caption Box:** A small yellow or white box in the top-left corner for titles (narrator voice).

### Speech Bubbles
- **Usage:** Tooltips, onboarding hints.
- **Style:** White background, black text, black border. CSS clip-path or SVG for the tail.

### Form Inputs
- **Style:**
  - Background: `#000`
  - Border: `2px solid #3F3F46`
  - Text: White
  - Focus: Border changes to `#7C3AED`, box-shadow glow.

---

## 4. Page-by-Page UI & Layout

### 1. Intro / Landing Page (`/`)
- **Hero Section:**
  - **Layout:** Split screen (Desktop). Left: Text/CTA. Right: **3D Comic Book Scene**.
  - **Background:** Dark halftone pattern (SVG).
  - **Interaction:** Scroll triggers the 3D book to rotate and open.
- **"What is VOID?":**
  - **Layout:** 3-column grid of "Comic Panels".
  - **Content:** Features explained as plot points.

### 2. Extension Brief (`/get-started`)
- **Layout:** Vertical timeline (like a comic strip reading down).
- **Panels:**
  1. "The Problem" (Chaos).
  2. "The Solution" (VOID).
  3. "Download" (Action).
- **CTAs:** Large, panel-sized buttons for Browser vs VS Code extensions.

### 3. Login Page (`/login`)
- **Layout:** Centered single panel.
- **Visual:** "Security Clearance" theme.
- **Form:**
  - "Identity Verification" header.
  - Google Login button styled as a "Super Pass".

### 4. Dashboard (`/dashboard`)
- **Layout:** Masonry grid of panels.
- **Panels:**
  - "Current Mission" (Active Issues).
  - "Stats" (Bar charts styled as power levels).
  - "Recent Comms" (Comments).

### 5. Report Issue Page (`/report-issue`)
- **Layout:**
  - Top: "Issue Log" input (large text area, monospace font).
  - Bottom: "Thread" - comments appear as a vertical strip of speech bubbles/panels.

---

## 5. 3D Comic Book Model & Scroll Animation

### A. 3D Model Blueprint
- **Format:** `.glb` (Draco compressed).
- **Meshes:**
  - `CoverFront`, `CoverBack`, `Spine`.
  - `Page1`, `Page2`, `Page3` (Rigged or separate meshes for rotation).
  - `PagesBlock` (The rest of the pages).
- **Textures:**
  - **Base Color:** Comic art style, flat colors, baked lighting (cel shaded).
  - **Emission:** Glowing title on the cover.
  - **Halftone:** Baked into the texture or applied via custom shader.

### B. Scroll + Hover Behavior
- **Tech Stack:** React Three Fiber (R3F), Lenis (Smooth Scroll), GSAP (Animation).
- **Logic:**
  - `useScroll` from `@react-three/drei` or GSAP `ScrollTrigger`.
  - Map scroll `0` to `1` to the rotation of the cover and pages.
- **States:**
  - **Scroll 0%:** Book closed, floating.
  - **Scroll 20%:** Cover opens (-120 deg).
  - **Scroll 40%:** Page 1 flips.
  - **Scroll 100%:** Camera zooms into a specific panel on the page.

---

## 6. Example Code: Integration

### `components/three/ComicBookScene.tsx`
```tsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useScroll } from '@react-three/drei';
import * as THREE from 'three';

export function ComicBookScene() {
  const { nodes, materials } = useGLTF('/models/comic-book.glb');
  const scroll = useScroll();
  const coverRef = useRef<THREE.Group>(null);
  const page1Ref = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    // The offset is between 0 and 1
    const r1 = scroll.range(0, 1 / 3);
    const r2 = scroll.range(1 / 3, 1 / 3);

    if (coverRef.current) {
      // Open cover
      coverRef.current.rotation.y = THREE.MathUtils.damp(
        coverRef.current.rotation.y,
        -Math.PI * 0.8 * r1,
        4,
        delta
      );
    }
    if (page1Ref.current) {
      // Flip page
      page1Ref.current.rotation.y = THREE.MathUtils.damp(
        page1Ref.current.rotation.y,
        -Math.PI * 0.9 * r2,
        4,
        delta
      );
    }
  });

  return (
    <group dispose={null}>
      <group ref={coverRef}>
        <mesh geometry={nodes.Cover.geometry} material={materials.CoverMat} />
      </group>
      <group ref={page1Ref}>
        <mesh geometry={nodes.Page1.geometry} material={materials.PageMat} />
      </group>
      <mesh geometry={nodes.BackCover.geometry} material={materials.CoverMat} />
    </group>
  );
}
```

---

## 7. Responsiveness & Accessibility

### Breakpoints
- **Mobile (<640px):**
  - Stack Hero (Text top, 3D bottom or hidden).
  - 3D Scene: Reduce render quality or replace with static image (`<img src="/comic-cover.png" />`).
- **Tablet (640px - 1024px):**
  - 2-column grids become 1-column.
- **Desktop (>1024px):**
  - Full 3D experience.

### Accessibility
- **Reduced Motion:**
  - Check `prefers-reduced-motion`.
  - If true, disable R3F canvas, show static illustration.
- **Contrast:**
  - Ensure `Hero Purple` text is not used on `Void Black` without checking contrast (4.5:1). Use lighter purple or white for text.
- **Focus:**
  - Visible focus rings (thick yellow or cyan outline) for keyboard navigation.

---

## 8. Performance & Precautions

- **Asset Size:** Keep `.glb` under 2MB. Use `gltf-pipeline` to Draco compress.
- **Canvas:** Use `dpr={[1, 2]}` to cap pixel ratio on high-DPI screens.
- **Fallbacks:** Always have an HTML/CSS fallback for the 3D scene.
- **Copyright:** Ensure no Marvel/DC logos appear in the texture assets. Use generic "Hero" symbols (stars, lightning bolts, shields).

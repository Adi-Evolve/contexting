# VOID 3D Comic Book Model Guide

This guide outlines the requirements for the 3D comic book model to be used in the VOID website.

## Model Specifications

- **File Format:** `.glb` (glTF Binary)
- **Compression:** Draco compression recommended (keep file size < 2MB).
- **Units:** Meters (Standard Three.js units).

## Structure & Hierarchy

The model should be rigged or separated into distinct meshes to allow for animation in React Three Fiber.

**Required Nodes (Names must match exactly or be updated in `ComicBookScene.tsx`):**

1.  **`Cover`** (Mesh/Group)
    - The front cover of the book.
    - Pivot point: Left edge (spine) to allow opening rotation.
2.  **`BackCover`** (Mesh)
    - The back cover.
    - Can be static or part of the main group.
3.  **`Spine`** (Mesh)
    - The binding of the book.
4.  **`Page1`** (Mesh/Group)
    - The first page that flips.
    - Pivot point: Left edge (spine).
5.  **`Page2`** (Mesh/Group)
    - The second page (optional, for more complex animations).
6.  **`PagesBlock`** (Mesh)
    - A solid block representing the remaining stacked pages.

## Textures & Materials

- **Style:** Cel-shaded / Comic Book style.
- **Baking:** Bake lighting and shadows into the Base Color texture for performance.
- **Halftone:** If possible, include a halftone pattern in the texture or use a custom shader.
- **Emission:** Use an emissive map for the "VOID" title on the cover to make it glow.

## Animation Logic (Implemented in Code)

The `ComicBookScene.tsx` component handles the animation based on scroll progress:

- **Scroll 0% - 33%:** The `Cover` rotates from 0 to ~160 degrees (opens).
- **Scroll 33% - 66%:** `Page1` rotates to reveal content.
- **Scroll 66% - 100%:** Camera zooms in or book floats away.

## Integration

Place the exported `comic-book.glb` file in `website/public/models/`.

Update `website/src/components/three/ComicBookScene.tsx`:

```tsx
const { nodes, materials } = useGLTF('/models/comic-book.glb')

// ... inside the return statement
<group ref={coverRef}>
  <mesh geometry={nodes.Cover.geometry} material={materials.CoverMat} />
</group>
```

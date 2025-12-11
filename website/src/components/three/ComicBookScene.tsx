'use client'

import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'
import '@/types/react-three-fiber'

export function ComicBookScene() {
  const scroll = useScroll()
  const bookRef = useRef<THREE.Group>(null)
  const coverRef = useRef<THREE.Group>(null)
  const page1Ref = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    // scroll.offset is 0 to 1
    // We can use scroll.range(start, end) to get a 0-1 value for a specific range
    
    const openCover = scroll.range(0, 1/3)
    const flipPage1 = scroll.range(1/3, 1/3)
    
    if (bookRef.current) {
      // Float animation
      bookRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
      
      // Rotate book slightly based on scroll
      bookRef.current.rotation.y = THREE.MathUtils.lerp(0, -0.5, openCover)
      bookRef.current.rotation.x = THREE.MathUtils.lerp(0.2, 0.1, openCover)
    }

    if (coverRef.current) {
      // Open cover (-180 degrees roughly)
      coverRef.current.rotation.y = THREE.MathUtils.damp(
        coverRef.current.rotation.y,
        -Math.PI * 0.8 * openCover,
        4,
        delta
      )
    }
    
    if (page1Ref.current) {
      // Flip page
      page1Ref.current.rotation.y = THREE.MathUtils.damp(
        page1Ref.current.rotation.y,
        -Math.PI * 0.9 * flipPage1,
        4,
        delta
      )
    }
  })

  // Placeholder Geometry until GLB is ready
  return (
    <group ref={bookRef} rotation={[0.2, 0, 0]}>
      {/* Back Cover */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[2, 3, 0.1]} />
        <meshStandardMaterial color="#09090B" />
      </mesh>
      
      {/* Pages Block */}
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[1.9, 2.9, 0.1]} />
        <meshStandardMaterial color="#F4F4F5" />
      </mesh>

      {/* Page 1 */}
      <group ref={page1Ref} position={[-0.95, 0, 0.1]}>
        <mesh position={[0.95, 0, 0]}>
          <boxGeometry args={[1.9, 2.9, 0.01]} />
          <meshStandardMaterial color="#F4F4F5" />
        </mesh>
        {/* Comic Panel on Page 1 */}
        <mesh position={[0.95, 0.5, 0.01]}>
          <planeGeometry args={[1.5, 1]} />
          <meshBasicMaterial color="#7C3AED" />
        </mesh>
      </group>

      {/* Front Cover */}
      <group ref={coverRef} position={[-1, 0, 0.1]}>
        <mesh position={[1, 0, 0]}>
          <boxGeometry args={[2, 3, 0.05]} />
          <meshStandardMaterial color="#18181B" />
        </mesh>
        {/* Cover Art Placeholder */}
        <mesh position={[1, 0, 0.03]}>
          <planeGeometry args={[1.8, 2.8]} />
          <meshBasicMaterial color="#09090B" />
        </mesh>
        {/* Title */}
        <mesh position={[1, 0.8, 0.04]}>
          <planeGeometry args={[1.5, 0.5]} />
          <meshBasicMaterial color="#7C3AED" />
        </mesh>
      </group>
    </group>
  )
}

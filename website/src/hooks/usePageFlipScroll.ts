import { useEffect, useRef } from 'react'
import Lenis from 'lenis'

interface PageFlipConfig {
  totalSections: number
  sensitivity?: number // How fast pages flip relative to scroll
}

export function usePageFlipScroll({ totalSections, sensitivity = 1 }: PageFlipConfig) {
  const lenisRef = useRef<Lenis | null>(null)
  const progressRef = useRef(0)

  useEffect(() => {
    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    })

    lenisRef.current = lenis

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    // Scroll Handler
    lenis.on('scroll', (e: any) => {
      const scrollY = e.scroll
      const windowHeight = window.innerHeight
      const totalScrollHeight = document.body.scrollHeight - windowHeight
      
      // Calculate global progress 0 to 1
      const progress = Math.max(0, Math.min(1, scrollY / totalScrollHeight))
      progressRef.current = progress

      // Update CSS Variables for each section
      // We map the global progress to individual page angles
      // Example: If we have 3 sections, 0-0.33 is page 1, 0.33-0.66 is page 2, etc.
      
      const sectionProgressStep = 1 / (totalSections - 1)

      for (let i = 0; i < totalSections; i++) {
        // Calculate start and end points for this section's flip
        const start = (i) * sectionProgressStep
        const end = (i + 1) * sectionProgressStep
        
        let sectionProgress = (progress - start) / (end - start)
        sectionProgress = Math.max(0, Math.min(1, sectionProgress))
        
        // Calculate Angle: 0 to -180 degrees (flipping left)
        // We use a non-linear ease for better feel
        const ease = sectionProgress // Linear for now, can add easing function
        const angle = ease * -180

        document.documentElement.style.setProperty(`--page-angle-${i}`, `${angle}deg`)
        document.documentElement.style.setProperty(`--page-progress-${i}`, `${sectionProgress}`)
      }
      
      document.documentElement.style.setProperty('--scroll-progress', progress.toString())
    })

    return () => {
      lenis.destroy()
    }
  }, [totalSections, sensitivity])

  return lenisRef
}

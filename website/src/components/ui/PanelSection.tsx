'use client'

import React from 'react'
import styles from './PanelSection.module.css'
import { cn } from '@/lib/utils'

interface PanelSectionProps {
  index: number
  children: React.ReactNode
  className?: string
  zIndex?: number
}

export function PanelSection({ index, children, className, zIndex }: PanelSectionProps) {
  // We bind the specific angle variable for this index to the generic --angle variable
  // used by the CSS module.
  const style = {
    '--angle': `var(--page-angle-${index}, 0deg)`,
    zIndex: zIndex ?? (100 - index), // Lower index = higher z-index (on top)
  } as React.CSSProperties

  return (
    <div className={cn(styles.comicPage, className)} style={style}>
      <div className={styles.comicPageContent}>
        {/* Halftone Overlay */}
        <div className={styles.halftoneBg} />
        
        {/* Content */}
        <div className="relative w-full h-full overflow-hidden">
          {children}
        </div>
      </div>
      
      {/* Back of the page (visible when flipped) */}
      <div className={styles.comicPageBack}>
        <span className="text-void-white/20 font-display text-4xl font-bold uppercase">
          VOID // PAGE {index + 1}
        </span>
      </div>
    </div>
  )
}

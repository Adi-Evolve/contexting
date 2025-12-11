'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ComicPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  caption?: string
  variant?: 'default' | 'speech' | 'thought'
}

export function ComicPanel({
  className,
  children,
  caption,
  variant = 'default',
  ...props
}: ComicPanelProps) {
  return (
    <div
      className={cn(
        'relative bg-void-panel border-2 border-void-panel transition-all',
        variant === 'default' && 'border-void-ink',
        variant === 'speech' && 'bg-white text-black rounded-2xl border-black p-6',
        className
      )}
      {...props}
    >
      {caption && (
        <div className="absolute -top-3 left-4 bg-void-yellow text-black font-bold text-xs px-2 py-0.5 border border-black uppercase tracking-wider z-10">
          {caption}
        </div>
      )}
      {children}
      
      {variant === 'speech' && (
        <div className="absolute -bottom-3 left-8 w-6 h-6 bg-white border-r-2 border-b-2 border-black rotate-45" />
      )}
    </div>
  )
}

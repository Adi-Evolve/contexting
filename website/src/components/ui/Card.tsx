'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { CardProps } from '@/types/component.types'

export function Card({
  className,
  title,
  description,
  footer,
  children,
}: CardProps) {
  return (
    <div className={cn(
      'bg-void-darker border border-gray-800 rounded-xl overflow-hidden',
      'shadow-lg hover:shadow-xl transition-shadow',
      className
    )}>
      {(title || description) && (
        <div className="px-6 py-4 border-b border-gray-800">
          {title && (
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-gray-400">{description}</p>
          )}
        </div>
      )}
      <div className="px-6 py-4">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 bg-void-dark border-t border-gray-800">
          {footer}
        </div>
      )}
    </div>
  )
}

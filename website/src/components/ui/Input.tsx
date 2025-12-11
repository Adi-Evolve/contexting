'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { InputProps } from '@/types/component.types'

export function Input({
  className,
  label,
  error,
  helperText,
  type = 'text',
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-display uppercase tracking-wider text-void-cyan mb-1 ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        <input
          type={type}
          className={cn(
            'w-full px-4 py-3 bg-void-black border-2 rounded-none',
            'text-white placeholder-gray-600 font-sans',
            'focus:outline-none focus:border-void-primary focus:shadow-[4px_4px_0px_rgba(124,58,237,0.5)]',
            'transition-all duration-200',
            error ? 'border-void-red' : 'border-void-ink group-hover:border-gray-500',
            className
          )}
          {...props}
        />
        {/* Corner accent */}
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-void-ink opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-void-ink opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      {error && (
        <p className="mt-1 text-sm font-bold text-void-red font-sans flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-400 font-sans">{helperText}</p>
      )}
    </div>
  )
}

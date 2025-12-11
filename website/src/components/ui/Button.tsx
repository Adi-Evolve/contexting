'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { ButtonProps } from '@/types/component.types'

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [comicWord, setComicWord] = useState('POP!')

  const comicWords = ['BOOM!', 'POW!', 'ZAP!', 'BAM!', 'CRASH!', 'WHAM!', 'KAPOW!']

  const handleMouseEnter = () => {
    setIsHovered(true)
    setComicWord(comicWords[Math.floor(Math.random() * comicWords.length)])
  }

  const baseStyles = 'relative inline-flex items-center justify-center font-display font-bold uppercase tracking-wider transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed border-2 border-void-ink shadow-comic active:translate-x-[2px] active:translate-y-[2px] active:shadow-comic-active hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-comic-hover hover:scale-[1.03] hover:border-[3px]'
  
  const variants = {
    primary: 'bg-void-purple text-white hover:bg-void-purple/90',
    secondary: 'bg-void-cyan text-white hover:bg-void-cyan/90',
    outline: 'bg-transparent border-void-purple text-void-purple hover:bg-void-purple hover:text-white',
    ghost: 'bg-transparent border-transparent shadow-none hover:shadow-none hover:bg-white/10 hover:translate-x-0 hover:translate-y-0 active:translate-x-0 active:translate-y-0 hover:scale-100 hover:border-0',
    danger: 'bg-void-red text-white hover:bg-void-red/90',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {/* Onomatopoeia Effect */}
      {isHovered && variant !== 'ghost' && (
        <span className="absolute -top-8 -right-8 pointer-events-none animate-bounce z-50">
          <svg width="80" height="60" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform rotate-12 drop-shadow-md">
            <path d="M10 20 L20 10 L30 20 L40 5 L50 20 L60 10 L70 20 L80 5 L90 20 L95 40 L80 55 L60 45 L40 55 L20 45 L5 40 Z" fill="#EAB308" stroke="black" strokeWidth="2"/>
            <text x="50" y="38" textAnchor="middle" fill="black" fontFamily="Bangers, sans-serif" fontWeight="bold" fontSize="20">{comicWord}</text>
          </svg>
        </span>
      )}

      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  )
}


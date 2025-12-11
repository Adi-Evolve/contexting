'use client'

import React from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { LayoutProps } from '@/types/component.types'

export function Layout({ 
  children, 
  showHeader = true, 
  showFooter = true,
  className 
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-void-dark text-white flex flex-col">
      {showHeader && <Header />}
      <main className={`flex-1 ${showHeader ? 'pt-16' : ''} ${className || ''}`}>
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  )
}

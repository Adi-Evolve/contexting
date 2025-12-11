'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks'
import { Button } from '@/components/ui'

export function Header() {
  const pathname = usePathname()
  const { isAuthenticated, signOut } = useAuth()

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const isActive = pathname === href
    return (
      <Link
        href={href}
        className={`relative px-2 py-1 text-sm font-bold uppercase tracking-wider transition-colors group ${
          isActive ? 'text-void-purple' : 'text-void-white hover:text-void-purple'
        }`}
      >
        {children}
        <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-void-purple transform origin-left transition-transform duration-300 ${
          isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
        }`} />
      </Link>
    )
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-void-black border-b-2 border-void-ink">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <svg width="120" height="40" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover:scale-105">
              <path d="M10 10 L190 5 L195 55 L5 50 Z" fill="#09090B" stroke="#7C3AED" strokeWidth="3"/>
              <path d="M30 15 L45 45 L60 15" stroke="#F4F4F5" strokeWidth="6" strokeLinecap="square" strokeLinejoin="round"/>
              <rect x="70" y="15" width="25" height="30" stroke="#F4F4F5" strokeWidth="6"/>
              <line x1="110" y1="15" x2="110" y2="45" stroke="#F4F4F5" strokeWidth="6"/>
              <path d="M130 15 H145 C155 15 155 45 145 45 H130 V15 Z" stroke="#F4F4F5" strokeWidth="6" fill="none"/>
              <circle cx="180" cy="20" r="2" fill="#7C3AED"/>
              <circle cx="185" cy="25" r="2" fill="#7C3AED"/>
              <circle cx="180" cy="30" r="2" fill="#7C3AED"/>
            </svg>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/get-started">Get Started</NavLink>
            <NavLink href="/about">About</NavLink>
            
            {isAuthenticated ? (
              <>
                <NavLink href="/dashboard">Dashboard</NavLink>
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="primary" size="sm">
                  Login
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}


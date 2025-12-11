'use client'

import React from 'react'
import Link from 'next/link'
import { APP_CONFIG } from '@/lib/config'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-void-black border-t-2 border-void-ink relative overflow-hidden">
      {/* Halftone Pattern Overlay */}
      <div className="absolute inset-0 bg-halftone opacity-10 pointer-events-none" />

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-display font-bold text-void-white uppercase tracking-widest">VOID</span>
            </div>
            <p className="text-sm text-void-white/70 font-sans">
              {APP_CONFIG.description}
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-void-purple font-display font-bold uppercase mb-4 tracking-wider">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/get-started" className="text-sm text-void-white/70 hover:text-void-cyan transition-colors font-bold uppercase">
                  Get Started
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-void-white/70 hover:text-void-cyan transition-colors font-bold uppercase">
                  About
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-void-white/70 hover:text-void-cyan transition-colors font-bold uppercase">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/report-issue" className="text-sm text-void-white/70 hover:text-void-cyan transition-colors font-bold uppercase">
                  Report Issue
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-void-purple font-display font-bold uppercase mb-4 tracking-wider">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href={APP_CONFIG.social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-void-white/70 hover:text-void-cyan transition-colors font-bold uppercase"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href={APP_CONFIG.social.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-void-white/70 hover:text-void-cyan transition-colors font-bold uppercase"
                >
                  Discord
                </a>
              </li>
              <li>
                <a
                  href={APP_CONFIG.social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-void-white/70 hover:text-void-cyan transition-colors font-bold uppercase"
                >
                  Twitter
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-void-purple font-display font-bold uppercase mb-4 tracking-wider">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/legal/privacy" className="text-sm text-void-white/70 hover:text-void-cyan transition-colors font-bold uppercase">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="text-sm text-void-white/70 hover:text-void-cyan transition-colors font-bold uppercase">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t-2 border-void-ink/20">
          <p className="text-center text-sm text-void-white/50 font-mono">
            © {currentYear} {APP_CONFIG.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

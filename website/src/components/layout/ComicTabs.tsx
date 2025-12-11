'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { name: 'Cover', href: '#cover', index: 0 },
  { name: 'Mission', href: '#mission', index: 1 },
  { name: 'Login', href: '#login', index: 2 },
  { name: 'Issues', href: '#issues', index: 3 },
]

export function ComicTabs() {
  // In a real app, we might track active section via intersection observer
  // For now, we just provide the links
  
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
      {tabs.map((tab) => (
        <a
          key={tab.name}
          href={tab.href}
          className="group relative flex items-center justify-end"
          onClick={(e) => {
            e.preventDefault()
            // Calculate scroll position based on index
            const totalHeight = document.body.scrollHeight - window.innerHeight
            const targetScroll = (tab.index / (tabs.length - 1)) * totalHeight
            window.scrollTo({ top: targetScroll, behavior: 'smooth' })
          }}
        >
          <span className="mr-4 px-2 py-1 bg-void-yellow text-black font-bold text-sm uppercase opacity-0 group-hover:opacity-100 transition-opacity border border-black shadow-[2px_2px_0px_#000]">
            {tab.name}
          </span>
          <div className="w-4 h-4 bg-void-white border-2 border-black rotate-45 group-hover:bg-void-purple transition-colors" />
        </a>
      ))}
    </div>
  )
}

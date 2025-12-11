'use client'

import React from 'react'
import { ComicPanel } from './ComicPanel'
import { Button } from './Button'

interface IssueCardProps {
  title: string
  description: string
  status: 'open' | 'in-progress' | 'closed'
  priority: 'low' | 'medium' | 'high'
  author: string
  date: string
}

export function IssueCard({
  title,
  description,
  status,
  priority,
  author,
  date
}: IssueCardProps) {
  const statusColors = {
    'open': 'bg-void-green text-black',
    'in-progress': 'bg-void-yellow text-black',
    'closed': 'bg-void-panel text-gray-500 border-gray-600'
  }

  const priorityColors = {
    'low': 'text-void-cyan',
    'medium': 'text-void-yellow',
    'high': 'text-void-red'
  }

  return (
    <ComicPanel className="mb-4 hover:scale-[1.01] transition-transform cursor-pointer" caption={`ISSUE: ${status.toUpperCase()}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-display font-bold text-void-white">{title}</h3>
        <span className={`px-2 py-1 text-xs font-bold uppercase border border-black ${statusColors[status]}`}>
          {status}
        </span>
      </div>
      
      <p className="text-void-white/80 mb-4 font-sans line-clamp-2">
        {description}
      </p>
      
      <div className="flex justify-between items-center text-sm border-t-2 border-void-ink/20 pt-3 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-void-purple rounded-full border border-void-ink" />
          <span className="font-bold text-void-white/60">{author}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className={`font-bold uppercase ${priorityColors[priority]}`}>
            {priority} Priority
          </span>
          <span className="text-void-white/40 font-mono text-xs">{date}</span>
        </div>
      </div>
    </ComicPanel>
  )
}

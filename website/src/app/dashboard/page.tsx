'use client'

import React from 'react'
import { Layout, ProtectedRoute } from '@/components/layout'
import { ComicPanel, LoadingSpinner, Button } from '@/components/ui'
import { useAuth, useProfile, useIssues } from '@/hooks'
import Link from 'next/link'
import { Issue } from '@/types/database.types'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const { user } = useAuth()
  const { profile, loading: profileLoading } = useProfile()
  const { issues, loading: issuesLoading } = useIssues({ userId: user?.id })

  if (profileLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-void-black">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  const myIssues = issues.filter(issue => issue.user_id === user?.id)
  const openIssues = myIssues.filter(issue => issue.status === 'open')
  const resolvedIssues = myIssues.filter(issue => issue.status === 'resolved')

  return (
    <Layout>
      <div className="min-h-screen bg-void-black bg-[url('/grid.svg')] bg-fixed">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* HERO SECTION */}
            <div className="relative">
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-void-purple/20 rounded-full blur-xl animate-pulse" />
              <h1 className="text-6xl md:text-7xl font-display text-white mb-2 drop-shadow-[4px_4px_0px_rgba(124,58,237,1)]">
                MISSION CONTROL
              </h1>
              <p className="text-xl md:text-2xl text-void-cyan font-sans uppercase tracking-widest">
                OPERATIVE: {profile?.display_name || user?.email?.split('@')[0] || 'UNKNOWN'}
              </p>
            </div>

            {/* ACCESS DOWNLOADS SECTION */}
            <ComicPanel 
              caption="THE ARMORY" 
              className="bg-void-darker border-void-purple shadow-[8px_8px_0px_rgba(124,58,237,0.2)] hover:shadow-[12px_12px_0px_rgba(124,58,237,0.4)] transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-void-purple/10 rounded-full flex items-center justify-center border-2 border-void-purple animate-pulse">
                      <svg className="w-8 h-8 text-void-purple" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 3.6v8.72c0 4.42-3.05 8.58-7.5 9.75v.01l-.5-.14-.5.14v-.01C7.05 24.58 4 20.42 4 16V7.78l8-3.6z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-3xl font-display text-void-yellow drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                        EQUIP YOURSELF
                      </h3>
                      <p className="text-gray-300 font-sans text-lg">
                        Download the Chrome and VS Code extensions to begin your memory augmentation.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a 
                    href="/void-chrome-extension.zip" 
                    download="void-chrome-extension.zip"
                    className="block"
                  >
                    <Button 
                      variant="secondary" 
                      size="lg" 
                      className="font-display text-xl tracking-wider px-8 py-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all w-full"
                    >
                      CHROME EXTENSION
                    </Button>
                  </a>
                  <a 
                    href="/vscode-extension.vsix" 
                    download="void-vscode-extension.vsix"
                    className="block"
                  >
                    <Button 
                      variant="primary" 
                      size="lg" 
                      className="font-display text-xl tracking-wider px-8 py-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all w-full"
                    >
                      VS CODE EXTENSION
                    </Button>
                  </a>
                </div>
              </div>
            </ComicPanel>

            {/* STATS GRID */}
            <div className="grid md:grid-cols-3 gap-6">
              <ComicPanel caption="TOTAL INTEL" className="bg-void-darker">
                <div className="text-center py-4">
                  <div className="text-6xl font-display text-void-primary mb-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    {myIssues.length}
                  </div>
                  <p className="text-gray-400 font-sans uppercase tracking-widest text-sm">Reported Issues</p>
                </div>
              </ComicPanel>

              <ComicPanel caption="ACTIVE THREATS" className="bg-void-darker">
                <div className="text-center py-4">
                  <div className="text-6xl font-display text-void-secondary mb-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    {openIssues.length}
                  </div>
                  <p className="text-gray-400 font-sans uppercase tracking-widest text-sm">Open Tickets</p>
                </div>
              </ComicPanel>

              <ComicPanel caption="NEUTRALIZED" className="bg-void-darker">
                <div className="text-center py-4">
                  <div className="text-6xl font-display text-void-accent mb-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    {resolvedIssues.length}
                  </div>
                  <p className="text-gray-400 font-sans uppercase tracking-widest text-sm">Resolved</p>
                </div>
              </ComicPanel>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* RECENT ACTIVITY */}
              <div className="lg:col-span-2">
                <ComicPanel caption="RECENT TRANSMISSIONS" className="h-full bg-void-darker">
                  <div className="p-2 space-y-4">
                    {issuesLoading ? (
                      <div className="flex justify-center py-12">
                        <LoadingSpinner />
                      </div>
                    ) : myIssues.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded-lg">
                        <p className="text-gray-400 font-sans text-lg mb-4">No transmissions detected.</p>
                        <Link href="/report-issue">
                          <Button variant="outline" size="sm">INITIATE REPORT</Button>
                        </Link>
                      </div>
                    ) : (
                      myIssues.slice(0, 5).map((issue) => (
                        <IssueRow key={issue.id} issue={issue} />
                      ))
                    )}
                  </div>
                </ComicPanel>
              </div>

              {/* QUICK ACTIONS */}
              <div className="lg:col-span-1">
                <ComicPanel caption="COMMAND CENTER" className="h-full bg-void-darker">
                  <div className="space-y-4 p-2">
                    <Link href="/report-issue" className="block group">
                      <div className="p-4 bg-void-black border-2 border-gray-800 group-hover:border-void-primary transition-all rounded-lg flex items-center gap-4">
                        <div className="w-12 h-12 bg-void-primary/20 rounded flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                          📝
                        </div>
                        <div>
                          <h4 className="font-display text-xl text-white group-hover:text-void-primary transition-colors">REPORT ISSUE</h4>
                          <p className="text-sm text-gray-400 font-sans">Submit bug report</p>
                        </div>
                      </div>
                    </Link>

                    <Link href="/profile" className="block group">
                      <div className="p-4 bg-void-black border-2 border-gray-800 group-hover:border-void-secondary transition-all rounded-lg flex items-center gap-4">
                        <div className="w-12 h-12 bg-void-secondary/20 rounded flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                          👤
                        </div>
                        <div>
                          <h4 className="font-display text-xl text-white group-hover:text-void-secondary transition-colors">IDENTITY</h4>
                          <p className="text-sm text-gray-400 font-sans">Update profile data</p>
                        </div>
                      </div>
                    </Link>

                    <Link href="/settings" className="block group">
                      <div className="p-4 bg-void-black border-2 border-gray-800 group-hover:border-void-accent transition-all rounded-lg flex items-center gap-4">
                        <div className="w-12 h-12 bg-void-accent/20 rounded flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                          ⚙️
                        </div>
                        <div>
                          <h4 className="font-display text-xl text-white group-hover:text-void-accent transition-colors">SETTINGS</h4>
                          <p className="text-sm text-gray-400 font-sans">System configuration</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                </ComicPanel>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  )
}

function IssueRow({ issue }: { issue: Issue }) {
  const statusColors = {
    'open': 'bg-void-primary/20 text-void-primary border-void-primary',
    'in-progress': 'bg-void-yellow/20 text-void-yellow border-void-yellow',
    'resolved': 'bg-green-500/20 text-green-400 border-green-500',
    'closed': 'bg-gray-700/20 text-gray-400 border-gray-600'
  }

  return (
    <div className="group p-4 bg-void-black border-2 border-gray-800 hover:border-void-primary transition-all rounded-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-display text-xl text-white group-hover:text-void-primary transition-colors mb-1">
            {issue.title}
          </h4>
          <p className="text-sm text-gray-400 font-sans line-clamp-1">
            {issue.body}
          </p>
        </div>
        <span className={`px-3 py-1 text-xs font-bold uppercase border rounded ${statusColors[issue.status] || statusColors['open']}`}>
          {issue.status}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 font-mono">
        <span>ID: {issue.id.slice(0, 8)}</span>
        <span>{new Date(issue.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  )
}

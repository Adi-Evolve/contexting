'use client'

import React from 'react'
import Link from 'next/link'
import { Layout } from '@/components/layout'
import { Button, Card } from '@/components/ui'
import { APP_CONFIG } from '@/lib/config'

export default function GetStartedPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-bangers text-5xl md:text-6xl mb-6 text-center text-void-white tracking-wider">
            INITIATE PROTOCOL
          </h1>
          <p className="text-xl text-gray-400 text-center mb-12 font-chakra">
            Equip the VOID arsenal and secure your context.
          </p>

          {/* What VOID Does */}
          <section className="mb-16">
            <h2 className="font-bangers text-3xl text-void-white mb-6">MISSION OBJECTIVES</h2>
            <Card className="bg-void-darker border-void-purple">
              <div className="space-y-4">
                <p className="text-gray-300 font-chakra text-lg">
                  <span className="text-void-purple font-bold">VOID</span> is your defense against the chaos of information overload. It bridges your browser and development environment to preserve your digital legacy.
                </p>
                <ul className="space-y-3 text-gray-300 font-chakra">
                  <li className="flex items-start">
                    <span className="text-void-yellow mr-2">►</span>
                    <span><strong>Semantic Memory Graph:</strong> Real-time context tracking that understands meaning, not just keywords.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-void-yellow mr-2">►</span>
                    <span><strong>Unified Intelligence:</strong> Syncs your mental state across Chrome and VS Code instantly.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-void-yellow mr-2">►</span>
                    <span><strong>Visual Archives:</strong> Comic-book-inspired visualizations of your project's history.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-void-yellow mr-2">►</span>
                    <span><strong>Tactical Dashboard:</strong> Manage issues, feedback, and memory nodes from a central command center.</span>
                  </li>
                </ul>
              </div>
            </Card>
          </section>

          {/* How to Use */}
          <section className="mb-16">
            <h2 className="font-bangers text-3xl text-void-white mb-6">DEPLOYMENT GUIDE</h2>
            <div className="space-y-6">
              <Card title="Step 1: Install Extensions">
                <p className="text-gray-300 mb-4">
                  Download and install both the browser extension and VS Code extension 
                  for the complete VOID experience.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href={APP_CONFIG.extensions.browser.chrome}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="primary" className="w-full">
                      Download Browser Extension
                    </Button>
                  </a>
                  <a
                    href={APP_CONFIG.extensions.vscode}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="secondary" className="w-full">
                      Download VS Code Extension
                    </Button>
                  </a>
                </div>
              </Card>

              <Card title="Step 2: Create an Account">
                <p className="text-gray-300 mb-4">
                  Sign up for a VOID account to sync your data across devices and access 
                  the dashboard.
                </p>
                <Link href="/login?mode=signup">
                  <Button variant="outline">Create Account →</Button>
                </Link>
              </Card>

              <Card title="Step 3: Connect & Sync">
                <p className="text-gray-300">
                  Once installed, the extensions will automatically sync with your VOID 
                  account. You can view your activity, report issues, and track progress 
                  from the dashboard.
                </p>
              </Card>

              <Card title="Step 4: Explore the Dashboard">
                <p className="text-gray-300 mb-4">
                  Access your personalized dashboard to view stats, manage issues, and 
                  explore the comic-book interface.
                </p>
                <Link href="/dashboard">
                  <Button variant="ghost">Go to Dashboard →</Button>
                </Link>
              </Card>
            </div>
          </section>

          {/* Extension Details */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-6">Extension Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card title="Browser Extension">
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>Track visited pages and context</li>
                  <li>Capture screenshots and notes</li>
                  <li>Quick issue reporting</li>
                  <li>Integration with popular dev tools</li>
                  <li>Offline support</li>
                </ul>
              </Card>

              <Card title="VS Code Extension">
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>Code context extraction</li>
                  <li>In-editor issue creation</li>
                  <li>Workspace synchronization</li>
                  <li>Command palette integration</li>
                  <li>Status bar indicators</li>
                </ul>
              </Card>
            </div>
          </section>

          {/* System Requirements */}
          <section>
            <h2 className="text-3xl font-bold mb-6">System Requirements</h2>
            <Card>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">Browser Extension:</h4>
                  <ul className="list-disc list-inside text-gray-300">
                    <li>Chrome 88+ / Edge 88+ / Firefox 85+</li>
                    <li>Manifest V3 support</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">VS Code Extension:</h4>
                  <ul className="list-disc list-inside text-gray-300">
                    <li>VS Code 1.60.0 or higher</li>
                    <li>Node.js 14+ (for development)</li>
                  </ul>
                </div>
              </div>
            </Card>
          </section>

          {/* CTA */}
          <div className="mt-16 text-center">
            <Link href="/login">
              <Button size="lg">
                Sign In to Get Started →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}

'use client'

import React from 'react'
import Image from 'next/image'
import { Layout } from '@/components/layout'
import { ComicPanel } from '@/components/ui'

export default function AboutPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-bangers text-6xl md:text-7xl mb-12 text-center text-void-white tracking-wider drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]">
            ORIGIN STORY
          </h1>
          
          <div className="space-y-16">
            {/* Mission Section */}
            <ComicPanel 
              caption="THE MISSION" 
              className="transform -rotate-1"
            >
              <div className="p-6">
                <p className="text-xl text-gray-300 mb-6 font-chakra leading-relaxed">
                  In a digital universe chaotic with information overload, a new villain emerged: <span className="text-red-500 font-bold">CONTEXT LOSS</span>. 
                  Developers and creators were losing their most valuable memories, fragmented across tabs, windows, and sessions.
                </p>
                <p className="text-xl text-gray-300 font-chakra leading-relaxed">
                  <span className="text-void-purple font-bold">VOID</span> was forged to combat this threat. 
                  We built the <span className="text-yellow-400 font-bold">Semantic Memory Graph (SMG)</span> — a revolutionary architecture that models AI memory like human cognition.
                  We are not just a tool; we are the shield that guards your context, the archive that preserves your digital legacy.
                </p>
              </div>
            </ComicPanel>

            {/* Superpowers Section */}
            <section>
              <h2 className="font-bangers text-4xl md:text-5xl mb-8 text-center text-void-white">
                SUPERPOWERS
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {/* Card 1 */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-void-purple transform rotate-2 group-hover:rotate-3 transition-transform"></div>
                    <div className="relative bg-void-dark border-2 border-black p-4 h-full transform transition-transform group-hover:-translate-y-2">
                        <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 absolute top-2 left-2 border border-black">
                            ISSUE #1
                        </div>
                        <div className="mt-8 mb-4 h-48 bg-gray-800 relative overflow-hidden border-2 border-black">
                             <Image 
                                src="/SEMANTIC RETRIEVAL.png" 
                                alt="Semantic Retrieval" 
                                fill 
                                className="object-cover"
                             />
                        </div>
                        <h3 className="font-bangers text-2xl text-void-yellow mb-2">SEMANTIC RETRIEVAL</h3>
                        <p className="font-chakra text-gray-300 text-sm">
                            Finds relevant context by meaning, not just recency. Never lose a decision or concept again.
                        </p>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-void-purple transform -rotate-1 group-hover:-rotate-2 transition-transform"></div>
                    <div className="relative bg-void-dark border-2 border-black p-4 h-full transform transition-transform group-hover:-translate-y-2">
                        <div className="bg-void-yellow text-black text-xs font-bold px-2 py-1 absolute top-2 left-2 border border-black">
                            ISSUE #2
                        </div>
                        <div className="mt-8 mb-4 h-48 bg-gray-800 relative overflow-hidden border-2 border-black">
                             <Image 
                                src="/HYPER COMPRESSION.png" 
                                alt="Hyper Compression" 
                                fill 
                                className="object-cover"
                             />
                        </div>
                        <h3 className="font-bangers text-2xl text-void-yellow mb-2">HYPER COMPRESSION</h3>
                        <p className="font-chakra text-gray-300 text-sm">
                            Intelligent algorithms compress 50MB of conversation history into a 400KB tactical file (90%+ reduction).
                        </p>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-void-purple transform rotate-1 group-hover:rotate-2 transition-transform"></div>
                    <div className="relative bg-void-dark border-2 border-black p-4 h-full transform transition-transform group-hover:-translate-y-2">
                        <div className="bg-void-cyan text-black text-xs font-bold px-2 py-1 absolute top-2 left-2 border border-black">
                            ISSUE #3
                        </div>
                        <div className="mt-8 mb-4 h-48 bg-gray-800 relative overflow-hidden border-2 border-black">
                             <Image 
                                src="/UNIVERSAL SYNC.png" 
                                alt="Universal Sync" 
                                fill 
                                className="object-cover"
                             />
                        </div>
                        <h3 className="font-bangers text-2xl text-void-yellow mb-2">UNIVERSAL SYNC</h3>
                        <p className="font-chakra text-gray-300 text-sm">
                            Portable .smg files work across Chrome, VS Code, and any AI model. Your memory travels with you.
                        </p>
                    </div>
                </div>
              </div>
            </section>

            {/* Tech Stack Section */}
            <ComicPanel caption="THE ARSENAL" className="transform rotate-1">
              <div className="p-6 grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bangers text-2xl text-void-purple mb-4">CORE TECH</h3>
                  <ul className="space-y-2 font-chakra text-gray-300">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-void-purple rounded-full mr-3"></span>
                      Semantic Graph Engine
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-void-purple rounded-full mr-3"></span>
                      Brotli & Delta Compression
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-void-purple rounded-full mr-3"></span>
                      IndexedDB + OPFS Storage
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-void-purple rounded-full mr-3"></span>
                      Next.js 14 & Tailwind CSS
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bangers text-2xl text-void-purple mb-4">INTEGRATIONS</h3>
                  <ul className="space-y-2 font-chakra text-gray-300">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-void-purple rounded-full mr-3"></span>
                      Chrome Extension (Manifest V3)
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-void-purple rounded-full mr-3"></span>
                      VS Code Extension API
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-void-purple rounded-full mr-3"></span>
                      OpenAI, Anthropic & Local LLMs
                    </li>
                  </ul>
                </div>
              </div>
            </ComicPanel>

            {/* Call to Action */}
            <div className="text-center py-12">
              <h2 className="font-bangers text-3xl text-gray-400 mb-6">
                JOIN THE RESISTANCE AGAINST CONTEXT LOSS
              </h2>
              <p className="font-chakra text-void-purple text-xl">
                Start your journey today.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

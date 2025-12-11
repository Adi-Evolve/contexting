'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Layout } from '@/components/layout'
import { Button, ComicPanel, IssueCard } from '@/components/ui'
import { APP_CONFIG } from '@/lib/config'
import { useAuth } from '@/hooks'

export default function HomePage() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [threatLevel, setThreatLevel] = useState('LOW')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signInWithGoogle, signIn, user, isAuthenticated } = useAuth()
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollTop / docHeight
      setScrollProgress(Math.max(0, Math.min(1, progress)))
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      await signInWithGoogle()
    } catch (error) {
      console.error('Google sign-in error:', error)
      setLoading(false)
    }
  }

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      alert('Please enter email and password')
      return
    }
    try {
      setLoading(true)
      await signIn(email, password)
      // Redirect will be handled by useAuth hook
    } catch (error: any) {
      alert(error.message || 'Login failed')
      setLoading(false)
    }
  }

  const handleDownloadExtension = (extensionType: 'chrome' | 'vscode') => {
    if (!user) {
      // Scroll to login section if not authenticated
      scrollToSection('login')
      return
    }

    // Download the extension
    const link = document.createElement('a')
    if (extensionType === 'chrome') {
      link.href = '/void-chrome-extension.zip'
      link.download = 'void-chrome-extension.zip'
    } else {
      link.href = '/vscode-extension.vsix'
      link.download = 'void-vscode-extension.vsix'
    }
    link.click()
  }

  return (
    <Layout>
      {/* Progress Indicator */}
      <div className="fixed top-0 left-0 w-full h-1 bg-void-panel z-50">
        <div 
          className="h-full bg-void-purple transition-all duration-300"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>
      
      {/* SECTION 1: COVER PAGE */}
      <section id="hero" className="min-h-screen bg-void-black relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none" />
            
            {/* Floating Code Fragments */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
               <div className="absolute top-20 left-10 opacity-60 animate-float font-mono text-void-cyan text-sm font-bold drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                 {`function recall() { return memory.get('context'); }`}
               </div>
               <div className="absolute top-40 right-20 opacity-60 animate-float-delayed font-mono text-void-purple text-sm font-bold drop-shadow-[0_0_5px_rgba(124,58,237,0.5)]">
                 {`const saga = new Workflow({ epic: true });`}
               </div>
               <div className="absolute bottom-32 left-1/4 opacity-50 animate-pulse font-mono text-void-red text-xs font-bold drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">
                 {`// TODO: Fix memory leak... DONE.`}
               </div>
               <div className="absolute bottom-20 right-1/3 opacity-50 animate-float font-mono text-void-yellow text-sm font-bold drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]">
                 {`import { Superpower } from '@void/core';`}
               </div>
            </div>

            <div className="h-full flex flex-col items-center justify-center p-8 md:p-16 text-center relative z-10">
              
              {/* Hero Content */}
              <div className="relative z-10 max-w-4xl">
                <div className="mb-8 inline-block relative">
                  <div className="absolute -inset-4 bg-void-purple/20 blur-xl rounded-full animate-pulse" />
                  <svg width="200" height="60" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-64 h-auto md:w-96">
                    <path d="M10 10 L190 5 L195 55 L5 50 Z" fill="#09090B" stroke="#7C3AED" strokeWidth="3"/>
                    <path d="M30 15 L45 45 L60 15" stroke="#F4F4F5" strokeWidth="6" strokeLinecap="square" strokeLinejoin="round"/>
                    <rect x="70" y="15" width="25" height="30" stroke="#F4F4F5" strokeWidth="6"/>
                    <line x1="110" y1="15" x2="110" y2="45" stroke="#F4F4F5" strokeWidth="6"/>
                    <path d="M130 15 H145 C155 15 155 45 145 45 H130 V15 Z" stroke="#F4F4F5" strokeWidth="6" fill="none"/>
                  </svg>
                </div>

                <ComicPanel variant="speech" className="mb-12 mx-auto max-w-2xl transform -rotate-1">
                  <p className="text-xl md:text-2xl font-bold text-black">
                    "Your workflow isn't just a list of tasks... it's an <span className="text-void-purple">EPIC SAGA!</span>"
                  </p>
                </ComicPanel>

                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <Button 
                    size="lg" 
                    className="text-xl px-12 py-6 shadow-[8px_8px_0px_#000]"
                    onClick={() => scrollToSection('mission')}
                  >
                    Start Mission
                  </Button>
                  <span className="font-comic text-void-white/50 text-sm animate-bounce">
                    SCROLL TO OPEN ⬇
                  </span>
                </div>
              </div>
            </div>
      </section>

      {/* SECTION 2: MISSION (WHAT IS VOID) */}
      <section id="mission" className="min-h-screen bg-void-panel relative">
            <div className="h-full p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 content-center">
              <div className="space-y-8">
                {/* Panels Removed as requested */}
              </div>

              {/* Rogues Gallery */}
              <div className="col-span-1 md:col-span-2 mt-12 mb-12">
                <h2 className="text-4xl font-display font-bold text-void-white mb-8 text-center transform -rotate-1">
                  WANTED: CONTEXT KILLERS
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Villain 1 */}
                  <div className="bg-[#f0e6d2] p-4 border-4 border-black transform rotate-1 shadow-[8px_8px_0px_#000] relative group hover:scale-105 transition-transform">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-void-red text-white px-4 py-1 font-bold border-2 border-black rotate-2">
                      MOST WANTED
                    </div>
                    <div className="border-2 border-black h-48 mb-4 bg-gray-800 flex items-center justify-center overflow-hidden relative">
                       <Image 
                         src="/the Context Snatcher.png" 
                         alt="The Context Snatcher" 
                         fill
                         className="object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                       />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-black text-center mb-2">THE CONTEXT SNATCHER</h3>
                    <p className="font-comic text-black/80 text-sm text-center">
                      Wipes your AI's memory after every session. Forces you to re-explain the entire plot.
                    </p>
                    <div className="mt-4 border-t-2 border-black pt-2 text-center font-bold text-void-red">
                      REWARD: INFINITE RECALL
                    </div>
                  </div>

                  {/* Villain 2 */}
                  <div className="bg-[#f0e6d2] p-4 border-4 border-black transform -rotate-1 shadow-[8px_8px_0px_#000] relative group hover:scale-105 transition-transform">
                    <div className="border-2 border-black h-48 mb-4 bg-gray-800 flex items-center justify-center overflow-hidden relative">
                       <Image 
                         src="/The Copy-Paste Grind.png" 
                         alt="The Copy-Paste Grind" 
                         fill
                         className="object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                       />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-black text-center mb-2">THE COPY-PASTE GRIND</h3>
                    <p className="font-comic text-black/80 text-sm text-center">
                      Forces you to manually transfer code blocks between files and chat. A tedious, soul-crushing villain.
                    </p>
                    <div className="mt-4 border-t-2 border-black pt-2 text-center font-bold text-void-red">
                      REWARD: AUTO-SYNC
                    </div>
                  </div>

                  {/* Villain 3 */}
                  <div className="bg-[#f0e6d2] p-4 border-4 border-black transform rotate-2 shadow-[8px_8px_0px_#000] relative group hover:scale-105 transition-transform">
                    <div className="border-2 border-black h-48 mb-4 bg-gray-800 flex items-center justify-center overflow-hidden relative">
                       <Image 
                         src="/The Black Box.png" 
                         alt="The Black Box" 
                         fill
                         className="object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                       />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-black text-center mb-2">THE BLACK BOX</h3>
                    <p className="font-comic text-black/80 text-sm text-center">
                      Locks your project knowledge inside closed chat sessions. Prevents you from building a knowledge base.
                    </p>
                    <div className="mt-4 border-t-2 border-black pt-2 text-center font-bold text-void-red">
                      REWARD: OPEN KNOWLEDGE
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center gap-6 items-center border-t-2 border-void-ink/20 pt-8 w-full col-span-1 md:col-span-2">
                <h2 className="text-4xl font-display font-bold text-void-white mb-4 text-center">
                  THE ARMORY
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                  {/* Weapon 1 */}
                  <div 
                    className="bg-void-blue/20 border-2 border-void-cyan p-6 relative group cursor-pointer hover:bg-void-blue/30 transition-all"
                    onClick={() => handleDownloadExtension('chrome')}
                  >
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-void-cyan"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-void-cyan"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-void-cyan"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-void-cyan"></div>
                    
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-mono font-bold text-void-cyan">MK-1 BROWSER EXTENSION</h3>
                      <div className="relative w-10 h-10">
                        <Image 
                          src="/chrome-icon-Photoroom.png" 
                          alt="Chrome Extension" 
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-xs font-mono text-void-cyan/70">
                        <span>POWER</span>
                        <div className="h-2 flex-grow bg-void-black border border-void-cyan/30">
                          <div className="h-full bg-void-cyan w-[80%]"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-void-cyan/70">
                        <span>SPEED</span>
                        <div className="h-2 flex-grow bg-void-black border border-void-cyan/30">
                          <div className="h-full bg-void-cyan w-[95%]"></div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-void-white/60 text-sm font-mono mb-4">
                      Standard issue sidekick. Deploys directly to Chrome. Intercepts memory loss in real-time.
                    </p>
                    
                    <div className="text-right">
                      <span className="text-void-cyan text-xs font-mono group-hover:underline">INITIATE DOWNLOAD &gt;&gt;</span>
                    </div>
                  </div>

                  {/* Weapon 2 */}
                  <div 
                    className="bg-void-purple/20 border-2 border-void-purple p-6 relative group cursor-pointer hover:bg-void-purple/30 transition-all"
                    onClick={() => handleDownloadExtension('vscode')}
                  >
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-void-purple"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-void-purple"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-void-purple"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-void-purple"></div>
                    
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-mono font-bold text-void-purple">MK-2 VS CODE EXTENSION</h3>
                      <div className="relative w-10 h-10">
                        <Image 
                          src="/vscode-icon.webp" 
                          alt="VS Code Extension" 
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-xs font-mono text-void-purple/70">
                        <span>POWER</span>
                        <div className="h-2 flex-grow bg-void-black border border-void-purple/30">
                          <div className="h-full bg-void-purple w-[100%]"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-void-purple/70">
                        <span>RANGE</span>
                        <div className="h-2 flex-grow bg-void-black border border-void-purple/30">
                          <div className="h-full bg-void-purple w-[90%]"></div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-void-white/60 text-sm font-mono mb-4">
                      Heavy artillery. Deep integration with the mainframe. Context awareness at the file level.
                    </p>
                    
                    <div className="text-right">
                      <span className="text-void-purple text-xs font-mono group-hover:underline">INITIATE DOWNLOAD &gt;&gt;</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
      </section>

      {/* SECTION 3: LOGIN - Only show if not authenticated */}
      {!isAuthenticated && (
      <section id="login" className="min-h-screen bg-void-darker relative flex items-center justify-center">
            <div className="w-full h-full flex items-center justify-center p-4">
              <div className="w-full max-w-md relative">
                {/* Decorative "POW" background */}
                <div className="absolute -inset-20 bg-void-purple/5 rounded-full blur-3xl animate-pulse" />
                
                <ComicPanel className="bg-void-black p-8 shadow-[12px_12px_0px_#000] border-4 border-void-white" caption="SECURITY CLEARANCE">
                  <div className="absolute -top-6 -right-6 bg-void-red text-white px-4 py-2 font-bold border-4 border-black rotate-12 shadow-lg z-20">
                    TOP SECRET
                  </div>
                  
                  <h2 className="text-3xl font-display font-bold text-center mb-8 text-void-white">
                    IDENTIFY YOURSELF
                  </h2>

                  <div className="space-y-4">
                    <Button 
                      variant="outline" 
                      className="w-full justify-center gap-2 bg-white text-black hover:bg-gray-100 border-white font-bold"
                      onClick={handleGoogleSignIn}
                      isLoading={loading}
                      disabled={loading}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Continue with Google
                    </Button>

                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-void-ink/50"></div>
                      <span className="flex-shrink mx-4 text-void-white/50 text-sm">OR</span>
                      <div className="flex-grow border-t border-void-ink/50"></div>
                    </div>

                    <div className="space-y-2">
                      <input 
                        type="email" 
                        placeholder="Agent Email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-void-panel border-2 border-void-ink p-3 text-white focus:border-void-purple focus:shadow-[0_0_10px_#7C3AED] outline-none transition-all"
                      />
                      <input 
                        type="password" 
                        placeholder="Passcode" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-void-panel border-2 border-void-ink p-3 text-white focus:border-void-purple focus:shadow-[0_0_10px_#7C3AED] outline-none transition-all"
                      />
                    </div>

                    <Button 
                      className="w-full mt-4"
                      onClick={handleEmailSignIn}
                      isLoading={loading}
                      disabled={loading}
                    >
                      Access Mainframe
                    </Button>
                  </div>
                </ComicPanel>
              </div>
            </div>
      </section>
      )}

      {/* SECTION 4: ISSUES */}
      <section id="issues" className="min-h-screen bg-void-black relative">
            <div className="h-full p-8 md:p-12 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-end mb-8 border-b-4 border-void-white pb-4">
                  <h2 className="text-5xl font-display font-bold text-void-white">
                    ACTIVE THREATS
                  </h2>
                  <span className="text-void-red font-bold text-xl animate-pulse">
                    LIVE FEED ●
                  </span>
                </div>

                <div className="grid gap-6">
                  <IssueCard 
                    title="Memory Leak in Sector 7"
                    description="The garbage collector is failing to recycle entities in the render loop. FPS dropping below 30."
                    status="open"
                    priority="high"
                    author="Cmdr. Shepard"
                    date="2m ago"
                  />
                  <IssueCard 
                    title="UI Glitch on Hover"
                    description="Buttons are vibrating uncontrollably when the mouse leaves the viewport."
                    status="in-progress"
                    priority="medium"
                    author="Dev. One"
                    date="15m ago"
                  />
                  <IssueCard 
                    title="Add 'Dark Mode' Toggle"
                    description="The light is burning my retinas. We need a void mode immediately."
                    status="closed"
                    priority="low"
                    author="NightOwl"
                    date="1h ago"
                  />
                </div>

                {/* Report Threat Section */}
                <div className="mt-12 border-t-4 border-void-white/20 pt-8">
                  <h3 className="text-3xl font-display font-bold text-void-white mb-6 flex items-center gap-3">
                    REPORT NEW THREAT
                    <span className="text-sm bg-void-red px-2 py-1 rounded text-white font-mono animate-pulse">URGENT</span>
                  </h3>
                  <div className="bg-void-panel border-2 border-void-ink p-6 relative shadow-[8px_8px_0px_#27272a]">
                    <div className="absolute -top-3 -left-3 bg-void-yellow border-2 border-void-ink px-2 py-1 font-bold text-sm transform -rotate-2 text-black shadow-sm">
                      CONFIDENTIAL
                    </div>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-void-white font-bold mb-3 font-comic tracking-wider">THREAT LEVEL</label>
                        <div className="flex flex-wrap gap-4">
                          {['LOW', 'MEDIUM', 'HIGH', 'AVENGERS LEVEL'].map((level) => (
                            <div 
                              key={level} 
                              className="flex items-center gap-2 cursor-pointer group"
                              onClick={() => setThreatLevel(level)}
                            >
                              <div className={`w-4 h-4 border-2 rounded-full flex items-center justify-center transition-colors ${threatLevel === level ? 'border-void-purple' : 'border-void-white group-hover:border-void-purple'}`}>
                                <div className={`w-2 h-2 bg-void-purple rounded-full transition-opacity ${threatLevel === level ? 'opacity-100' : 'opacity-0'}`} />
                              </div>
                              <span className={`text-sm font-comic transition-colors ${threatLevel === level ? 'text-void-purple' : 'text-void-white/80 group-hover:text-void-purple'}`}>{level}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <input 
                          type="text" 
                          placeholder="CODENAME (Your Name)" 
                          className="w-full bg-void-black border-2 border-void-ink p-3 text-white focus:border-void-cyan focus:shadow-[4px_4px_0px_#22d3ee] outline-none transition-all font-mono"
                        />
                         <input 
                          type="text" 
                          placeholder="SECTOR (Component/Page)" 
                          className="w-full bg-void-black border-2 border-void-ink p-3 text-white focus:border-void-cyan focus:shadow-[4px_4px_0px_#22d3ee] outline-none transition-all font-mono"
                        />
                      </div>

                      <textarea 
                        placeholder="Describe the anomaly in detail..." 
                        className="w-full bg-void-black border-2 border-void-ink p-4 text-white min-h-[120px] focus:border-void-cyan focus:shadow-[4px_4px_0px_#22d3ee] outline-none transition-all font-mono resize-y"
                      />
                      
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-void-white/40 font-mono text-xs">
                          * Transmission is encrypted
                        </span>
                        <Button size="lg" className="bg-void-red hover:bg-red-600 text-white border-2 border-white shadow-[4px_4px_0px_#fff] hover:shadow-[2px_2px_0px_#fff] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                          TRANSMIT REPORT
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 text-center">
                </div>
              </div>
            </div>
      </section>
      {/* Footer */}
      <footer className="bg-void-black border-t-4 border-void-red p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[url('/grid.svg')]"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <div className="inline-block border-4 border-void-red p-2 mb-4 transform -rotate-2">
                <h3 className="text-2xl font-display font-bold text-void-red uppercase tracking-widest">TOP SECRET</h3>
              </div>
              <p className="text-void-white/50 font-mono text-sm max-w-md">
                WARNING: This site contains classified information regarding Project MemoryForge. 
                Unauthorized access will result in immediate termination of... wait, are you still reading this?
              </p>
            </div>
            
            <div className="flex gap-4">
               <div className="group relative">
                 <div className="absolute -inset-1 bg-void-red blur opacity-20 group-hover:opacity-50 transition-opacity"></div>
                 <button className="relative bg-void-black border-2 border-void-red text-void-red px-6 py-3 font-mono font-bold hover:bg-void-red hover:text-white transition-colors">
                   SELF DESTRUCT
                 </button>
               </div>
               
               <div className="group relative">
                 <div className="absolute -inset-1 bg-void-cyan blur opacity-20 group-hover:opacity-50 transition-opacity"></div>
                 <button className="relative bg-void-black border-2 border-void-cyan text-void-cyan px-6 py-3 font-mono font-bold hover:bg-void-cyan hover:text-black transition-colors">
                   DECRYPT DATA
                 </button>
               </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-void-white/10 flex flex-col md:flex-row justify-between items-center text-void-white/30 font-mono text-xs">
            <p>© 2025 MEMORYFORGE INDUSTRIES. ALL RIGHTS RESERVED.</p>
            <p className="mt-2 md:mt-0">CLEARANCE LEVEL: OMEGA</p>
          </div>
        </div>
      </footer>
    </Layout>
  )
}



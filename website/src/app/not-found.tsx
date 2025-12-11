'use client'

import React from 'react'
import Link from 'next/link'
import { Layout } from '@/components/layout'
import { Button } from '@/components/ui'

export default function NotFoundPage() {
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <div className="text-9xl font-bold bg-gradient-to-r from-void-primary via-void-accent to-void-secondary bg-clip-text text-transparent">
              404
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
          <p className="text-xl text-gray-400 mb-8">
            Looks like you've ventured into the VOID...
          </p>
          
          <Link href="/">
            <Button size="lg">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  )
}

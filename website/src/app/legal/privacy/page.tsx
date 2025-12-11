'use client'

import React from 'react'
import { Layout } from '@/components/layout'
import { Card } from '@/components/ui'

export default function PrivacyPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          
          <Card>
            <div className="prose prose-invert max-w-none space-y-6">
              <p className="text-gray-400">
                <strong>Last updated:</strong> December 10, 2025
              </p>

              <section>
                <h2 className="text-2xl font-bold mb-3">Introduction</h2>
                <p className="text-gray-300">
                  VOID ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy 
                  explains how we collect, use, disclose, and safeguard your information when you use our 
                  website, browser extension, and VS Code extension.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">Information We Collect</h2>
                <h3 className="text-xl font-semibold mb-2">Personal Information</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>Email address and display name when you create an account</li>
                  <li>Profile information you choose to provide (bio, avatar)</li>
                  <li>OAuth data from third-party authentication providers (Google)</li>
                </ul>

                <h3 className="text-xl font-semibold mb-2 mt-4">Usage Information</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>Issues and feedback you submit through the platform</li>
                  <li>Extension usage data (anonymized)</li>
                  <li>Log data including IP address, browser type, and timestamps</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">How We Use Your Information</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>To provide and maintain our services</li>
                  <li>To authenticate and manage your account</li>
                  <li>To respond to your inquiries and provide customer support</li>
                  <li>To improve our products and services</li>
                  <li>To send you updates and notifications (with your consent)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">Data Storage and Security</h2>
                <p className="text-gray-300">
                  We use Supabase (PostgreSQL) for secure data storage. All data is encrypted in transit 
                  using TLS/SSL. We implement industry-standard security measures to protect your personal 
                  information from unauthorized access, alteration, or destruction.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">Data Sharing and Disclosure</h2>
                <p className="text-gray-300">
                  We do not sell, trade, or rent your personal information to third parties. We may share 
                  your information only in the following circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>With your explicit consent</li>
                  <li>To comply with legal obligations</li>
                  <li>To protect our rights and prevent fraud</li>
                  <li>With service providers who assist in operating our platform (under strict confidentiality agreements)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">Your Rights</h2>
                <p className="text-gray-300">You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate or incomplete data</li>
                  <li>Request deletion of your data</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Export your data in a portable format</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">Cookies and Tracking</h2>
                <p className="text-gray-300">
                  We use essential cookies for authentication and session management. We do not use 
                  third-party tracking or advertising cookies.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">Children's Privacy</h2>
                <p className="text-gray-300">
                  Our services are not intended for users under the age of 13. We do not knowingly 
                  collect personal information from children under 13.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">Changes to This Policy</h2>
                <p className="text-gray-300">
                  We may update this Privacy Policy from time to time. We will notify you of any changes 
                  by posting the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">Contact Us</h2>
                <p className="text-gray-300">
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <p className="text-void-primary">
                  privacy@voidapp.com
                </p>
              </section>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}

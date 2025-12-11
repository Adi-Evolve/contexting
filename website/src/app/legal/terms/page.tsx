'use client'

import React from 'react'
import { Layout } from '@/components/layout'
import { Card } from '@/components/ui'

export default function TermsPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          
          <Card>
            <div className="prose prose-invert max-w-none space-y-6">
              <p className="text-gray-400">
                <strong>Last updated:</strong> December 10, 2025
              </p>

              <section>
                <h2 className="text-2xl font-bold mb-3">1. Acceptance of Terms</h2>
                <p className="text-gray-300">
                  By accessing and using VOID ("the Service"), you accept and agree to be bound by the 
                  terms and provisions of this agreement. If you do not agree to abide by the above, 
                  please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">2. Use License</h2>
                <p className="text-gray-300">
                  Permission is granted to download and install VOID's browser and VS Code extensions for 
                  personal and commercial use. This license shall automatically terminate if you violate 
                  any of these restrictions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">3. User Accounts</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                  <li>You must provide accurate and complete information when creating an account</li>
                  <li>You are responsible for all activities that occur under your account</li>
                  <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">4. Acceptable Use</h2>
                <p className="text-gray-300">You agree not to:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>Use the Service for any illegal purpose or in violation of any laws</li>
                  <li>Violate or infringe other users' rights, including privacy and intellectual property</li>
                  <li>Transmit any malicious code, viruses, or harmful software</li>
                  <li>Attempt to gain unauthorized access to the Service or related systems</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Submit false, misleading, or inappropriate content</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">5. User Content</h2>
                <p className="text-gray-300">
                  You retain ownership of any content you submit through the Service (issues, feedback, etc.). 
                  By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, 
                  display, and distribute your content for the purpose of operating and improving the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">6. Intellectual Property</h2>
                <p className="text-gray-300">
                  The Service and its original content, features, and functionality are owned by VOID and 
                  are protected by international copyright, trademark, and other intellectual property laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">7. Disclaimer of Warranties</h2>
                <p className="text-gray-300">
                  The Service is provided "as is" without any warranties, expressed or implied. We do not 
                  warrant that the Service will be uninterrupted, secure, or error-free.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">8. Limitation of Liability</h2>
                <p className="text-gray-300">
                  In no event shall VOID or its affiliates be liable for any indirect, incidental, special, 
                  consequential, or punitive damages resulting from your use of the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">9. Data and Privacy</h2>
                <p className="text-gray-300">
                  Your use of the Service is also governed by our Privacy Policy. Please review our Privacy 
                  Policy to understand our practices.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">10. Termination</h2>
                <p className="text-gray-300">
                  We may terminate or suspend your account and access to the Service immediately, without 
                  prior notice, for any reason, including breach of these Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">11. Changes to Terms</h2>
                <p className="text-gray-300">
                  We reserve the right to modify these terms at any time. We will notify users of any 
                  material changes. Your continued use of the Service after changes constitutes acceptance 
                  of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">12. Governing Law</h2>
                <p className="text-gray-300">
                  These Terms shall be governed by and construed in accordance with applicable laws, 
                  without regard to its conflict of law provisions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-3">13. Contact Information</h2>
                <p className="text-gray-300">
                  If you have any questions about these Terms, please contact us at:
                </p>
                <p className="text-void-primary">
                  legal@voidapp.com
                </p>
              </section>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}

export const APP_CONFIG = {
  name: 'VOID',
  description: 'An immersive, comic-book-inspired productivity companion for developers',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  version: '0.1.0',
  
  // Extension URLs - will be updated when published
  extensions: {
    browser: {
      chrome: '#', // Chrome Web Store URL
      firefox: '#', // Firefox Add-ons URL
      edge: '#', // Edge Add-ons URL
    },
    vscode: '#', // VS Code Marketplace URL
  },

  // Social links
  social: {
    github: 'https://github.com/yourusername/void',
    twitter: 'https://twitter.com/voidapp',
    discord: '#',
  },

  // Feature flags
  features: {
    threeD: true,
    darkMode: true,
    notifications: false, // Coming soon
  },
}

export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
}

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  timeout: 10000,
}

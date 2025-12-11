export type RouteConfig = {
  path: string
  label: string
  requiresAuth: boolean
  icon?: string
}

export const PUBLIC_ROUTES: RouteConfig[] = [
  { path: '/', label: 'Home', requiresAuth: false },
  { path: '/get-started', label: 'Get Started', requiresAuth: false },
  { path: '/about', label: 'About', requiresAuth: false },
  { path: '/login', label: 'Login', requiresAuth: false },
]

export const PROTECTED_ROUTES: RouteConfig[] = [
  { path: '/dashboard', label: 'Dashboard', requiresAuth: true, icon: 'dashboard' },
  { path: '/profile', label: 'Profile', requiresAuth: true, icon: 'person' },
  { path: '/settings', label: 'Settings', requiresAuth: true, icon: 'settings' },
  { path: '/report-issue', label: 'Report Issue', requiresAuth: true, icon: 'bug_report' },
]

export const LEGAL_ROUTES: RouteConfig[] = [
  { path: '/legal/privacy', label: 'Privacy Policy', requiresAuth: false },
  { path: '/legal/terms', label: 'Terms of Service', requiresAuth: false },
]

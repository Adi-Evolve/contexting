# VOID Website - Architecture Documentation

## Overview

VOID is built with modern web technologies optimized for performance, scalability, and developer experience.

## Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Three.js + React Three Fiber** - 3D graphics
- **GSAP** - Advanced animations
- **Lenis** - Smooth scrolling

### Backend
- **Supabase** - PostgreSQL database + Authentication
- **Next.js API Routes** - Serverless functions

### Deployment
- **Vercel** - Frontend hosting & edge functions
- **Supabase Cloud** - Database & auth hosting

## Project Structure

```
website/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Home page
│   │   ├── login/              # Authentication pages
│   │   ├── dashboard/          # Protected dashboard
│   │   ├── profile/            # User profile
│   │   ├── settings/           # User settings
│   │   ├── report-issue/       # Issue reporting
│   │   ├── get-started/        # Onboarding
│   │   ├── about/              # About page
│   │   ├── legal/              # Privacy & Terms
│   │   ├── api/                # API routes
│   │   │   ├── issues/         # Issue CRUD endpoints
│   │   │   └── auth/           # Auth callbacks
│   │   └── not-found.tsx       # 404 page
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Alert.tsx
│   │   │   └── ...
│   │   ├── layout/             # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Layout.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   └── three/              # 3D components
│   │       └── ComicBookScene.tsx
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts          # Authentication hook
│   │   ├── useProfile.ts       # User profile hook
│   │   └── useIssues.ts        # Issues management hook
│   │
│   ├── services/               # Business logic layer
│   │   ├── auth.service.ts     # Auth operations
│   │   ├── profile.service.ts  # Profile operations
│   │   └── issue.service.ts    # Issue operations
│   │
│   ├── lib/                    # Utilities & configuration
│   │   ├── supabase/           # Supabase clients
│   │   │   ├── client.ts       # Client-side client
│   │   │   ├── server.ts       # Server-side client
│   │   │   └── middleware.ts   # Middleware client
│   │   ├── config.ts           # App configuration
│   │   ├── utils.ts            # Utility functions
│   │   └── errors.ts           # Error classes
│   │
│   ├── types/                  # TypeScript definitions
│   │   ├── database.types.ts   # Database types
│   │   ├── api.types.ts        # API types
│   │   ├── component.types.ts  # Component types
│   │   └── routes.types.ts     # Route definitions
│   │
│   └── styles/                 # Global styles
│       └── globals.css         # Tailwind + custom CSS
│
├── public/                     # Static assets
│   └── assets/
│       ├── logo/               # Logo files (placeholder)
│       ├── 3d/                 # 3D models (placeholder)
│       └── images/             # Images
│
├── docs/                       # Documentation
│   ├── DATABASE_SETUP.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── ARCHITECTURE.md
│
├── .env.example                # Environment variables template
├── .gitignore
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies
└── README.md                   # Getting started guide
```

## Architecture Patterns

### 1. Service Layer Pattern

All business logic is abstracted into service modules:

```typescript
// services/issue.service.ts
export const issueService = {
  createIssue: async (userId, payload) => { ... },
  getIssues: async (filters) => { ... },
  updateIssue: async (id, payload) => { ... },
  deleteIssue: async (id) => { ... },
}
```

### 2. Custom Hooks Pattern

React hooks encapsulate state management and side effects:

```typescript
// hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // ... auth logic
  return { user, loading, signIn, signOut, ... }
}
```

### 3. Protected Routes Pattern

Authentication is enforced via wrapper component:

```typescript
// components/layout/ProtectedRoute.tsx
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  return <>{children}</>
}
```

### 4. API Route Pattern

Next.js API routes handle server-side operations:

```typescript
// app/api/issues/route.ts
export async function GET(request: Request) {
  const supabase = createServerClient()
  const { data } = await supabase.from('issues').select()
  return NextResponse.json({ data })
}
```

## Data Flow

### Authentication Flow

```
User → Login Page → authService.signIn()
  → Supabase Auth → Set Session Cookie
  → Redirect to Dashboard
```

### Issue Creation Flow

```
User → Report Issue Form → Validate Input
  → issueService.createIssue()
  → POST /api/issues
  → Supabase Insert
  → Update Local State
  → Show Success Message
```

### Profile Update Flow

```
User → Profile Page → Edit Form
  → profileService.updateProfile()
  → Supabase Update
  → Refresh Profile Data
  → Show Success Message
```

## Security Measures

### 1. Authentication
- Supabase handles secure session management
- JWT tokens stored in HTTP-only cookies
- Automatic token refresh

### 2. Authorization
- Row Level Security (RLS) enabled on all tables
- Users can only access/modify their own data
- Server-side validation on all API routes

### 3. Input Validation
- Client-side validation with Zod schemas
- Server-side sanitization to prevent XSS
- Length limits on all text inputs

### 4. API Security
- CORS configured for specific origins
- Rate limiting (to be implemented)
- No sensitive data in client-side code

## Performance Optimizations

### 1. Server-Side Rendering (SSR)
- Landing page is statically generated
- Authenticated pages use SSR for fresh data

### 2. Code Splitting
- Automatic route-based code splitting
- Dynamic imports for heavy components (Three.js)

### 3. Image Optimization
- Next.js Image component for optimized loading
- Lazy loading for below-the-fold images

### 4. Caching
- Supabase queries cached where appropriate
- Static assets cached via CDN

### 5. Database Indexes
- Indexes on frequently queried columns
- Optimized query patterns

## Scalability Considerations

### Horizontal Scaling
- Stateless API routes can scale infinitely
- Vercel edge functions distribute globally

### Database Scaling
- Supabase auto-scales with connection pooling
- Read replicas for heavy read operations (future)

### Asset Delivery
- CDN for static assets
- Image optimization via Vercel

## Error Handling

### Client-Side
```typescript
try {
  await issueService.createIssue(data)
  setAlert({ type: 'success', message: 'Issue created!' })
} catch (error) {
  setAlert({ type: 'error', message: error.message })
}
```

### Server-Side
```typescript
export async function POST(request: Request) {
  try {
    // ... operation
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

## Testing Strategy (To Be Implemented)

### Unit Tests
- Service layer functions
- Utility functions
- Custom hooks

### Integration Tests
- API routes
- Database operations
- Authentication flows

### E2E Tests
- Critical user journeys
- Cross-browser compatibility

## Future Enhancements

1. **Real-time Updates** - Supabase Realtime subscriptions
2. **Email Notifications** - Issue status updates
3. **Admin Dashboard** - Issue management panel
4. **Analytics** - User behavior tracking
5. **Progressive Web App** - Offline support
6. **Internationalization** - Multi-language support
7. **Advanced 3D Features** - GLTF model loading
8. **Performance Monitoring** - Sentry integration
9. **Rate Limiting** - API endpoint protection
10. **Websocket Support** - Real-time collaboration

## Contributing

See main repository CONTRIBUTING.md for guidelines.

## Support

For issues or questions:
- GitHub Issues: [link]
- Discord: [link]
- Email: support@voidapp.com

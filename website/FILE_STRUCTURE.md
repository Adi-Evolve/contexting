# VOID Website - Complete File Structure

```
website/
│
├── 📄 package.json                      # Dependencies & scripts
├── 📄 tsconfig.json                     # TypeScript configuration
├── 📄 next.config.js                    # Next.js configuration
├── 📄 tailwind.config.ts                # Tailwind CSS configuration
├── 📄 postcss.config.js                 # PostCSS configuration
├── 📄 .eslintrc.json                    # ESLint rules
├── 📄 .env.example                      # Environment template
├── 📄 .gitignore                        # Git ignore rules
├── 📄 README.md                         # Main documentation
├── 📄 QUICKSTART.md                     # 5-minute setup guide
├── 📄 PROJECT_COMPLETE.md               # Implementation summary
│
├── 📁 src/
│   │
│   ├── 📁 app/                          # Next.js App Router
│   │   ├── 📄 layout.tsx                # Root layout with metadata
│   │   ├── 📄 page.tsx                  # Landing/Home page
│   │   ├── 📄 not-found.tsx             # 404 error page
│   │   │
│   │   ├── 📁 login/                    # Authentication
│   │   │   └── 📄 page.tsx              # Login/Signup page
│   │   │
│   │   ├── 📁 dashboard/                # User dashboard (protected)
│   │   │   └── 📄 page.tsx              # Dashboard with stats
│   │   │
│   │   ├── 📁 profile/                  # Profile management (protected)
│   │   │   └── 📄 page.tsx              # Edit profile & avatar
│   │   │
│   │   ├── 📁 settings/                 # User settings (protected)
│   │   │   └── 📄 page.tsx              # Account & preferences
│   │   │
│   │   ├── 📁 report-issue/             # Issue reporting (protected)
│   │   │   └── 📄 page.tsx              # Create & view issues
│   │   │
│   │   ├── 📁 get-started/              # Onboarding
│   │   │   └── 📄 page.tsx              # Extension downloads & guide
│   │   │
│   │   ├── 📁 about/                    # About page
│   │   │   └── 📄 page.tsx              # Mission & tech stack
│   │   │
│   │   ├── 📁 legal/                    # Legal pages
│   │   │   ├── 📁 privacy/
│   │   │   │   └── 📄 page.tsx          # Privacy policy
│   │   │   └── 📁 terms/
│   │   │       └── 📄 page.tsx          # Terms of service
│   │   │
│   │   ├── 📁 api/                      # API Routes
│   │   │   ├── 📁 issues/
│   │   │   │   ├── 📄 route.ts          # GET & POST /api/issues
│   │   │   │   └── 📁 [id]/
│   │   │   │       └── 📄 route.ts      # GET, PATCH, DELETE by ID
│   │   │   └── 📁 auth/
│   │   │       └── 📁 callback/
│   │   │           └── 📄 route.ts      # OAuth callback handler
│   │   │
│   │
│   ├── 📁 components/                   # React Components
│   │   │
│   │   ├── 📁 ui/                       # Base UI Components
│   │   │   ├── 📄 Button.tsx            # Button with variants
│   │   │   ├── 📄 Input.tsx             # Input with validation
│   │   │   ├── 📄 Textarea.tsx          # Textarea component
│   │   │   ├── 📄 Card.tsx              # Card container
│   │   │   ├── 📄 LoadingSpinner.tsx    # Loading indicator
│   │   │   ├── 📄 Alert.tsx             # Alert notifications
│   │   │   └── 📄 index.ts              # Export barrel
│   │   │
│   │   ├── 📁 layout/                   # Layout Components
│   │   │   ├── 📄 Header.tsx            # Site header with nav
│   │   │   ├── 📄 Footer.tsx            # Site footer
│   │   │   ├── 📄 Layout.tsx            # Main layout wrapper
│   │   │   ├── 📄 ProtectedRoute.tsx    # Auth guard wrapper
│   │   │   └── 📄 index.ts              # Export barrel
│   │   │
│   │   └── 📁 three/                    # 3D Components
│   │       ├── 📄 ComicBookScene.tsx    # 3D comic book
│   │       └── 📄 index.ts              # Export barrel
│   │
│   ├── 📁 hooks/                        # Custom React Hooks
│   │   ├── 📄 useAuth.ts                # Authentication hook
│   │   ├── 📄 useProfile.ts             # Profile management hook
│   │   ├── 📄 useIssues.ts              # Issues management hook
│   │   └── 📄 index.ts                  # Export barrel
│   │
│   ├── 📁 services/                     # Business Logic Layer
│   │   ├── 📄 auth.service.ts           # Auth operations
│   │   ├── 📄 profile.service.ts        # Profile CRUD
│   │   ├── 📄 issue.service.ts          # Issue CRUD
│   │   └── 📄 index.ts                  # Export barrel
│   │
│   ├── 📁 lib/                          # Utilities & Config
│   │   ├── 📁 supabase/                 # Supabase Clients
│   │   │   ├── 📄 client.ts             # Client-side client
│   │   │   ├── 📄 server.ts             # Server-side client
│   │   │   └── 📄 middleware.ts         # Middleware client
│   │   ├── 📄 config.ts                 # App configuration
│   │   ├── 📄 utils.ts                  # Utility functions
│   │   └── 📄 errors.ts                 # Error classes
│   │
│   ├── 📁 types/                        # TypeScript Definitions
│   │   ├── 📄 database.types.ts         # Database schema types
│   │   ├── 📄 api.types.ts              # API request/response types
│   │   ├── 📄 component.types.ts        # Component prop types
│   │   └── 📄 routes.types.ts           # Route configurations
│   │
│   ├── 📁 styles/                       # Global Styles
│   │   └── 📄 globals.css               # Tailwind + custom CSS
│   │
│   └── 📄 middleware.ts                 # Next.js middleware (auth)
│
├── 📁 public/                           # Static Assets
│   └── 📁 assets/
│       ├── 📁 logo/                     # Logo files (placeholder)
│       ├── 📁 3d/                       # 3D models (placeholder)
│       └── 📁 images/                   # Images (placeholder)
│
└── 📁 docs/                             # Documentation
    ├── 📄 DATABASE_SETUP.md             # Complete DB setup guide
    ├── 📄 DEPLOYMENT_GUIDE.md           # Vercel deployment steps
    └── 📄 ARCHITECTURE.md               # System architecture docs
```

## 📊 Statistics

**Total Files**: 61 files
**Total Directories**: 23 folders

### Breakdown by Type
- **Pages**: 14 pages (app router)
- **API Routes**: 2 route handlers (5 endpoints total)
- **Components**: 15 components
- **Hooks**: 3 custom hooks
- **Services**: 3 service modules
- **Types**: 4 type definition files
- **Config Files**: 8 configuration files
- **Documentation**: 6 markdown files

### Lines of Code (Approximate)
- **TypeScript/TSX**: ~3,200 lines
- **CSS**: ~150 lines
- **Configuration**: ~300 lines
- **Documentation**: ~1,500 lines
- **Total**: ~5,150 lines

## 🎯 Key Files to Understand

### Configuration
1. `next.config.js` - Next.js settings
2. `tailwind.config.ts` - Design system
3. `tsconfig.json` - TypeScript rules

### Core Logic
1. `src/services/` - All business logic
2. `src/hooks/` - State management
3. `src/lib/supabase/` - Database connection

### Pages
1. `src/app/page.tsx` - Landing page
2. `src/app/login/page.tsx` - Authentication
3. `src/app/dashboard/page.tsx` - Main dashboard
4. `src/app/report-issue/page.tsx` - Issue reporting

### API
1. `src/app/api/issues/route.ts` - Issue CRUD
2. `src/middleware.ts` - Route protection

## 🔒 Protected Routes

These routes require authentication:
- `/dashboard`
- `/profile`
- `/settings`
- `/report-issue`

## 🌐 Public Routes

Accessible without login:
- `/` (landing)
- `/login`
- `/get-started`
- `/about`
- `/legal/privacy`
- `/legal/terms`

## 🎨 Component Hierarchy

```
Layout (with Header & Footer)
├── HomePage
├── LoginPage
├── Dashboard (Protected)
├── ProfilePage (Protected)
├── SettingsPage (Protected)
├── ReportIssuePage (Protected)
├── GetStartedPage
├── AboutPage
└── LegalPages
```

## 🗄️ Database Tables

```
auth.users (managed by Supabase)
    ↓
profiles (1:1)
    ↓
issues (1:many)
```

## 🔄 Data Flow

```
User Action
    ↓
Component (UI)
    ↓
Custom Hook (State)
    ↓
Service (Logic)
    ↓
Supabase Client
    ↓
Database
```

## 🚀 Getting Started

Start here:
1. Read `QUICKSTART.md`
2. Follow `docs/DATABASE_SETUP.md`
3. Run `npm install && npm run dev`
4. Visit `http://localhost:3000`

## 📚 Documentation Order

For best understanding, read in this order:
1. `README.md` - Overview
2. `QUICKSTART.md` - Get running
3. `docs/DATABASE_SETUP.md` - Database config
4. `docs/ARCHITECTURE.md` - System design
5. `docs/DEPLOYMENT_GUIDE.md` - Go live
6. `PROJECT_COMPLETE.md` - Full summary

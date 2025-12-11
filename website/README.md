# VOID - Website

> An immersive, comic-book-inspired productivity companion for developers.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials.

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)**

## 📁 Project Structure

```
website/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/             # Utilities & Supabase client
│   ├── services/        # API service layer
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript definitions
│   └── styles/          # Global styles
├── public/
│   └── assets/          # Static assets (logo, 3D models)
└── ...config files
```

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **3D Graphics:** Three.js + React Three Fiber
- **Animations:** GSAP + Lenis
- **Backend:** Supabase (Auth + Database)
- **Deployment:** Vercel

## 🔐 Authentication

VOID uses Supabase Auth with:
- Google OAuth
- Email/Password authentication
- Automatic session management

## 📊 Database Schema

### Tables:
- `profiles` - Extended user data
- `issues` - User-submitted feedback/issues

See `/docs/database-schema.md` for full details.

## 🎨 Features

- ✅ 3D comic book scroll interaction
- ✅ Browser & VS Code extension downloads
- ✅ Issue reporting system
- ✅ User dashboard
- ✅ Profile management
- ✅ Responsive design

## 🚢 Deployment

Deploy to Vercel:
```bash
npm run build
vercel --prod
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checker

## 🤝 Contributing

See main repository CONTRIBUTING.md

## 📄 License

See main repository LICENSE

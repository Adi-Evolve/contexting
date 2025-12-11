# VOID Website - Deployment Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account and project configured
- Vercel account (for deployment)

## Local Development

### 1. Install Dependencies

```bash
cd website
npm install
```

### 2. Configure Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
npm start
```

## Deployment to Vercel

### Method 1: Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Set Environment Variables:**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add NEXT_PUBLIC_SITE_URL
   ```

5. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

### Method 2: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `website`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   
5. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (set to your Vercel domain)

6. Click "Deploy"

## Post-Deployment Configuration

### 1. Update Supabase Redirect URLs

In Supabase Dashboard → Authentication → URL Configuration:

Add your production URL:
```
https://your-domain.vercel.app
https://your-domain.vercel.app/auth/callback
```

### 2. Update Google OAuth Redirect URIs

In Google Cloud Console:
- Add: `https://<your-project-ref>.supabase.co/auth/v1/callback`

### 3. Configure Custom Domain (Optional)

In Vercel Dashboard:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_SITE_URL` environment variable

## Performance Optimization

### 1. Enable Edge Functions

Vercel automatically optimizes:
- Static page generation
- API routes
- Image optimization

### 2. Configure Caching

Add to `next.config.js`:

```javascript
module.exports = {
  ...
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=60' },
      ],
    },
  ],
}
```

### 3. Analyze Bundle

```bash
npm run build
npx @next/bundle-analyzer
```

## Monitoring

### Vercel Analytics

Enable in Vercel Dashboard → Analytics

### Error Tracking

Consider integrating:
- Sentry
- LogRocket
- Datadog

## CI/CD

Vercel provides automatic deployments:
- **Production:** Deploys from `main` branch
- **Preview:** Deploys from pull requests

### GitHub Actions (Optional)

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd website
          npm ci
          
      - name: Lint
        run: |
          cd website
          npm run lint
          
      - name: Type check
        run: |
          cd website
          npm run type-check
          
      - name: Build
        run: |
          cd website
          npm run build
```

## Troubleshooting

### Build Fails

1. Check environment variables are set
2. Verify Node.js version (18+)
3. Clear cache: `rm -rf .next node_modules && npm install`

### Authentication Issues

1. Verify Supabase URL and keys
2. Check redirect URLs in Supabase dashboard
3. Ensure OAuth providers are configured correctly

### 3D Scene Not Loading

1. Check browser WebGL support
2. Verify Three.js dependencies are installed
3. Check browser console for errors

## Rollback

To rollback to previous deployment:

```bash
vercel rollback
```

Or use Vercel Dashboard → Deployments → "Promote to Production"

## Scaling Considerations

- **Database:** Supabase auto-scales; monitor usage
- **API Rate Limits:** Implement rate limiting for public endpoints
- **CDN:** Vercel Edge Network handles this automatically
- **Database Indexes:** Ensure proper indexes on frequently queried columns

## Security Checklist

- ✅ Environment variables are not committed to git
- ✅ Supabase RLS policies are enabled
- ✅ Input validation on all forms
- ✅ CORS configured properly
- ✅ HTTPS enforced (automatic with Vercel)
- ✅ XSS protection (React handles this)
- ✅ Rate limiting on API routes (implement as needed)

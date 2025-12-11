# VOID - Vercel Deployment Guide

## 🚀 Quick Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (sign up at https://vercel.com)
- Git installed on your computer

---

## Step 1: Prepare the Repository

### 1.1 Check Git Status
```bash
cd "c:\Users\adiin\OneDrive\Desktop\new shit"
git status
```

### 1.2 Add and Commit Changes
```bash
git add .
git commit -m "Ready for deployment: VOID website with extension downloads"
git push origin main
```

---

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel**: https://vercel.com/dashboard
2. **Click "Add New..."** → **Project**
3. **Import Git Repository**:
   - Select your GitHub account
   - Find repository: `contexting` (or your repo name)
   - Click **Import**

4. **Configure Project**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `website`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

5. **Environment Variables** (if using Supabase):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

6. **Click "Deploy"** 🚀

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to website folder
cd website

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

---

## Step 3: Verify Deployment

### 3.1 Check Extension Downloads
Once deployed, visit your site and test:
- Click on **"ARMORY"** section
- Click **"CHROME EXTENSION"** download button
- Should download: `void-chrome-extension.zip` (approximately 0.33 MB)

### 3.2 Test Download URLs
```
https://your-site.vercel.app/void-chrome-extension.zip
https://your-site.vercel.app/vscode-extension.vsix
```

### 3.3 Verify Pages
- ✅ Home page: `/`
- ✅ About: `/about`
- ✅ Get Started: `/get-started`
- ✅ Dashboard: `/dashboard`
- ✅ Login: `/login`
- ✅ Terms: `/legal/terms`
- ✅ Privacy: `/legal/privacy`

---

## Step 4: Custom Domain (Optional)

### 4.1 Add Domain in Vercel
1. Go to your project in Vercel
2. Navigate to **Settings** → **Domains**
3. Click **Add Domain**
4. Enter your domain (e.g., `void-ai.com`)
5. Follow DNS configuration instructions

### 4.2 DNS Configuration
Add these records to your domain provider:

**For root domain (void-ai.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## 📦 What's Deployed

### Files in Public Folder
- ✅ `void-chrome-extension.zip` (0.33 MB) - VOID Chrome Extension
- ✅ `vscode-extension.vsix` - VOID VS Code Extension
- ✅ Images and assets

### Configuration
- ✅ `vercel.json` - Proper headers for ZIP downloads
- ✅ Next.js 14 configuration
- ✅ TypeScript + Tailwind CSS

### Features
- 🎨 Comic-themed UI with VOID branding
- 📥 Direct extension downloads from Armory section
- 🔐 Authentication with Supabase (if configured)
- 📱 Fully responsive design
- ⚡ Optimized for performance

---

## 🔧 Post-Deployment Configuration

### Update Extension Metadata
After deployment, update your extension's manifest:

**chrome-extension/manifest.json:**
```json
{
  "homepage_url": "https://your-deployed-site.vercel.app",
  "update_url": "https://your-deployed-site.vercel.app/updates.xml"
}
```

### Analytics (Optional)
Add Vercel Analytics to track usage:

```bash
cd website
npm install @vercel/analytics
```

Then add to `src/app/layout.tsx`:
```tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Check for TypeScript errors
cd website
npm run type-check

# Check for linting errors
npm run lint
```

### Downloads Not Working
1. Verify files exist in `website/public/`
2. Check `vercel.json` headers configuration
3. Clear browser cache and try again

### Environment Variables Missing
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add required variables
3. Redeploy

---

## 📊 Deployment Checklist

- [ ] Extension ZIP created and in `website/public/`
- [ ] Git repository pushed to GitHub
- [ ] Vercel project created and connected
- [ ] Environment variables configured (if needed)
- [ ] Build successful
- [ ] Extension downloads working
- [ ] All pages loading correctly
- [ ] Custom domain configured (optional)
- [ ] Analytics added (optional)

---

## 🎉 Success!

Your VOID website is now live! 

**Next Steps:**
1. Share your deployment URL
2. Test all features thoroughly
3. Monitor deployment logs in Vercel Dashboard
4. Set up custom domain if desired
5. Share with users!

---

## 📞 Support

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Deployment Issues**: Check Vercel Dashboard → Your Project → Deployments → View Logs

---

**Deployment Date**: December 11, 2025
**Project**: VOID - AI Memory Augmentation
**Status**: Ready for Production 🚀

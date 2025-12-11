# VOID Website - Quick Start

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies (1 min)
```bash
cd website
npm install
```

### Step 2: Create Supabase Project (2 min)
1. Go to https://supabase.com
2. Click "New Project"
3. Copy your project URL and anon key

### Step 3: Set Environment Variables (30 sec)
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 4: Set Up Database (1 min)
Go to Supabase SQL Editor and paste this:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "issues_select" ON issues FOR SELECT USING (true);
CREATE POLICY "issues_insert" ON issues FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "issues_update" ON issues FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "issues_delete" ON issues FOR DELETE USING (auth.uid() = user_id);
```

### Step 5: Enable Google OAuth (Optional, 1 min)
1. In Supabase: Authentication → Providers → Google
2. Follow the setup wizard
3. Or skip and use email/password auth

### Step 6: Run! (30 sec)
```bash
npm run dev
```

Open http://localhost:3000

## ✅ You're Done!

Try these:
1. Sign up with email/password
2. Go to dashboard
3. Create an issue
4. Edit your profile

## 📚 Need More Details?

- **Full Setup**: `docs/DATABASE_SETUP.md`
- **Deployment**: `docs/DEPLOYMENT_GUIDE.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Complete Overview**: `PROJECT_COMPLETE.md`

## 🆘 Common Issues

**"Module not found"**
```bash
rm -rf node_modules package-lock.json
npm install
```

**"Invalid environment variables"**
- Check `.env.local` exists
- Verify Supabase URL and key are correct

**"Database error"**
- Make sure you ran the SQL setup
- Check Supabase project is active

## 🎉 Success!

Your VOID website is now running locally!

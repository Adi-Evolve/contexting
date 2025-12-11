# Database Setup

## Quick Setup

You need to create the required tables in your Supabase database. There are two ways to do this:

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://zatysaexdxqieeqylsgr.supabase.co
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy and paste the contents of `001_create_tables.sql` from the `supabase/migrations/` folder
5. Click **Run** to execute the migration
6. Verify the tables were created by checking the **Table Editor**

### Option 2: Supabase CLI (Advanced)

If you have the Supabase CLI installed:

```bash
# Link to your project
supabase link --project-ref zatysaexdxqieeqylsgr

# Apply migration
supabase db push
```

## What Gets Created

The migration creates:

### Tables
- **profiles**: User profile information (display name, avatar, bio)
- **issues**: Bug reports and feedback from users

### Security
- Row Level Security (RLS) enabled on all tables
- Policies allowing users to manage their own data
- Public read access for profiles and issues

### Automation
- Automatic profile creation when a user signs up
- Automatic `updated_at` timestamp updates
- Foreign key relationships with cascade deletes

## Troubleshooting

**404 errors on `/dashboard`?**
- The `issues` and `profiles` tables don't exist yet
- Run the migration using one of the methods above

**Permission denied errors?**
- Make sure RLS policies were created correctly
- Check that you're authenticated when making requests

**Profile not created on signup?**
- The trigger might not have been created
- Run the migration again to ensure the trigger exists

# Database Migration Instructions

## Run the Migration

1. **Open Supabase Dashboard**
   - Go to [app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste Migration**
   - Open the file: `supabase/migrations/001_create_queue_system.sql`
   - Copy the entire contents
   - Paste into the SQL Editor

4. **Run the Migration**
   - Click "Run" button (or press Ctrl/Cmd + Enter)
   - Wait for confirmation message
   - You should see "Success. No rows returned"

5. **Verify Tables Created**
   - Click on "Table Editor" in the left sidebar
   - You should see two new tables:
     - `patients`
     - `queue_settings`

## What This Creates

### Tables
- **patients**: Stores all patient queue data
- **queue_settings**: Stores ticket number counter per user

### Security
- Row Level Security (RLS) enabled
- Users can only access their own data
- Automatic user_id filtering

### Features
- Real-time subscriptions enabled
- Auto-updating timestamps
- Indexed for performance

## Troubleshooting

### "relation already exists"
- Tables already created, you're good to go!
- Or drop tables first: `DROP TABLE IF EXISTS patients, queue_settings CASCADE;`

### "permission denied"
- Make sure you're the project owner
- Check you're in the correct project

### "function uuid_generate_v4() does not exist"
- Run: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

## Next Steps

After running the migration:
1. The dashboard will automatically use the new tables
2. New users will see an empty dashboard
3. All patient data will be stored in Supabase
4. Real-time updates will work across devices

✅ Migration ready to run!

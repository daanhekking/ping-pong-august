# Database Setup for Monthly Awards

## Required Database Changes

You need to create a new table in your Supabase database to store monthly awards.

### Step 1: Create the `monthly_awards` Table

Go to your Supabase SQL Editor and run this SQL script:

```sql
-- Create monthly_awards table
CREATE TABLE monthly_awards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  month_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate awards for same player/category/month
  UNIQUE(player_id, category, month, year)
);

-- Create indexes for faster queries
CREATE INDEX idx_monthly_awards_player ON monthly_awards(player_id);
CREATE INDEX idx_monthly_awards_date ON monthly_awards(year DESC, month DESC);
CREATE INDEX idx_monthly_awards_category ON monthly_awards(category);

-- Add comment to table
COMMENT ON TABLE monthly_awards IS 'Stores monthly challenge awards for players';
```

### Step 2: Enable Row Level Security (RLS) - Optional but Recommended

If you're using RLS, you may want to add policies:

```sql
-- Enable RLS on monthly_awards table
ALTER TABLE monthly_awards ENABLE ROW LEVEL SECURITY;

-- Allow public read access to awards
CREATE POLICY "Anyone can view monthly awards"
  ON monthly_awards FOR SELECT
  USING (true);

-- Only allow authenticated users to insert awards (or adjust based on your auth setup)
CREATE POLICY "Authenticated users can insert awards"
  ON monthly_awards FOR INSERT
  WITH CHECK (true);

-- Allow updates for existing records (to handle upserts)
CREATE POLICY "Authenticated users can update awards"
  ON monthly_awards FOR UPDATE
  USING (true);
```

### Step 3: Verify the Setup

After running the SQL, verify your table was created correctly:

```sql
-- Check if table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'monthly_awards';

-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'monthly_awards';
```

---

## Table Schema Reference

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `player_id` | UUID | Foreign key to players table |
| `category` | TEXT | Award category (e.g., 'mostPoints', 'giantKiller') |
| `month` | INTEGER | Month number (0-11, JavaScript format) |
| `year` | INTEGER | Year (e.g., 2025) |
| `month_name` | TEXT | Human-readable month name (e.g., 'August') |
| `created_at` | TIMESTAMP | When the award was created |

### Award Categories

The following categories are tracked:
- `mostPoints` - Most Points Scored
- `highestElo` - Highest ELO Score
- `winningStreak` - Longest Winning Streak
- `giantKiller` - Most Wins Against Higher-Ranked Players
- `socialButterfly` - Played Against Most Different Opponents
- `bestDefense` - Lowest Average Points Conceded
- `highestMatch` - Highest Single Match Score
- `eloSwing` - Biggest ELO Swing
- `biggestLoser` - Most Losses

---

## How It Works

### Automatic Award Saving

The system automatically saves monthly awards on the **1st day of each calendar month**:

1. **Checks date**: On page load, checks if it's the 1st of the month
2. **Calculates previous month**: If yes, calculates winners from the previous month
3. **Saves to database**: Sends all awards to the database via API
4. **Marks as saved**: Stores a flag in localStorage to prevent duplicate saves
5. **Refreshes data**: Updates the UI with new awards

### Award Display

- Awards are displayed in the **Rankings page** (formerly Leaderboard)
- Each player's row shows icons for all their earned awards
- Hover over icons to see award names
- Awards persist across months and accumulate over time

---

## Testing the Setup

1. **Run the SQL script** in Supabase SQL Editor
2. **Restart your development server** if running
3. **Go to Monthly Winners page** - System will check for auto-save
4. **View Rankings page** - Awards should appear in the new column

### Manual Testing (if needed)

To test without waiting for the 1st of the month:

1. Clear localStorage: `localStorage.removeItem('lastSavedMonth')`
2. Temporarily change the date check in `MonthlyWinners.jsx` line 85
3. Reload the page - awards should save
4. Check database: `SELECT * FROM monthly_awards;`

---

## Troubleshooting

### Awards Not Saving?

1. Check browser console for errors
2. Verify table exists: `SELECT * FROM monthly_awards LIMIT 1;`
3. Check RLS policies are not blocking inserts
4. Verify API endpoint is working: Visit `/api/monthly-awards` (should return `[]` or data)

### Awards Not Displaying?

1. Check browser console for fetch errors
2. Verify awards exist in database: `SELECT * FROM monthly_awards;`
3. Check that `player_id` matches IDs in your `players` table
4. Refresh the page to reload data

### Duplicate Awards?

The table has a UNIQUE constraint that prevents duplicates. If you see duplicate awards:
1. Check the constraint exists: `\d monthly_awards` (in psql)
2. Remove duplicates manually if needed
3. Re-run the CREATE TABLE script with IF NOT EXISTS

---

## Migration from localStorage (if applicable)

If you had previous localStorage-based awards, they are now ignored. The system only uses database awards.

---

## Done! 🎉

Your monthly awards system is now fully automated and stored in the database.

**Next automatic save will happen on:** The 1st day of the next calendar month.


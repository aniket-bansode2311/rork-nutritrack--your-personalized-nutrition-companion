-- Performance Optimizations for Nutrition Tracking App
-- Run these SQL commands to optimize database performance

-- 1. Indexes for food_entries table (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_food_entries_user_date 
ON food_entries(user_id, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_food_entries_user_meal_type 
ON food_entries(user_id, meal_type);

CREATE INDEX IF NOT EXISTS idx_food_entries_user_date_meal 
ON food_entries(user_id, logged_at DESC, meal_type);

-- 2. Indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
ON profiles(id);

-- 3. Indexes for custom_foods table
CREATE INDEX IF NOT EXISTS idx_custom_foods_user_id 
ON custom_foods(user_id);

CREATE INDEX IF NOT EXISTS idx_custom_foods_name_search 
ON custom_foods USING gin(to_tsvector('english', name || ' ' || COALESCE(brand, '')));

-- 4. Indexes for recipes table
CREATE INDEX IF NOT EXISTS idx_recipes_user_id 
ON recipes(user_id);

CREATE INDEX IF NOT EXISTS idx_recipes_name_search 
ON recipes USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- 5. Partial indexes for active data (last 90 days)
CREATE INDEX IF NOT EXISTS idx_food_entries_recent 
ON food_entries(user_id, logged_at DESC) 
WHERE logged_at >= NOW() - INTERVAL '90 days';

-- 6. Composite index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_food_entries_dashboard 
ON food_entries(user_id, logged_at DESC, meal_type, calories);

-- 7. Index for food search functionality
CREATE INDEX IF NOT EXISTS idx_food_search 
ON food_entries USING gin(to_tsvector('english', food_name || ' ' || COALESCE(brand, '')));

-- 8. Optimize table statistics (run periodically)
ANALYZE food_entries;
ANALYZE profiles;
ANALYZE custom_foods;
ANALYZE recipes;

-- 9. Create materialized view for nutrition summaries (optional, for heavy usage)
-- CREATE MATERIALIZED VIEW daily_nutrition_summary AS
-- SELECT 
--   user_id,
--   DATE(logged_at) as log_date,
--   SUM(calories) as total_calories,
--   SUM(protein) as total_protein,
--   SUM(carbs) as total_carbs,
--   SUM(fat) as total_fat,
--   COUNT(*) as entry_count
-- FROM food_entries
-- GROUP BY user_id, DATE(logged_at);

-- CREATE UNIQUE INDEX idx_daily_nutrition_summary 
-- ON daily_nutrition_summary(user_id, log_date);

-- 10. Vacuum and reindex periodically (maintenance)
-- VACUUM ANALYZE food_entries;
-- REINDEX TABLE food_entries;
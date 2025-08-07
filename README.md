# NutriTrack - Your Personalized Nutrition Companion
Created by Rork

A comprehensive nutrition tracking app built with React Native and Expo.

## Database Setup

The app requires the following Supabase tables to be created. Run these SQL commands in your Supabase SQL editor:

### 1. Profiles Table
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  weight DECIMAL NOT NULL,
  height DECIMAL NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')) NOT NULL,
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very active')) NOT NULL,
  goal TEXT CHECK (goal IN ('lose', 'maintain', 'gain')) NOT NULL,
  calories_goal INTEGER NOT NULL,
  protein_goal INTEGER NOT NULL,
  carbs_goal INTEGER NOT NULL,
  fat_goal INTEGER NOT NULL,
  dietary_preferences JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',
  health_integrations JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Food Entries Table
```sql
CREATE TABLE food_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  food_name TEXT NOT NULL,
  brand TEXT,
  barcode TEXT,
  serving_size DECIMAL NOT NULL,
  serving_unit TEXT NOT NULL,
  calories DECIMAL NOT NULL,
  protein DECIMAL NOT NULL,
  carbs DECIMAL NOT NULL,
  fat DECIMAL NOT NULL,
  fiber DECIMAL,
  sugar DECIMAL,
  sodium DECIMAL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Recipes Table
```sql
CREATE TABLE recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  servings INTEGER NOT NULL,
  prep_time INTEGER,
  cook_time INTEGER,
  instructions TEXT[],
  ingredients JSONB NOT NULL,
  total_calories DECIMAL NOT NULL,
  total_protein DECIMAL NOT NULL,
  total_carbs DECIMAL NOT NULL,
  total_fat DECIMAL NOT NULL,
  image_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Custom Foods Table
```sql
CREATE TABLE custom_foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  serving_size DECIMAL NOT NULL,
  serving_unit TEXT NOT NULL,
  calories_per_serving DECIMAL NOT NULL,
  protein_per_serving DECIMAL NOT NULL,
  carbs_per_serving DECIMAL NOT NULL,
  fat_per_serving DECIMAL NOT NULL,
  fiber_per_serving DECIMAL,
  sugar_per_serving DECIMAL,
  sodium_per_serving DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Row Level Security (RLS)
Enable RLS and create policies for each table:

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_foods ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Food entries policies
CREATE POLICY "Users can view own food entries" ON food_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own food entries" ON food_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own food entries" ON food_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own food entries" ON food_entries FOR DELETE USING (auth.uid() = user_id);

-- Recipes policies
CREATE POLICY "Users can view own recipes" ON recipes FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users can insert own recipes" ON recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recipes" ON recipes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recipes" ON recipes FOR DELETE USING (auth.uid() = user_id);

-- Custom foods policies
CREATE POLICY "Users can view own custom foods" ON custom_foods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own custom foods" ON custom_foods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own custom foods" ON custom_foods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own custom foods" ON custom_foods FOR DELETE USING (auth.uid() = user_id);
```

## Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in your Supabase URL and anon key:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Development

```bash
# Install dependencies
npm install

# Start the development server
npx expo start
```

## Features

- User authentication and profiles
- Food logging with barcode scanning
- AI-powered food recognition
- Recipe management
- Nutrition tracking and insights
- Goal setting and progress tracking
- AI coaching and recommendations

## Fallback Mode

The app includes a fallback mode that uses AsyncStorage when the database is not available. This allows the app to function during development even before the database is set up.

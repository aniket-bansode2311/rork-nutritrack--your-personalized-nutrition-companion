-- Database setup for nutrition tracking app
-- Run this SQL in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  height DECIMAL(5,2) NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')) NOT NULL,
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very active')) NOT NULL,
  goal TEXT CHECK (goal IN ('lose', 'maintain', 'gain')) NOT NULL,
  calories_goal INTEGER NOT NULL,
  protein_goal DECIMAL(6,2) NOT NULL,
  carbs_goal DECIMAL(6,2) NOT NULL,
  fat_goal DECIMAL(6,2) NOT NULL,
  dietary_preferences JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',
  health_integrations JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create food_entries table
CREATE TABLE IF NOT EXISTS public.food_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  food_name TEXT NOT NULL,
  brand TEXT,
  barcode TEXT,
  serving_size DECIMAL(8,2) NOT NULL,
  serving_unit TEXT NOT NULL,
  calories DECIMAL(8,2) NOT NULL,
  protein DECIMAL(8,2) NOT NULL,
  carbs DECIMAL(8,2) NOT NULL,
  fat DECIMAL(8,2) NOT NULL,
  fiber DECIMAL(8,2),
  sugar DECIMAL(8,2),
  sodium DECIMAL(8,2),
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')) NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  servings INTEGER NOT NULL,
  prep_time INTEGER,
  cook_time INTEGER,
  instructions JSONB DEFAULT '[]',
  ingredients JSONB NOT NULL DEFAULT '[]',
  total_calories DECIMAL(8,2) NOT NULL,
  total_protein DECIMAL(8,2) NOT NULL,
  total_carbs DECIMAL(8,2) NOT NULL,
  total_fat DECIMAL(8,2) NOT NULL,
  image_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom_foods table
CREATE TABLE IF NOT EXISTS public.custom_foods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  serving_size DECIMAL(8,2) NOT NULL,
  serving_unit TEXT NOT NULL,
  calories_per_serving DECIMAL(8,2) NOT NULL,
  protein_per_serving DECIMAL(8,2) NOT NULL,
  carbs_per_serving DECIMAL(8,2) NOT NULL,
  fat_per_serving DECIMAL(8,2) NOT NULL,
  fiber_per_serving DECIMAL(8,2),
  sugar_per_serving DECIMAL(8,2),
  sodium_per_serving DECIMAL(8,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weight_entries table
CREATE TABLE IF NOT EXISTS public.weight_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create water_entries table
CREATE TABLE IF NOT EXISTS public.water_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(6,2) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_entries table
CREATE TABLE IF NOT EXISTS public.activity_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  calories_burned DECIMAL(6,2),
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create barcode_products table
CREATE TABLE IF NOT EXISTS public.barcode_products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  barcode TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  serving_size DECIMAL(8,2) NOT NULL,
  serving_unit TEXT NOT NULL,
  calories_per_serving DECIMAL(8,2) NOT NULL,
  protein_per_serving DECIMAL(8,2) NOT NULL,
  carbs_per_serving DECIMAL(8,2) NOT NULL,
  fat_per_serving DECIMAL(8,2) NOT NULL,
  fiber_per_serving DECIMAL(8,2),
  sugar_per_serving DECIMAL(8,2),
  sodium_per_serving DECIMAL(8,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create personalized_insights table
CREATE TABLE IF NOT EXISTS public.personalized_insights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendations JSONB DEFAULT '[]',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  is_read BOOLEAN DEFAULT false,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create smart_goal_suggestions table
CREATE TABLE IF NOT EXISTS public.smart_goal_suggestions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  adjustment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  previous_goals JSONB NOT NULL,
  new_goals JSONB NOT NULL,
  reason TEXT,
  source TEXT CHECK (source IN ('user_request', 'system_recommendation', 'periodic_review')) NOT NULL,
  effectiveness_tracking JSONB,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')) DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_food_entries_user_id ON public.food_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_food_entries_logged_at ON public.food_entries(logged_at);
CREATE INDEX IF NOT EXISTS idx_food_entries_meal_type ON public.food_entries(meal_type);
CREATE INDEX IF NOT EXISTS idx_weight_entries_user_id ON public.weight_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_entries_date ON public.weight_entries(date);
CREATE INDEX IF NOT EXISTS idx_water_entries_user_id ON public.water_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_water_entries_timestamp ON public.water_entries(timestamp);
CREATE INDEX IF NOT EXISTS idx_activity_entries_user_id ON public.activity_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_entries_date ON public.activity_entries(date);
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_is_public ON public.recipes(is_public);
CREATE INDEX IF NOT EXISTS idx_custom_foods_user_id ON public.custom_foods(user_id);
CREATE INDEX IF NOT EXISTS idx_barcode_products_barcode ON public.barcode_products(barcode);
CREATE INDEX IF NOT EXISTS idx_personalized_insights_user_id ON public.personalized_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_goal_suggestions_user_id ON public.smart_goal_suggestions(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personalized_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_goal_suggestions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Food entries policies
CREATE POLICY "Users can view own food entries" ON public.food_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food entries" ON public.food_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food entries" ON public.food_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food entries" ON public.food_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Recipes policies
CREATE POLICY "Users can view own recipes and public recipes" ON public.recipes
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own recipes" ON public.recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes" ON public.recipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes" ON public.recipes
  FOR DELETE USING (auth.uid() = user_id);

-- Custom foods policies
CREATE POLICY "Users can view own custom foods" ON public.custom_foods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom foods" ON public.custom_foods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom foods" ON public.custom_foods
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom foods" ON public.custom_foods
  FOR DELETE USING (auth.uid() = user_id);

-- Weight entries policies
CREATE POLICY "Users can view own weight entries" ON public.weight_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight entries" ON public.weight_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weight entries" ON public.weight_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight entries" ON public.weight_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Water entries policies
CREATE POLICY "Users can view own water entries" ON public.water_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water entries" ON public.water_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own water entries" ON public.water_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own water entries" ON public.water_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Activity entries policies
CREATE POLICY "Users can view own activity entries" ON public.activity_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity entries" ON public.activity_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity entries" ON public.activity_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activity entries" ON public.activity_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Personalized insights policies
CREATE POLICY "Users can view own insights" ON public.personalized_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights" ON public.personalized_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights" ON public.personalized_insights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights" ON public.personalized_insights
  FOR DELETE USING (auth.uid() = user_id);

-- Smart goal suggestions policies
CREATE POLICY "Users can view own goal suggestions" ON public.smart_goal_suggestions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goal suggestions" ON public.smart_goal_suggestions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goal suggestions" ON public.smart_goal_suggestions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal suggestions" ON public.smart_goal_suggestions
  FOR DELETE USING (auth.uid() = user_id);

-- Barcode products can be read by everyone (public data)
CREATE POLICY "Anyone can view barcode products" ON public.barcode_products
  FOR SELECT USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON public.recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, weight, height, age, gender, activity_level, goal, calories_goal, protein_goal, carbs_goal, fat_goal)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    70.0, -- default weight
    170.0, -- default height
    25, -- default age
    'other', -- default gender
    'moderate', -- default activity level
    'maintain', -- default goal
    2000, -- default calories
    150.0, -- default protein
    250.0, -- default carbs
    67.0 -- default fat
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
/*
  # Pantry Pal - Complete Food Management System Database Schema

  1. New Tables
    - `user_profiles` - User health data and preferences
    - `pantry_items` - Enhanced inventory with full nutrition data
    - `nutrition_logs` - Comprehensive meal and nutrition tracking
    - `recipes` - Smart recipes with nutrition analysis
    - `recipe_ingredients` - Recipe components with nutrition impact
    - `shopping_list_items` - AI-powered shopping management
    - `meal_plans` - Advanced meal planning with macro balancing
    - `health_metrics` - Complete health and wellness tracking

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for authenticated users
    - Secure data access based on user ownership

  3. Features
    - Full nutrition tracking with macro/micronutrients
    - AI-powered food recognition and categorization
    - Smart expiry tracking and waste reduction
    - Recipe recommendations based on pantry + health goals
    - Advanced meal planning with nutrition optimization
    - Shopping list automation with budget tracking
    - Health metrics monitoring and progress tracking
*/

-- User profiles with comprehensive health data
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  height_cm INTEGER,
  weight_kg DECIMAL,
  activity_level TEXT CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
  health_goals TEXT[] DEFAULT '{}',
  dietary_restrictions TEXT[] DEFAULT '{}',
  daily_calorie_goal INTEGER,
  daily_protein_goal INTEGER,
  daily_carb_goal INTEGER,
  daily_fat_goal INTEGER,
  daily_fiber_goal INTEGER DEFAULT 25,
  daily_water_goal_ml INTEGER DEFAULT 2000,
  timezone TEXT DEFAULT 'UTC',
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced pantry items with complete nutrition data
CREATE TABLE IF NOT EXISTS pantry_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  subcategory TEXT,
  quantity DECIMAL DEFAULT 1,
  unit TEXT DEFAULT 'piece',
  barcode TEXT,
  expiry_date DATE,
  purchase_date DATE DEFAULT CURRENT_DATE,
  purchase_location TEXT,
  location TEXT DEFAULT 'pantry', -- fridge, pantry, freezer, counter
  cost DECIMAL,
  calories_per_100g INTEGER,
  protein_per_100g DECIMAL,
  carbs_per_100g DECIMAL,
  fat_per_100g DECIMAL,
  fiber_per_100g DECIMAL,
  sugar_per_100g DECIMAL,
  sodium_per_100g DECIMAL,
  saturated_fat_per_100g DECIMAL,
  trans_fat_per_100g DECIMAL,
  cholesterol_per_100g DECIMAL,
  vitamin_a_per_100g DECIMAL,
  vitamin_c_per_100g DECIMAL,
  calcium_per_100g DECIMAL,
  iron_per_100g DECIMAL,
  image_url TEXT,
  nutrition_data JSONB DEFAULT '{}',
  ai_confidence DECIMAL DEFAULT 0,
  recognition_source TEXT, -- manual, barcode, ai, ocr
  is_opened BOOLEAN DEFAULT false,
  opened_date DATE,
  typical_shelf_life_days INTEGER,
  storage_instructions TEXT,
  allergens TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  is_favorite BOOLEAN DEFAULT false,
  times_used INTEGER DEFAULT 0,
  last_used_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comprehensive nutrition logging
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'drink')),
  food_name TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  unit TEXT DEFAULT 'gram',
  calories INTEGER,
  protein DECIMAL,
  carbs DECIMAL,
  fat DECIMAL,
  fiber DECIMAL,
  sugar DECIMAL,
  sodium DECIMAL,
  saturated_fat DECIMAL,
  trans_fat DECIMAL,
  cholesterol DECIMAL,
  vitamin_a DECIMAL,
  vitamin_c DECIMAL,
  calcium DECIMAL,
  iron DECIMAL,
  pantry_item_id UUID REFERENCES pantry_items(id),
  recipe_id UUID,
  meal_time TIME,
  location TEXT,
  mood_before INTEGER CHECK (mood_before BETWEEN 1 AND 10),
  mood_after INTEGER CHECK (mood_after BETWEEN 1 AND 10),
  hunger_before INTEGER CHECK (hunger_before BETWEEN 1 AND 10),
  hunger_after INTEGER CHECK (hunger_after BETWEEN 1 AND 10),
  satisfaction_level INTEGER CHECK (satisfaction_level BETWEEN 1 AND 10),
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced recipes with complete nutrition analysis
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  prep_time INTEGER, -- minutes
  cook_time INTEGER, -- minutes
  total_time INTEGER, -- minutes
  servings INTEGER DEFAULT 1,
  cuisine TEXT,
  diet_tags TEXT[] DEFAULT '{}', -- vegan, keto, gluten-free, etc.
  meal_type TEXT[] DEFAULT '{}', -- breakfast, lunch, dinner, snack
  season TEXT[] DEFAULT '{}', -- spring, summer, fall, winter
  image_url TEXT,
  instructions JSONB DEFAULT '[]',
  equipment TEXT[] DEFAULT '{}',
  total_calories INTEGER,
  calories_per_serving INTEGER,
  protein_per_serving DECIMAL,
  carbs_per_serving DECIMAL,
  fat_per_serving DECIMAL,
  fiber_per_serving DECIMAL,
  sugar_per_serving DECIMAL,
  sodium_per_serving DECIMAL,
  nutrition_score INTEGER CHECK (nutrition_score BETWEEN 1 AND 100),
  health_score INTEGER CHECK (health_score BETWEEN 1 AND 100),
  sustainability_score INTEGER CHECK (sustainability_score BETWEEN 1 AND 100),
  cost_per_serving DECIMAL,
  is_favorite BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  times_cooked INTEGER DEFAULT 0,
  average_rating DECIMAL DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  source TEXT, -- ai_generated, user_created, imported
  source_url TEXT,
  allergens TEXT[] DEFAULT '{}',
  storage_instructions TEXT,
  reheating_instructions TEXT,
  tips TEXT[] DEFAULT '{}',
  variations TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipe ingredients with nutrition contribution
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  unit TEXT DEFAULT 'gram',
  pantry_item_id UUID REFERENCES pantry_items(id),
  calories_contribution INTEGER,
  protein_contribution DECIMAL,
  carbs_contribution DECIMAL,
  fat_contribution DECIMAL,
  preparation_method TEXT, -- diced, sliced, grated, etc.
  is_optional BOOLEAN DEFAULT false,
  substitutes TEXT[] DEFAULT '{}',
  notes TEXT,
  order_index INTEGER DEFAULT 0
);

-- Smart shopping list management
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  subcategory TEXT,
  quantity DECIMAL DEFAULT 1,
  unit TEXT DEFAULT 'piece',
  estimated_cost DECIMAL,
  actual_cost DECIMAL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  source TEXT CHECK (source IN ('manual', 'auto_pantry', 'recipe', 'meal_plan', 'ai_suggestion')),
  source_id UUID, -- recipe_id or meal_plan_id
  nutrition_goal TEXT, -- protein, fiber, etc.
  store_section TEXT,
  preferred_brand TEXT,
  size_preference TEXT,
  organic_preference BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  pantry_item_id UUID REFERENCES pantry_items(id),
  notes TEXT,
  alternatives TEXT[] DEFAULT '{}',
  coupons_available BOOLEAN DEFAULT false,
  seasonal_availability BOOLEAN DEFAULT true,
  sustainability_score INTEGER CHECK (sustainability_score BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Advanced meal planning with nutrition optimization
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id UUID REFERENCES recipes(id),
  recipe_title TEXT,
  planned_servings INTEGER DEFAULT 1,
  actual_servings INTEGER,
  calories_planned INTEGER,
  calories_actual INTEGER,
  protein_planned DECIMAL,
  protein_actual DECIMAL,
  carbs_planned DECIMAL,
  carbs_actual DECIMAL,
  fat_planned DECIMAL,
  fat_actual DECIMAL,
  prep_time_planned INTEGER,
  prep_time_actual INTEGER,
  cost_planned DECIMAL,
  cost_actual DECIMAL,
  meal_prep_batch BOOLEAN DEFAULT false,
  batch_id UUID,
  leftovers_expected BOOLEAN DEFAULT false,
  leftovers_actual BOOLEAN DEFAULT false,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 10),
  difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 10),
  would_make_again BOOLEAN,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comprehensive health and wellness tracking
CREATE TABLE IF NOT EXISTS health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight_kg DECIMAL,
  body_fat_percentage DECIMAL,
  muscle_mass_kg DECIMAL,
  bone_mass_kg DECIMAL,
  water_percentage DECIMAL,
  bmr INTEGER, -- Basal Metabolic Rate
  tdee INTEGER, -- Total Daily Energy Expenditure
  water_intake_ml INTEGER DEFAULT 0,
  sleep_hours DECIMAL,
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 10),
  exercise_minutes INTEGER DEFAULT 0,
  exercise_type TEXT,
  exercise_intensity TEXT CHECK (exercise_intensity IN ('low', 'medium', 'high')),
  steps_count INTEGER DEFAULT 0,
  heart_rate_resting INTEGER,
  heart_rate_max INTEGER,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  blood_sugar_mg_dl INTEGER,
  mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
  digestion_score INTEGER CHECK (digestion_score BETWEEN 1 AND 10),
  skin_condition INTEGER CHECK (skin_condition BETWEEN 1 AND 10),
  mental_clarity INTEGER CHECK (mental_clarity BETWEEN 1 AND 10),
  motivation_level INTEGER CHECK (motivation_level BETWEEN 1 AND 10),
  symptoms TEXT[] DEFAULT '{}',
  medications TEXT[] DEFAULT '{}',
  supplements TEXT[] DEFAULT '{}',
  notes TEXT,
  data_source TEXT DEFAULT 'manual', -- manual, app, device
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food waste tracking for sustainability
CREATE TABLE IF NOT EXISTS food_waste_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  pantry_item_id UUID REFERENCES pantry_items(id),
  item_name TEXT NOT NULL,
  quantity_wasted DECIMAL,
  unit TEXT,
  reason TEXT CHECK (reason IN ('expired', 'spoiled', 'disliked', 'overcooked', 'forgot', 'other')),
  estimated_cost DECIMAL,
  environmental_impact DECIMAL, -- CO2 equivalent
  prevention_tip TEXT,
  date_wasted DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements and gamification
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  points INTEGER DEFAULT 0,
  unlocked_at TIMESTAMPZ DEFAULT NOW(),
  progress DECIMAL DEFAULT 100, -- percentage completed
  target_value DECIMAL,
  current_value DECIMAL
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_waste_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Pantry Items Policies
CREATE POLICY "Users can manage own pantry items"
  ON pantry_items
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Nutrition Logs Policies
CREATE POLICY "Users can manage own nutrition logs"
  ON nutrition_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Recipes Policies
CREATE POLICY "Users can manage own recipes"
  ON recipes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read public recipes"
  ON recipes
  FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

-- Recipe Ingredients Policies
CREATE POLICY "Users can manage recipe ingredients"
  ON recipe_ingredients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes 
      WHERE recipes.id = recipe_ingredients.recipe_id 
      AND recipes.user_id = auth.uid()
    )
  );

-- Shopping List Items Policies
CREATE POLICY "Users can manage own shopping list"
  ON shopping_list_items
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Meal Plans Policies
CREATE POLICY "Users can manage own meal plans"
  ON meal_plans
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Health Metrics Policies
CREATE POLICY "Users can manage own health metrics"
  ON health_metrics
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Food Waste Logs Policies
CREATE POLICY "Users can manage own food waste logs"
  ON food_waste_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- User Achievements Policies
CREATE POLICY "Users can manage own achievements"
  ON user_achievements
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create useful indexes for performance
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id ON pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_expiry ON pantry_items(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pantry_items_category ON pantry_items(category);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date ON nutrition_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_public ON recipes(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON meal_plans(user_id, date);
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_date ON health_metrics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_shopping_list_user_id ON shopping_list_items(user_id);
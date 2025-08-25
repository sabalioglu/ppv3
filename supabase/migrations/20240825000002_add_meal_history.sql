-- Create meal_history table for diversity tracking
CREATE TABLE IF NOT EXISTS meal_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_name TEXT NOT NULL,
  ingredients TEXT[] NOT NULL DEFAULT '{}',
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  cuisine_type TEXT,
  cooking_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_meal_history_user_id ON meal_history(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_history_created_at ON meal_history(created_at);
CREATE INDEX IF NOT EXISTS idx_meal_history_meal_type ON meal_history(meal_type);
CREATE INDEX IF NOT EXISTS idx_meal_history_user_created ON meal_history(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE meal_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own meal history"
  ON meal_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal history"
  ON meal_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal history"
  ON meal_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal history"
  ON meal_history FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meal_history_updated_at 
  BEFORE UPDATE ON meal_history 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add some helpful functions
CREATE OR REPLACE FUNCTION get_recent_ingredients(user_uuid UUID, days_back INTEGER DEFAULT 7)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT DISTINCT unnest(ingredients)
    FROM meal_history 
    WHERE user_id = user_uuid 
      AND created_at >= NOW() - INTERVAL '1 day' * days_back
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_cuisine_variety_score(user_uuid UUID, days_back INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  unique_cuisines INTEGER;
  total_meals INTEGER;
BEGIN
  SELECT COUNT(DISTINCT cuisine_type), COUNT(*)
  INTO unique_cuisines, total_meals
  FROM meal_history 
  WHERE user_id = user_uuid 
    AND created_at >= NOW() - INTERVAL '1 day' * days_back
    AND cuisine_type IS NOT NULL;
    
  IF total_meals = 0 THEN
    RETURN 100; -- Perfect score if no history
  END IF;
  
  RETURN LEAST(100, (unique_cuisines * 100 / GREATEST(total_meals, 1)));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
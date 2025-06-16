-- Receipt Learning System Extension
-- Migration: 20241216000004_add_learning_system.sql
-- Adds machine learning capabilities for receipt parsing improvement

-- 1. Receipt learning data table
CREATE TABLE IF NOT EXISTS receipt_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  store_name TEXT,
  store_format TEXT, -- 'walmart', 'target', 'kroger', etc.
  parsed_items JSONB, -- AI parsed items
  user_feedback JSONB, -- User corrections
  confirmed_items JSONB, -- Final confirmed food items
  rejected_items JSONB, -- Non-food items user rejected
  accuracy_score DECIMAL, -- Parser success rate 0-100
  processing_time INTEGER, -- Analysis time in ms
  receipt_total DECIMAL, -- Receipt total amount
  items_count INTEGER, -- Total items in receipt
  image_url TEXT, -- Receipt image URL
  parsing_method TEXT DEFAULT 'ai_vision', -- ai_vision, ocr, manual
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Food pattern learning table
CREATE TABLE IF NOT EXISTS food_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT UNIQUE NOT NULL,
  pattern_type TEXT CHECK (pattern_type IN ('name', 'category', 'brand', 'keyword')),
  confidence_score INTEGER DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  usage_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  store_specific TEXT[],
  is_food BOOLEAN DEFAULT true,
  language TEXT DEFAULT 'en',
  region TEXT DEFAULT 'US',
  seasonal BOOLEAN DEFAULT false,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Store format learning table
CREATE TABLE IF NOT EXISTS store_formats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT UNIQUE NOT NULL,
  store_chain TEXT, -- 'walmart', 'kroger', etc.
  store_country TEXT DEFAULT 'US',
  line_pattern TEXT, -- Regex for line parsing
  price_pattern TEXT, -- Regex for price detection
  item_pattern TEXT, -- Regex for item names
  header_patterns TEXT[], -- Patterns to skip (headers)
  footer_patterns TEXT[], -- Patterns to skip (footers)
  accuracy_stats JSONB DEFAULT '{}',
  sample_receipt_lines TEXT[],
  total_receipts INTEGER DEFAULT 0,
  avg_accuracy DECIMAL DEFAULT 0,
  last_accuracy DECIMAL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User learning statistics
CREATE TABLE IF NOT EXISTS user_learning_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
  total_receipts INTEGER DEFAULT 0,
  total_feedback_provided INTEGER DEFAULT 0,
  total_corrections INTEGER DEFAULT 0,
  total_confirmations INTEGER DEFAULT 0,
  total_rejections INTEGER DEFAULT 0,
  average_accuracy DECIMAL DEFAULT 0,
  best_accuracy DECIMAL DEFAULT 0,
  preferred_stores TEXT[],
  learned_patterns_count INTEGER DEFAULT 0,
  contribution_score INTEGER DEFAULT 0, -- Points for helping improve system
  streak_days INTEGER DEFAULT 0, -- Consecutive days of feedback
  badges TEXT[] DEFAULT '{}', -- Achievement badges
  level INTEGER DEFAULT 1, -- User level based on contribution
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Receipt feedback sessions
CREATE TABLE IF NOT EXISTS receipt_feedback_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_learning_id UUID REFERENCES receipt_learning(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  feedback_data JSONB NOT NULL,
  session_duration INTEGER, -- Time spent reviewing in seconds
  items_confirmed INTEGER DEFAULT 0,
  items_rejected INTEGER DEFAULT 0,
  items_edited INTEGER DEFAULT 0,
  new_items_added INTEGER DEFAULT 0,
  completion_status TEXT CHECK (completion_status IN ('completed', 'partial', 'skipped')),
  user_satisfaction INTEGER CHECK (user_satisfaction BETWEEN 1 AND 5),
  feedback_quality TEXT CHECK (feedback_quality IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Pattern performance tracking
CREATE TABLE IF NOT EXISTS pattern_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID REFERENCES food_patterns(id) ON DELETE CASCADE,
  store_format TEXT,
  success_rate DECIMAL DEFAULT 0,
  total_uses INTEGER DEFAULT 0,
  recent_successes INTEGER DEFAULT 0,
  recent_failures INTEGER DEFAULT 0,
  last_performance_update TIMESTAMPTZ DEFAULT NOW(),
  performance_trend TEXT CHECK (performance_trend IN ('improving', 'stable', 'declining')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE receipt_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_formats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_feedback_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for receipt_learning
CREATE POLICY "Users can view own receipt learning data" 
ON receipt_learning FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own receipt learning data" 
ON receipt_learning FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own receipt learning data" 
ON receipt_learning FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for food_patterns (readable by all authenticated users)
CREATE POLICY "Food patterns are publicly readable" 
ON food_patterns FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "System can insert food patterns" 
ON food_patterns FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "System can update food patterns" 
ON food_patterns FOR UPDATE 
TO authenticated 
USING (true);

-- RLS Policies for store_formats
CREATE POLICY "Store formats are publicly readable" 
ON store_formats FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "System can manage store formats" 
ON store_formats FOR ALL 
TO authenticated 
USING (true);

-- RLS Policies for user_learning_stats
CREATE POLICY "Users can view own learning stats" 
ON user_learning_stats FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own learning stats" 
ON user_learning_stats FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for receipt_feedback_sessions
CREATE POLICY "Users can view own feedback sessions" 
ON receipt_feedback_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback sessions" 
ON receipt_feedback_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for pattern_performance
CREATE POLICY "Pattern performance is publicly readable" 
ON pattern_performance FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "System can manage pattern performance" 
ON pattern_performance FOR ALL 
TO authenticated 
USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_receipt_learning_user_id ON receipt_learning(user_id);
CREATE INDEX IF NOT EXISTS idx_receipt_learning_store_format ON receipt_learning(store_format);
CREATE INDEX IF NOT EXISTS idx_receipt_learning_created_at ON receipt_learning(created_at);
CREATE INDEX IF NOT EXISTS idx_receipt_learning_accuracy ON receipt_learning(accuracy_score);

CREATE INDEX IF NOT EXISTS idx_food_patterns_pattern ON food_patterns(pattern);
CREATE INDEX IF NOT EXISTS idx_food_patterns_confidence ON food_patterns(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_food_patterns_usage ON food_patterns(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_food_patterns_type ON food_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_food_patterns_is_food ON food_patterns(is_food);

CREATE INDEX IF NOT EXISTS idx_store_formats_store_name ON store_formats(store_name);
CREATE INDEX IF NOT EXISTS idx_store_formats_chain ON store_formats(store_chain);
CREATE INDEX IF NOT EXISTS idx_store_formats_active ON store_formats(is_active);

CREATE INDEX IF NOT EXISTS idx_user_learning_stats_user_id ON user_learning_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_stats_contribution ON user_learning_stats(contribution_score DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_sessions_receipt_id ON receipt_feedback_sessions(receipt_learning_id);
CREATE INDEX IF NOT EXISTS idx_feedback_sessions_user_id ON receipt_feedback_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_sessions_status ON receipt_feedback_sessions(completion_status);

CREATE INDEX IF NOT EXISTS idx_pattern_performance_pattern_id ON pattern_performance(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_performance_success_rate ON pattern_performance(success_rate DESC);

-- Insert initial food patterns (enhanced set)
INSERT INTO food_patterns (pattern, pattern_type, confidence_score, is_food) VALUES
-- Basic foods
('BREAD', 'keyword', 95, true),
('MILK', 'keyword', 95, true),
('EGGS', 'keyword', 95, true),
('CHEESE', 'keyword', 90, true),
('BUTTER', 'keyword', 90, true),
('YOGURT', 'keyword', 90, true),

-- Fruits
('APPLE', 'keyword', 95, true),
('BANANA', 'keyword', 95, true),
('ORANGE', 'keyword', 95, true),
('GRAPES', 'keyword', 90, true),
('BERRIES', 'keyword', 90, true),
('LEMON', 'keyword', 85, true),

-- Vegetables
('TOMATO', 'keyword', 90, true),
('POTATO', 'keyword', 95, true),
('ONION', 'keyword', 95, true),
('GARLIC', 'keyword', 90, true),
('CARROT', 'keyword', 90, true),
('BROCCOLI', 'keyword', 90, true),
('LETTUCE', 'keyword', 85, true),
('SPINACH', 'keyword', 85, true),

-- Proteins
('CHICKEN', 'keyword', 95, true),
('BEEF', 'keyword', 95, true),
('FISH', 'keyword', 90, true),
('SALMON', 'keyword', 90, true),
('TURKEY', 'keyword', 90, true),
('PORK', 'keyword', 90, true),

-- Grains & Pantry
('RICE', 'keyword', 95, true),
('PASTA', 'keyword', 90, true),
('FLOUR', 'keyword', 85, true),
('SUGAR', 'keyword', 90, true),
('SALT', 'keyword', 85, true),
('PEPPER', 'keyword', 85, true),
('OIL', 'keyword', 85, true),

-- Beverages
('WATER', 'keyword', 80, true),
('JUICE', 'keyword', 90, true),
('SODA', 'keyword', 75, true),
('COFFEE', 'keyword', 85, true),
('TEA', 'keyword', 85, true),

-- Sauces & Condiments
('SAUCE', 'keyword', 85, true),
('KETCHUP', 'keyword', 80, true),
('MUSTARD', 'keyword', 80, true),
('MAYO', 'keyword', 80, true),
('DRESSING', 'keyword', 80, true),

-- International/Specialty
('AVOCADO', 'keyword', 90, true),
('SESAME', 'keyword', 80, true),
('SOY', 'keyword', 75, true),
('SRIRACHA', 'keyword', 75, true),
('HOISIN', 'keyword', 70, true),

-- Common non-food patterns
('SHAMPOO', 'keyword', 95, false),
('TOOTHPASTE', 'keyword', 95, false),
('DETERGENT', 'keyword', 95, false),
('BATTERIES', 'keyword', 95, false),
('PAPER', 'keyword', 90, false),
('SOAP', 'keyword', 90, false);

-- Insert initial store formats with enhanced patterns
INSERT INTO store_formats (store_name, store_chain, store_country, line_pattern, price_pattern, item_pattern, header_patterns, footer_patterns) VALUES
('WALMART', 'walmart', 'US', 
 '^([A-Z][A-Z\s]+?)\s+\d{12,}', 
 '\d+\.\d{2}\s*[XT]?\s*$',
 '^([A-Z][A-Z\s]+?)\s+',
 ARRAY['WALMART', 'SAVE MONEY', 'LIVE BETTER', 'SUPERCENTER', 'STORE', 'MANAGER'],
 ARRAY['SUBTOTAL', 'TAX', 'TOTAL', 'CASH', 'CHANGE', 'THANK YOU', 'VISIT US']
),

('TARGET', 'target', 'US', 
 '^([A-Z][A-Z\s]+?)\s+\d{9,}', 
 '\d+\.\d{2}\s*[XT]?\s*$',
 '^([A-Z][A-Z\s]+?)\s+',
 ARRAY['TARGET', 'EXPECT MORE', 'PAY LESS', 'STORE'],
 ARRAY['SUBTOTAL', 'TAX', 'TOTAL', 'CASH', 'CHANGE', 'THANK YOU']
),

('KROGER', 'kroger', 'US', 
 '^([A-Z][A-Z\s]+?)\s+', 
 '\d+\.\d{2}\s*[XT]?\s*$',
 '^([A-Z][A-Z\s]+?)\s+',
 ARRAY['KROGER', 'FRESH FOR EVERYONE', 'STORE'],
 ARRAY['SUBTOTAL', 'TAX', 'TOTAL', 'CASH', 'CHANGE', 'THANKS']
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_learning_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;

$$ language 'plpgsql';

-- Create triggers for updated_at on new tables
CREATE TRIGGER update_receipt_learning_updated_at 
BEFORE UPDATE ON receipt_learning 
FOR EACH ROW EXECUTE FUNCTION update_learning_updated_at_column();

CREATE TRIGGER update_store_formats_updated_at 
BEFORE UPDATE ON store_formats 
FOR EACH ROW EXECUTE FUNCTION update_learning_updated_at_column();

CREATE TRIGGER update_user_learning_stats_updated_at 
BEFORE UPDATE ON user_learning_stats 
FOR EACH ROW EXECUTE FUNCTION update_learning_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE receipt_learning IS 'Stores receipt analysis data for machine learning improvement';
COMMENT ON TABLE food_patterns IS 'Dynamic food pattern recognition database with learning capabilities';
COMMENT ON TABLE store_formats IS 'Store-specific receipt format patterns with accuracy tracking';
COMMENT ON TABLE user_learning_stats IS 'User contribution statistics and gamification for learning system';
COMMENT ON TABLE receipt_feedback_sessions IS 'User feedback sessions for receipt analysis improvement';
COMMENT ON TABLE pattern_performance IS 'Tracks performance metrics for each pattern across different contexts';

-- Create view for learning analytics
CREATE OR REPLACE VIEW learning_analytics AS
SELECT 
  sf.store_name,
  sf.store_chain,
  COUNT(rl.id) as total_receipts,
  AVG(rl.accuracy_score) as avg_accuracy,
  MAX(rl.accuracy_score) as best_accuracy,
  MIN(rl.accuracy_score) as worst_accuracy,
  COUNT(DISTINCT rl.user_id) as unique_users,
  AVG(rl.processing_time) as avg_processing_time
FROM store_formats sf
LEFT JOIN receipt_learning rl ON sf.store_chain = rl.store_format
GROUP BY sf.store_name, sf.store_chain;

-- Grant permissions for the view
GRANT SELECT ON learning_analytics TO authenticated;

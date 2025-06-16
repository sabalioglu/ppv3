// types/learning.ts
export interface ReceiptLearning {
  id?: string;
  user_id?: string;
  original_text: string;
  store_name?: string;
  store_format?: string;
  parsed_items: ParsedItem[];
  user_feedback?: UserFeedback[];
  confirmed_items: ParsedItem[];
  rejected_items: string[];
  accuracy_score?: number;
  processing_time?: number;
  receipt_total?: number;
  items_count?: number;
  image_url?: string;
  parsing_method?: string;
}

export interface UserFeedback {
  item_id: string;
  action: 'confirm' | 'reject' | 'edit' | 'add';
  original_name?: string;
  corrected_name?: string;
  is_food?: boolean;
  confidence?: number;
}

export interface ParsedItem {
  id?: string;
  name: string;
  price?: number;
  quantity?: number;
  category?: string;
  confidence?: number;
  is_food?: boolean;
}

export interface FoodPattern {
  id?: string;
  pattern: string;
  pattern_type: 'name' | 'category' | 'brand' | 'keyword';
  confidence_score: number;
  usage_count: number;
  success_count: number;
  is_food: boolean;
  store_specific?: string[];
}

export interface UserLearningStats {
  id?: string;
  user_id?: string;
  total_receipts: number;
  total_feedback_provided: number;
  total_corrections: number;
  average_accuracy: number;
  contribution_score: number;
  level: number;
  badges: string[];
}

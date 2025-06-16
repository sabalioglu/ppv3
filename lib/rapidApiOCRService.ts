// lib/rapidApiOCRService.ts
export interface OCRReceiptItem {
  id: string;
  name: string;
  price?: number;
  quantity?: number;
  category: string;
  confidence: number;
  is_food: boolean;
  user_action: 'pending' | 'confirmed' | 'rejected' | 'edited';
}

export interface OCRParseResult {
  success: boolean;
  items: OCRReceiptItem[];
  store_name?: string;
  total?: number;
  tax?: number;
  date?: string;
  confidence: number;
  processing_time: number;
  method: 'rapidapi_ocr';
  raw_response?: any;
}

export class RapidApiOCRService {
  private static readonly API_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY || '1b4af5fbbdmsh25a1223f1b80040p1d954bjsne22e8d0cac3d';
  private static readonly API_URL = 'https://receipt-and-invoice-ocr-api.p.rapidapi.com/recognize';

  static async parseReceipt(imageBase64: string): Promise<OCRParseResult> {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Starting RapidAPI Receipt OCR parsing...');
      
      // Convert Base64 to Blob
      const response = await fetch(`data:image/jpeg;base64,${imageBase64}`);
      const blob = await response.blob();
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', blob, 'receipt.jpg');
      formData.append('settings', '{"documentType": "invoice"}');
      
      const apiResponse = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'X-RapidAPI-Key': this.API_KEY,
          'X-RapidAPI-Host': 'receipt-and-invoice-ocr-api.p.rapidapi.com'
        },
        body: formData
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        throw new Error(`RapidAPI OCR failed: ${apiResponse.status} - ${errorText}`);
      }

      const data = await apiResponse.json();
      console.log('📄 RapidAPI OCR Response:', JSON.stringify(data, null, 2));
      
      return this.formatOCRResponse(data, Date.now() - startTime);
      
    } catch (error) {
      console.error('❌ RapidAPI OCR failed:', error);
      
      return {
        success: false,
        items: [],
        confidence: 0,
        processing_time: Date.now() - startTime,
        method: 'rapidapi_ocr',
        raw_response: null
      };
    }
  }

  private static formatOCRResponse(apiResponse: any, processingTime: number): OCRParseResult {
    try {
      // Extract items from different possible response formats
      let rawItems = [];
      
      if (apiResponse.line_items) {
        rawItems = apiResponse.line_items;
      } else if (apiResponse.items) {
        rawItems = apiResponse.items;
      } else if (apiResponse.extracted_data?.line_items) {
        rawItems = apiResponse.extracted_data.line_items;
      } else if (apiResponse.extracted_data?.items) {
        rawItems = apiResponse.extracted_data.items;
      }

      console.log('📦 Raw items found:', rawItems.length);

      // Process all items
      const allItems: OCRReceiptItem[] = rawItems.map((item: any, index: number) => {
        const itemName = this.extractItemName(item);
        const itemPrice = this.parsePrice(item.price || item.amount || item.total_price || item.value);
        const itemQuantity = parseInt(item.quantity || item.qty || '1');
        
        return {
          id: `ocr_${Date.now()}_${index}`,
          name: itemName.toString().toUpperCase().trim(),
          price: itemPrice,
          quantity: itemQuantity,
          category: this.categorizeItem(itemName),
          confidence: 85, // Fixed confidence
          is_food: this.isFoodItem(itemName),
          user_action: 'pending'
        };
      }).filter(item => item.name.length > 2);

      // Filter only food items
      const foodItems = allItems.filter(item => item.is_food);
      const nonFoodItems = allItems.filter(item => !item.is_food);

      console.log('✅ Food items:', foodItems.length);
      console.log('❌ Non-food items filtered out:', nonFoodItems.length);
      if (nonFoodItems.length > 0) {
        console.log('❌ Filtered non-food items:', nonFoodItems.map(item => item.name));
      }

      return {
        success: true,
        items: foodItems, // Only return food items
        store_name: this.extractStoreName(apiResponse),
        total: this.parsePrice(apiResponse.total || apiResponse.total_amount || apiResponse.grand_total),
        tax: this.parsePrice(apiResponse.tax || apiResponse.tax_amount),
        date: this.extractDate(apiResponse),
        confidence: 85, // Fixed overall confidence
        processing_time: processingTime,
        method: 'rapidapi_ocr',
        raw_response: apiResponse
      };
    } catch (error) {
      console.error('❌ Error formatting OCR response:', error);
      return {
        success: false,
        items: [],
        confidence: 0,
        processing_time: processingTime,
        method: 'rapidapi_ocr',
        raw_response: apiResponse
      };
    }
  }

  // Enhanced pattern-based food detection
  private static checkWithPatterns(itemName: string): boolean {
    const foodPatterns = [
      // Fruit patterns
      /fruit$/i,           // dragon fruit, passion fruit, star fruit
      /berry$/i,           // goji berry, acai berry, elderberry
      
      // Protein patterns  
      /nut$/i,             // macadamia nut, brazil nut, walnut
      /seed$/i,            // chia seed, flax seed, sunflower seed
      /protein$/i,         // plant protein, whey protein
      
      // Oil patterns
      /oil$/i,             // coconut oil, avocado oil, olive oil
      /butter$/i,          // almond butter, peanut butter
      
      // Organic patterns
      /organic/i,          // organic banana, organic milk
      /natural/i,          // natural honey, natural juice
      /fresh/i,            // fresh herbs, fresh produce
      /raw/i,              // raw almonds, raw honey
      /whole/i,            // whole grain, whole wheat
      /pure/i,             // pure vanilla, pure maple
      
      // Beverage patterns
      /\b(juice|milk|water|tea|coffee|smoothie|drink)\b/i,
      
      // Health food patterns
      /gluten.?free/i,     // gluten free bread
      /dairy.?free/i,      // dairy free milk
      /sugar.?free/i,      // sugar free candy
      /low.?fat/i,         // low fat yogurt
      /non.?fat/i,         // non fat milk
      
      // Meat patterns
      /grass.?fed/i,       // grass fed beef
      /free.?range/i,      // free range chicken
      /wild.?caught/i,     // wild caught salmon
      
      // Vegetable patterns
      /leafy/i,            // leafy greens
      /baby/i,             // baby spinach, baby carrots
      
      // Grain patterns
      /grain/i,            // multi grain, ancient grain
      /wheat/i,            // whole wheat, wheat bread
      /rice$/i,            // brown rice, jasmine rice
      
      // Spice patterns
      /spice/i,            // mixed spice, pumpkin spice
      /seasoning/i,        // taco seasoning, garlic seasoning
      
      // Food formats
      /canned/i,           // canned tomatoes, canned beans
      /frozen/i,           // frozen vegetables, frozen fruit
      /dried/i,            // dried fruit, dried herbs
      /roasted/i,          // roasted nuts, roasted vegetables
      
      // Sweet patterns
      /honey$/i,           // raw honey, organic honey
      /syrup$/i,           // maple syrup, corn syrup
      /sugar$/i,           // brown sugar, coconut sugar
    ];
    
    const lowerName = itemName.toLowerCase();
    return foodPatterns.some(pattern => pattern.test(lowerName));
  }

  // Enhanced hybrid food categorization
  private static categorizeItem(itemName: string): string {
    // Step 1: Quick keyword check
    const foodKeywords = [
      // Fruits
      'apple', 'banana', 'orange', 'lemon', 'lime', 'avocado', 'mango', 'pineapple',
      'strawberry', 'blueberry', 'raspberry', 'blackberry', 'grape', 'cherry', 'peach',
      'pear', 'plum', 'kiwi', 'watermelon', 'cantaloupe', 'honeydew', 'papaya',
      'coconut', 'date', 'fig', 'apricot', 'cranberry', 'pomegranate',
      
      // Vegetables  
      'tomato', 'potato', 'onion', 'garlic', 'carrot', 'celery', 'lettuce', 'spinach',
      'broccoli', 'cauliflower', 'cabbage', 'kale', 'arugula', 'cucumber', 'zucchini',
      'eggplant', 'bell pepper', 'jalapeño', 'mushroom', 'corn', 'peas', 'beans',
      'asparagus', 'artichoke', 'beet', 'radish', 'turnip', 'sweet potato', 'squash',
      'pumpkin', 'brussels sprouts', 'leek', 'shallot', 'ginger', 'scallion',
      
      // Meat & Protein
      'chicken', 'beef', 'pork', 'turkey', 'lamb', 'fish', 'salmon', 'tuna', 'cod',
      'shrimp', 'crab', 'lobster', 'bacon', 'ham', 'sausage', 'ground beef', 'steak',
      'pork chop', 'chicken breast', 'drumstick', 'thigh', 'wing', 'fillet', 'tenderloin',
      'eggs', 'egg', 'tofu', 'tempeh', 'quinoa', 'lentils', 'chickpeas', 'black beans',
      
      // Dairy
      'milk', 'cheese', 'butter', 'yogurt', 'cream', 'sour cream', 'cottage cheese',
      'cheddar', 'mozzarella', 'parmesan', 'swiss', 'goat cheese', 'cream cheese',
      'ice cream', 'frozen yogurt', 'heavy cream', 'half and half', 'buttermilk',
      
      // Grains & Carbs
      'bread', 'rice', 'pasta', 'flour', 'oats', 'cereal', 'quinoa', 'barley',
      'wheat', 'rye', 'corn', 'millet', 'buckwheat', 'couscous', 'bulgur',
      'noodles', 'spaghetti', 'macaroni', 'bagel', 'muffin', 'croissant', 'roll',
      
      // Spices & Condiments
      'salt', 'pepper', 'sugar', 'honey', 'maple syrup', 'vanilla', 'cinnamon',
      'paprika', 'cumin', 'oregano', 'basil', 'thyme', 'rosemary', 'sage',
      'ketchup', 'mustard', 'mayo', 'mayonnaise', 'ranch', 'bbq sauce', 'hot sauce',
      'soy sauce', 'vinegar', 'olive oil', 'coconut oil', 'vegetable oil', 'canola oil',
      
      // Beverages
      'juice', 'water', 'soda', 'coffee', 'tea', 'beer', 'wine', 'smoothie',
      'energy drink', 'sports drink', 'kombucha', 'sparkling water', 'lemonade',
      'orange juice', 'apple juice', 'cranberry juice', 'grape juice',
      
      // Snacks
      'chips', 'crackers', 'nuts', 'almonds', 'peanuts', 'cashews', 'walnuts',
      'pistachios', 'trail mix', 'granola', 'protein bar', 'energy bar',
      'chocolate', 'candy', 'cookies', 'cake', 'pie', 'donuts', 'pastry',
      
      // Frozen Foods
      'frozen', 'frozen pizza', 'frozen vegetables', 'frozen fruit',
      'frozen meals', 'frozen chicken', 'frozen fish', 'popsicle', 'sorbet',
      
      // Canned & Packaged
      'canned', 'soup', 'sauce', 'salsa', 'jam', 'jelly', 'peanut butter',
      'almond butter', 'hummus', 'pickles', 'olives', 'tuna can', 'tomato sauce',
      
      // Store Brands
      'great value', 'marketside', 'equate', 'simply', 'organic', 'fresh',
      'natural', 'whole', 'raw', 'pure', 'premium', 'select', 'choice',
      
      // Food Categories
      'produce', 'deli', 'bakery', 'meat', 'seafood', 'dairy', 'beverage',
      'snack', 'nutrition', 'vitamin', 'supplement', 'protein'
    ];
    
    const lowerName = itemName.toLowerCase();
    const hasKeyword = foodKeywords.some(keyword => lowerName.includes(keyword));
    
    if (hasKeyword) {
      console.log(`✅ Keyword match: "${itemName}"`);
      return 'food';
    }
    
    // Step 2: Pattern check for unknown items
    if (this.checkWithPatterns(itemName)) {
      console.log(`🎯 Pattern match: "${itemName}"`);
      return 'food';
    }
    
    // Step 3: Unknown item (future AI integration point)
    console.log(`❓ Unknown item: "${itemName}"`);
    return 'product';
  }

  private static isFoodItem(itemName: string): boolean {
    return this.categorizeItem(itemName) === 'food';
  }

  private static extractItemName(item: any): string {
    return item.description || 
           item.name || 
           item.item_name || 
           item.product_name ||
           item.text || 
           item.line_text ||
           'Unknown Item';
  }

  private static extractStoreName(response: any): string | undefined {
    return response.merchant_name || 
           response.store_name || 
           response.vendor || 
           response.company_name ||
           response.extracted_data?.merchant_name;
  }

  private static extractDate(response: any): string | undefined {
    return response.date || 
           response.transaction_date || 
           response.purchase_date ||
           response.extracted_data?.date;
  }

  private static parsePrice(priceStr: any): number | undefined {
    if (!priceStr) return undefined;
    
    const cleanPrice = priceStr.toString().replace(/[^\d.,]/g, '');
    const price = parseFloat(cleanPrice.replace(',', '.'));
    
    return isNaN(price) ? undefined : Math.round(price * 100) / 100;
  }

  // Test function for development
  static async testOCR(): Promise<void> {
    console.log('🧪 Testing OCR service...');
    const testResult = await this.parseReceipt('test_base64_string');
    console.log('Test result:', testResult);
  }
}

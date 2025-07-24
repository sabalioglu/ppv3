//lib/meal-plan/constants.ts
// Complete enhanced meal database with comprehensive ingredient matching
import { Meal } from './types';

export const MEAL_DATABASE: Record<string, Meal[]> = {
  breakfast: [
    {
      id: 'breakfast_1',
      name: "Scrambled Eggs with Toast",
      ingredients: [
        { name: "eggs", amount: 2, unit: "pieces", category: "Protein" },
        { name: "butter", amount: 1, unit: "tbsp", category: "Dairy" },
        { name: "bread", amount: 2, unit: "slices", category: "Grains" },
        { name: "salt", amount: 1, unit: "pinch", category: "Condiments" },
        { name: "pepper", amount: 1, unit: "pinch", category: "Condiments" }
      ],
      calories: 350,
      protein: 20,
      carbs: 28,
      fat: 18,
      fiber: 2,
      prepTime: 10,
      cookTime: 5,
      servings: 1,
      difficulty: "Easy",
      emoji: "🍳",
      category: "breakfast",
      tags: ["quick", "protein-rich", "comfort-food"],
      instructions: [
        "Crack eggs into a bowl and whisk with salt and pepper",
        "Heat butter in a non-stick pan over medium-low heat",
        "Pour eggs into pan and let sit for 20 seconds",
        "Using a spatula, gently push eggs from edges to center",
        "Continue stirring gently until eggs are just set but still creamy",
        "Meanwhile, toast bread slices until golden brown",
        "Serve scrambled eggs immediately with buttered toast"
      ]
    },
    {
      id: 'breakfast_2',
      name: "Oatmeal with Berries",
      ingredients: [
        { name: "oats", amount: 0.5, unit: "cup", category: "Grains" },
        { name: "milk", amount: 1, unit: "cup", category: "Dairy" },
        { name: "berries", amount: 0.5, unit: "cup", category: "Fruits" },
        { name: "honey", amount: 1, unit: "tbsp", category: "Condiments" }
      ],
      calories: 280,
      protein: 8,
      carbs: 52,
      fat: 4,
      fiber: 8,
      prepTime: 5,
      cookTime: 3,
      servings: 1,
      difficulty: "Easy",
      emoji: "🥣",
      category: "breakfast",
      tags: ["healthy", "fiber-rich", "quick"],
      instructions: [
        "Combine oats and milk in a microwave-safe bowl",
        "Microwave on high for 2-3 minutes, stirring halfway through",
        "Alternatively, cook on stovetop over medium heat for 3-5 minutes",
        "Stir in honey while oatmeal is still warm",
        "Top with fresh berries",
        "Let cool for 1 minute before serving"
      ]
    },
    {
      id: 'breakfast_3',
      name: "Yogurt Parfait",
      ingredients: [
        { name: "yogurt", amount: 1, unit: "cup", category: "Dairy" },
        { name: "granola", amount: 0.25, unit: "cup", category: "Grains" },
        { name: "honey", amount: 1, unit: "tbsp", category: "Condiments" },
        { name: "berries", amount: 0.5, unit: "cup", category: "Fruits" }
      ],
      calories: 320,
      protein: 15,
      carbs: 45,
      fat: 8,
      fiber: 5,
      prepTime: 5,
      cookTime: 0,
      servings: 1,
      difficulty: "Easy",
      emoji: "🥛",
      category: "breakfast",
      tags: ["healthy", "no-cook", "protein-rich"],
      instructions: [
        "Start with a layer of yogurt in a glass or bowl",
        "Add a layer of fresh berries",
        "Sprinkle granola evenly over berries",
        "Drizzle with honey",
        "Repeat layers if using a tall glass",
        "Serve immediately for best texture"
      ]
    },
    {
      id: 'breakfast_4',
      name: "Avocado Toast",
      ingredients: [
        { name: "bread", amount: 2, unit: "slices", category: "Grains" },
        { name: "avocado", amount: 1, unit: "medium", category: "Fruits" },
        { name: "lemon", amount: 0.5, unit: "piece", category: "Fruits" },
        { name: "salt", amount: 1, unit: "pinch", category: "Condiments" },
        { name: "pepper", amount: 1, unit: "pinch", category: "Condiments" }
      ],
      calories: 290,
      protein: 8,
      carbs: 32,
      fat: 18,
      fiber: 12,
      prepTime: 8,
      cookTime: 2,
      servings: 1,
      difficulty: "Easy",
      emoji: "🥑",
      category: "breakfast",
      tags: ["healthy", "trendy", "fiber-rich"],
      instructions: [
        "Toast bread slices until golden brown",
        "Cut avocado in half, remove pit, and scoop into bowl",
        "Mash avocado with fork until desired consistency",
        "Add lemon juice, salt, and pepper to avocado",
        "Spread avocado mixture evenly on toast",
        "Optional: top with cherry tomatoes or everything bagel seasoning"
      ]
    }
  ],
  lunch: [
    {
      id: 'lunch_1',
      name: "Chicken Salad",
      ingredients: [
        { name: "chicken", amount: 150, unit: "g", category: "Protein" },
        { name: "lettuce", amount: 2, unit: "cups", category: "Vegetables" },
        { name: "tomatoes", amount: 1, unit: "medium", category: "Vegetables" },
        { name: "cucumber", amount: 0.5, unit: "medium", category: "Vegetables" },
        { name: "olive oil", amount: 2, unit: "tbsp", category: "Condiments" },
        { name: "lemon", amount: 0.5, unit: "piece", category: "Fruits" }
      ],
      calories: 450,
      protein: 35,
      carbs: 12,
      fat: 28,
      fiber: 4,
      prepTime: 15,
      cookTime: 0,
      servings: 1,
      difficulty: "Easy",
      emoji: "🥗",
      category: "lunch",
      tags: ["healthy", "low-carb", "fresh"],
      instructions: [
        "Cook chicken breast by grilling, baking, or pan-frying until internal temp reaches 165°F",
        "Let chicken cool, then dice into bite-sized pieces",
        "Wash and chop lettuce into bite-sized pieces",
        "Dice tomatoes and cucumber",
        "Combine all vegetables in a large bowl",
        "Whisk olive oil with fresh lemon juice, salt, and pepper",
        "Add diced chicken to salad",
        "Toss with dressing just before serving"
      ]
    },
    {
      id: 'lunch_2',
      name: "Tuna Sandwich",
      ingredients: [
        { name: "tuna", amount: 1, unit: "can", category: "Protein" },
        { name: "bread", amount: 2, unit: "slices", category: "Grains" },
        { name: "mayonnaise", amount: 2, unit: "tbsp", category: "Condiments" },
        { name: "lettuce", amount: 2, unit: "leaves", category: "Vegetables" },
        { name: "tomatoes", amount: 2, unit: "slices", category: "Vegetables" }
      ],
      calories: 420,
      protein: 30,
      carbs: 32,
      fat: 18,
      fiber: 3,
      prepTime: 10,
      cookTime: 0,
      servings: 1,
      difficulty: "Easy",
      emoji: "🥪",
      category: "lunch",
      tags: ["quick", "protein-rich", "portable"],
      instructions: [
        "Drain tuna completely and flake with a fork",
        "Mix tuna with mayonnaise in a bowl",
        "Season with salt and pepper to taste",
        "Optional: add diced celery or onion for crunch",
        "Toast bread lightly if desired",
        "Layer lettuce leaves on one slice of bread",
        "Spread tuna mixture over lettuce",
        "Top with tomato slices and second bread slice"
      ]
    },
    {
      id: 'lunch_3',
      name: "Vegetable Stir Fry",
      ingredients: [
        { name: "rice", amount: 1, unit: "cup", category: "Grains" },
        { name: "mixed vegetables", amount: 2, unit: "cups", category: "Vegetables" },
        { name: "soy sauce", amount: 2, unit: "tbsp", category: "Condiments" },
        { name: "garlic", amount: 2, unit: "cloves", category: "Vegetables" },
        { name: "ginger", amount: 1, unit: "tsp", category: "Condiments" },
        { name: "oil", amount: 1, unit: "tbsp", category: "Condiments" }
      ],
      calories: 380,
      protein: 12,
      carbs: 68,
      fat: 8,
      fiber: 6,
      prepTime: 20,
      cookTime: 15,
      servings: 1,
      difficulty: "Medium",
      emoji: "🍜",
      category: "lunch",
      tags: ["vegetarian", "healthy", "filling"],
      instructions: [
        "Cook rice according to package instructions",
        "While rice cooks, prepare vegetables by cutting into uniform pieces",
        "Mince garlic and ginger finely",
        "Heat oil in a wok or large skillet over high heat",
        "Add garlic and ginger, stir-fry for 30 seconds until fragrant",
        "Add harder vegetables first (carrots, broccoli), stir-fry 2-3 minutes",
        "Add softer vegetables (bell peppers, snap peas), stir-fry 2 minutes",
        "Add soy sauce and toss everything together",
        "Serve immediately over cooked rice"
      ]
    }
  ],
  dinner: [
    {
      id: 'dinner_1',
      name: "Grilled Chicken with Vegetables",
      ingredients: [
        { name: "chicken", amount: 200, unit: "g", category: "Protein" },
        { name: "broccoli", amount: 1, unit: "cup", category: "Vegetables" },
        { name: "carrots", amount: 1, unit: "medium", category: "Vegetables" },
        { name: "olive oil", amount: 1, unit: "tbsp", category: "Condiments" },
        { name: "garlic", amount: 2, unit: "cloves", category: "Vegetables" },
        { name: "herbs", amount: 1, unit: "tsp", category: "Condiments" }
      ],
      calories: 550,
      protein: 45,
      carbs: 15,
      fat: 32,
      fiber: 6,
      prepTime: 15,
      cookTime: 25,
      servings: 1,
      difficulty: "Medium",
      emoji: "🍗",
      category: "dinner",
      tags: ["healthy", "high-protein", "low-carb"],
      instructions: [
        "Preheat grill or grill pan to medium-high heat",
        "Season chicken breast with minced garlic, herbs, salt, and pepper",
        "Let chicken marinate for 10 minutes at room temperature",
        "Cut carrots into sticks and broccoli into florets",
        "Grill chicken 6-8 minutes per side until internal temp reaches 165°F",
        "Meanwhile, steam vegetables until tender-crisp (5-7 minutes)",
        "Let chicken rest for 5 minutes before slicing",
        "Drizzle vegetables with olive oil and season with salt",
        "Serve chicken sliced alongside vegetables"
      ]
    },
    {
      id: 'dinner_2',
      name: "Pasta Bolognese",
      ingredients: [
        { name: "pasta", amount: 100, unit: "g", category: "Grains" },
        { name: "ground beef", amount: 150, unit: "g", category: "Protein" },
        { name: "tomato sauce", amount: 1, unit: "cup", category: "Condiments" },
        { name: "onion", amount: 0.5, unit: "medium", category: "Vegetables" },
        { name: "garlic", amount: 2, unit: "cloves", category: "Vegetables" },
        { name: "cheese", amount: 30, unit: "g", category: "Dairy" }
      ],
      calories: 650,
      protein: 35,
      carbs: 72,
      fat: 22,
      fiber: 4,
      prepTime: 10,
      cookTime: 25,
      servings: 1,
      difficulty: "Medium",
      emoji: "🍝",
      category: "dinner",
      tags: ["comfort-food", "filling", "family-favorite"],
      instructions: [
        "Bring large pot of salted water to boil for pasta",
        "Dice onion finely and mince garlic",
        "Heat oil in large pan over medium-high heat",
        "Add ground beef and cook, breaking up with spoon, until browned",
        "Add onion and garlic, cook until onion is translucent",
        "Pour in tomato sauce and simmer 15 minutes",
        "Meanwhile, cook pasta according to package directions until al dente",
        "Season sauce with salt, pepper, and Italian herbs",
        "Drain pasta and toss with sauce",
        "Serve topped with grated cheese"
      ]
    },
    {
      id: 'dinner_3',
      name: "Salmon with Quinoa",
      ingredients: [
        { name: "salmon", amount: 180, unit: "g", category: "Protein" },
        { name: "quinoa", amount: 0.5, unit: "cup", category: "Grains" },
        { name: "asparagus", amount: 1, unit: "cup", category: "Vegetables" },
        { name: "lemon", amount: 0.5, unit: "piece", category: "Fruits" },
        { name: "olive oil", amount: 1, unit: "tbsp", category: "Condiments" }
      ],
      calories: 520,
      protein: 40,
      carbs: 42,
      fat: 18,
      fiber: 8,
      prepTime: 10,
      cookTime: 25,
      servings: 1,
      difficulty: "Medium",
      emoji: "🐟",
      category: "dinner",
      tags: ["healthy", "omega-3", "balanced"],
      instructions: [
        "Preheat oven to 400°F (200°C)",
        "Rinse quinoa and cook in 1 cup water for 15 minutes until fluffy",
        "Season salmon with salt, pepper, and lemon juice",
        "Trim woody ends from asparagus",
        "Place salmon on baking sheet, drizzle with olive oil",
        "Bake salmon 12-15 minutes until it flakes easily",
        "Steam or roast asparagus until tender-crisp",
        "Fluff quinoa with fork and season with salt",
        "Serve salmon over quinoa with asparagus on the side",
        "Garnish with lemon wedges"
      ]
    }
  ],
  snacks: [
    {
      id: 'snack_1',
      name: "Apple with Peanut Butter",
      ingredients: [
        { name: "apple", amount: 1, unit: "medium", category: "Fruits" },
        { name: "peanut butter", amount: 2, unit: "tbsp", category: "Protein" }
      ],
      calories: 200,
      protein: 6,
      carbs: 28,
      fat: 8,
      fiber: 5,
      prepTime: 2,
      cookTime: 0,
      servings: 1,
      difficulty: "Easy",
      emoji: "🍎",
      category: "snack",
      tags: ["healthy", "quick", "fiber-rich"],
      instructions: [
        "Wash apple thoroughly under cold water",
        "Core apple and slice into wedges",
        "Serve with peanut butter for dipping",
        "Optional: sprinkle apple slices with cinnamon"
      ]
    },
    {
      id: 'snack_2',
      name: "Greek Yogurt",
      ingredients: [
        { name: "greek yogurt", amount: 1, unit: "cup", category: "Dairy" },
        { name: "honey", amount: 1, unit: "tbsp", category: "Condiments" }
      ],
      calories: 150,
      protein: 15,
      carbs: 20,
      fat: 2,
      fiber: 0,
      prepTime: 1,
      cookTime: 0,
      servings: 1,
      difficulty: "Easy",
      emoji: "🥛",
      category: "snack",
      tags: ["protein-rich", "quick", "healthy"],
      instructions: [
        "Serve Greek yogurt in a bowl",
        "Drizzle with honey",
        "Optional: add fresh berries or nuts for extra nutrition"
      ]
    },
    {
      id: 'snack_3',
      name: "Mixed Nuts",
      ingredients: [
        { name: "almonds", amount: 10, unit: "pieces", category: "Protein" },
        { name: "walnuts", amount: 5, unit: "pieces", category: "Protein" },
        { name: "cashews", amount: 8, unit: "pieces", category: "Protein" }
      ],
      calories: 180,
      protein: 5,
      carbs: 8,
      fat: 16,
      fiber: 3,
      prepTime: 0,
      cookTime: 0,
      servings: 1,
      difficulty: "Easy",
      emoji: "🥜",
      category: "snack",
      tags: ["healthy-fats", "portable", "energy-boost"],
      instructions: [
        "Mix nuts in a small bowl",
        "Serve immediately",
        "Store leftover nuts in airtight container"
      ]
    },
    {
      id: 'snack_4',
      name: "Hummus with Vegetables",
      ingredients: [
        { name: "hummus", amount: 0.25, unit: "cup", category: "Protein" },
        { name: "carrots", amount: 1, unit: "medium", category: "Vegetables" },
        { name: "cucumber", amount: 0.5, unit: "medium", category: "Vegetables" },
        { name: "bell pepper", amount: 0.5, unit: "medium", category: "Vegetables" }
      ],
      calories: 160,
      protein: 7,
      carbs: 18,
      fat: 8,
      fiber: 6,
      prepTime: 5,
      cookTime: 0,
      servings: 1,
      difficulty: "Easy",
      emoji: "🥕",
      category: "snack",
      tags: ["healthy", "crunchy", "fiber-rich"],
      instructions: [
        "Wash all vegetables thoroughly",
        "Cut carrots into sticks",
        "Slice cucumber into rounds or sticks",
        "Cut bell pepper into strips",
        "Arrange vegetables on plate with hummus for dipping"
      ]
    }
  ]
};

export const INGREDIENT_CATEGORIES = {
  'Protein': [
    'chicken', 'chicken breast', 'chicken thigh', 'poultry',
    'beef', 'ground beef', 'beef mince', 'minced beef', 'hamburger meat',
    'fish', 'salmon', 'tuna', 'cod', 'tilapia', 'trout',
    'pork', 'ham', 'bacon', 'sausage',
    'turkey', 'turkey breast',
    'eggs', 'egg whites',
    'tofu', 'tempeh', 'seitan',
    'beans', 'black beans', 'kidney beans', 'chickpeas', 'lentils',
    'peanut butter', 'almond butter', 'tahini',
    'almonds', 'walnuts', 'cashews', 'pecans', 'pistachios',
    'greek yogurt', 'cottage cheese', 'ricotta',
    'protein powder', 'hummus'
  ],
  'Dairy': [
    'milk', 'whole milk', 'skim milk', '2% milk', 'almond milk', 'soy milk',
    'cheese', 'cheddar', 'mozzarella', 'parmesan', 'swiss cheese', 'feta',
    'yogurt', 'greek yogurt', 'plain yogurt',
    'butter', 'unsalted butter', 'salted butter',
    'cream', 'heavy cream', 'sour cream', 'cream cheese',
    'ice cream', 'frozen yogurt'
  ],
  'Grains': [
    'rice', 'white rice', 'brown rice', 'jasmine rice', 'basmati rice', 'wild rice',
    'pasta', 'spaghetti', 'penne', 'macaroni', 'linguine', 'fettuccine',
    'bread', 'white bread', 'whole wheat bread', 'sourdough', 'rye bread',
    'oats', 'rolled oats', 'steel cut oats', 'instant oats',
    'quinoa', 'couscous', 'bulgur', 'barley',
    'flour', 'all-purpose flour', 'whole wheat flour', 'almond flour',
    'cereal', 'granola', 'muesli',
    'noodles', 'ramen', 'udon', 'rice noodles'
  ],
  'Vegetables': [
    'lettuce', 'romaine', 'iceberg lettuce', 'spinach', 'arugula', 'kale',
    'tomato', 'tomatoes', 'cherry tomatoes', 'roma tomatoes', 'grape tomatoes',
    'cucumber', 'english cucumber', 'pickling cucumber',
    'carrot', 'carrots', 'baby carrots',
    'broccoli', 'cauliflower', 'brussels sprouts',
    'onion', 'yellow onion', 'red onion', 'white onion', 'green onion', 'scallions',
    'garlic', 'garlic cloves', 'minced garlic',
    'pepper', 'bell pepper', 'red pepper', 'green pepper', 'yellow pepper',
    'asparagus', 'green beans', 'snap peas', 'snow peas',
    'mushrooms', 'button mushrooms', 'shiitake', 'portobello',
    'zucchini', 'yellow squash', 'eggplant',
    'celery', 'leeks', 'fennel',
    'mixed vegetables', 'frozen vegetables', 'stir fry vegetables'
  ],
  'Fruits': [
    'apple', 'green apple', 'red apple', 'granny smith',
    'banana', 'plantain',
    'berries', 'strawberries', 'blueberries', 'raspberries', 'blackberries',
    'orange', 'blood orange', 'navel orange',
    'grapes', 'red grapes', 'green grapes',
    'lemon', 'lime', 'grapefruit',
    'avocado', 'hass avocado',
    'pineapple', 'mango', 'papaya',
    'peach', 'nectarine', 'plum',
    'pear', 'asian pear',
    'watermelon', 'cantaloupe', 'honeydew',
    'kiwi', 'pomegranate', 'cranberries'
  ],
  'Condiments': [
    'oil', 'olive oil', 'vegetable oil', 'canola oil', 'coconut oil', 'sesame oil',
    'vinegar', 'balsamic vinegar', 'apple cider vinegar', 'rice vinegar',
    'sauce', 'tomato sauce', 'marinara', 'alfredo sauce', 'pesto',
    'soy sauce', 'tamari', 'teriyaki sauce', 'hoisin sauce',
    'hot sauce', 'sriracha', 'tabasco',
    'mayonnaise', 'mustard', 'dijon mustard', 'yellow mustard',
    'ketchup', 'bbq sauce', 'worcestershire sauce',
    'dressing', 'ranch', 'italian dressing', 'caesar dressing',
    'spices', 'herbs', 'basil', 'oregano', 'thyme', 'rosemary',
    'salt', 'pepper', 'black pepper', 'sea salt', 'kosher salt',
    'garlic powder', 'onion powder', 'paprika', 'cumin', 'chili powder',
    'honey', 'maple syrup', 'agave', 'brown sugar', 'white sugar',
    'vanilla', 'vanilla extract', 'cinnamon', 'nutmeg',
    'ginger', 'fresh ginger', 'ground ginger'
  ],
  'Pantry Staples': [
    'flour', 'sugar', 'brown sugar', 'powdered sugar',
    'baking powder', 'baking soda', 'yeast',
    'vanilla extract', 'almond extract',
    'stock', 'chicken stock', 'beef stock', 'vegetable stock',
    'broth', 'chicken broth', 'beef broth', 'vegetable broth',
    'coconut milk', 'evaporated milk', 'condensed milk',
    'canned tomatoes', 'tomato paste', 'tomato puree',
    'dried beans', 'canned beans', 'lentils', 'split peas',
    'rice', 'pasta', 'noodles', 'breadcrumbs'
  ]
};

// Comprehensive ingredient aliases for better matching
export const INGREDIENT_ALIASES = {
  // Proteins
  'chicken': ['chicken breast', 'chicken thigh', 'chicken meat', 'poultry', 'rotisserie chicken', 'grilled chicken'],
  'beef': ['ground beef', 'beef mince', 'minced beef', 'hamburger meat', 'ground chuck', 'lean beef'],
  'fish': ['salmon', 'tuna', 'cod', 'tilapia', 'trout', 'halibut', 'sea bass'],
  'eggs': ['egg', 'whole eggs', 'large eggs', 'fresh eggs'],
  'tofu': ['firm tofu', 'silken tofu', 'extra firm tofu', 'soft tofu'],
  
  // Dairy
  'milk': ['whole milk', 'skim milk', '2% milk', 'low fat milk', 'dairy milk'],
  'cheese': ['cheddar', 'mozzarella', 'parmesan', 'swiss cheese', 'american cheese', 'cheese slices'],
  'yogurt': ['greek yogurt', 'plain yogurt', 'vanilla yogurt', 'low fat yogurt'],
  'butter': ['unsalted butter', 'salted butter', 'stick butter', 'european butter'],
  
  // Grains
  'bread': ['white bread', 'whole wheat bread', 'sourdough', 'toast', 'sandwich bread', 'sliced bread'],
  'rice': ['white rice', 'brown rice', 'jasmine rice', 'basmati rice', 'long grain rice', 'short grain rice'],
  'pasta': ['spaghetti', 'penne', 'macaroni', 'linguine', 'fettuccine', 'angel hair', 'rigatoni'],
  'oats': ['rolled oats', 'old fashioned oats', 'quick oats', 'instant oats', 'steel cut oats'],
  
  // Vegetables
  'tomato': ['tomatoes', 'cherry tomatoes', 'grape tomatoes', 'roma tomatoes', 'beefsteak tomatoes'],
  'lettuce': ['romaine', 'iceberg lettuce', 'butter lettuce', 'mixed greens', 'salad greens'],
  'onion': ['yellow onion', 'white onion', 'red onion', 'sweet onion', 'vidalia onion'],
  'pepper': ['bell pepper', 'red pepper', 'green pepper', 'yellow pepper', 'orange pepper'],
  'carrot': ['carrots', 'baby carrots', 'mini carrots', 'whole carrots'],
  
  // Fruits
  'apple': ['red apple', 'green apple', 'granny smith', 'gala apple', 'fuji apple', 'honeycrisp'],
  'berries': ['strawberries', 'blueberries', 'raspberries', 'blackberries', 'mixed berries'],
  'citrus': ['lemon', 'lime', 'orange', 'grapefruit', 'tangerine'],
  
  // Condiments & Oils
  'oil': ['olive oil', 'vegetable oil', 'canola oil', 'cooking oil', 'extra virgin olive oil'],
  'vinegar': ['balsamic vinegar', 'apple cider vinegar', 'white vinegar', 'rice vinegar'],
  'sauce': ['tomato sauce', 'marinara sauce', 'pasta sauce', 'pizza sauce'],
  'herbs': ['fresh herbs', 'dried herbs', 'italian herbs', 'herb seasoning'],
  'spices': ['seasoning', 'spice blend', 'mixed spices', 'seasoning mix']
};

// Enhanced matching patterns for fuzzy ingredient recognition
export const MATCHING_PATTERNS = {
  // Common substitutions
  substitutions: {
    'ground beef': ['ground turkey', 'ground chicken', 'ground pork'],
    'chicken breast': ['chicken thigh', 'turkey breast', 'pork tenderloin'],
    'white rice': ['brown rice', 'quinoa', 'cauliflower rice'],
    'regular milk': ['almond milk', 'soy milk', 'oat milk'],
    'butter': ['margarine', 'coconut oil', 'olive oil']
  },
  
  // Category-based flexible matching
  flexibleCategories: {
    'leafy_greens': ['lettuce', 'spinach', 'kale', 'arugula', 'mixed greens'],
    'cooking_oils': ['olive oil', 'vegetable oil', 'canola oil', 'coconut oil'],
    'citrus': ['lemon', 'lime', 'orange', 'grapefruit'],
    'berries': ['strawberries', 'blueberries', 'raspberries', 'blackberries'],
    'nuts': ['almonds', 'walnuts', 'cashews', 'pecans', 'pistachios']
  },
  
  // Unit conversion helpers
  unitConversions: {
    'tbsp': ['tablespoon', 'tablespoons', 'T'],
    'tsp': ['teaspoon', 'teaspoons', 't'],
    'cup': ['cups', 'c'],
    'oz': ['ounce', 'ounces'],
    'lb': ['pound', 'pounds', 'lbs'],
    'g': ['gram', 'grams', 'gr'],
    'kg': ['kilogram', 'kilograms']
  }
};

// Seasonal ingredient suggestions
export const SEASONAL_INGREDIENTS = {
  spring: ['asparagus', 'peas', 'radishes', 'spring onions', 'strawberries'],
  summer: ['tomatoes', 'zucchini', 'corn', 'berries', 'peaches', 'watermelon'],
  fall: ['pumpkin', 'squash', 'apples', 'pears', 'brussels sprouts', 'sweet potatoes'],
  winter: ['citrus', 'root vegetables', 'cabbage', 'kale', 'pomegranate']
};

// Dietary restriction mappings
export const DIETARY_RESTRICTIONS = {
  vegetarian: {
    avoid: ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'turkey', 'ham', 'bacon'],
    alternatives: ['tofu', 'tempeh', 'beans', 'lentils', 'nuts', 'seeds']
  },
  vegan: {
    avoid: ['chicken', 'beef', 'pork', 'fish', 'milk', 'cheese', 'yogurt', 'butter', 'eggs', 'honey'],
    alternatives: ['tofu', 'tempeh', 'beans', 'lentils', 'nuts', 'plant milk', 'nutritional yeast']
  },
  'gluten-free': {
    avoid: ['bread', 'pasta', 'flour', 'wheat', 'barley', 'rye', 'oats'],
    alternatives: ['rice', 'quinoa', 'gluten-free bread', 'rice noodles', 'almond flour']
  },
  'dairy-free': {
    avoid: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'ice cream'],
    alternatives: ['almond milk', 'coconut milk', 'vegan cheese', 'coconut yogurt', 'olive oil']
  }
};

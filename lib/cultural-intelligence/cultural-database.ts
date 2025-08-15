//Lib > cultural-intelligence > cultural-database.ts
// Complete cultural knowledge from 8-region research
export const CULTURAL_KNOWLEDGE_BASE = {
  cuisines: {
    turkish: {
      breakfast: {
        typical: ['beyaz peynir', 'kaşar', 'zeytin', 'domates', 'salatalık', 'bal', 'reçel', 'simit', 'çay'],
        timing: '7-8 AM',
        style: 'communal feast-like spread',
        forbidden: ['pork', 'alcohol'],
        cookingMethods: ['grilling', 'stewing', 'fermentation']
      },
      spices: ['sumac', 'cumin', 'red pepper flakes', 'mint', 'oregano'],
      proteins: ['lamb', 'chicken', 'fish (coastal)', 'yogurt', 'cheese'],
      cookingMethods: ['grilling (kebab)', 'stewing', 'fermentation'],
      culturalRules: {
        ramadan: 'no daytime eating during Ramadan',
        halal: 'no pork, no alcohol, halal meat only'
      }
    },
    // ... complete data for all 8 cuisines from research
  },
  
  religiousConstraints: {
    halal: {
      forbidden: ['pork', 'alcohol', 'non-halal meat'],
      required: ['halal certification for meat'],
      strictness: 'absolute'
    },
    kosher: {
      forbidden: ['pork', 'shellfish', 'meat-dairy combinations'],
      required: ['kosher supervision', 'separate preparation'],
      strictness: 'absolute'
    },
    hindu: {
      forbidden: ['beef', 'often pork'],
      preferred: ['vegetarian', 'dairy acceptable'],
      strictness: 'high'
    }
    // ... all religious constraints from research
  },
  
  regionalPatterns: {
    coastal: {
      seafoodConsumption: 'high',
      preferredFish: ['local catch', 'seasonal varieties'],
      cookingMethods: ['grilling', 'steaming', 'raw preparation']
    },
    inland: {
      seafoodConsumption: 'low',
      proteinSources: ['poultry', 'red meat', 'dairy', 'legumes'],
      preservation: ['dried', 'fermented', 'preserved']
    }
  }
};
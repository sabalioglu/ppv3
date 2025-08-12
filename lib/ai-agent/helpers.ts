// lib/ai-agent/helpers.ts
export const normalize = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^\p{Letter}\p{Number}\s]/gu,' ').replace(/\s+/g,' ').trim();

export const tokenSet = (s: string) => new Set(normalize(s).split(' ').filter(w => w.length > 2));

export const jaccard = (a: Set<string>, b: Set<string>) => {
  const i = [...a].filter(x => b.has(x)).length;
  const u = a.size + b.size - i;
  return u === 0 ? 0 : i / u;
};

export const isNearDuplicateByName = (name: string, prevNames: string[], threshold=0.6) => {
  const A = tokenSet(name);
  return prevNames.some(p => jaccard(A, tokenSet(p)) >= threshold);
};

const PROTEIN_MAP: Record<string, 'fish'|'poultry'|'red_meat'|'legume'|'egg'|'tofu'|'dairy'|'seafood_other'> = {
  salmon:'fish', tuna:'fish', trout:'fish', mackerel:'fish', sardine:'fish', cod:'fish', anchovy:'fish',
  chicken:'poultry', turkey:'poultry',
  beef:'red_meat', lamb:'red_meat', pork:'red_meat',
  shrimp:'seafood_other', prawn:'seafood_other', crab:'seafood_other', lobster:'seafood_other',
  bean:'legume', beans:'legume', chickpea:'legume', lentil:'legume',
  egg:'egg', eggs:'egg', tofu:'tofu', paneer:'dairy', yogurt:'dairy', milk:'dairy', cheese:'dairy'
};
export const proteinCategoryOf = (ings: {name:string}[]=[]) => {
  for (const i of ings) {
    const n = normalize(i.name);
    const hit = Object.keys(PROTEIN_MAP).find(k => n.includes(k));
    if (hit) return PROTEIN_MAP[hit];
  }
  return null;
};

const METHODS = ['grill','bake','roast','saute','stir fry','stir-fry','steam','poach','braise','fry','air fry','air-fry'];
export const extractMethods = (instr: string[] = []) =>
  [...new Set(instr.flatMap(s => METHODS.filter(m => s.toLowerCase().includes(m))))];

export const CUISINE_MARKERS: Record<string,string[]> = {
  turkish: ['sumac','bulgur','yogurt','cumin','mint','pepper paste','tahin','pide','simit'],
  american:['bbq','ranch','cheddar','bacon','cornbread','coleslaw','maple'],
  greek:   ['oregano','feta','olive oil','lemon','tzatziki','kalamata'],
  vietnamese:['fish sauce','nuoc mam','mint','cilantro','lime','vermicelli','pho'],
  italian: ['basil','parmesan','risotto','pomodoro','penne','oregano'],
  mexican: ['chipotle','tortilla','cilantro','salsa','cumin'],
  japanese:['miso','soy sauce','mirin','dashi','nori'],
  indian:  ['garam masala','curry','turmeric','cumin','tandoori']
};

export function identifyCulturalMarkers(meal:any){
  const names = (meal.ingredients||[]).map((i:any)=>String(i.name||'').toLowerCase()).join(' ');
  const tags  = (meal.tags||[]).map((t:string)=>t.toLowerCase()).join(' ');
  const bag   = `${names} ${tags}`;
  const hits: string[] = [];
  for (const c in CUISINE_MARKERS) {
    const score = CUISINE_MARKERS[c].reduce((s,k)=> s + (bag.includes(k) ? 1 : 0), 0);
    if (score>0) hits.push(c);
  }
  return hits;
}
export function identifyPrimaryCuisine(meal:any, prefs:string[]){
  const hits = identifyCulturalMarkers(meal);
  const prefHit = hits.find(h=>prefs.includes(h));
  return prefHit || hits[0] || (prefs[0] || 'modern');
}

export const ALLERGEN_MAP: Record<string,string[]> = {
  nuts:['almond','walnut','cashew','pecan','hazelnut','pistachio'],
  peanuts:['peanut','peanut butter'],
  dairy:['milk','cheese','butter','cream','yogurt','whey','casein','ghee'],
  eggs:['egg','albumen','mayonnaise','aioli'],
  soy:['soy','tofu','tempeh','miso','edamame','soy sauce'],
  wheat:['wheat','flour','breadcrumbs','semolina','farina'],
  gluten:['wheat','barley','rye','malt','spelt','semolina'],
  fish:['fish','salmon','tuna','cod','mackerel','anchovy'],
  shellfish:['shrimp','prawn','crab','lobster','oyster','scallop','clam','mussel'],
  sesame:['sesame','tahini','sesame oil','gomashio'],
  sulfites:['sulfite','sulphite','wine','treated dried fruit']
};

export const containsAllergen = (ingredientName:string, allergen:string) => {
  const keywords = ALLERGEN_MAP[allergen] || [allergen];
  const n = normalize(ingredientName);
  return keywords.some(k => n.includes(normalize(k)));
};
// lib/policy/diversity-memory.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DiversitySnapshot = {
  date: string;                        // YYYY-MM-DD
  proteinCats: string[];               // fish/poultry/red_meat/legume/egg/tofu/dairy/seafood_other
  cuisines: string[];                  // 'turkish','american',...
  methods: string[];                   // 'grill','bake',...
};

const KEY = '@ai_food_pantry:diversity_memory_v1';

export async function loadDiversity(): Promise<DiversitySnapshot[]> {
  try { return JSON.parse((await AsyncStorage.getItem(KEY))||'[]'); }
  catch { return []; }
}
export async function saveDiversity(snaps: DiversitySnapshot[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(snaps.slice(-2)));
}
export async function pushToday(update: Partial<DiversitySnapshot>) {
  const today = new Date().toISOString().slice(0,10);
  const snaps = await loadDiversity();
  const last = snaps.find(s => s.date === today) ?? { date: today, proteinCats:[], cuisines:[], methods:[] };
  const merged: DiversitySnapshot = {
    date: today,
    proteinCats: Array.from(new Set([...(last.proteinCats||[]), ...(update.proteinCats||[])])),
    cuisines:    Array.from(new Set([...(last.cuisines||[]),    ...(update.cuisines||[])])),
    methods:     Array.from(new Set([...(last.methods||[]),     ...(update.methods||[])])),
  };
  const others = snaps.filter(s => s.date !== today);
  await saveDiversity([...others, merged]);
  return merged;
}
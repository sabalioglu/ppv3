# Plan · Stovd Launch Prep (A + B, paywall hariç)

## Brief
Stovd'un store öncesi kullanıcı deneyimi katmanını tamamla: onboarding'i sadeleştir ve diyet tercihlerinin AI tariflere fiilen beslendiğini garanti et, Library ekranının tipografi/çakışma sorununu gider, ai-meal-plan'in Haftalık ve Aylık görünümlerini gerçek üretime bağla. RevenueCat paywall (C) bu plana dahil değil.

## Stack
- Expo SDK 54, React Native, expo-router (~/projects/ppv3, branch main)
- Supabase backend (ref mngukcchktjmexinfnib): meal-generate edge fn (Gemini, MEAL_PROVIDER switch), meal-plan-quota edge fn
- lib/meal-plan/enhanced-ai-generation.ts (generateEnhancedMealPlan + MealPlanQuotaError gate), lib/meal-plan/api-clients/ai-generation.ts (getCalorieTarget porsiyonlama)
- Gemini 2.5 Flash (mevcut GEMINI_API_KEY, meal-generate üzerinden — ek ücretli API yok)
- lib/theme.ts + contexts/ThemeContext.tsx (useTheme tokenları), lib/i18n (EN+TR)

## Scope

**A4 — Onboarding diyet verisi → AI besleme doğrulaması**
- onboarding kayıt edilen `dietary_preferences`, `dietaryRestrictions` (allergens), `cuisinePreferences` alanlarının meal-generate prompt'una geçtiğini izle
- Eksikse: profili okuyup bu üç alanı `generateAIMeal`/`generateEnhancedMealPlan` prompt'una bağla (ai-generation.ts:548 `dietary_preferences`, :897 `dietary_restrictions`, cuisine pref)
- Allergens = HARD CONSTRAINT olarak prompt'ta (asla üretime sızmamalı)

**Onboarding sadeleştirme (8 → 4 adım)**
- Mevcut 8 adım: 1 BasicInfo, 2 PhysicalStats, 3 HealthGoalsMacros, 4 HealthGoalsMicros, 5 Allergens, 6 DietaryPreferences, 7 CuisinePreferences, 8 CookingSkill
- KES: Step3 HealthGoalsMacros + Step4 HealthGoalsMicros (14 klinik health-goal alanı)
- KORU: BasicInfo, PhysicalStats (height/weight/activity — kalori için şart), Allergens, DietaryPreferences, CuisinePreferences, CookingSkill
- KONSOLİDE → 4 adım hedefi: (1) BasicInfo+PhysicalStats, (2) Allergens, (3) DietaryPreferences+CuisinePreferences, (4) CookingSkill (gruplama serbest, adım sayısı ≤4 olmalı)
- `steps` haritası, `TOTAL_STEPS`, progress hesabı ve i18n `step{N}Kicker/Title` anahtarları yeni sıraya göre güncellensin
- profil insert'inde `health_goals_macros`/`health_goals_micros` artık toplanmıyorsa null/varsayılan yazılsın (DB kolonu kalır, schema bozulmaz)

**B6 — Library ekranı tipografi + çakışma**
- components/library/LibraryMain.tsx statik renk/font yerine `useTheme()` tokenları kullansın (recipes.tsx ile tutarlı tipografi)
- İngilizce-sabit string'ler (My Cookbooks, All Recipes, New cookbook, Import from ...) i18n'e taşınsın (EN+TR)
- recipes.tsx ile görsel/işlev çakışması giderilsin (aynı kart tipografisi)

**B5 — ai-meal-plan Haftalık + Aylık üretim (ONAYLANMIŞ STRATEJİ)**
- ai-meal-plan.tsx:1435-1463 `comingSoonContainer` blokları kaldırılsın
- **Haftalık = 1 tam LLM çağrısı**: 7 gün, her öğün tam tarif (malzeme+adım). ~13k token çıktıya sığar.
- **Aylık = iskelet + lazy expand**: 1 LLM çağrısı ile 30 günlük iskelet (her öğün sadece `{title, calories, macros}`, ~6-8k token, çeşitlilik tek seferde optimize). Kullanıcı bir öğüne dokununca mevcut `generateAIMeal` ile o tek tarifin tam detayı üretilir.
- 30 ardışık çağrı YAPILMAZ (kırılgan, yavaş). Tek dev çağrı da YAPILMAZ (48k token → kesilme/bozuk JSON riski).
- meal-plan-quota gate: haftalık = 1 ai_meal_plan ünitesi; aylık iskelet = 1 ünite (lazy expand tarif açılışları ayrı/ucuz sayılır veya sayılmaz)
- üretilen planlar mevcut günlük kart bileşenleriyle render edilsin (yeni tasarım gerekmez)

## Out of Scope
- C: RevenueCat paywall, $15/ay ürün, MealPlanQuotaError → paywall UI gösterimi
- D/E: Apple Sign-In, hesap silme, Privacy/Terms URL, EAS build/submit
- Social import motoru (bitti, dokunulmaz: Modal stovd-video-analyze + video-intelligence)
- Tam görsel redesign (Phase 4) — Library dışındaki ekranların elden geçirilmesi
- Yeni meal-plan kart tasarımı / yeni bileşen üretimi
- Onboarding'e yeni alan/soru ekleme (sadece kesme + konsolidasyon)
- Stovd-markalı email domain geçişi

## Constraints
- Mevcut Supabase şeması bozulmaz (health_goals_macros/micros kolonları silinmez, sadece toplanmaz)
- Ek ücretli API yok (Gemini mevcut key, meal-generate üzerinden)
- Allergens her zaman hard constraint — üretilen hiçbir tarif seçili alerjeni içermez
- getCalorieTarget porsiyonlama mantığı korunur (height/weight/activity ona besleniyor)
- Dosyalar 500 satır hedefi; mevcut stil/idiom korunur, komşu kod "iyileştirilmez"
- Web (localhost:8081) test ortamı; native build gerekmez
- branch main, gizli/.env commit edilmez

## Definition of Done
Onboarding ≤4 adımda tamamlanır ve Step3/Step4 klinik alanları kaldırılmıştır; kaydedilen profilin dietary_preferences + dietaryRestrictions(allergens) + cuisinePreferences değerleri meal-generate prompt'unda birebir görünür; LibraryMain.tsx useTheme tokenları kullanır ve İngilizce-sabit string kalmaz; ai-meal-plan Haftalık (7 gün) ve Aylık (30 gün) görünümleri comingSoon bloğu olmadan gerçek üretilmiş plan render eder — hepsi grep + localhost:8081 CloakBrowser akışıyla kanıtlanır.

## Acceptance Criteria
- `app/(auth)/onboarding.tsx` içinde `TOTAL_STEPS` ≤ 4 ve `steps` haritasında HealthGoalsMacros/HealthGoalsMicros adımı yok
- Onboarding akışı localhost:8081'de baştan sona tamamlanıp dashboard'a ulaşır (takılan adım yok)
- Tamamlanan profilde dietary_preferences, dietaryRestrictions, cuisinePreferences DB'ye yazılır (boş değilse)
- meal-generate'e giden prompt metninde seçili dietary/cuisine değerleri ve allergens "HARD CONSTRAINT" olarak yer alır (log/inspect ile görünür)
- Seçili bir alerjen içeren tarif üretilmez (1 örnek üzerinde doğrulanır)
- `grep -n "comingSoon" app/(protected)/ai-meal-plan.tsx` boş döner
- Haftalık görünüm 7 günlük, Aylık görünüm ~30 günlük üretilmiş plan gösterir (placeholder değil)
- Haftalık/aylık üretimde meal-plan-quota gate çalışır (kota bitince MealPlanQuotaError, üretim durur)
- `grep -rn "My Cookbooks\|All Recipes\|New cookbook" components/library/LibraryMain.tsx` boş döner (i18n'e taşınmış)
- LibraryMain.tsx statik `colors.` import yerine `useTheme()` kullanır; tsc yeni hata yok

## Verification
- `cd ~/projects/ppv3 && npx tsc --noEmit` → yeni hata yok
- `grep -n "TOTAL_STEPS\|HealthGoalsMacros\|HealthGoalsMicros" app/(auth)/onboarding.tsx` → klinik adımlar yok, TOTAL_STEPS ≤4
- `grep -n "comingSoon" app/(protected)/ai-meal-plan.tsx` → boş
- `grep -rn "My Cookbooks\|All Recipes\|New cookbook\|Import from" components/library/LibraryMain.tsx` → boş (i18n)
- CloakBrowser localhost:8081: yeni hesap → onboarding ≤4 adım → dashboard; ai-meal-plan → Haftalık sekmesi → 7 gün plan; Aylık → 30 gün plan; Library → tokenlı tipografi + TR string
- meal-generate prompt'unu inspect et (edge fn log veya client console): dietary/cuisine/allergens prompt'ta görünür

## Turn Budget
Stop after 55 turns, or sooner once the DoD condition holds.

## References
- app/(auth)/onboarding.tsx (steps haritası 98-108, profil insert 174-177)
- components/onboarding/OnboardingLists.tsx (HealthGoalsMacros/Micros/Allergens/Dietary/Cuisine)
- app/(protected)/ai-meal-plan.tsx (VIEW_MODES 443, comingSoon 1435-1463)
- lib/meal-plan/enhanced-ai-generation.ts (generateEnhancedMealPlan + MealPlanQuotaError)
- lib/meal-plan/api-clients/ai-generation.ts (dietary 548, restrictions 897, getCalorieTarget 590)
- components/library/LibraryMain.tsx (recipes.tsx ile karşılaştır)

## Risks / Open Questions
- Aylık 30 gün üretim = 30 ardışık LLM çağrısı; süre/timeout ve kota sayımı net tanımlanmalı (öneri: aylık üretim tek ai_meal_plan ünitesi sayılsın ama arkada batch'le). /goal bu kararı verirken kota mantığını bozmamalı.
- Onboarding adım konsolidasyonu i18n step{N} anahtarlarını kaydırır; eski/yeni anahtar uyumsuzluğu boş başlık riskine yol açar — tüm step{N}Kicker/Title yeni sıraya göre güncellenmeli.
- health_goals_macros/micros artık toplanmıyor; bu alanı okuyan başka ekran varsa null guard gerekir (kontrol et).

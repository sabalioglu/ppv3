# Stovd (ppv3) — CHECKPOINT · 2026-06-05

Master plan (`new-dazzling-cocke.md`, Phase 0–6) + bugünkü A/B planı (`stovd-launch-prep-ab_2026-06-05.md`) birleşik durum.
Commit hattı: `95b56a1` → `b099cb2`(Modal) → `fc4fd40`(A+B6) → `a9d92c3`(B5) → `4bcdfc5`(reformat). Branch main, hepsi push'lu.

---

## 1) MASTER PLAN (Phase 0–6) — genel durum

- [x] **Phase 0 — Bootstrap & güvenlik** (key rotate, hardcoded fallback temizliği, repo, EAS bağ)
- [x] **Phase 1 — Edge fn temizliği + model modernizasyon + auth** (IDOR fix, Gemini 2.5, hardcoded anon key çıkar)
- [x] **Phase 2 — Backend freemium entitlement** (user_entitlements, usage_counters, meter, revenuecat-webhook)
- [ ] **Phase 3 — RevenueCat paywall (client) + gating** ← $15/ay, react-native-purchases, paywall ekranı, MealPlanQuotaError→paywall UI  (C grubu, ERTELENDİ)
- [~] **Phase 4 — Full redesign** ← bugün kısmen ilerledi (aşağıda); kalanı diğer ekranlar + settings stub'ları + ölü kod
- [ ] **Phase 5 — Auth & store uyumu** ← Apple Sign-In UI, hesap silme, Privacy/Terms/Data-deletion URL (store ZORUNLU blocker)
- [ ] **Phase 6 — Build & submit** ← eas.json, secrets, iOS .ipa + Android .aab, submit, web Netlify

---

## 2) BUGÜNKÜ PLAN (A/B) — örtüşme: Phase 4'ün bir dilimi

### ✅ TAMAMLANAN
- [x] **A — Onboarding 8→4 adım** (klinik HealthGoals Macros/Micros silindi; basic+physical / diet+cuisine birleşti; i18n step başlıkları EN+TR; AuthContext completeness `health_goals_macros` bağımlılığı kaldırıldı → onboarding loop riski kapandı)
- [x] **A — Diyet/alerjen → prompt fix** (BUG bulundu: alerjenler `dietary_restrictions`'a yazılıyordu ama üretim `userProfile.allergens` okuyordu → prompt'a hiç gitmiyordu. Fallback + prompt'a "USER PERSONAL CONSTRAINTS" bloğu: alerjen HARD CONSTRAINT + diyet + mutfak)
- [x] **B6 — Library tutarlılık** (yeni `library` i18n namespace EN+TR; görünen string'ler t()'ye; 35 hardcoded Poppins/SF-Pro → brand token Fraunces+Inter; "My Cookbooks/All Recipes/New cookbook" sabit string 0) — **CloakBrowser görsel doğrulandı**
- [x] **B5 — Haftalık (7g) + Aylık (30g iskelet)** (yeni izole `multi-day-generation.ts`, meal-generate üzerine; comingSoon kaldırıldı; "Planı yenile" regenerate butonu var; quota gate; alerjen+diyet prompt'ta) — **CloakBrowser dolu kartlar screenshot'landı**
- [x] **tsc** — yeni hata 0 (353 pre-existing, hiçbiri bizim kodda değil)
- [x] **Modal video motoru** (önceki: IG/TikTok/büyük video, creative-cloner'a dokunulmadan izole `stovd-video-analyze`)

### ⚠️ AÇIK (kod doğru, sadece görsel/garanti eksik)
- [ ] Onboarding 4-adım **akış screenshot'ı** — onboarded user `/`'e redirect ediyor; taze hesap email-onay'a takılı. Kod `TOTAL_STEPS=4` doğrulandı.
- [ ] **Canlı alerjen-kaçınma kanıtı** — diyet/alerjen prompt'a giriyor (kod ok) ama "profile X alerjeni koy → tarif X içermiyor" canlı testi çekilmedi (demo profilde alerjen seçili değil)

---

## 3) SIRADAKİ İŞLEMLER (öncelik sırası önerisi)

### Yakın — bugünkü işin doğal devamı
1. [ ] **Gün-bazlı regenerate** (weekly/monthly tek günü yenile — tüm-plan "Planı yenile" zaten var)
2. [ ] **Variety hard-guarantee** (post-check: aynı ana protein 7 günde >2 → o günü yeniden ürettir; "5 somon" sorununa sert garanti)
3. [ ] **Daily view'ı holistik mantığa çekme** (eski enhanced-diversity pipeline; salmon sorunu oradaydı)

### RAG (ayrı not: `project_stovd_rag_expansion`)
4. [ ] **Corpus genişletme** — şu an 265 (TheMealDB, %100 embedding'li). Açık kaynak + **food.com** + Wikibooks/OpenFoodFacts → bin+ tarif
5. [ ] **Kullanıcı tarifleri RAG'i beslesin — MUST HAVE** (eklenen/import edilen her tarif `recipe_corpus`'a embedding'lenip eklensin → community flywheel)
6. [ ] **Weekly'ye RAG bağlama** (gün başına aday tarif retrieve → LLM assemble; aylık iskelet prompt-gen kalsın)

### Master plan kalan blokları
7. [ ] **Phase 3 — Paywall** ($15/ay RevenueCat + gating + MealPlanQuotaError→paywall UI)
8. [ ] **Phase 4 kalanı** — diğer ekran redesign, settings 6 "coming soon" stub, ölü kod (`screens/*.backup`, VideoExtractor, orphan profile route)
9. [ ] **Phase 5 — Store uyumu** (Apple Sign-In UI, hesap silme akışı, Privacy/Terms/Data-deletion URL) ← submit blocker
10. [ ] **Phase 6 — Build & submit** (eas.json profilleri, EAS secrets `printf`, iOS+Android build+submit, web Netlify)

### Açık kararlar
- [ ] `cultural-meal-ai` (mock) ürün kapsamında kalacak mı / silinecek mi
- [ ] Final app ismi/bundle ("Smart Pantry" vs "PantryPal" vs "Stovd"/`com.pantrypal.app`)
- [ ] Stovd-markalı email domain (şu an mail.agentized.io)

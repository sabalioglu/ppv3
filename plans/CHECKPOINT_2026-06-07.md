# Stovd (ppv3) — CHECKPOINT · 2026-06-07

Devam noktası. Branch `main`, her şey push'lu (son commit `7414600`). Ayrı branch YOK — tüm iş main'de, merge gereği yok. Netlify `pantry-pal.app` main'e bağlı (otomatik deploy).

---

## ✅ BU OTURUMDA BİTEN (hepsi canlı)

- **Paywall (Phase 3 client)** — `lib/purchases.ts` (web no-op RC wrapper), `hooks/useEntitlement.ts`, `app/(protected)/paywall.tsx`, AuthContext RC lifecycle, ai-meal-plan free-quota→`/paywall`. `react-native-purchases ^10`. *(RC dashboard + key + store ürünü KULLANICIDA.)*
- **RAG kullanıcı-tarifi besleme** — `_shared/embed.ts` `feedCorpus()`; `recipe-from-url` + `video-intelligence` **DEPLOY EDİLDİ** → importlar artık `recipe_corpus`'u canlı besliyor (community flywheel).
- **Legal sayfalar** — `public/{privacy,terms,data-deletion}.html` + `_redirects` + settings Privacy linki. (`LEGAL_BASE=https://stovd.app`, contact `support@stovd.app`.)
- **Apple Sign-In — TAM KURULDU + TEST GEÇTİ** (CloakBrowser ile):
  - App ID `com.stovd.app` (Sign in with Apple, primary) · Services ID `com.stovd.signin` · Key `NXSH8YSD7G` · Team `H538J4QRR4`
  - Supabase Apple provider ENABLED (Client IDs `com.stovd.signin,com.stovd.app` + ES256 JWT secret)
  - .p8 yedek: `~/stovd-apple-signin/`. **⚠️ JWT exp 2026-12-04 — yenile** (komut: [[reference_stovd_apple_signin]])
  - Buton **web+mobil** ikisinde (login+signup), iOS gate kaldırıldı.
- **Logout web fix** — RN `Alert.alert` callback web'de ölü → `window.confirm`. (Aynı bug başka confirm'lerde de var: ai-meal-plan regenerate-all vs.)
- **Hesap silme (Phase 5, 5.1.1 ZORUNLU)** — `delete-account` edge fn **DEPLOY EDİLDİ** (best-effort tablo wipe + `admin.deleteUser`) + settings Danger Zone "Hesabı sil" (web-safe confirm).

**Phase 5 store-blocker'ları (Apple Sign-In + hesap silme + legal) = BİTTİ.**

---

## ⏭️ SIRADAKİ OTONOM PLAN (deploy gerektirmeyen, lokal test edilir)

1. **Variety hard-guarantee** — `lib/meal-plan/multi-day-generation.ts`: haftalık planda aynı ana protein >2 gün çıkarsa o günü yeniden ürettir (post-check + 1 retry). "1 günde 5 somon" sorununa sert garanti. Lokal CloakBrowser test.
2. **AuthContext `setTimeout(1000)` fix** — `contexts/AuthContext.tsx` kırılgan gecikmeleri sağlam state mantığıyla değiştir (login sonrası yarış/loop riski azalır).
3. **Phase 4 ölü kod temizliği** — import-grep ile doğrula sonra sil: `screens/*.backup`, boş `VideoExtractor.tsx`, `lib/errorHandler`, orphan `profile` route, `lib/openai*`/`lib/llm` kalıntıları.
4. **Manuel tarif → corpus backfill** — elle eklenen tarifler (direkt client→user_recipes) henüz corpus'a gitmiyor (gte-small embed sadece edge'de çalışır). Trigger+cron veya `corpus-backfill` edge fn. *(Deploy gerekir.)*
5. **Gün-bazlı regenerate** — weekly/monthly tek günü yenile (tüm-plan "Planı yenile" zaten var).
6. **RN-web Alert.alert genel fix** — kalan multi-button confirm'leri (regenerate-all vb.) web-safe yap.

## 👤 KULLANICI TARAFI BEKLEYEN (otonom yapılamaz)
- RevenueCat dashboard + public SDK key + App Store Connect/Play subscription ürünü ($15/ay) → paywall canlı test (dev client/prebuild)
- TR DID (Telnyx) — pilot voice (ayrı proje, ilgisiz)
- EAS build + iOS/Android submit (Phase 6): eas.json profilleri, secrets `printf`, `eas build`/`eas submit`

## Açık kararlar
- `cultural-meal-ai` (mock) kapsamda mı
- Final email domain (mail.agentized.io → stovd-markalı?)

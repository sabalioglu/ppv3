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

## ✅ 2026-06-07 GEÇ OTURUM — bitenler (hepsi push'lu)

- **(item 6) Manuel tarif → corpus backfill** — `corpus-backfill` edge fn **DEPLOY EDİLDİ** (self-auth JWT, idempotent owner+title dedupe). Recipes sekmesi session başına bir kez fire-and-forget tetikler. `8e6519b`.
- **(item 1) Variety hard-guarantee** — `multi-day-generation.ts`: haftalık planda aynı ana protein >2 akşam yemeği → kota harcamadan düzeltici tek retry ile o günleri yeniden ürettir (best-effort, fail→orijinal plan). Aylık iskelet etkilenmez. `122c47a`.
- **(item 2) AuthContext gecikme fix** — yapay 1s `init` delay silindi; `onAuthStateChange` session'ı senkron set edip kalan supabase çağrılarını `setTimeout(0)` ile erteliyor (1000→0). `d1fdc9b`.
- **(item 3) Ölü kod temizliği** — `lib/llm` (createLLM, 0 importer) silindi. `screens/*.backup`, `VideoExtractor`, `errorHandler`, profile route ZATEN yoktu. `lib/openaiVisionService.ts` camera.tsx kullanıyor → KORUNDU. `bf44aae`.

## ⏭️ KALAN OTONOM (deploy gerektirmeyen)

5. **Gün-bazlı regenerate** — weekly/monthly tek günü yenile (tüm-plan "Planı yenile" zaten var).
6. **RN-web Alert.alert genel fix** — kalan multi-button confirm'leri (regenerate-all vb.) web-safe yap.

## 👤 KULLANICI TARAFI BEKLEYEN (otonom yapılamaz)
- RevenueCat dashboard + public SDK key + App Store Connect/Play subscription ürünü ($15/ay) → paywall canlı test (dev client/prebuild)
- TR DID (Telnyx) — pilot voice (ayrı proje, ilgisiz)
- EAS build + iOS/Android submit (Phase 6): eas.json profilleri, secrets `printf`, `eas build`/`eas submit`

## Açık kararlar
- `cultural-meal-ai` (mock) kapsamda mı
- Final email domain (mail.agentized.io → stovd-markalı?)

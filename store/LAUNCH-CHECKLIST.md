# Stovd — Launch Checklist (iOS App Store + Google Play)

## TL;DR durum (Türkçe, 4-5 satır)
Stovd henüz **submit edilemez durumda**: 17 adet **blocker** var (kod/config + senin hesap/asset/key işlerin karışık). En kritik kod/config sorunları: Android `applicationId`/`namespace`/`app_name`/`scheme` hepsi BAYAT (`com.aifoodpantry.app` / "Smart Pantry" / `aifoodpantry` → `com.stovd.app` / Stovd / stovd), checked-in `ios/android` dizinleri config'ten **drift etmiş** (RevenueCat pod yok, Apple Sign-In entitlement BOŞ, AdMob `GADApplicationIdentifier` Info.plist'te YOK → iOS launch crash), `eas.json` iOS profili/submit config yok + `buildType:"aab"` GEÇERSİZ. Yeni audit'lerden iki büyük **review-compliance blocker** çıktı: (1) recipe detail'deki birincil **"Start Cooking" CTA** meal-plan dışı tariflerde sadece "Coming Soon" alert açıyor (Guideline 2.1 red sebebi), (2) **RevenueCat `appl_`/`goog_` SDK key'leri ve webhook secret eksik** → paywall planları boş, abonelik fiilen satılamıyor. Listeleme metinleri + App Privacy + Data Safety + screenshot planı **HAZIR** (6 store/*.md). Claude kod/config + native fix + prebuild'i tek seferde halleder; sen Apple/Google hesap adımlarını, RC/Gemini key'lerini ve görselleri sağlamalısın.

---

## 🔴 BLOCKERS — bunlar olmadan submit reddedilir/imkansız

| # | Platform | Item | Owner | Fix |
|---|----------|------|-------|-----|
| B1 | both | EAS projesi bağlı değil (`extra.eas.projectId` + `expo.owner` YOK) | Sen (sonra Claude pre-stage) | `eas login` → `eas init` çalıştır → `app.config.js`'e UUID + owner otomatik yazılır. UUID'yi uydurma. |
| B2 | iOS | `eas.json`'da iOS build profili yok → App Store .ipa üretilemez | Claude | `eas.json`'a her profile `ios` bloğu ekle (`production.ios.distribution: "store"`, `preview.ios.distribution: "internal", simulator: false`). |
| B3 | iOS | App Store Connect submit config yok (`ascAppId`/`ascApiKey`/`appleTeamId`) | Sen + Claude | Sen: ASC API key (.p8) + ascAppId + Team ID üret. Claude: `submit.production.ios` bloğunu `eas.json`'a ekle. |
| B4 | Android | Google Play submit config yok (`serviceAccountKeyPath`/`track`) | Sen + Claude | Sen: Play Console service-account JSON üret. Claude: `submit.production.android` + `track: "internal"` ekle. |
| B5 | Android | Native `applicationId` + `namespace` = `com.aifoodpantry.app` ama config = `com.stovd.app` (DOĞRULANDI: build.gradle:90,92; Kotlin `package com.aifoodpantry.app` MainApplication.kt:1 / MainActivity.kt:1 + dizin yolu eski) | Claude | `expo prebuild --clean --platform android` (tercih) → config'ten regenere. Manuel: build.gradle:90,92 → `com.stovd.app`, Kotlin'leri `java/com/stovd/app/`'a taşı + `package` satırlarını düzelt. Play listing applicationId'e KALICI bağlanır — yanlış id ile yayınlanırsa Stovd kimliği o listingde geri alınamaz. |
| B6 | both | AdMob SDK Android'de kurulu değil (`react-native-google-mobile-ads` package.json'da YOK — DOĞRULANDI) → rewarded ads sessizce no-op, quota bonus path ÖLÜ; AD_ID permission + APPLICATION_ID meta-data manifest'te yok | Claude + Sen | Ads Android'de kalacaksa: `npx expo install react-native-google-mobile-ads` → plugins[]'e ekle → `expo prebuild --clean` (AD_ID otomatik merge olur) + Sen: gerçek Android AdMob app/unit + `EXPO_PUBLIC_ADMOB_*` + Play Data Safety'de Advertising ID beyan. Ads sadece iOS olacaksa: Android admob key/config'lerini KALDIR. |
| B7 | both | Checked-in `ios/android` BAYAT: RevenueCat pod Podfile.lock'ta YOK (DOĞRULANDI: grep=0) → `Purchases.configure()` runtime'da patlar; ayrıca ios/ snapshot'ı AdMob + Apple-auth config'lerinden geride (drift, B5-B11'in upstream sebebi) | Claude | Tek source of truth seç. Tercih: tracked `ios/`+`android/`'ı SİL + `.gitignore`'a ekle + CI'de `expo prebuild`. Veya bare workflow için bir kez `prebuild --clean` + commit. Doğrula: Podfile.lock'ta `RevenueCat`/`PurchasesHybridCommon`; Info.plist'te `GADApplicationIdentifier`+`ITSAppUsesNonExemptEncryption`; entitlements'ta `applesignin`. |
| B8 | iOS | **Sign in with Apple entitlement EKSİK** — `ios/Stovd/Stovd.entitlements` BOŞ `<dict/>` (182 byte, DOĞRULANDI), `com.apple.developer.applesignin` yok ama `app.config.js:17 usesAppleSignIn:true` + pbxproj CODE_SIGN_ENTITLEMENTS bu boş dosyayı kullanıyor → Apple-auth runtime'da fail (Guideline 4.8) | Claude + Sen | `expo prebuild -p ios --clean` → entitlement otomatik yazılır + commit. Bare tutuluyorsa manuel `com.apple.developer.applesignin` key'i ekle + Apple Developer portal'da App ID'ye Sign In with Apple capability'sini AÇ. (Supabase Apple provider + Services ID com.stovd.signin + key NXSH8YSD7G zaten hazır.) |
| B9 | iOS | **AdMob `GADApplicationIdentifier` Info.plist'te YOK → garantili launch crash** — AdMob aktif (app.config.js:80-87 iosAppId + lib/ads.ts initialize()), Google Mobile Ads SDK bu key yoksa açılışta hard-crash; `SKAdNetworkItems` de yok (DOĞRULANDI grep=0). Committed Info.plist AdMob entegrasyonundan önce | Claude + Sen | `react-native-google-mobile-ads` config plugin'ini app.config.js plugins[]'e ekle (GADApplicationIdentifier + SKAdNetworkItems otomatik enjekte) → `expo prebuild -p ios --clean`. Doğrula: Info.plist'te GADApplicationIdentifier == iosAppId + dolu SKAdNetworkItems. Elle app id yapıştırma. |
| B10 | both | **"Start Cooking" birincil CTA meal-plan dışı tariflerde sadece "Coming Soon" alert açıyor** (recipe/[id].tsx:1465-1470 prominent primary button → handleCookNow:851-856 sadece `Alert.alert('Coming Soon! 👨‍🍳', ...)`). Recipe detail core surface; Guideline 2.1 "coming soon"/işlevsiz buton reddi neredeyse kesin | Claude | Ya minimal interactive cooking mode implement et (mevcut recipe.instructions'tan step-by-step modal), YA DA meal-plan dışı tariflerde butonu çalışan bir aksiyona relabel et (örn. "Malzemeleri alışveriş listesine ekle" / "I made this" logging) ve Coming Soon alert'i kaldır. ai-meal-plan.tsx:1 başlığındaki bayat "(Coming Soon Version)" yorumunu da düzelt (weekly/monthly artık tam wired). handleShare:858 / handleEdit:865 dead code (hiçbir onPress'e bağlı değil) — kullanıcıya görünmez, bırakmak güvenli. |
| B11 | Android | **Bayat Android `app_name`="Smart Pantry" + deep-link scheme="aifoodpantry"** (strings.xml + AndroidManifest.xml:29; config name=Stovd, scheme=stovd). Manifest'te stovd auth/callback intentFilter YOK → `stovd://auth/callback` OAuth/Apple redirect shipped build'de resolve OLMAZ + launcher label yanlış | Claude | `expo prebuild --clean` (ikisini de config'ten çözer). Manuel: strings.xml app_name → Stovd; manifest data scheme aifoodpantry → stovd auth/callback filter. |
| B12 | both | **RevenueCat SDK key'leri `.env`'de YOK → native paywall disabled ship** — `.env` sadece SUPABASE_URL/ANON_KEY içeriyor; `EXPO_PUBLIC_RC_IOS_KEY`/`RC_ANDROID_KEY` yok → `getOfferingPackages()` `[]` döner, paywall plan göstermez, `purchase()` no-op → kullanıcı fiziksel olarak abone OLAMAZ (= fonksiyonel hata + 2.1/3.1 red). RC config app start'ta doğru wire (AuthContext.tsx:64/67/86) — sadece key eksik | Sen | RevenueCat dashboard (project 2f3bf734) iOS `appl_` + Android `goog_` public SDK key'lerini al → `EXPO_PUBLIC_RC_IOS_KEY`/`EXPO_PUBLIC_RC_ANDROID_KEY` EAS env (+ local .env dev için). Bunlar public bundle key, secret değil. (Memory: appl_/goog_ key'ler hâlâ store-credential setup bekliyor — store launch'ı gate eden item.) |
| B13 | both | **Supabase secret `REVENUECAT_WEBHOOK_SECRET` set değilse her webhook 401** (revenuecat-webhook/index.ts: secret unset → authOk() false). is_premium asla yazılmaz → ödeme yapan kullanıcı un-entitled kalır | Sen | `supabase secrets set REVENUECAT_WEBHOOK_SECRET=<value>` (değer memory secret_revenuecat_webhook_secret.md'de var) + aynı string'i RC dashboard Integrations → Webhooks Authorization header'a yapıştır. RC test event gönder, user_entitlements upsert doğrula. |
| B14 | Android | `eas.json:10` `production.android.buildType="aab"` GEÇERSİZ (EAS sadece `app-bundle`\|`apk` kabul eder) → schema red veya non-AAB artifact; Play yeni upload için AAB ister | Claude | `eas.json:10` `"buildType": "aab"` → `"buildType": "app-bundle"`. `preview.android.buildType="apk"` internal test için kalsın. |
| B15 | Android | Adaptive icon foreground EKSİK (sadece backgroundColor; `mipmap-anydpi-v26/` + foreground drawable YOK — DOĞRULANDI) → Play letterbox/blank tile | Sen + Claude | Sen: 1024x1024 transparan foreground PNG (logo ~%66 safe zone, `./assets/images/adaptive-icon.png`). Claude: `android.adaptiveIcon.foregroundImage` ekle + `expo prebuild --clean`. |
| B16 | Android | Play feature graphic (1024x500, alpha YOK) zorunlu ve eksik | Sen | 1024x500 brand görseli tasarla → `store/android/feature-graphic.png`. |
| B17 | both | Store screenshot'ları yok: iOS 6.9"/6.7" (1290x2796, min 1) + Play phone (1080x1920+, min 2) | Sen | iPhone 16 Pro Max simulator (6.9") + Android emulator'da çek (kamera/pantry/recipe/scan ekranları). Detay: `store/screenshots-and-assets-plan.md`. **iPad uyarısı:** `supportsTablet:true` → ASC ≥1 iPad screenshot seti ister; ya iPad çek ya da build öncesi `supportsTablet:false` yap. |

---

## 🟠 iOS App Store — kalan işler

### Claude yapabilir (kod/config)
- [ ] **`eas.json` iOS build profili** (B2): `production.ios = { "distribution": "store" }`, `preview.ios = { "distribution": "internal", "simulator": false }`.
- [ ] **`eas.json` submit.production.ios** (B3): `{ "appleId", "ascAppId", "appleTeamId", "ascApiKeyPath": "./asc-api-key.p8", "ascApiKeyIssuerId", "ascApiKeyId" }` — sen değerleri verince doldurur.
- [ ] **Version stratejisi** (B7/high): `eas.json`'a `"cli": { "version": ">= 20.0.0", "appVersionSource": "remote" }` + `production.autoIncrement: true`. EAS buildNumber'ı sunucuda bump eder; marketing `version` 1.0.0 `app.config.js`'de kalır. `eas build:version:set` ile bir kez seed et.
- [ ] **"Start Cooking" CTA fix** (B10): meal-plan dışı tariflerde Coming Soon alert'i kaldır — ya interactive cooking modal implement et ya da çalışan aksiyona relabel et (recipe/[id].tsx:851-856,1465-1470). ai-meal-plan.tsx:1 başlık yorumunu da güncelle.
- [ ] **Apple Sign-In native + iOS gate** (high — login.tsx:110-124 / signup.tsx:104-118 web OAuth flow kullanıyor, native değil; @invertase/react-native-apple-authentication ^2.3.0 package.json:26'da ama hiç import edilmemiş; AppleButton her iki platformda koşulsuz render — Platform.OS gate yok): iOS'ta native `appleAuth`'tan identityToken al → `supabase.auth.signInWithIdToken({ provider:'apple', token })`. AppleButton'ı `Platform.OS === 'ios'` ile gate et (login.tsx:193 / signup.tsx:179).
- [ ] **Apple Sign-In entitlement** (B8 — entitlements BOŞ, DOĞRULANDI): `expo prebuild --clean` → `ios/Stovd/Stovd.entitlements`'a `com.apple.developer.applesignin` gelir.
- [ ] **AdMob Info.plist keys** (B9): `react-native-google-mobile-ads` config plugin'ini app.config.js plugins[]'e ekle → prebuild → `GADApplicationIdentifier` + `SKAdNetworkItems` Info.plist'e gelir.
- [ ] **Paywall Terms/Privacy linkleri + per-package billing period** (high — paywall.tsx Terms/EULA + Privacy link RENDER ETMİYOR, Guideline 3.1.2 ister; billing period plan başına gösterilmiyor — `perMonth '/mo'` string'i hiç render edilmiyor): tappable `Linking.openURL(`${LEGAL_BASE}/terms`)` + `/privacy` ekle (LEGAL_BASE='https://stovd.app', settings.tsx:16,365 pattern'i). Her planCard'a Monthly/Yearly/Lifetime period label ekle (RC package.packageType / subscriptionPeriod'tan türet, purchases.ts getOfferingPackages). Mevcut auto-renew disclosure compliant, kalsın. **Sen:** Terms sayfasının subscription EULA terimlerini (uzunluk, fiyat, yenileme, iptal) kapsadığını onayla.
- [ ] **ATT (App Tracking Transparency)** (high — `expo-tracking-transparency` YOK, `NSUserTrackingUsageDescription` yok, PrivacyInfo.xcprivacy `NSPrivacyTracking=false` — DOĞRULANDI): AdMob default'u personalized ads = tracking → ATT prompt + usage string ZORUNLU. Karar ver: personalized ads ise `npx expo install expo-tracking-transparency` + NSUserTrackingUsageDescription + `NSPrivacyTracking=true` + NSPrivacyTrackingDomains + ATT'yi initAds() öncesi çağır + App Privacy label güncelle. Non-personalized only ise AdMob `requestNonPersonalizedAdsOnly` configure et + dokümante et → NSPrivacyTracking=false defanse edilebilir. → `expo prebuild --clean`.
- [ ] **`ITSAppUsesNonExemptEncryption: false`** (medium — Info.plist'te ve app.config.js'de YOK, DOĞRULANDI grep=0 → her TestFlight upload'ında export-compliance sorusu çıkar, build testçilere geçmez): app.config.js `ios.infoPlist`'e ekle (standart HTTPS/TLS için doğru) → re-prebuild.
- [ ] **Splash plugin** (high — `expo-splash-screen` deps'te ama plugins[]'te YOK): `['expo-splash-screen', { image, imageWidth: 200, resizeMode: 'contain', backgroundColor: '#ffffff', dark: {...} }]` ekle (kare splash görseli senden).
- [ ] **`expo prebuild --clean` tek sefer** (B6/B7/B8/B9/high): ads SDK + RC pod + Apple entitlement + ATT keys + GADApplicationIdentifier + ITSAppUsesNonExemptEncryption'ı tek hamlede resync eder, sonra commit.

### Sen yapmalısın (hesap/anlaşma/upload)
- [ ] **Apple Developer Program** ($99/yıl) aktif + **Paid Apps Agreement** (Agreements, Tax, and Banking) **'Active'** + tax/banking formları tam (medium — koddan doğrulanamaz, DEĞİLSE IAP ürünleri review'da yok → paywall boş → 2.1/3.1 red). Subscription ürünlerinin 'Ready to Submit' + bu version'a attached olduğunu doğrula.
- [ ] **App Store Connect'te app record** oluştur → numeric **ascAppId** + bundle `com.stovd.app` eşle.
- [ ] **ASC API Key (.p8)**: Users and Access → Integrations → Key ID + Issuer ID + indir, repo köküne `asc-api-key.p8` koy (.gitignore `*.p8` zaten kapsıyor).
- [ ] **Apple Team ID** (TEAMID) — Membership sayfasından.
- [ ] **RevenueCat `appl_` SDK key** (B12) → `EXPO_PUBLIC_RC_IOS_KEY` EAS env. appl_ key gerçek değilse paywall boş = red.
- [ ] **ASC'de auto-renewable subscription ürünleri** oluştur + RevenueCat'e bağla (project 2f3bf734, entitlement 'premium', Monthly/Yearly/Lifetime offering) + build'le ilişkilendir.
- [ ] **iOS'ta Stripe gate doğrula** (low/caveat — settings.tsx '/subscription' & 'Go Premium' iOS'ta Stripe web checkout AÇMAMALI, sadece RC paywall; Stripe ile dijital abonelik satışı 3.1.1 ihlali). Paywall web no-op gated görünüyor ama iOS'ta /subscription'ın RC paywall'a gittiğini doğrula.
- [ ] **6.9"/6.7" screenshot'lar** (B17): 1290x2796, min 1 / önerilen 3-5 (kamera, pantry, recipe, scan). iPad seti kararı (supportsTablet).
- [ ] **`eas login`** + B1'deki `eas init`.
- [ ] **App Store Connect form**: kategori (Food & Drink / Health & Fitness), 4+ yaş, **App Privacy nutrition label** (`store/app-store-app-privacy.md`'den — ATT consequence dahil, IDFA → Tracking=YES), reviewer demo hesabı, Description/Keywords/Promo (HAZIR metinden kopyala).
- [ ] **Privacy/Terms/Data-deletion URL'leri** HTTPS'te yayında: `https://stovd.app/{privacy,terms,data-deletion}` + support@stovd.app çalışıyor. (DOĞRULANDI: public/privacy.html 81 satır, terms.html 76, data-deletion.html 54, _redirects 200 map — content gerçek. **Privacy policy'ye AdMob/advertising identifier EKLE** — rewarded ads ship ediyorsa şu an policy'de AdMob YOK.)

### ✅ iOS PASS (audit doğruladı, aksiyon yok / minimal)
- [ ] **Account deletion** (5.1.1(v)) — PASS. settings.tsx:135-166 → delete-account edge fn (Auth header + self-verify + 11 tablo + recipe_corpus + admin.deleteUser + 500-on-failure), public/data-deletion.html (in-app + email support@stovd.app 30-gün). Opsiyonel: 500 dönerse distinct error toast.
- [ ] **IAP via RevenueCat + Restore + auto-renew disclosure** (3.1.1/3.1.2) — PASS (key gate B12 hariç). purchases.ts react-native-purchases native, web no-op (Stripe path), Restore button paywall.tsx:186-190 → restorePurchases, auto-renew sentence mevcut, iOS purchasePackage gerçek StoreKit IAP.
- [ ] **Privacy/Terms/Data-deletion content** — PASS. Gerçek app-specific içerik + AI-not-medical-advice disclaimer + processor disclosure (Apple/Google/Supabase/RevenueCat). Last updated 5 Haz 2026, App Privacy label'la eşleştiğini doğrula.
- [ ] **PrivacyInfo.xcprivacy** — PASS (brief'teki "missing" varsayımı YANLIŞ; mevcut + pbxproj'de registered, required-reason API manifest tatmin). Sadece ads tracking model'i kesinleşince NSPrivacyTracking revisit.
- [ ] **Camera/Photo/Microphone usage strings + iOS 15.1 target** — PASS (Info.plist:55-60 mevcut; pbxproj IPHONEOS_DEPLOYMENT_TARGET=15.1 kazanır; bundle com.stovd.app tutarlı). Opsiyonel: usage string'leri spesifikleştir; LSMinimumSystemVersion 12.0'ı 15.1'e hizala.

---

## 🟢 Google Play — kalan işler

### Claude yapabilir (kod/config + listeleme dosyaları HAZIR)
- [ ] **Android `applicationId`/`namespace`/`app_name`/`scheme` fix** (B5+B11): `expo prebuild --clean --platform android` ile config'ten regenere (tercih), veya manuel build.gradle:90,92 + Kotlin paket taşıma + strings.xml + manifest intentFilter.
- [ ] **`eas.json` production android `buildType`** (B14): `"aab"` GEÇERSİZ → `"app-bundle"` yap (geçerli değerler: `apk` | `app-bundle`).
- [ ] **`eas.json` submit.production.android** (B4): `{ "serviceAccountKeyPath": "./play-service-account.json", "track": "internal" }`.
- [ ] **`.gitignore`** (medium): `play-service-account.json` satırı ekle — mevcut `.gitignore` `*.p8/*.p12/*.key`'i kapsıyor ama service-account `.json`'u KAPSAMIYOR (DOĞRULANDI).
- [ ] **Adaptive icon foreground** (B15): foreground PNG geldikten sonra `android.adaptiveIcon.foregroundImage` set et + `expo prebuild`.
- [ ] **AdMob Android SDK** (B6): ads Android'de kalacaksa `npx expo install react-native-google-mobile-ads` + plugins[] + prebuild (AD_ID otomatik merge). iOS-only ise Android admob root config/key'lerini kaldır.
- [ ] **`autoVerify` temizliği** (medium — app.config.js:32-44 custom scheme `stovd` üstünde `autoVerify:true` ama assetlinks.json yok → no-op/yanıltıcı): sadece stovd:// OAuth callback gerekliyse `autoVerify`'ı kaldır/false. Gerçek https App Link isteniyorsa https host intentFilter + Play App Signing SHA-256 ile assetlinks.json host et.
- [ ] **`targetSdk` doğrulama** (medium — build.gradle:88,93,94 rootProject.ext.* okur, expo-build-properties ile pin yok; Expo SDK 54 default targetSdk 35 = Play 2025 gereği, muhtemel uyumlu ama implicit): `prebuild --clean` sonrası targetSdk/compileSdk 35 + minSdk 24 doğrula. Garanti için expo-build-properties plugin ekle.
- [ ] **Broad permission temizliği** (low — AndroidManifest.xml:6 SYSTEM_ALERT_WINDOW + :8 WRITE_EXTERNAL_STORAGE + :4 READ_EXTERNAL_STORAGE stale native'den, pantry app'in ihtiyacını aşıyor): `prebuild --clean` sonrası permission set'i audit et, gereksizleri kaldır (Play sensitive-permission review + ağır Data Safety formundan kaçın).
- [ ] **`cli.appVersionSource: remote` + `autoIncrement`** (iOS ile ortak, versionCode'u EAS bump eder).
- [ ] **Listeleme metinleri**: `store/google-play-listing.md` HAZIR (EN+TR, tüm char limit PASS, Data Safety tablosu dahil).

### Sen yapmalısın
- [ ] **Play Console** ($25 tek seferlik) hesabı aktif.
- [ ] **Service account** (Setup → API access → Google Cloud SA), release izinleri ver, JSON indir → repo köküne `play-service-account.json` (Claude .gitignore'a ekledikten SONRA bırak).
- [ ] **App signing**: Play App Signing enroll (Google key yönetir) — ilk AAB upload'da onayla. **Release keystore uyarısı** (medium — build.gradle:110-113 release `signingConfigs.debug` kullanıyor; debug-signed AAB prod'a kabul edilmez). EAS managed credentials kullan (önerilen); lokal build'de release keystore üret, debug keystore'u asla ship etme.
- [ ] **RevenueCat `goog_` SDK key + Android AdMob env** (B12 + high — `EXPO_PUBLIC_RC_ANDROID_KEY` .env'de yok, react-native-purchases kurulu → Android'de undefined key ile configure, Play Billing fail): RC dashboard'a Google Play app ekle, `goog_` key oluştur, `EXPO_PUBLIC_RC_ANDROID_KEY` set et (.env + EAS), Play Billing wire (service account + in-app products).
- [ ] **Feature graphic** (B16): 1024x500, alpha yok → `store/android/feature-graphic.png`.
- [ ] **Phone screenshot'lar** (B17): min 2, 1080x1920+, emulator/device.
- [ ] **Data Safety form**: `store/google-play-data-safety.md`'den gir (9 per-type kart + console path'leri; tek Shared=Yes → AdMob Advertising ID; encrypted-in-transit Yes, deletion Yes, sold No). **Uyarı:** rewarded ads submit edilen build'de YOKSA Device IDs Shared=No'ya çevir.
- [ ] **Content rating**: `store/content-rating-iarc.md`'deki IARC cevaplarını gir (Alkol=Evet/ingredient-only, UGC=Hayır, unrestricted web=Hayır, IAP+ads=Evet → beklenen Everyone/PEGI 3).
- [ ] **AdMob Android app + rewarded unit**: prod'da hâlâ Google TEST unit kullanılıyor (ca-app-pub-3940256099942544...) — gerçek Android AdMob app'i oluştur, `EXPO_PUBLIC_ADMOB_*` EAS env'lerine gerçek değerleri koy + Play Data Safety'de Advertising ID beyan.

---

## 🟣 Supabase Backend — release readiness

### Sen yapmalısın (secrets/deploy)
- [ ] **`REVENUECAT_WEBHOOK_SECRET`** (B13): Supabase secret set + RC dashboard webhook header'a aynı string.
- [ ] **`GEMINI_API_KEY` + `GROQ_API_KEY`** (high — bu üç core paid feature için ZORUNLU: photo scan, meal plan, recipe import; eksikse 500). Ayrıca `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` (web checkout), `APIFY_TOKEN` (IG import), `FIRECRAWL_API_KEY`, `VIDEO_SVC_SECRET/URL`, `SEED_SECRET`. `supabase secrets set` ile project `mngukcchktjmexinfnib`'e koy + vision-analyze & meal-plan-quota'ya gerçek JWT ile smoke call.
- [ ] **RevenueCat `appl_`/`goog_` SDK key'leri** (B12 — store launch'ı gate eden item).
- [ ] **Edge fn deploy doğrula**: 7 zorunlu fn deployed (delete-account, revenuecat-webhook, admob-ssv, meal-plan-quota, meal-generate, vision-analyze, recipe-from-url) — `revenuecat-webhook` + `admob-ssv` `--no-verify-jwt` ile deploy edilmeli (RC/AdMob unauthenticated çağırır, kendi auth'unu yapar).
- [ ] **admob-ssv SSV callback URL'i** AdMob console'a kayıtlı.

### Product/ops kararı (ship-blocker değil)
- [ ] **Free-tier metering fail-OPEN** (medium — _shared/entitlement.ts checkQuota() infra error'da `{allowed:true}` döner; gemini-2.5-flash paid GA model → transient DB hatası unlimited free call → Gemini/Groq fatura): pilot için fail-open kalsın ama (a) Supabase/Gemini billing budget alert + (b) opsiyonel hard rate-limit ekle. Kod değişikliği şart değil.

### ✅ Backend PASS (audit doğruladı)
- [ ] **7 edge fn + migration envanteri** — PASS (delete-account/revenuecat-webhook/admob-ssv/meal-plan-quota/meal-generate/vision-analyze/recipe-from-url + stripe/recipe-recommend/video-intelligence/corpus/_shared; migration'lar entitlements + ad_quota_bonus). Sadece deploy doğrula.
- [ ] **admob-ssv + delete-account auth** — PASS. admob-ssv Google ECDSA imza doğrular (spoof edilemez, --no-verify-jwt deploy); meal-plan-quota + AI fn'ler Bearer JWT ister; RLS client read'leri caller'a scope eder.
- [ ] **NANO/preview image model riski** — YOK. Aranan 'nano/nano-banana/flash-image/imagen/preview/exp/3.0' = 0 hit; tüm path gemini-2.5-flash (GA) + Groq llama-3.3-70b fallback. Free vs premium farkı sadece call count (20/10/5 vs 600/300/150), model değil. Aksiyon yok.

---

## 📁 Üretilen listeleme dosyaları
- `store/app-store-listing.md` — Apple App Store listing (EN-US + TR), 12/12 char-limit PASS, App Privacy nutrition label, reviewer notes, kategori 4+.
- `store/google-play-listing.md` — Google Play listing (EN-US + TR-TR), tüm char limitler PASS, Data Safety tablosu, görsel asset spec (icon 512x512 / feature 1024x500 / screenshots), pre-submission checklist.
- `store/content-rating-iarc.md` — IARC + Apple yaş-derecelendirme questionnaire cevapları (beklenen: Play Everyone/PEGI 3, Apple 4+), submission gotcha'ları.
- `store/app-store-app-privacy.md` — Apple App Privacy ("nutrition label") cevap seti: ATT consequence (IDFA → Tracking=YES), data-type→toggle master tablosu, ASC click-by-click 3-soru akışı, published-label bucket'ları, pre-publish cross-check'ler. Processor'lar: Supabase/Gemini/AdMob/RevenueCat, veri satılmıyor.
- `store/google-play-data-safety.md` — Google Play Data Safety cevap sayfası: 3 gating soru + 9 per-type detay kartı (console path'leri ile), tek Shared=Yes (AdMob Advertising ID), "NOT collected" listesi, single-glance özet tablo. Uyarı: published privacy policy'de AdMob YOK (ship öncesi ekle); ads yoksa Device IDs Shared=No.
- `store/screenshots-and-assets-plan.md` — Screenshot + grafik asset üretim planı: exact sizes (iOS 6.9"/6.7" 1290x2796 mandatory, iPad flag, Play phone 1080x1920 + feature 1024x500), 8-shot storyboard (gerçek ekranlara map), feature graphic konsepti, capture talimatları (simctl/adb + fastlane), app preview video notu, gate-to-publish checklist.

---

## ▶️ Önerilen sıra (next actions)

**Claude (kod/config — tek oturum):**
1. `eas.json` yeniden yaz: `cli` (version + appVersionSource: remote) + `build.production/preview` her ikisine `ios` + `android` (buildType `app-bundle`) + `production.autoIncrement` + `submit.production.{ios,android}` (placeholder değerlerle).
2. Android kimlik fix (B5+B11): `android/` sil + `expo prebuild --clean --platform android` (tercih) veya manuel build.gradle/Kotlin/strings.xml/manifest düzelt.
3. **"Start Cooking" CTA fix** (B10): recipe/[id].tsx Coming Soon alert kaldır/relabel + ai-meal-plan.tsx:1 yorum.
4. **Apple Sign-In native** (B8): login.tsx/signup.tsx web OAuth → native appleAuth + signInWithIdToken + Platform.OS==='ios' gate.
5. **Paywall** (3.1.2): Terms/Privacy linkleri + per-package billing period (Monthly/Yearly/Lifetime).
6. `.gitignore`: `play-service-account.json` ekle.
7. `npx expo install react-native-google-mobile-ads expo-tracking-transparency` + app.config.js plugins[]'e AdMob config plugin + expo-splash-screen + (ATT model'ine göre) expo-tracking-transparency; `ITSAppUsesNonExemptEncryption:false` ios.infoPlist'e ekle; foreground/splash/adaptive-icon path'leri set et.
8. ATT akışı: model kararına göre `requestTrackingPermissionsAsync()` → `initAds()` veya `requestNonPersonalizedAdsOnly`.
9. `npx expo prebuild --clean` → RC pod + Apple entitlement + AdMob (GADApplicationIdentifier+SKAdNetworkItems) + ATT + ITSAppUsesNonExemptEncryption resync; doğrula + commit.

**Sen (hesap + key + asset):**
10. `eas login` → `eas init` (B1) → `eas build:version:set` (remote seed).
11. Apple: Developer + **Paid Apps Agreement Active** + ASC app record (ascAppId) + ASC API key (.p8) + Team ID → Claude'a ver.
12. Google: Play Console + service-account JSON + Play App Signing enroll.
13. **Key'ler (gate item):** RC `appl_`/`goog_` SDK key → EAS env; Supabase secrets `REVENUECAT_WEBHOOK_SECRET` + `GEMINI_API_KEY` + `GROQ_API_KEY` (+ Stripe/Apify); RC dashboard webhook header.
14. **Edge fn deploy** doğrula (7 fn, revenuecat-webhook + admob-ssv `--no-verify-jwt`); AdMob SSV callback URL kaydet; smoke call.
15. Asset'ler: adaptive foreground PNG, splash kare PNG, feature graphic 1024x500, iOS 6.9"/6.7" + Android phone screenshot'ları (`store/screenshots-and-assets-plan.md`).
16. Privacy/Terms/Data-deletion HTML'leri HTTPS'te yayında + **privacy policy'ye AdMob ekle**; ASC subscription + RC bağlantısı her iki store'da.
17. Store form'ları: App Privacy (`app-store-app-privacy.md`) + Data Safety (`google-play-data-safety.md`) + content rating + listing metinleri.

**Build + submit (tüm üst maddeler bittikten sonra):**
18. `eas build -p ios --profile production` → `eas submit -p ios --profile production`
19. `eas build -p android --profile production` → `eas submit -p android --profile production` (track: internal → test → production'a promote)

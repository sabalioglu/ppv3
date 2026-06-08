# Stovd — Screenshot & Graphic-Asset Production Plan

> App: **Stovd** — "Cook from what you have." AI pantry & meal assistant.
> Bundle/package: `com.stovd.app` · Platforms: iOS, Android, Web · Languages: EN + TR · Rating: 4+/Everyone
> Verified against real source: `app.config.js` (`supportsTablet: true`) and `app/(protected)/(tabs)/_layout.tsx`.

Real screens mapped (from `app/(protected)/`):
- `(tabs)/index.tsx` — **Kitchen** home/dashboard
- `(tabs)/pantry.tsx` — **Pantry** (ingredients, expiry)
- `(tabs)/camera.tsx` — **AI Camera Scan** (center tab; modes food/multi/calorie/receipt)
- `(tabs)/recipes.tsx` — **AI Recipe Suggestions** (from pantry)
- `(tabs)/shopping-list.tsx` — **Shopping List**
- `ai-meal-plan.tsx` — **AI Meal Plans** (daily/weekly/monthly)
- `paywall.tsx` — **Premium / Paywall**
- `cookbook/[id].tsx`, `recipe/` — Cookbook / recipe detail (import from URL / IG / TikTok)
- `(tabs)/settings.tsx` — Settings (not a marketing shot)

---

## 1. Exact Required Sizes

### Apple App Store (App Store Connect)
Screenshots are portrait unless noted. You must supply at least one display size; ASC will not auto-scale across families that lack a default.

| Display family | Pixel size (portrait) | Status | Notes |
|---|---|---|---|
| **6.9" iPhone** (16 Pro Max / 15 Pro Max) | **1290 x 2796** | **MANDATORY** | Primary required set. Up to 10 images. |
| 6.7" iPhone (older Pro Max / Plus) | 1290 x 2796 | Covered by 6.9" upload | 6.9" assets are accepted/reused for 6.7". Treat as one deliverable. |
| 6.5" iPhone (11 Pro Max / XS Max) | **1242 x 2688** | Recommended | Provide if you want pixel-perfect older-device display; otherwise ASC scales from 6.9". |
| 5.5" iPhone (8 Plus) | 1242 x 2208 | Optional | Legacy; skip unless targeting very old devices. |
| **iPad 13"** (M4 iPad Pro) | **2064 x 2752** | **FLAG — LIKELY REQUIRED** | See flag below. |
| **iPad 12.9"** (Pro 2nd–6th gen) | **2048 x 2732** | **FLAG — LIKELY REQUIRED** | See flag below. |

> ⚠️ **iPad screenshots flag.** `app.config.js` sets **`supportsTablet: true`**, so the build is submitted as a **universal (iPhone + iPad) app**. App Store Connect then **requires at least one iPad screenshot set** (13" or 12.9") to publish. Two options before submit:
> 1. **Keep iPad support** → you MUST produce iPad screenshots (2064x2752 and/or 2048x2732). Min 1, recommend 4–6.
> 2. **Drop iPad support** → set `supportsTablet: false`, rebuild; then only iPhone screenshots are required. Decide this BEFORE the screenshot run to avoid reshooting.
> **Action required:** confirm with stakeholder which path. Plan below assumes iPad stays ON.

App icon for store: 1024x1024 PNG, no alpha, no rounded corners (pulled from build / ASC, not a screenshot).

### Google Play Console
| Asset | Size | Status | Notes |
|---|---|---|---|
| **Phone screenshots** | **1080 x 1920** (min 1080px short side), 9:16 | **MANDATORY** | Min **2**, max **8**. PNG or JPEG, ≤8MB each. |
| **Feature graphic** | **1024 x 500** | **MANDATORY** | Required to publish + for Play promotion slots. JPEG/PNG, no alpha. |
| App icon | 512 x 512 PNG (32-bit, alpha) | Mandatory | From listing, not a screenshot. |
| 7" tablet screenshots | 1080 x 1920+ (tablet aspect) | Optional | Recommended since app is tablet-capable. Min 1 if provided. |
| 10" tablet screenshots | 1080 x 1920+ (tablet aspect) | Optional | Recommended for tablet visibility. |

> Play does **not** force tablet screenshots, but if `supportsTablet` stays true, providing 7"/10" sets improves the "Designed for tablets" surface. Reuse the iPad storyboard compositions, re-exported at tablet dimensions.

### Per-language requirement (EN + TR)
Each locale (`en-US` and `tr-TR`) needs its **own** screenshot set with localized caption overlays. That means **2x** the export count: EN captions and TR captions. Feature graphic also localized (text in EN vs TR).

---

## 2. Shot Storyboard (6–8 shots)

Order is the gallery order shown to users. Each shot = one real screen + a caption overlay band (top ~18% of frame) on a branded background. Keep the device frame screenshot real (captured from the app), composite caption above.

| # | Screen (real source) | What's visible | Caption EN | Caption TR |
|---|---|---|---|---|
| **1** | `camera.tsx` (AI Camera Scan, food mode) | Camera viewfinder over groceries / mid-scan with detected items chips | **Snap your groceries. We'll stock your pantry.** | **Bir fotoğraf çek, kileri biz dolduralım.** |
| **2** | `(tabs)/pantry.tsx` (Pantry) | Ingredient list with expiry badges, categories | **Smart Pantry tracks what you have — and what's expiring.** | **Akıllı Kiler neyin olduğunu ve son kullanmayı takip eder.** |
| **3** | `(tabs)/recipes.tsx` (AI Recipe Suggestions) | Recipe cards generated from pantry, "cook from what you have" | **AI recipes from exactly what's in your kitchen.** | **Mutfağındakilerle yapay zeka tarifleri.** |
| **4** | `ai-meal-plan.tsx` (AI Meal Plans) | Weekly meal plan grid, calorie/diet tags | **Personalized meal plans — diet, allergens, calories handled.** | **Sana özel öğün planı — diyet, alerjen ve kaloriye göre.** |
| **5** | `cookbook/[id].tsx` or `recipe/` (Import) | Recipe imported from a TikTok/Instagram/URL link | **Import any recipe from a link, Instagram or TikTok.** | **Bir bağlantı, Instagram ya da TikTok'tan tarif aktar.** |
| **6** | `(tabs)/shopping-list.tsx` (Shopping List) | Auto-built shopping list, checkable items | **Auto shopping lists for what you're missing.** | **Eksiklerin için otomatik alışveriş listesi.** |
| **7** | `(tabs)/index.tsx` (Kitchen home) | Dashboard: pantry summary, suggestions, quick actions | **Your whole kitchen, in one place.** | **Tüm mutfağın tek bir yerde.** |
| **8** | `paywall.tsx` (Premium) | Premium benefits: unlimited scans/imports/plans, ad-free | **Go Premium: unlimited scans, imports & plans, ad-free.** | **Premium'a geç: sınırsız tarama, aktarım ve plan, reklamsız.** |

**Recommended minimum sets:**
- Apple 6.9": ship shots **1–8** (room for all 10).
- Play phone: ship shots **1–6** (covers the mandatory hook within max-8 limit; can include 7–8 if space).
- iPad / tablet: ship shots **1, 2, 3, 4, 7** (5 strongest landscape-friendly compositions).

**Caption style rules:** one line, ≤7 words, sentence case, brand accent color band, app wordmark "Stovd" small in corner of shot 1 only. Shot 1 must communicate the core value ("snap → pantry") because it's the conversion-driving first impression. Do NOT put pricing numbers in captions (quota numbers go in the description, not overlays, to avoid store-policy churn on screenshots).

---

## 3. Feature Graphic Concept (1024x500, Play mandatory)

**Concept — "From phone camera to cooked dinner."**
- Left third: a hand holding a phone showing the **AI Camera Scan** viewfinder over fresh groceries, with floating detected-ingredient chips (tomato, egg, pasta).
- Center: bold wordmark **Stovd** + tagline **"Cook from what you have."** (TR variant: **"Elindekiyle yemek yap."**).
- Right third: a generated recipe card emerging, plus a small AI/sparkle motif tying camera → recipe.
- Background: warm kitchen gradient (brand colors), high contrast so text is legible at thumbnail size. No critical content in outer 10% safe-margin (Play crops/overlays a play button on promo placements).
- Two locale exports: EN text + TR text. Keep imagery identical, swap only the wordmark tagline line.
- Format: PNG (or JPEG) 1024x500, no alpha, sRGB, <1MB target.

---

## 4. How to Capture

### iOS (6.9" + 6.7" + 6.5" + iPad)
1. **6.9" / 6.7" (1290x2796):** boot **iPhone 16 Pro Max** simulator.
   ```
   xcrun simctl boot "iPhone 16 Pro Max"
   open -a Simulator
   # run the app on it
   npx expo run:ios --device "iPhone 16 Pro Max"   # or eas build + install
   # capture (saves at exact device resolution):
   xcrun simctl io booted screenshot ~/stovd-shots/ios-69-<shot>.png
   ```
2. **6.5" (1242x2688):** boot **iPhone 11 Pro Max** simulator (or 15 Plus mapped), repeat capture. If you skip, ASC scales from 6.9".
3. **iPad 13" / 12.9" (2064x2752 / 2048x2732):** boot **iPad Pro 13-inch (M4)** and/or **iPad Pro 12.9-inch**, run app, `xcrun simctl io booted screenshot`. Required because `supportsTablet: true`.
4. Use a clean seeded account: realistic pantry items (no test garbage), at least one imported recipe, a populated meal plan, an in-progress camera scan, status bar cleaned via `xcrun simctl status_bar booted override --time "9:41" --batteryState charged --batteryLevel 100`.

### Android (phone + tablet)
1. **Phone (1080x1920+):** Pixel emulator, e.g. **Pixel 8** (1080x2400) or Pixel 7. Export will be ≥1080 short side; crop/letterbox to a consistent 1080x1920 or keep native 9:19.5 (Play accepts ≥1080 short side, 16:9–9:16).
   ```
   emulator -avd Pixel_8_API_34
   adb exec-out screencap -p > ~/stovd-shots/android-phone-<shot>.png
   ```
2. **7" / 10" tablet (optional):** Pixel Tablet / Nexus 9 style AVD, same `adb exec-out screencap`.
3. Same clean-seed-account rule as iOS.

### Compositing captions + frames
- Raw `simctl`/`adb` captures are the **device-content** layer. Add the caption band + (optional) device frame in the marketing template.
- **Automation (recommended):** use **fastlane** to manage upload + framing:
  - `fastlane snapshot` (iOS) can auto-capture localized screenshots from a UITest, but with Expo/React Native the simpler path is manual `simctl` capture + **`fastlane frameit`** to add device frames and the title/subtitle text per locale (`Framefile.json` + `title.strings` for `en-US` and `tr-TR`).
  - `fastlane deliver` (iOS) and `fastlane supply` (Android) upload the framed sets to ASC and Play per locale.
  - With **EAS**, build via `eas build`, install on simulator/emulator, then run the `simctl`/`adb` capture scripts; EAS doesn't ship a screenshot framer, so pair it with `frameit` or a Figma/Canva template.
- Keep a single source template per platform/size so EN and TR exports differ only in the caption text layer (drive from a strings file).

---

## 5. App Preview Video (optional)

- **Apple:** App Preview is optional. If added, 1 per localized 6.9" set, **15–30s**, portrait, captured in-app (ASC accepts `.mov`/`.mp4`, H.264/HEVC, exact device resolution e.g. 886x1920 or 1290x2796 source). Capture with `xcrun simctl io booted recordVideo`. Strong candidate flow: **camera scan → pantry fills → recipe suggested → meal plan** (mirrors shots 1→4). No audio narration needed; on-screen captions in locale.
- **Google Play:** add a **YouTube URL** (not an uploaded file) in the "Video" field; optional. Same 15–30s flow works; host unlisted on YouTube.
- **Priority:** ship static screenshots + feature graphic first (these gate publishing). Video is a post-launch conversion boost — defer if it blocks the launch date.

---

## Deliverable Checklist (gate-to-publish first)

- [ ] **DECISION:** keep `supportsTablet: true` (→ iPad shots required) or set false before build.
- [ ] iOS 6.9" 1290x2796 — shots 1–8 — **EN** and **TR** (MANDATORY)
- [ ] iOS iPad 2064x2752 and/or 2048x2732 — shots 1,2,3,4,7 — EN + TR (required if tablet stays on)
- [ ] iOS 6.5" 1242x2688 — optional, EN + TR
- [ ] Play feature graphic 1024x500 — **EN** and **TR** (MANDATORY)
- [ ] Play phone 1080x1920 — shots 1–6 (min 2) — **EN** and **TR** (MANDATORY)
- [ ] Play 7"/10" tablet — optional, reuse iPad compositions
- [ ] App preview video 15–30s — optional, defer if blocking
- [ ] Clean seed account + status bar cleanup before any capture
- [ ] fastlane `frameit` template wired to per-locale strings (EN/TR)

# Stovd — Apple App Privacy ("Nutrition Label") Answers

**App:** Stovd — "Cook from what you have" (AI pantry & meal assistant)
**Package / Bundle ID:** `com.stovd.app`
**Category:** Food & Drink (primary), Health & Fitness / Lifestyle (secondary)
**Platforms:** iOS, Android, Web · **Languages:** English, Turkish
**Audience:** General (4+)
**Last reviewed:** 2026-06-07

This document holds the authoritative answer set for the **App Store Connect →
App Privacy** questionnaire (the "privacy nutrition label"). Apple asks, for each
**data type** you collect: (1) is it collected, (2) is it **linked to the user's
identity**, (3) is it **used for tracking**, and (4) what **purposes** it serves.

> **Definitions Apple uses (read these first — they drive every answer below):**
> - **"Collect"** = transmitted off the device in a way that's accessible to you
>   or a third party for longer than the time needed to service the request.
> - **"Linked to the user"** = associated with the user's identity (account,
>   device-account, etc.). Stovd uses authenticated accounts, so nearly all data
>   is linked.
> - **"Tracking"** = linking this app's data with data from other companies'
>   apps/websites/offline sources for targeted advertising or measurement, **or**
>   sharing it with a data broker. **Only the AdMob advertising path qualifies.**
> - **Purposes** Apple lets you pick: **App Functionality, Analytics, Product
>   Personalization, Developer's Advertising or Marketing, Third-Party
>   Advertising, Other.**

---

## 0. The single most important consequence — ATT

Because Google **AdMob** rewarded ads use the **device advertising identifier
(IDFA)** to link Stovd's data with other companies' data for **Third-Party
Advertising**, Stovd **does track** under Apple's definition. That means:

- In App Privacy you must answer **"Yes, we track"** for **Device ID** (and
  **Coarse/Other identifiers** AdMob may read).
- Stovd **must** implement **App Tracking Transparency** — call
  `ATTrackingManager.requestTrackingAuthorization` and only initialize AdMob
  personalized ads if the user grants permission. Without the ATT prompt, an app
  that declares tracking is **rejected** under App Store Review Guideline 5.1.2.
- If the user **denies** ATT, AdMob must run in **non-personalized** mode
  (`npa=1`) — but the *declaration* in App Privacy still says "used for tracking"
  because the capability/SDK is present and used for some users who consent.

> Implementation note for the dev: gate the AdMob SDK behind the ATT result, and
> pass `RequestConfiguration` / non-personalized flags when status ≠ authorized.
> The rewarded-ads-to-extend-quota flow (`lib/ads.ts`, `admob-ssv` webhook) still
> works without IDFA; only ad *personalization* changes.

---

## 1. Data-type → toggle map (the master table)

Each row = one selectable **data type** card in App Store Connect. "—" means the
card is left **unchecked** (not collected).

| App Store Connect data type | Collected? | Linked to user? | Used for tracking? | Purposes to check |
|---|---|---|---|---|
| **Contact Info → Email Address** | **Yes** | **Yes** | No | App Functionality |
| **Contact Info → Name** | **Yes** | **Yes** | No | App Functionality |
| **Contact Info → Phone Number** | No (—) | — | — | — |
| **Contact Info → Physical Address** | No (—) | — | — | — |
| **Health & Fitness → Health** | **Yes** (height, weight, dietary, allergens) | **Yes** | **No** | App Functionality, Product Personalization |
| **Health & Fitness → Fitness** | **Yes** (activity level for calorie target) | **Yes** | **No** | App Functionality, Product Personalization |
| **User Content → Photos or Videos** | **Yes** (pantry / receipt / calorie scan photos) | **Yes** | No | App Functionality |
| **User Content → Other User Content** | **Yes** (pantry items, saved recipes, meal plans, shopping list) | **Yes** | No | App Functionality |
| **User Content → Customer Support** | Optional (only if support form used) | Yes | No | App Functionality |
| **Identifiers → User ID** | **Yes** (Supabase account ID) | **Yes** | No | App Functionality |
| **Identifiers → Device ID** | **Yes** (IDFA via AdMob) | **Yes** | **YES** | Third-Party Advertising, Analytics |
| **Purchases → Purchase History** | **Yes** (RevenueCat subscription state) | **Yes** | No | App Functionality, Analytics |
| **Usage Data → Product Interaction** | **Yes** | **Yes** | No | Analytics, Product Personalization |
| **Usage Data → Advertising Data** | **Yes** (ad impressions via AdMob) | **Yes** | **YES** | Third-Party Advertising |
| **Diagnostics → Crash Data** | **Yes** | No (not linked) | No | App Functionality, Analytics |
| **Diagnostics → Performance Data** | **Yes** | No (not linked) | No | App Functionality, Analytics |
| **Location** | No (—) | — | — | — |
| **Financial Info** | No (—)* | — | — | — |
| **Browsing History / Search History** | No (—) | — | — | — |
| **Contacts** | No (—) | — | — | — |
| **Sensitive Info** | No (—) | — | — | — |

\* **Financial Info = No.** Stovd never sees card/payment data. All payment is
handled by **Apple In-App Purchase** (StoreKit) and reconciled via **RevenueCat**,
which returns only **subscription status / purchase history** — declared under
**Purchases**, not Financial Info.

---

## 2. Click-by-click answer set (per data type)

This is the literal flow inside **App Store Connect → [App] → App Privacy → Get
Started / Edit**. For every data type you mark "collected," App Store Connect
asks the same 3 follow-ups (linked? / tracking? / purposes?). Answers below.

### 2.1 Contact Info — Email Address  → COLLECTED
1. *"Do you collect Email Address?"* → **Yes**
2. *Purposes* → check **App Functionality** only (account creation / login via
   Email-password, Sign in with Apple, Google Sign-In). Leave Analytics,
   Advertising, Personalization **unchecked**.
3. *"Is Email Address linked to the user's identity?"* → **Yes**
4. *"Is Email Address used for tracking?"* → **No**

### 2.2 Contact Info — Name  → COLLECTED
1. *"Do you collect Name?"* → **Yes** (display name on the account/profile)
2. *Purposes* → **App Functionality** only
3. *Linked?* → **Yes**
4. *Tracking?* → **No**

> Sign in with Apple may return a **private relay email** — still declare Email
> as collected; the relay is fine and stays linked to the account.

### 2.3 Health & Fitness — Health  → COLLECTED
Covers **height, weight, dietary preferences, allergens** (used to compute the
calorie target and to filter recipes/meal plans).
1. *"Do you collect Health?"* → **Yes**
2. *Purposes* → check **App Functionality** AND **Product Personalization**.
   Leave **Analytics, Third-Party Advertising, Developer's Advertising**
   **unchecked**.
3. *Linked?* → **Yes** (tied to the account so plans persist)
4. *"Used for tracking?"* → **No** ← critical: health data is **never** shared
   with AdMob or any ad/analytics third party; it stays in Supabase for
   personalization only.

### 2.4 Health & Fitness — Fitness  → COLLECTED
Covers the **activity level** input that feeds the calorie/BMR calculation.
1. Collected → **Yes**
2. Purposes → **App Functionality**, **Product Personalization**
3. Linked? → **Yes**
4. Tracking? → **No**

> If App Store Connect only surfaces a single combined "Health & Fitness" card in
> your version of the UI, select it once and apply the same answers (Functionality
> + Personalization, linked, no tracking).

### 2.5 User Content — Photos or Videos  → COLLECTED
Covers photos sent to the **AI Camera Scan** (food / multi / calorie / receipt
modes), processed by **Google Gemini** vision to populate the pantry.
1. Collected → **Yes**
2. *Purposes* → **App Functionality** only (the photo IS the feature input)
3. Linked? → **Yes** (uploaded under the user's account)
4. Tracking? → **No**

> Disclose Google Gemini as a **third-party processor** in the Privacy Policy.
> Apple does not have a per-data-type "third party" toggle here, but the policy
> linked from App Privacy must name processors (Supabase, Google Gemini, AdMob,
> RevenueCat). Photos are used to analyze ingredients, **not** for advertising.

### 2.6 User Content — Other User Content  → COLLECTED
Covers **pantry items, saved/imported recipes, meal plans, shopping lists,
cookbook entries** (incl. recipes imported from a URL or Instagram/TikTok video).
1. Collected → **Yes**
2. Purposes → **App Functionality** only
3. Linked? → **Yes**
4. Tracking? → **No**

### 2.7 Identifiers — User ID  → COLLECTED
Supabase account / user identifier.
1. Collected → **Yes**
2. Purposes → **App Functionality** only
3. Linked? → **Yes**
4. Tracking? → **No**

### 2.8 Identifiers — Device ID  → COLLECTED (TRACKING)
The **IDFA / advertising identifier** read by the **AdMob** SDK for rewarded ads.
1. Collected → **Yes**
2. *Purposes* → check **Third-Party Advertising** AND **Analytics** (AdMob
   measurement). Do **not** check App Functionality.
3. *Linked?* → **Yes**
4. *"Used for tracking?"* → **YES** ← this is the toggle that forces the ATT
   prompt requirement. Be honest here; mismatches are a top rejection cause.

### 2.9 Purchases — Purchase History  → COLLECTED
Subscription state from **Apple IAP via RevenueCat** (free vs. premium,
weekly/monthly/lifetime, ad-free).
1. Collected → **Yes**
2. Purposes → **App Functionality** (unlock premium / gate quota) AND
   **Analytics** (RevenueCat reporting). No tracking.
3. Linked? → **Yes**
4. Tracking? → **No**

### 2.10 Usage Data — Product Interaction  → COLLECTED
In-app actions: scans run, imports done, plans generated, quota consumption
(`usage_counters`), rewarded-ad redemptions.
1. Collected → **Yes**
2. Purposes → **Analytics** AND **Product Personalization** (better suggestions).
   No advertising on this row.
3. Linked? → **Yes**
4. Tracking? → **No**

### 2.11 Usage Data — Advertising Data  → COLLECTED (TRACKING)
Ad impressions / interactions reported by **AdMob**.
1. Collected → **Yes**
2. Purposes → **Third-Party Advertising**
3. Linked? → **Yes**
4. *Tracking?* → **YES** (same AdMob path as Device ID)

### 2.12 Diagnostics — Crash Data  → COLLECTED, NOT LINKED
1. Collected → **Yes**
2. Purposes → **App Functionality**, **Analytics**
3. *Linked?* → **No** (crash/performance telemetry is not tied to identity)
4. Tracking? → **No**

### 2.13 Diagnostics — Performance Data  → COLLECTED, NOT LINKED
1. Collected → **Yes**
2. Purposes → **App Functionality**, **Analytics**
3. Linked? → **No**
4. Tracking? → **No**

---

## 3. Final summary of label sections (what the public label will show)

App Store Connect groups the published label into three buckets. Stovd's outcome:

### 🔴 Data Used to Track You
*(this section appears **because of AdMob** — and only AdMob)*
- **Identifiers** → Device ID
- **Usage Data** → Advertising Data

### 🟠 Data Linked to You
- **Contact Info** (Email, Name)
- **Health & Fitness** (Health, Fitness)
- **User Content** (Photos/Videos, Other User Content)
- **Identifiers** (User ID, Device ID)
- **Purchases** (Purchase History)
- **Usage Data** (Product Interaction, Advertising Data)

### ⚪ Data Not Linked to You
- **Diagnostics** (Crash Data, Performance Data)

---

## 4. Cross-checks before you hit "Publish"

- [ ] **ATT implemented** — `requestTrackingAuthorization` is called before any
      AdMob personalized request; non-personalized fallback (`npa=1`) wired for
      denied/undetermined. (Required because §2.8 / §2.11 declare tracking.)
- [ ] **NSUserTrackingUsageDescription** string present in `Info.plist`
      (e.g. "Stovd uses your device's advertising identifier to show ads that
      help keep the app free.").
- [ ] **"Data is not sold"** — keep this true. No row above is shared with a data
      broker; AdMob is **advertising/tracking**, not a sale. State "We do not
      sell your data" in the Privacy Policy.
- [ ] **Health data is NOT in the tracking bucket** — verify §2.3 / §2.4 tracking
      = No. Never wire height/weight/dietary/allergens to AdMob or analytics ad
      paths.
- [ ] **Processors named in Privacy Policy**: Supabase (storage/auth/DB),
      Google Gemini (photo & recipe AI), Google AdMob (ads), RevenueCat
      (subscriptions). Privacy Policy URL set in App Store Connect → App Privacy.
- [ ] **Financial Info stays unchecked** — payments go through Apple IAP; you only
      see purchase status (declared under Purchases).
- [ ] **Location unchecked** — Stovd has no location feature; confirm no SDK
      (incl. AdMob) is requesting precise/coarse location.
- [ ] **Account Deletion** path exists (Guideline 5.1.1(v)) and Privacy Policy
      describes how users delete account + associated data (pantry, photos,
      health, meal plans).

---

## 5. One-line rationale cheat sheet (for review notes)

> Stovd collects account info, user-generated food content, and optional health
> inputs (height/weight/dietary/allergens) **solely to run the app and personalize
> meal plans** — never for tracking. Photos are processed by Google Gemini for
> ingredient recognition only. The **only** tracking is Google AdMob's optional
> rewarded ads, which read the device advertising identifier; this is gated behind
> an ATT prompt and falls back to non-personalized ads on denial. Payments run
> through Apple IAP / RevenueCat (purchase status only). **No data is sold.**

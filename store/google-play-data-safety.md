# Stovd — Google Play Data Safety Form

Authoritative answer sheet for the Google Play Console **App content → Data safety** section.
Fill each toggle exactly as written below. Keep this file in sync with the published
[Privacy Policy](https://stovd.app/privacy) and [Data Deletion](https://stovd.app/data-deletion) pages.

- **App:** Stovd — "Cook from what you have" (AI pantry & meal assistant)
- **Package:** `com.stovd.app`
- **Privacy policy URL:** https://stovd.app/privacy
- **Data deletion URL:** https://stovd.app/data-deletion
- **Support / deletion email:** support@stovd.app
- **Processors only (no resale):** Supabase, Google Gemini, Google AdMob, RevenueCat
- **Last reviewed:** 2026-06-07

---

## Console wizard overview (the questions Play asks, top to bottom)

The Data safety form is a wizard. Answer the gating questions first, then the per-type matrix.

| Console question | Answer | Notes |
|---|---|---|
| Does your app collect or share any of the required user data types? | **Yes** | We collect account, content, health, photos, activity, IDs, purchases. |
| Is all of the user data collected by your app encrypted in transit? | **Yes** | All traffic to Supabase / Gemini / AdMob / RevenueCat is HTTPS/TLS. |
| Do you provide a way for users to request that their data be deleted? | **Yes** | In-app: Settings → Delete account. Web: https://stovd.app/data-deletion. |

After these three, the console shows a checklist of **data categories**. Toggle a category ON only if a row below is "Collected = Yes", then fill its detail card.

For **every** "Collected = Yes" data type the console asks the same four sub-questions:
1. **Collected?** — leaves your app's servers/processors → **Yes** for all rows below.
2. **Shared?** — sent to a *third party* (a separate company) for *their* use, OR a processor that uses it for purposes beyond your instruction. We mark **Shared = Yes only for the Advertising ID** (AdMob ad serving). All other processors act on our behalf only → **Shared = No**.
3. **Processed ephemerally?** — handled in memory only, not stored. **Photos = Yes** (Gemini analyzes, returns labels, does not retain). All other rows = **No** (we store them).
4. **Required or optional?** — "Optional" means the user can use the app without providing it.

> **Sharing definition reminder (Play):** Using a processor that only acts on your instructions is **NOT** "sharing." AdMob serving personalized/limited ads with the Advertising ID **IS** "sharing." That is the only Shared=Yes in this app.

---

## Per-data-type answers

### 1. Personal info → Name

| Field | Answer |
|---|---|
| Collected | **Yes** |
| Shared | No |
| Processed ephemerally | No (stored in account profile) |
| Required or optional | **Optional** (display name; email/SSO sign-in does not force a name) |
| Purposes | App functionality; Account management; Personalization |

Console path: **Personal info → Name** → toggle ON.

### 2. Personal info → Email address

| Field | Answer |
|---|---|
| Collected | **Yes** |
| Shared | No |
| Processed ephemerally | No (stored as account identifier) |
| Required or optional | **Required** (email/password, Apple, or Google sign-in needs an email/identifier) |
| Purposes | App functionality; Account management |

Console path: **Personal info → Email address** → toggle ON.

> Do NOT toggle: User IDs (other than email), Address, Phone number, Race/ethnicity,
> Political/religious beliefs, Sexual orientation, Other personal info. We do not collect them.

### 3. Health and fitness → Health info

| Field | Answer |
|---|---|
| Collected | **Yes** |
| Shared | **No** (personalization only; never sent to a third party for their use) |
| Processed ephemerally | No (stored in profile) |
| Required or optional | **Optional** (height, weight, dietary preferences, allergens, activity level for calorie/portion personalization) |
| Purposes | App functionality; Personalization |

Console path: **Health and fitness → Health info** → toggle ON. (Map height/weight/activity/dietary/allergens here. Stovd is not a "Fitness info" workout tracker, so leave **Fitness info** OFF.)

### 4. Photos and videos → Photos

| Field | Answer |
|---|---|
| Collected | **Yes** |
| Shared | **No** (sent to Google Gemini as our processor for vision analysis only) |
| Processed ephemerally | **Yes** (AI Camera Scan: photo → Gemini extracts food/receipt/calorie data → result returned; image is not retained server-side) |
| Required or optional | **Optional** (only when the user chooses to scan a photo) |
| Purposes | App functionality |

Console path: **Photos and videos → Photos** → toggle ON.

> Note for reviewer text: "Photos captured via AI Camera Scan are transmitted to Google
> Gemini (our processor) for ingredient/receipt/calorie extraction and are processed
> ephemerally; they are not stored or used to train third-party models."

### 5. App activity → App interactions

| Field | Answer |
|---|---|
| Collected | **Yes** |
| Shared | No |
| Processed ephemerally | No (usage counters stored to enforce free-tier quota) |
| Required or optional | **Required** (quota metering — 20 scans / 10 imports / 5 meal plans — is core to the freemium model) |
| Purposes | App functionality; Analytics |

Console path: **App activity → App interactions** → toggle ON.

> Also under "App activity": **In-app search history**, **Installed apps**, **Other user-generated content**, **Other actions** → leave OFF unless you later add them.
> User content (pantry items, shopping lists, recipes, meal plans) is declared under
> App functionality via App interactions; Play has no separate "pantry"/"recipe" type, so
> it is covered here and in the per-type cards above — no extra toggle needed.

### 6. App info and performance → Crash logs

| Field | Answer |
|---|---|
| Collected | **Yes** |
| Shared | No |
| Processed ephemerally | No |
| Required or optional | **Required** (diagnostics) |
| Purposes | App functionality; Analytics |

Console path: **App info and performance → Crash logs** → toggle ON.

### 7. App info and performance → Diagnostics

| Field | Answer |
|---|---|
| Collected | **Yes** |
| Shared | No |
| Processed ephemerally | No |
| Required or optional | **Required** (performance/diagnostics) |
| Purposes | App functionality; Analytics |

Console path: **App info and performance → Diagnostics** → toggle ON. (Leave **Other app performance data** OFF unless used.)

### 8. Device or other identifiers → Device or other IDs

| Field | Answer |
|---|---|
| Collected | **Yes** |
| Shared | **Yes** (Advertising ID is shared with Google AdMob for ad serving / measurement) |
| Processed ephemerally | No |
| Required or optional | **Optional** (only present when the user watches a rewarded ad to extend free quota; absent for premium/ad-free users) |
| Purposes | Advertising or marketing; Analytics; App functionality |

Console path: **Device or other IDs → Device or other IDs** → toggle ON, then set **Shared = Yes** and check **Advertising or marketing** as a purpose. This is the one and only Shared=Yes row.

### 9. Financial info → Purchase history

| Field | Answer |
|---|---|
| Collected | **Yes** |
| Shared | No (RevenueCat / store billing acts as processor; full card details never received) |
| Processed ephemerally | No (subscription/entitlement status stored) |
| Required or optional | **Optional** (only for users who buy Premium) |
| Purposes | App functionality; Account management |

Console path: **Financial info → Purchase history** → toggle ON. Leave **Payment info**, **Credit score**, **Other financial info** OFF (we never receive raw payment card data — handled by Apple/Google/Stripe).

---

## Categories explicitly NOT collected (leave OFF)

Toggle these **OFF** so the form reflects "Not collected":

- **Location** (Approximate / Precise) — OFF
- **Personal info:** User IDs, Address, Phone number, Race & ethnicity, Political/religious beliefs, Sexual orientation, Other info — OFF
- **Financial info:** Payment info, Credit score, Other financial info — OFF
- **Messages** (Emails, SMS, Other in-app messages) — OFF
- **Photos and videos → Videos** — OFF (we process photos only)
- **Audio** (Voice/sound recordings, Music files, Other audio) — OFF
- **Files and docs** — OFF
- **Calendar** — OFF
- **Contacts** — OFF
- **App activity:** In-app search history, Installed apps, Other UGC, Other actions — OFF
- **Web browsing history** — OFF
- **Health and fitness → Fitness info** — OFF (we capture profile health metrics, not workout/activity tracking data)

---

## Fill-in summary table (single-glance reference)

| Data type (console row) | Collected | Shared | Ephemeral | Req/Opt | Purposes |
|---|:---:|:---:|:---:|---|---|
| Personal info → Name | Yes | No | No | Optional | App functionality, Account management, Personalization |
| Personal info → Email address | Yes | No | No | Required | App functionality, Account management |
| Health & fitness → Health info | Yes | No | No | Optional | App functionality, Personalization |
| Photos & videos → Photos | Yes | No | **Yes** | Optional | App functionality |
| App activity → App interactions | Yes | No | No | Required | App functionality, Analytics |
| App info & performance → Crash logs | Yes | No | No | Required | App functionality, Analytics |
| App info & performance → Diagnostics | Yes | No | No | Required | App functionality, Analytics |
| Device or other IDs → Device or other IDs | Yes | **Yes** | No | Optional | Advertising/marketing, Analytics, App functionality |
| Financial info → Purchase history | Yes | No | No | Optional | App functionality, Account management |

**Global declarations:**
- Encrypted in transit: **Yes** (HTTPS/TLS to all processors — Supabase, Gemini, AdMob, RevenueCat).
- Users can request data deletion: **Yes** — in-app (Settings → Delete account) + web form https://stovd.app/data-deletion.
- Data sold to third parties: **No.**
- Data shared: **only the Advertising ID** with Google AdMob for ad serving.
- Processors (act on our behalf, not "sharing"): Supabase (DB/auth/hosting), Google Gemini (vision/text AI), RevenueCat (subscription state), Google AdMob (rewarded ads).

---

## Reviewer notes / consistency checks before submit

1. **Privacy policy must list every collected type** above and name Supabase, Google Gemini, AdMob, RevenueCat — already covered by https://stovd.app/privacy. Confirm the live policy mentions AdMob/advertising identifiers before submitting (current policy lists Supabase, Gemini, RevenueCat, Apple, Google, Stripe, Firecrawl/Apify; add AdMob if rewarded ads ship in this release).
2. **Advertising ID = the only Shared=Yes.** If rewarded ads are NOT enabled in the submitted build, set Device IDs **Shared = No** and drop "Advertising or marketing" purpose, and remove the Advertising-ID permission declaration.
3. **Photos = Processed ephemerally = Yes** is a deliberate claim; only keep it true (Gemini does not retain images). If you ever cache scanned images server-side, flip this to No.
4. **Health info** stays Shared=No: dietary/allergen/height/weight are used for personalization only and never leave our processors for a third party's own use.
5. **Account management** purpose is valid for Name/Email/Purchase history (sign-in + subscription state).
6. Keep `Last reviewed` date current and re-validate this sheet whenever a new SDK that collects data is added.

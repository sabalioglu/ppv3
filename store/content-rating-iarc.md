# Stovd — Content Rating Questionnaire Answers

**App:** Stovd — "Cook from what you have" (AI pantry & meal assistant)
**Package / Bundle ID:** `com.stovd.app`
**Category:** Food & Drink (primary), Health & Fitness / Lifestyle (secondary)
**Platforms:** iOS, Android, Web · **Languages:** English, Turkish
**Last reviewed:** 2026-06-07

This document holds the recommended answers for the two age-rating systems Stovd
must complete at submission:

1. **Google Play — IARC** (International Age Rating Coalition questionnaire)
2. **Apple App Store — Age Rating** questionnaire (App Store Connect)

Stovd has no violence, no sexual content, no profanity, no gambling, and no drug
content. The only sensitive edge cases are addressed explicitly below:
- **Alcohol:** only ever appears as a possible *recipe ingredient* (e.g. "wine",
  "beer"). The app does not depict, promote, or encourage alcohol consumption.
  In fact the diet/allergen engine *filters alcohol out* for halal users
  (`lib/policy/diet-registry.ts`, `lib/policy/cultural-rules.ts`). It is a
  passing textual reference inside food data, not a feature.
- **Recipe URL / social-video import:** users can paste a YouTube / TikTok /
  Instagram / Facebook video URL and the AI extracts the recipe
  (`components/recipe/VideoRecipeExtractor.tsx`). This is a *constrained URL
  input field*, not an open in-app browser. It does not give unrestricted access
  to the internet.
- **User-generated content:** pantry items, saved recipes, and photos submitted
  for AI analysis are private to the user's own account. There is **no public
  feed, no social sharing, no user-to-user interaction, and no comments.** It is
  not UGC in the moderation sense.

---

## 1. Google Play — IARC Questionnaire

IARC presents the questionnaire as Yes/No category questions. Answer each as
shown. Choose category **"Reference / Utility / Productivity / Communication"**
or **"Other / Tools"** when asked for app type (NOT "Game") — non-game apps get
a shorter questionnaire.

### App type / first screen
| Question | Answer | Rationale |
|---|---|---|
| Is this app a game? | **No** | Stovd is a utility / productivity app (food & meal management). |
| App category | **Tools / Reference / Lifestyle** | Non-game branch. |

### Violence
| Question | Answer |
|---|---|
| Does the app contain any violence (cartoon, fantasy, realistic, or intense)? | **No** |
| Depictions of injury to humans, animals, or fantasy characters? | **No** |
| Blood or gore? | **No** |

### Sexuality / Nudity
| Question | Answer |
|---|---|
| Does the app contain nudity? | **No** |
| Sexual content, suggestive themes, or references? | **No** |

### Language
| Question | Answer |
|---|---|
| Does the app contain profanity or crude humor? | **No** |

### Controlled Substances
| Question | Answer | Note |
|---|---|---|
| References to or use of illegal drugs? | **No** | |
| References to or use of tobacco? | **No** | |
| **References to or use of alcohol?** | **Yes** | Honest answer. Alcohol can appear *only* as a text ingredient inside recipes (e.g. "wine", "beer"). No depiction of consumption, no promotion, no minigame, no purchase. The diet engine actively excludes it for halal users. This is the lowest-tier "reference" answer and does not raise the rating to Teen on its own for a Food & Drink utility — but it MUST be declared truthfully. If the questionnaire offers a follow-up "Is alcohol use glamorized / encouraged / central to the app?" answer **No**. |

### Gambling
| Question | Answer |
|---|---|
| Does the app contain simulated gambling (no real money)? | **No** |
| Does the app allow real-money gambling / wagering? | **No** |
| (Rewarded ads / freemium quota are **not** gambling — no wager, no chance-based payout.) | — |

### Fear / Horror
| Question | Answer |
|---|---|
| Content likely to frighten or scare young children? | **No** |

### Crude humor / Miscellaneous
| Question | Answer |
|---|---|
| Crude humor or bodily-function humor? | **No** |
| Discrimination / hate content? | **No** |

### Interactivity disclosures (IARC asks these separately — they affect labels, not the core rating)
| Question | Answer | Rationale |
|---|---|---|
| Does the app allow users to **interact or exchange content / communicate** with other users? | **No** | No social feed, no chat, no comments, no sharing to other users. All content is private to the user's account. |
| Does the app **share the user's physical location** with other users? | **No** | No location sharing. |
| Does the app allow purchase of **digital goods** (in-app purchases)? | **Yes** | Premium subscription via RevenueCat (Apple/Google billing). Declare IAP. |
| Does the app contain **ads**? | **Yes** | Google AdMob rewarded ads (optional, to extend free quota). Declare ads. |
| Does the app provide **unrestricted access to the internet** (e.g. a built-in open web browser)? | **No** | The recipe-import field accepts a pasted video URL that the backend AI parses. It is not an open browser and does not let the user freely browse the web inside the app. |
| Does the app **share user-provided personal information** with third parties? | **No (processors only)** | Data goes only to sub-processors needed to run the app (Supabase backend, Google Gemini for AI analysis, Google AdMob for ads, RevenueCat for billing). Data is **not sold** and **not shared for cross-app advertising beyond standard AdMob**. Declare AdMob advertising IDs in the Data Safety form. |
| Does the app collect / share user location for ads? | **No** | |

### Digital purchases note
Stovd offers a freemium model: free monthly quota (20 photo scans, 10 recipe
imports, 5 AI meal plans), Premium subscription (unlimited + ad-free) via
RevenueCat, and optional AdMob rewarded ads to extend the free quota. None of
these are gambling or loot-box mechanics.

### ► Expected Google Play IARC result
| Region authority | Expected rating |
|---|---|
| **IARC generic** | **Everyone** (3+) |
| ESRB (Americas) | **Everyone** |
| PEGI (Europe) | **PEGI 3** |
| USK (Germany) | **USK 0 / All ages** |
| ClassInd (Brazil) | **L (Livre / All ages)** |
| Google Play (global default) | **Rated for 3+ / Everyone** |

> The single "alcohol reference" Yes is the only flag. For a Food & Drink utility
> where alcohol is merely an ingredient string with no consumption depiction,
> IARC keeps this at **Everyone / PEGI 3**. (PEGI can apply a content descriptor
> but does not raise a food-utility above 3 for an ingredient-level mention.)
> If any authority unexpectedly returns Teen/12 due to the alcohol answer, that
> is acceptable and accurate — do **not** answer "No" to the alcohol question to
> force a lower rating.

---

## 2. Apple App Store — Age Rating Questionnaire (App Store Connect)

Apple's questionnaire asks frequency levels: **None / Infrequent or Mild /
Frequent or Intense** for each content category, plus several Yes/No toggles.

### "Made for Kids?" gate
| Question | Answer |
|---|---|
| Is this app **Made for Kids** (Kids Category)? | **No** | Stovd is a general-audience utility, collects account data and uses third-party ads/analytics — it must NOT be in the Kids Category. Target audience is general adult/teen users managing groceries and meals. |

### Content frequency questions
| Apple category | Answer |
|---|---|
| Cartoon or Fantasy Violence | **None** |
| Realistic Violence | **None** |
| Prolonged Graphic or Sadistic Realistic Violence | **None** |
| Profanity or Crude Humor | **None** |
| Mature/Suggestive Themes | **None** |
| Horror/Fear Themes | **None** |
| Medical/Treatment Information | **None** | (Calorie targets / dietary personalization are general wellness, not medical treatment advice. Keep marketing free of medical claims.) |
| **Alcohol, Tobacco, or Drug Use or References** | **Infrequent/Mild** | Honest answer. Alcohol appears only as an optional recipe ingredient text. Choose **Infrequent/Mild**, NOT Frequent/Intense, and NOT None. This is the closest accurate option since alcohol *can* appear as an ingredient reference. |
| Simulated Gambling | **None** |
| Sexual Content or Nudity | **None** |
| Graphic Sexual Content and Nudity | **None** |

### Additional Apple toggles
| Question | Answer | Rationale |
|---|---|---|
| Unrestricted Web Access (does the app provide open, unfiltered access to web content, e.g. a browser)? | **No** | Recipe import is a constrained URL parse, not a browser. Set this **No** so the app is not forced to 17+. |
| Gambling and Contests | **No** | |
| Does the app contain **user-generated content**? | **No** | Content is private to the user's account; no public posting, no user-to-user exchange, no community feed. (If App Review asks about the recipe/photo inputs, clarify they are private personal data, not shared UGC.) |

### ► Expected Apple result
| With "Unrestricted Web Access = No" and Alcohol = Infrequent/Mild | **Rating: 4+** |
|---|---|

> Apple treats **Infrequent/Mild Alcohol/Tobacco/Drug References** at the lowest
> tier; combined with everything else None and **no** unrestricted web access,
> the app rates **4+**. (Even if Apple's matrix nudges Alcohol-Infrequent to
> 12+, that is acceptable and honest — but for a food utility with ingredient
> mentions only, **4+** is the expected outcome.) Do **not** set "Unrestricted
> Web Access = Yes", which would force 17+ incorrectly.

---

## 3. Cross-cutting declarations (consistency checklist)

These must match across IARC, Apple Age Rating, Apple Privacy "Nutrition Label",
and Google Play Data Safety:

| Item | Stovd answer |
|---|---|
| In-app purchases | **Yes** — Premium subscription (RevenueCat → Apple/Google billing) |
| Advertising | **Yes** — Google AdMob (rewarded ads; uses advertising identifier) |
| User-to-user communication / social feed | **No** |
| Unrestricted internet / in-app browser | **No** (constrained recipe-URL import only) |
| Location collection | **No** |
| Data sold | **No** |
| Data shared with third parties | **Processors only** — Supabase (backend), Google Gemini (AI photo/recipe analysis), Google AdMob (ads), RevenueCat (billing) |
| Health & fitness data | **Collected** (height, weight, dietary restrictions, allergens) — used **only** for meal personalization, **not** shared, **not** sold |
| Photos | Submitted **only** for AI food/receipt recognition (Google Gemini); tied to the user's own account |
| Made for Kids / Kids Category | **No** |

### Data types to declare (Apple Privacy + Google Play Data Safety)
- **Contact Info:** email, name (account).
- **Health & Fitness:** height, weight, dietary restrictions, allergens (meal personalization only).
- **User Content:** pantry items, recipes, photos (for AI analysis), meal plans.
- **Purchases:** purchase history (RevenueCat).
- **Identifiers:** device / advertising identifiers (AdMob).
- **Usage Data / Diagnostics:** app usage, crash/diagnostics.
- **Linked to user:** account, health, user content, purchases.
- **Used for tracking:** advertising identifier (AdMob) — declare in App Tracking Transparency (ATT) on iOS if used for tracking; otherwise declare "Not used to track you" and disable cross-app tracking in AdMob config.

---

## 4. Submission notes / gotchas

1. **Be honest about alcohol.** Answer Yes (Google) / Infrequent-Mild (Apple).
   Do not zero it out to chase a lower rating — Stovd surfaces ingredient names
   that include wine/beer/etc. Misdeclaring risks an enforcement removal worse
   than a 12+/Teen flag.
2. **Do NOT declare Unrestricted Web Access.** The URL import is a single bounded
   field validated against YouTube/TikTok/Instagram/Facebook patterns
   (`detectVideoPlatform`), not a browser. Declaring "Yes" would force iOS 17+.
3. **Do NOT declare user-to-user content.** No social feed/chat/sharing exists.
   Declaring UGC would force Teen+ and trigger UGC-moderation review requirements
   Stovd does not need.
4. **Keep medical claims out of metadata.** Calorie/diet personalization is
   general wellness. Avoid words like "treat", "cure", "medical advice" in store
   copy so the Medical category stays **None / not applicable**.
5. **Rewarded ads + freemium quota are not gambling.** No wager, no random payout.
6. **Net expected ratings: Google Play "Everyone / PEGI 3", Apple "4+".**

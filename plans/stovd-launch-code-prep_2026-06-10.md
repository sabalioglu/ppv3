# Plan · Stovd App Store Lansman — Kalan Kod Hazırlığı

## Brief
Stovd'u App Store public-release'e kod tarafından hazır hale getir: iPad kapsamını kapat, store screenshot setini üret, paywall uyumunu doğrula, sonra yeni ikon+splash'i taşıyan production build 14'u kesip TestFlight'a gönder. Hesap/RevenueCat işleri (kullanici-elinde) kapsam disi.

## Stack
- Expo SDK54 / RN 0.81, ~/projects/ppv3, branch main, EAS @sabalioglu/stovd (ascAppId 6777703441)
- eas-cli 20.x (`eas build --platform ios --profile production --non-interactive --auto-submit`)
- Screenshot uretimi: HTML + Fraunces/Inter (Google Fonts) -> headless Chrome 1290x2796, landing/assets food gorselleri + birebir app ekran markup'i (landing/index.html'deki .phone/.screen sistemi reuse)
- Supabase ref mngukcchktjmexinfnib (bu planda DB degisikligi YOK)

## Scope
- **S1 · iPad kapsamini kapat**: `app.config.js` `ios.supportsTablet: true -> false` (ASC iPad screenshot zorunlulugunu kaldirir; v1.0 sadece iPhone).
- **S2 · Store screenshot seti**: 5 adet iOS 6.9" (1290x2796, alpha YOK) kapak uret -> `store/ios-screenshots/01..05.png`. Her kapak: Warm Editorial zemin + kisa baslik (Fraunces) + cihaz cercevesi icinde birebir app ekrani. Ekranlar: (1) Home "What are we cooking tonight?", (2) Kamera canli tarama (feed+detections), (3) Tarif detayi + pantry match, (4) Pantry listesi, (5) Haftalik meal plan. landing/index.html'deki mevcut faithful ekran markup'i + camera-feed.png reuse.
- **S3 · Paywall uyum DOGRULAMA** (Guideline 3.1.2): `app/(protected)/paywall.tsx` zaten Terms (satir 231) + Privacy (240) `Linking.openURL(${LEGAL_BASE}/...)` ve plan-periyodu etiketi (193-197 `PERIOD_KEY[packageType]`) render ediyor. Yeni kod GEREKMIYOR; sadece grep ile teyit et + LEGAL_BASE='https://stovd.app' dogru mu kontrol et. Eksik cikarsa tamamla.
- **S4 · Production build 14 + auto-submit**: S1-S3 commit'lendikten SONRA `eas build --platform ios --profile production --non-interactive --auto-submit`. Build yeni ikon (c6f2f9b) + splash + adaptive + tum fix'leri tasir. `appVersionSource: remote` -> buildNumber otomatik 14.

## Out of Scope
- RevenueCat production key (appl_) + ASC IAP urunleri + Paid Apps Agreement — KULLANICI elinde, hesap isi
- REVENUECAT_WEBHOOK_SECRET set — ayri (deger memory'de)
- ASC listing formu / App Privacy label / reviewer demo hesabi — kullanici, panel isi
- Android/Play tarafi (ayri lansman)
- Gercek cihaz screenshot'i (faithful render yeterli; istenirse sonra TestFlight'tan degistirilir)
- Yeni ozellik / refactor / mega-dosya bolme

## Constraints
- tsc <= 340 (yeni hata yok)
- Surgical: yalniz app.config.js + store/ios-screenshots/* + (gerekirse) paywall.tsx; baska dosyaya dokunma
- icon/screenshot PNG'leri alpha-suz (App Store sarti)
- ppv3'te `git add -A` YASAK — explicit path
- Build 14 ADIMI EN SON (S1-S3 commit'li olmali ki build hepsini icersin)
- Warm Editorial korunur; yeni renk yok

## Definition of Done
app.config.js'de supportsTablet=false, store/ios-screenshots/ altinda 5 adet 1290x2796 alpha-suz kapak uretilmis, paywall 3.1.2 uyumu (Terms+Privacy link + periyot etiketi) grep ile dogrulanmis, tsc <= 340, ve production build 14 EAS'te FINISHED + App Store Connect'e submit edilmis (auto-submit "Submitted" ciktisi).

## Acceptance Criteria
- `grep -n "supportsTablet" app.config.js` -> `false`
- `ls store/ios-screenshots/*.png | wc -l` -> 5
- Her screenshot: `sips -g pixelWidth -g pixelHeight -g hasAlpha 01.png` -> 1290 x 2796, hasAlpha no
- `grep -c "LEGAL_BASE}/terms\|LEGAL_BASE}/privacy" app/(protected)/paywall.tsx` -> >=2 ve `PERIOD_KEY` render ediliyor
- `npx tsc --noEmit | grep -c "error TS"` -> <= 340
- `eas build:list --json --limit 1` -> en yeni build status=FINISHED, error=null, metadata.buildNumber=14
- auto-submit task ciktisi "Submitted your app to Apple App Store Connect!" icerir

## Verification
- `cd ~/projects/ppv3 && grep -n supportsTablet app.config.js`
- `sips -g pixelWidth -g pixelHeight -g hasAlpha store/ios-screenshots/*.png`
- `npx tsc --noEmit 2>&1 | grep -c "error TS"`
- Screenshot'lari tek board'da render edip kullaniciya gonder (onay)
- `eas build --platform ios --profile production --non-interactive --auto-submit` (run_in_background) -> tamamlaninca `eas build:list --json`

## Turn Budget
Stop after 25 turns, or sooner once the DoD condition holds.

## References
- Mevcut faithful app ekranlari + camera-feed.png: `landing/index.html`, `landing/assets/`
- Marka asset'leri: `assets/images/icon.png` (yeni), splash-icon, adaptive
- Eski tam blocker listesi (cogu cozuldu): `store/LAUNCH-CHECKLIST.md`
- Listing metinleri hazir: `store/app-store-listing.md`, `store/screenshots-and-assets-plan.md`

## Risks / Open Questions
- Build 14 EAS kuyrugu + Apple processing ~20-40 dk; cron'da yeterli timeout/await ver
- auto-submit IAP urunleri olmadan da gecer (binary upload) ama review IAP'siz paywall'da reddeder -> bu plan binary'yi hazirlar, review submit'i kullanici RC/ASC tamamlayinca yapar
- Screenshot basliklari App Store metin-orani kurallarini asmamali (gorsel agirlikli kalsin)
- supportsTablet=false sonrasi mevcut TestFlight iPad testcileri etkilenmez (iPhone binary iPad'de scaled calisir)

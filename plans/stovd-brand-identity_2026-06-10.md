# Plan · Stovd Marka Kimligi & Ikon Asset Seti

## Brief
Stovd'a tek seferde "biten" premium bir marka asset seti uretmek: rafine italik-S logo, app icon (iOS + Android adaptive), favicon, splash, wordmark. Kullanici bir daha logo iterasyonu yapmak istemiyor - yon KILITLI.

## Stack
- Logo render: HTML + Fraunces/Inter (Google Fonts) -> headless Chrome screenshot (ucretsiz, deterministik). AI gorsel uretimi YOK.
- sips/ImageMagick ile boyutlandirma + alpha temizleme
- Expo SDK54 app.config.js (icon, adaptiveIcon, expo-splash-screen plugin)
- ~/projects/ppv3, branch main

## Scope (KILITLI kararlar)
- **Logo yonu: Rafine italik S** - terracotta radyal gradyan + krem Fraunces italik "S" + saffron kivilcim. Tek mark, bu.
- **Premium dil: Warm Editorial** - sicak krem, espresso, tek terracotta vurgu, Fraunces serif. Mevcut sistem korunur, yeni renk YOK.
- **Kapsam: Logo + ikon asset seti**

**Uretilecek asset'ler:**
- `assets/images/icon.png` - 1024x1024, full-bleed terracotta gradyan, alpha YOK, kose yuvarlatma YOK (iOS kendi maskeler)
- `assets/images/adaptive-icon-foreground.png` - 1024, seffaf, S+kivilcim guvenli-bolge icinde (~58% olcek, ortali)
- `assets/images/adaptive-icon-background.png` - 1024, terracotta gradyan (Android'de gradyan korunur)
- `assets/images/favicon.png` - 64x64 (web)
- `assets/images/splash-icon.png` - S marki, seffaf (splash plugin krem zemine ortalar)
- `assets/images/wordmark.png` - "Stovd" Fraunces lockup (store/pazarlama, opsiyonel kullanim)

**app.config.js degisiklikleri:**
- `android.adaptiveIcon`: backgroundColor '#ffffff' -> foregroundImage + backgroundImage (veya backgroundColor '#C8472B')
- `plugins`: expo-splash-screen ekle (image splash-icon, backgroundColor '#FBF7F0', dark variant '#1A1614')

## Out of Scope
- Uygulama ici ekran redesign'i (home/paywall/onboarding cila) - ayri is
- App Store screenshot kapaklari / marka PDF'i - ayri is
- Yeni logo yonleri / kesif turlari - yon kilitli, denenmeyek
- Animasyonlu splash / Lottie - statik yeterli

## Constraints
- Mevcut Warm Editorial paleti DISINA cikma (terracotta #C8472B, herb #5B8C5A, saffron #E8A13A, paper #FBF7F0, espresso #2A2422)
- icon.png alpha kanali OLMAMALI (App Store transparan ikon reddeder)
- Android foreground guvenli-bolge: S, 1024 tuvalinde merkezi ~66% icinde kalmali (kenarlar kirpilir)
- Surgical: sadece assets/images/* + app.config.js; baska dosyaya dokunma
- tsc <= 340; ppv3'te `git add -A` YASAK (explicit path)

## Definition of Done
assets/images/ altinda 6 asset uretilmis ve App Store/Play spec'ine uygun (icon 1024 alpha-suz, adaptive foreground guvenli-bolgede), app.config.js icon+adaptiveIcon+splash'i yeni asset'lere baglamis, `npx expo config --type public` hatasiz parse ediyor ve tsc <= 340.

## Acceptance Criteria
- `sips -g pixelWidth -g pixelHeight assets/images/icon.png` -> 1024x1024
- `sips -g hasAlpha assets/images/icon.png` -> no (alpha yok)
- adaptive-icon-foreground.png seffaf + S kivilcim ortali, guvenli bolgede
- adaptive-icon-background.png 1024 gradyan
- favicon.png 64x64
- app.config.js: android.adaptiveIcon.foregroundImage + backgroundImage tanimli; expo-splash-screen plugin'i splash-icon + krem bg ile ekli
- `npx expo config --type public` exit 0, icon yollari cozuluyor
- tsc hata sayisi <= 340
- Kullaniciya nihai set tek panoda gosterildi (icon + adaptive preview + favicon + splash + wordmark)

## Verification
- `cd ~/projects/ppv3 && sips -g pixelWidth -g pixelHeight -g hasAlpha assets/images/icon.png`
- `npx expo config --type public 2>&1 | grep -i "icon\|splash" | head` -> yeni yollar
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` -> <= 340
- Gorsel: tum asset'leri tek board'da render edip kullaniciya gonder, onay al
- Build dogrulamasi: bir sonraki EAS build'inde ikon cihazda gorunur (kullanici dogrular)

## Turn Budget
Stop after 15 turns, or sooner once the DoD condition holds.

## Risks / Open Questions
- Android adaptiveIcon backgroundImage Expo'da destekleniyor; desteklenmezse backgroundColor '#C8472B' flat fallback (gradyan kaybolur, kabul edilebilir)
- expo-splash-screen plugin ekleme prebuild gerektirir; sadece sonraki build'de gorunur (mevcut build 13'u etkilemez)
- Kivilcim detayi cok kucuk boyutta (favicon 64) kaybolabilir - favicon'da S agirlikli, kivilcim opsiyonel
